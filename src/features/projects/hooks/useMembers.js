import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc,
    getDocs,
    where,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { useAuth } from '../../auth/AuthContext';

export const useMembers = (projectId) => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Listener en tiempo real (limpio, sin side-effects) ---
    useEffect(() => {
        if (!projectId) return;

        const membersRef = collection(db, `projects/${projectId}/members`);
        const q = query(membersRef);

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const membersData = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }));
                setMembers(membersData);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching members:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [projectId]);

    // --- Validar email ---
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // --- Agregar miembro ---
    const addMember = async (email, role = 'editor') => {
        try {
            if (!email || !email.trim()) {
                return { success: false, error: 'El email es requerido' };
            }

            const normalizedEmail = email.trim().toLowerCase();

            if (!validateEmail(normalizedEmail)) {
                return { success: false, error: 'El email no es válido' };
            }

            // Validar: no invitarse a uno mismo
            if (user && user.email === normalizedEmail) {
                return { success: false, error: 'No puedes invitarte a ti mismo' };
            }

            // Validar: email no duplicado en la lista actual
            const alreadyExists = members.some(
                m => m.email?.toLowerCase() === normalizedEmail
            );
            if (alreadyExists) {
                return { success: false, error: 'Este miembro ya está en el equipo' };
            }

            // Preparar datos del miembro
            let memberData = {
                email: normalizedEmail,
                role,
                addedAt: serverTimestamp(),
                displayName: normalizedEmail.split('@')[0]
            };

            // Buscar si el usuario ya tiene cuenta en GANTTAGRAM
            let invitedUid = null;
            try {
                const usersRef = collection(db, 'users');
                const qUser = query(usersRef, where('email', '==', normalizedEmail));
                const querySnapshot = await getDocs(qUser);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    invitedUid = userDoc.id;
                    memberData.uid = invitedUid;
                    memberData.displayName = userDoc.data().displayName || memberData.displayName;
                }
            } catch (queryError) {
                // Si no podemos consultar users, seguimos sin UID
                console.warn("No se pudo consultar usuarios:", queryError.message);
            }

            // PASO 1: Crear documento en subcolección members
            await addDoc(collection(db, `projects/${projectId}/members`), memberData);

            // PASO 2: Actualizar arrays de visibilidad del proyecto
            const projectRef = doc(db, 'projects', projectId);
            const projectUpdates = {
                memberEmails: arrayUnion(normalizedEmail)
            };
            if (invitedUid) {
                projectUpdates.memberUids = arrayUnion(invitedUid);
            }
            await updateDoc(projectRef, projectUpdates);

            return { success: true };
        } catch (err) {
            console.error("Error adding member:", err);
            return { success: false, error: err.message };
        }
    };

    // --- Actualizar rol ---
    const updateMemberRole = async (memberId, newRole) => {
        try {
            // Proteger al owner
            const member = members.find(m => m.id === memberId);
            if (member && member.role === 'owner') {
                return { success: false, error: 'No se puede cambiar el rol del propietario' };
            }

            const memberRef = doc(db, `projects/${projectId}/members`, memberId);
            await updateDoc(memberRef, { role: newRole });
            return { success: true };
        } catch (err) {
            console.error("Error updating member role:", err);
            return { success: false, error: err.message };
        }
    };

    // --- Remover miembro ---
    const removeMember = async (memberId) => {
        try {
            // Encontrar datos del miembro antes de eliminar
            const member = members.find(m => m.id === memberId);
            if (!member) {
                return { success: false, error: 'Miembro no encontrado' };
            }

            // Proteger al owner
            if (member.role === 'owner') {
                return { success: false, error: 'No se puede eliminar al propietario del proyecto' };
            }

            // PASO 1: Eliminar documento de la subcolección
            const memberRef = doc(db, `projects/${projectId}/members`, memberId);
            await deleteDoc(memberRef);

            // PASO 2: Limpiar arrays de visibilidad del proyecto
            const projectRef = doc(db, 'projects', projectId);
            const projectUpdates = {};

            if (member.email) {
                projectUpdates.memberEmails = arrayRemove(member.email);
            }
            if (member.uid) {
                projectUpdates.memberUids = arrayRemove(member.uid);
            }

            if (Object.keys(projectUpdates).length > 0) {
                await updateDoc(projectRef, projectUpdates);
            }

            return { success: true };
        } catch (err) {
            console.error("Error removing member:", err);
            return { success: false, error: err.message };
        }
    };

    return { members, loading, error, addMember, updateMemberRole, removeMember };
};
