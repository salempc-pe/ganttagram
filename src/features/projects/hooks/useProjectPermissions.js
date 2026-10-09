import { useMembers } from './useMembers';
import { useAuth } from '../../auth/AuthContext';

export const useProjectPermissions = (projectId) => {
    const { user } = useAuth();
    const { members, loading: membersLoading } = useMembers(projectId);

    if (!user || membersLoading) {
        return {
            isOwner: false,
            canEdit: false,
            canInvite: false,
            role: null,
            loading: true
        };
    }

    // Buscar al usuario actual en la lista de miembros
    // Prioridad: UID primero, luego email como fallback
    const currentMember = members.find(m => m.uid === user.uid)
        || members.find(m => m.email?.toLowerCase() === user.email?.toLowerCase());

    if (currentMember) {
        const role = currentMember.role;
        return {
            isOwner: role === 'owner',
            canEdit: role === 'owner' || role === 'editor',
            canInvite: role === 'owner' || role === 'editor',
            role,
            loading: false
        };
    }

    // No es miembro del proyecto
    return {
        isOwner: false,
        canEdit: false,
        canInvite: false,
        role: null,
        loading: false
    };
};
