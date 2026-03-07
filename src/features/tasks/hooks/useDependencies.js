import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

export const useDependencies = (projectId) => {
    const [dependencies, setDependencies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        const depsRef = collection(db, `projects/${projectId}/dependencies`);
        const unsubscribe = onSnapshot(depsRef, (snapshot) => {
            const loadedDeps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDependencies(loadedDeps);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    const addDependency = async (fromTaskId, toTaskId, type = 'FS', lag = 0) => {
        try {
            // Evitar duplicados exactos
            const exists = dependencies.find(d =>
                d.fromTaskId === fromTaskId && d.toTaskId === toTaskId && d.type === type
            );
            if (exists) return { success: false, error: 'Esta dependencia ya existe' };

            // Evitar dependencia circular inmediata
            if (fromTaskId === toTaskId) return { success: false, error: 'Una tarea no puede depender de sí misma' };

            await addDoc(collection(db, `projects/${projectId}/dependencies`), {
                fromTaskId,
                toTaskId,
                type,
                lag: Number(lag),
                createdAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error("Error adding dependency:", error);
            return { success: false, error: error.message };
        }
    };

    const deleteDependency = async (depId) => {
        try {
            await deleteDoc(doc(db, `projects/${projectId}/dependencies`, depId));
            return { success: true };
        } catch (error) {
            console.error("Error deleting dependency:", error);
            return { success: false, error: error.message };
        }
    };

    return { dependencies, loading, addDependency, deleteDependency };
};
