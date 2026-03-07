import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { useAuth } from '../../auth/AuthContext';

export const useProjects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        const projectsRef = collection(db, 'projects');

        // Query 1: Proyectos donde soy miembro directo (UID)
        const qUid = query(
            projectsRef,
            where('memberUids', 'array-contains', user.uid)
        );

        // Query 2: Proyectos donde fui invitado por email (Invitaciones pendientes/nuevas)
        const qEmail = query(
            projectsRef,
            where('memberEmails', 'array-contains', user.email)
        );

        let uidProjects = [];
        let emailProjects = [];

        const mergeDocs = () => {
            const allDocs = [...uidProjects, ...emailProjects];
            // Deduplicar por ID
            const uniqueProjects = Array.from(new Map(allDocs.map(item => [item.id, item])).values())
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setProjects(uniqueProjects);
            setLoading(false);
        };

        const unsubUid = onSnapshot(qUid,
            (snapshot) => {
                uidProjects = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                }));
                mergeDocs();
            },
            (err) => {
                console.warn("UID Query Error:", err);
                if (err.code !== 'permission-denied') setError(err.message);
                // Si falla uno, intentamos mostrar lo que podamos del otro o mantenemos estado
            }
        );

        const unsubEmail = onSnapshot(qEmail,
            (snapshot) => {
                emailProjects = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                }));
                mergeDocs();
            },
            (err) => {
                console.warn("Email Query Error:", err);
                // Ignoramos error de permisos en email por si acaso es estricto
            }
        );

        return () => {
            unsubUid();
            unsubEmail();
        };
    }, [user]);

    const createProject = async (projectData) => {
        try {
            if (!user) throw new Error('Usuario no autenticado');

            const newProject = {
                name: projectData.name,
                description: projectData.description || '',
                emoji: projectData.emoji || '🏗️',
                ownerId: user.uid,
                ownerName: user.displayName,
                memberUids: [user.uid],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                settings: {
                    categories: [
                        { id: 'cat_1', name: 'Planificación', color: '#3b82f6' },
                        { id: 'cat_2', name: 'Desarrollo', color: '#10b981' },
                        { id: 'cat_3', name: 'Entrega', color: '#8b5cf6' }
                    ]
                }
            };

            const docRef = await addDoc(collection(db, 'projects'), newProject);

            // Agregar al creador como miembro owner en subcolección
            await addDoc(collection(db, `projects/${docRef.id}/members`), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: 'owner',
                addedAt: serverTimestamp()
            });

            return { success: true, id: docRef.id };
        } catch (err) {
            console.error("Error creating project:", err);
            return { success: false, error: err.message };
        }
    };

    const duplicateProject = async (projectId) => {
        try {
            if (!user) throw new Error('Usuario no autenticado');

            // 1. Obtener datos del proyecto original
            const sourceRef = doc(db, 'projects', projectId);
            const sourceSnap = await getDoc(sourceRef);
            if (!sourceSnap.exists()) throw new Error('Proyecto no encontrado');

            const sourceData = sourceSnap.data();

            // 2. Crear el nuevo proyecto (Copia)
            const newProjectData = {
                ...sourceData,
                name: `${sourceData.name} (Copia)`,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            const newProjectRef = await addDoc(collection(db, 'projects'), newProjectData);
            const newId = newProjectRef.id;

            // 3. Preparar mapas de IDs
            const itemMap = {};
            const resourceMap = {};

            // --- FASE 1: RECURSOS (Necesarios para las tareas) ---
            const resourcesSnap = await getDocs(collection(db, `projects/${projectId}/resources`));

            const resourcePromises = resourcesSnap.docs.map(async (rDoc) => {
                const newR = await addDoc(collection(db, `projects/${newId}/resources`), rDoc.data());
                resourceMap[rDoc.id] = newR.id;
            });

            await Promise.all(resourcePromises);

            // --- FASE 2: TAREAS E HITOS (Paralelo) ---
            const [tasksSnap, milestonesSnap] = await Promise.all([
                getDocs(collection(db, `projects/${projectId}/tasks`)),
                getDocs(collection(db, `projects/${projectId}/milestones`))
            ]);

            const taskPromises = tasksSnap.docs.map(async (tDoc) => {
                const data = tDoc.data();
                const mappedResources = (data.resources || [])
                    .map(oldRid => resourceMap[oldRid])
                    .filter(id => id); // Filtrar IDs nulos si falla el mapeo

                const newT = await addDoc(collection(db, `projects/${newId}/tasks`), {
                    ...data,
                    resources: mappedResources
                });
                itemMap[tDoc.id] = newT.id;
            });

            const milestonePromises = milestonesSnap.docs.map(async (mDoc) => {
                const newM = await addDoc(collection(db, `projects/${newId}/milestones`), mDoc.data());
                itemMap[mDoc.id] = newM.id;
            });

            // Esperar a que se creen todas las tareas e hitos para tener sus IDs
            await Promise.all([...taskPromises, ...milestonePromises]);

            // --- FASE 3: DEPENDENCIAS (Requieren itemMap completo) ---
            const depsSnap = await getDocs(collection(db, `projects/${projectId}/dependencies`));

            const depPromises = depsSnap.docs.map(async (dDoc) => {
                const data = dDoc.data();
                const newFrom = itemMap[data.fromTaskId];
                const newTo = itemMap[data.toTaskId];

                if (newFrom && newTo) {
                    await addDoc(collection(db, `projects/${newId}/dependencies`), {
                        ...data,
                        fromTaskId: newFrom,
                        toTaskId: newTo
                    });
                }
            });

            await Promise.all(depPromises);

            return { success: true, id: newId };
        } catch (err) {
            console.error("Error duplicating project:", err);
            return { success: false, error: err.message };
        }
    };

    const deleteProject = async (projectId) => {
        try {
            await deleteDoc(doc(db, 'projects', projectId));
            return { success: true };
        } catch (err) {
            console.error("Error deleting project:", err);
            return { success: false, error: err.message };
        }
    };

    const updateProject = async (projectId, updates) => {
        try {
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (err) {
            console.error("Error updating project:", err);
            return { success: false, error: err.message };
        }
    };

    return { projects, loading, error, createProject, deleteProject, updateProject, duplicateProject };
};
