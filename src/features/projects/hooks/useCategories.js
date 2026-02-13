import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

export const useCategories = (projectId) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        // Las categorías son una subcolección del proyecto
        const categoriesRef = collection(db, `projects/${projectId}/categories`);

        // Escuchar cambios en tiempo real
        const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Si no hay categorías (proyecto nuevo), podríamos crearlas aquí
            // pero mejor dejarlo a la creación del proyecto

            setCategories(cats.sort((a, b) => a.order - b.order));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    const addCategory = async (name, color) => {
        try {
            if (!projectId) throw new Error("No Project ID");
            const docRef = await addDoc(collection(db, `projects/${projectId}/categories`), {
                name,
                color,
                order: categories.length + 1,
                createdAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    };

    const updateCategory = async (categoryId, updates) => {
        try {
            await updateDoc(doc(db, `projects/${projectId}/categories`, categoryId), updates);
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    }

    const deleteCategory = async (categoryId) => {
        try {
            await deleteDoc(doc(db, `projects/${projectId}/categories`, categoryId));
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    };

    return { categories, loading, addCategory, updateCategory, deleteCategory };
};
