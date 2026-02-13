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

    const addTask = async (taskData) => {
        try {
            await addDoc(collection(db, `projects/${projectId}/tasks`), {
                ...taskData,
                progress: taskData.progress || 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error("Error creating task:", error);
            return { success: false, error: error.message };
        }
    };

    const updateTask = async (taskId, updates) => {
        try {
            const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
            await updateDoc(taskRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error("Error updating task:", error);
            return { success: false, error: error.message };
        }
    };

    const updateTasksBatch = async (updatesMap) => {
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
            return { success: true };
        } catch (error) {
            console.error("Error updating tasks batch:", error);
            return { success: false, error: error.message };
        }
    };

    const deleteTask = async (taskId) => {
        try {
            // 1. Limpiar dependencias asociadas
            const depsRef = collection(db, `projects/${projectId}/dependencies`);
            const qFrom = query(depsRef, where('fromTaskId', '==', taskId));
            const qTo = query(depsRef, where('toTaskId', '==', taskId));

            const [snapFrom, snapTo] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);
            const batch = writeBatch(db);

            snapFrom.forEach(d => batch.delete(d.ref));
            snapTo.forEach(d => batch.delete(d.ref));

            // 2. Eliminar la tarea
            const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
            batch.delete(taskRef);

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error("Error deleting task:", error);
            return { success: false, error: error.message };
        }
    };

    return { tasks, loading, addTask, updateTask, updateTasksBatch, deleteTask };
};
