import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

export const useResources = (projectId) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!projectId) return;

        const resourcesRef = collection(db, `projects/${projectId}/resources`);
        const q = query(resourcesRef, orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedResources = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setResources(loadedResources);
            setLoading(false);
        }, (err) => {
            console.error("Error loading resources:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    const addResource = async (resourceData) => {
        try {
            const docRef = await addDoc(collection(db, `projects/${projectId}/resources`), {
                ...resourceData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (err) {
            console.error("Error adding resource:", err);
            return { success: false, error: err.message };
        }
    };

    const updateResource = async (resourceId, updates) => {
        try {
            const resourceRef = doc(db, `projects/${projectId}/resources`, resourceId);
            await updateDoc(resourceRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (err) {
            console.error("Error updating resource:", err);
            return { success: false, error: err.message };
        }
    };

    const deleteResource = async (resourceId) => {
        try {
            await deleteDoc(doc(db, `projects/${projectId}/resources`, resourceId));
            return { success: true };
        } catch (err) {
            console.error("Error deleting resource:", err);
            return { success: false, error: err.message };
        }
    };

    return { resources, loading, error, addResource, updateResource, deleteResource };
};
