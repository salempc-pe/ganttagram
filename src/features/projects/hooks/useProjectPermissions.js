import { useState, useEffect } from 'react';
import { useMembers } from './useMembers';
import { useAuth } from '../../auth/AuthContext';

export const useProjectPermissions = (projectId) => {
    const { user } = useAuth();
    const { members, loading: membersLoading } = useMembers(projectId);
    const [permissions, setPermissions] = useState({
        isOwner: false,
        canEdit: false,
        canInvite: false,
        role: null,
        loading: true
    });

    useEffect(() => {
        if (!user || membersLoading) return;

        // Buscar al usuario actual en la lista de miembros
        // Prioridad: UID primero, luego email como fallback
        const currentMember = members.find(m => m.uid === user.uid)
            || members.find(m => m.email?.toLowerCase() === user.email?.toLowerCase());

        if (currentMember) {
            const role = currentMember.role;
            setPermissions({
                isOwner: role === 'owner',
                canEdit: role === 'owner' || role === 'editor',
                canInvite: role === 'owner' || role === 'editor',
                role,
                loading: false
            });
        } else {
            // No es miembro del proyecto
            setPermissions({
                isOwner: false,
                canEdit: false,
                canInvite: false,
                role: null,
                loading: false
            });
        }
    }, [user, members, membersLoading]);

    return permissions;
};
