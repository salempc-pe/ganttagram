import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    writeBatch,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { recalculateAncestors, getDescendantIds } from '../utils/hierarchy';
import { calculateAutoSchedule } from '../utils/scheduler';
import { getWorkingDuration } from '../../../shared/utils/calendar';

export const useTasks = (projectId) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        const tasksRef = collection(db, `projects/${projectId}/tasks`);
        const q = query(tasksRef, orderBy('startDate', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                startDate: doc.data().startDate?.toDate(),
                endDate: doc.data().endDate?.toDate(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            setTasks(loadedTasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    /**
     * Recalcula y persiste los ancestros de una tarea dada y dispara cascada de dependencias.
     */
    const propagateParentUpdates = async (taskId, freshTasks, dependencies = [], milestones = [], calendar = null) => {
        const updatesMap = { [taskId]: freshTasks.find(t => t.id === taskId) };
        await resolveAndCommitScheduling(updatesMap, dependencies, milestones, calendar);
    };

    /**
     * Motor de resolución de cronograma que maneja jerarquía (Rollup) y dependencias (Cascada)
     * e itera hasta que el sistema sea estable. Luego persiste en un único batch.
     */
    const resolveAndCommitScheduling = async (initialUpdates, dependencies = [], milestones = [], calendar = null) => {
        try {
            // Clonamos las tareas para el proceso de cálculo
            let workingTasks = tasks.map(t => {
                const updates = initialUpdates[t.id];
                if (updates) return { ...t, ...updates };
                return { ...t };
            });

            const finalUpdates = { ...initialUpdates };
            const processedTriggers = new Set();
            let queue = Object.keys(initialUpdates);
            let iterations = 0;
            const maxIterations = Math.max(50, tasks.length * 2);

            // Bucle de estabilidad jerarquía <-> dependencias
            while (queue.length > 0 && iterations < maxIterations) {
                iterations++;
                const currentTriggerId = queue.shift();
                
                // 1. Rollup: Si esta tarea cambió, sus ancestros podrían cambiar
                const ancestorUpdates = recalculateAncestors(currentTriggerId, workingTasks, calendar);
                Object.entries(ancestorUpdates).forEach(([id, data]) => {
                    finalUpdates[id] = { ...finalUpdates[id], ...data };
                    const tIdx = workingTasks.findIndex(t => t.id === id);
                    if (tIdx !== -1) {
                        workingTasks[tIdx] = { ...workingTasks[tIdx], ...data };
                        if (!queue.includes(id)) queue.push(id); 
                    }
                });

                // 2. Cascada: Si esta tarea o hito cambió, sus sucesores deben cambiar
                const triggerData = workingTasks.find(t => t.id === currentTriggerId) || 
                                   (milestones || []).find(m => m.id === currentTriggerId);
                
                if (triggerData) {
                    const cascadingUpdates = calculateAutoSchedule(
                        workingTasks,
                        dependencies || [],
                        currentTriggerId,
                        { 
                            startDate: triggerData.startDate || triggerData.date, 
                            endDate: triggerData.endDate || triggerData.date 
                        },
                        milestones || [],
                        calendar
                    );

                    Object.entries(cascadingUpdates).forEach(([id, data]) => {
                        const existingIdx = workingTasks.findIndex(t => t.id === id);
                        const milestoneIdx = (milestones || []).findIndex(m => m.id === id);

                        if (existingIdx === -1 && milestoneIdx === -1) return;

                        const item = existingIdx !== -1 ? workingTasks[existingIdx] : milestones[milestoneIdx];
                        
                        // Solo comparar si hay cambios de fechas en el update
                        const newS = data.startDate || data.date;
                        const newE = data.endDate || data.date;
                        const oldS = item.startDate || item.date;
                        const oldE = item.endDate || item.date;

                        let hasChanged = false;
                        if (newS && oldS && Math.abs(newS.getTime() - oldS.getTime()) > 60000) hasChanged = true;
                        if (newE && oldE && Math.abs(newE.getTime() - oldE.getTime()) > 60000) hasChanged = true;

                        if (hasChanged) {
                            if (existingIdx !== -1) {
                                workingTasks[existingIdx] = { ...workingTasks[existingIdx], ...data };
                            } else {
                                milestoneIdx !== -1 && (milestones[milestoneIdx] = { ...milestones[milestoneIdx], ...data });
                            }

                            finalUpdates[id] = { ...finalUpdates[id], ...data };
                            if (!queue.includes(id)) queue.push(id);
                        }
                    });
                }
            }

            if (iterations >= maxIterations) {
                console.error("El cronograma no logró estabilizarse después de " + iterations + " iteraciones.");
                throw new Error("El sistema de dependencias es demasiado complejo o contiene un bucle no detectado. Los cambios no se guardaron.");
            }

            // 3. Persistencia Atómica (Fase 3: writeBatch)
            if (Object.keys(finalUpdates).length > 0) {
                const batch = writeBatch(db);
                
                for (const [id, data] of Object.entries(finalUpdates)) {
                    const isMilestone = (milestones || []).some(m => m.id === id);
                    
                    if (isMilestone) {
                        const msRef = doc(db, `projects/${projectId}/milestones`, id);
                        batch.update(msRef, {
                            date: data.date || data.startDate,
                            updatedAt: serverTimestamp()
                        });
                    } else {
                        const taskRef = doc(db, `projects/${projectId}/tasks`, id);
                        const originalTask = tasks.find(t => t.id === id);
                        
                        const updatePayload = {
                            ...data,
                            updatedAt: serverTimestamp()
                        };

                        if (data.startDate || data.endDate) {
                            const s = data.startDate || originalTask?.startDate;
                            const e = data.endDate || originalTask?.endDate;
                            if (s && e) {
                                updatePayload.duration = getWorkingDuration(s, e, calendar).toString();
                            }
                        }
                        
                        // Limpieza de propiedades inválidas para Firebase
                        Object.keys(updatePayload).forEach(key => {
                            const val = updatePayload[key];
                            if (val === undefined || (typeof val === 'number' && Number.isNaN(val)) || val === '') {
                                delete updatePayload[key];
                            }
                        });

                        batch.update(taskRef, updatePayload);
                    }
                }
                
                await batch.commit();
            }
        } catch (error) {
            console.error("Error in resolveAndCommitScheduling:", error);
            alert("Error al guardar cambios: " + error.message);
            throw error;
        }
    };

    const addTask = async (taskData, calendar = null) => {
        try {
            const docRef = await addDoc(collection(db, `projects/${projectId}/tasks`), {
                ...taskData,
                parentId: taskData.parentId || null,
                progress: taskData.progress || 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Recalcular padres si esta tarea pertenece a una madre
            if (taskData.parentId) {
                const newTask = {
                    id: docRef.id,
                    ...taskData,
                    parentId: taskData.parentId
                };
                const freshTasks = [...tasks, newTask];
                await propagateParentUpdates(docRef.id, freshTasks, [], [], calendar);
            }

            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error creating task:", error);
            return { success: false, error: error.message };
        }
    };

    const updateTask = async (taskId, updates, dependencies = [], milestones = [], calendar = null) => {
        try {
            const currentTask = tasks.find(t => t.id === taskId);
            
            const initialUpdates = { 
                [taskId]: { 
                    ...updates,
                    parentId: updates.parentId !== undefined ? updates.parentId : (currentTask?.parentId || null)
                } 
            };

            await resolveAndCommitScheduling(initialUpdates, dependencies, milestones, calendar);

            return { success: true };
        } catch (error) {
            console.error("Error updating task:", error);
            alert("Error saving task: " + error.message);
            return { success: false, error: error.message };
        }
    };

    const updateTasksBatch = async (updatesMap, dependencies = [], milestones = [], calendar = null) => {
        try {
            await resolveAndCommitScheduling(updatesMap, dependencies, milestones, calendar);
            return { success: true };
        } catch (error) {
            console.error("Error updating tasks batch:", error);
            alert("Error batch saving tasks: " + error.message);
            return { success: false, error: error.message };
        }
    };

    const deleteTask = async (taskId, calendar = null) => {
        try {
            const taskToDelete = tasks.find(t => t.id === taskId);
            const parentIdOfDeleted = taskToDelete?.parentId;

            // 1. Obtener todos los descendientes para eliminarlos también
            const descendantIds = getDescendantIds(taskId, tasks);
            const allIdsToDelete = [taskId, ...descendantIds];

            // 2. Limpiar dependencias asociadas a todas las tareas a eliminar
            const depsRef = collection(db, `projects/${projectId}/dependencies`);
            const batch = writeBatch(db);

            for (const idToDelete of allIdsToDelete) {
                const qFrom = query(depsRef, where('fromTaskId', '==', idToDelete));
                const qTo = query(depsRef, where('toTaskId', '==', idToDelete));

                const [snapFrom, snapTo] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);
                snapFrom.forEach(d => batch.delete(d.ref));
                snapTo.forEach(d => batch.delete(d.ref));

                // Eliminar la tarea
                const taskRef = doc(db, `projects/${projectId}/tasks`, idToDelete);
                batch.delete(taskRef);
            }

            await batch.commit();

            // 3. Recalcular padres si la tarea eliminada tenía padre
            if (parentIdOfDeleted) {
                const freshTasks = tasks.filter(t => !allIdsToDelete.includes(t.id));
                // Crear una tarea temporal para disparar el recálculo desde el padre
                const tempChild = freshTasks.find(t => t.parentId === parentIdOfDeleted);
                if (tempChild) {
                    await propagateParentUpdates(tempChild.id, freshTasks, calendar);
                } else {
                    // El padre ya no tiene hijos, no necesita recálculo automático
                    // (ya no es "padre")
                }
            }

            return { success: true };
        } catch (error) {
            console.error("Error deleting task:", error);
            return { success: false, error: error.message };
        }
    };

    return { tasks, loading, addTask, updateTask, updateTasksBatch, deleteTask };
};
