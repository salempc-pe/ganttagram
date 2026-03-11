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
     * Recalcula y persiste los ancestros de una tarea dada.
     * Usa el estado actual `tasks` enriquecido con los cambios recientes.
     */
    const propagateParentUpdates = async (taskId, freshTasks, calendar = null) => {
        const ancestorUpdates = recalculateAncestors(taskId, freshTasks, calendar);

        if (Object.keys(ancestorUpdates).length > 0) {
            const batch = writeBatch(db);
            Object.entries(ancestorUpdates).forEach(([id, data]) => {
                const ref = doc(db, `projects/${projectId}/tasks`, id);
                batch.update(ref, {
                    startDate: data.startDate,
                    endDate: data.endDate,
                    progress: data.progress,
                    updatedAt: serverTimestamp()
                });
            });
            await batch.commit();
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
                await propagateParentUpdates(docRef.id, freshTasks, calendar);
            }

            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error creating task:", error);
            return { success: false, error: error.message };
        }
    };

    const updateTask = async (taskId, updates, calendar = null) => {
        try {
            const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
            await updateDoc(taskRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });

            // Recalcular padres — usar datos actualizados
            const currentTask = tasks.find(t => t.id === taskId);
            const parentId = updates.parentId !== undefined ? updates.parentId : currentTask?.parentId;
            const oldParentId = currentTask?.parentId;

            if (parentId || oldParentId) {
                const freshTasks = tasks.map(t =>
                    t.id === taskId ? { ...t, ...updates } : t
                );

                // Recalcular la cadena del nuevo padre
                if (parentId) {
                    await propagateParentUpdates(taskId, freshTasks, calendar);
                }

                // Si cambió de padre, recalcular también el antiguo padre
                if (oldParentId && oldParentId !== parentId) {
                    await propagateParentUpdates(taskId, freshTasks, calendar);
                    // Recalcular el viejo padre con la tarea ya removida
                    const tasksWithoutOldParent = freshTasks.map(t =>
                        t.id === taskId ? { ...t, parentId: parentId } : t
                    );
                    const oldAncestorUpdates = recalculateAncestors(
                        // Necesitamos un hijo del viejo padre para disparar
                        oldParentId,
                        // Simulamos que somos hijo del viejo padre temporalmente
                        [...tasksWithoutOldParent, { id: '__temp__', parentId: oldParentId, startDate: new Date(), endDate: new Date(), progress: 0 }],
                        calendar
                    );

                    // Pero esto es innecesario si simplemente recalculamos usando el viejo padre
                    // Simplificamos: recalculamos el viejo padre directamente
                    if (Object.keys(oldAncestorUpdates).length > 0) {
                        const batch = writeBatch(db);
                        Object.entries(oldAncestorUpdates).forEach(([id, data]) => {
                            const ref = doc(db, `projects/${projectId}/tasks`, id);
                            batch.update(ref, {
                                startDate: data.startDate,
                                endDate: data.endDate,
                                progress: data.progress,
                                updatedAt: serverTimestamp()
                            });
                        });
                        await batch.commit();
                    }
                }
            }

            return { success: true };
        } catch (error) {
            console.error("Error updating task:", error);
            return { success: false, error: error.message };
        }
    };

    const updateTasksBatch = async (updatesMap, calendar = null) => {
        try {
            const batch = writeBatch(db);
            Object.entries(updatesMap).forEach(([taskId, updates]) => {
                const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                batch.update(taskRef, {
                    ...updates,
                    updatedAt: serverTimestamp()
                });
            });
            await batch.commit();

            // Recalcular padres UNIFICADO para evitar redundancia
            const freshTasks = tasks.map(t =>
                updatesMap[t.id] ? { ...t, ...updatesMap[t.id] } : t
            );

            // Obtener IDs de padres únicos afectados para recalcular solo una vez por rama
            const affectedParentIds = new Set();
            Object.keys(updatesMap).forEach(taskId => {
                const task = freshTasks.find(t => t.id === taskId);
                if (task?.parentId) affectedParentIds.add(task.parentId);
            });

            if (affectedParentIds.size > 0) {
                const parentUpdatesBatch = {};
                // Recalcular desde los hijos hacia arriba una sola vez por rama
                affectedParentIds.forEach(parentId => {
                    const sampleChildId = freshTasks.find(t => t.parentId === parentId)?.id;
                    if (sampleChildId) {
                        const ancestorUpdates = recalculateAncestors(sampleChildId, freshTasks, calendar);
                        Object.assign(parentUpdatesBatch, ancestorUpdates);
                    }
                });

                if (Object.keys(parentUpdatesBatch).length > 0) {
                    const parentBatch = writeBatch(db);
                    Object.entries(parentUpdatesBatch).forEach(([id, data]) => {
                        const ref = doc(db, `projects/${projectId}/tasks`, id);
                        parentBatch.update(ref, {
                            startDate: data.startDate,
                            endDate: data.endDate,
                            progress: data.progress,
                            updatedAt: serverTimestamp()
                        });
                    });
                    await parentBatch.commit();
                }
            }

            return { success: true };
        } catch (error) {
            console.error("Error updating tasks batch:", error);
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
