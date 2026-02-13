import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    query,
    orderBy,
    where,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

export const useMilestones = (projectId) => {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        const milestonesRef = collection(db, `projects/${projectId}/milestones`);
        const q = query(milestonesRef, orderBy('date', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ms = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date?.toDate() || new Date()
                };
            });
            setMilestones(ms);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    const addMilestone = async (milestoneData) => {
        try {
            if (!projectId) throw new Error("No Project ID");
            const docRef = await addDoc(collection(db, `projects/${projectId}/milestones`), {
                ...milestoneData,
                createdAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    };

    const updateMilestone = async (milestoneId, updates) => {
        try {
            await updateDoc(doc(db, `projects/${projectId}/milestones`, milestoneId), updates);
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    };

    const deleteMilestone = async (milestoneId) => {
        try {
            // 1. Limpiar dependencias asociadas
            const depsRef = collection(db, `projects/${projectId}/dependencies`);
            const qFrom = query(depsRef, where('fromTaskId', '==', milestoneId));
            const qTo = query(depsRef, where('toTaskId', '==', milestoneId));

            const [snapFrom, snapTo] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);
            const batch = writeBatch(db);

            snapFrom.forEach(d => batch.delete(d.ref));
            snapTo.forEach(d => batch.delete(d.ref));

            // 2. Eliminar hito
            const msRef = doc(db, `projects/${projectId}/milestones`, milestoneId);
            batch.delete(msRef);

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    };

    return { milestones, loading, addMilestone, updateMilestone, deleteMilestone };
};
