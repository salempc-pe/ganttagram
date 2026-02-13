import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { useAuth } from '../../auth/AuthContext';

export const useComments = (projectId, taskId) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId || !taskId) return;

        const commentsRef = collection(db, `projects/${projectId}/tasks/${taskId}/comments`);
        const q = query(commentsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            setComments(loadedComments);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId, taskId]);

    const addComment = async (text) => {
        if (!text.trim()) return;

        try {
            const commentsRef = collection(db, `projects/${projectId}/tasks/${taskId}/comments`);
            await addDoc(commentsRef, {
                text,
                userId: user.uid,
                userName: user.displayName || user.email,
                createdAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error("Error adding comment:", error);
            return { success: false, error: error.message };
        }
    };

    return { comments, loading, addComment };
};
