import { useState } from 'react';
import { useMembers } from '../hooks/useMembers';
import { useProjectPermissions } from '../hooks/useProjectPermissions';
import { useAuth } from '../../auth/AuthContext';
import { Crown, Pencil, Eye, Clock, Mail, AlertTriangle, CheckCircle, X } from 'lucide-react';
import './ProjectMembers.css';

const ROLE_CONFIG = {
    owner: { label: 'Propietario', Icon: Crown, className: 'owner' },
    editor: { label: 'Editor', Icon: Pencil, className: 'editor' },
    viewer: { label: 'Viewer', Icon: Eye, className: 'viewer' }
};

export const ProjectMembers = ({ projectId }) => {
    const { user } = useAuth();
    const { members, loading, addMember, updateMemberRole, removeMember } = useMembers(projectId);
    const { canInvite, isOwner } = useProjectPermissions(projectId);

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [inviting, setInviting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const showFeedback = (message, type = 'success') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 3500);
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim() || inviting) return;

        setInviting(true);
        const result = await addMember(inviteEmail, inviteRole);

        if (result.success) {
            showFeedback(`Se invitó a ${inviteEmail} como ${ROLE_CONFIG[inviteRole].label}`);
            setInviteEmail('');
            setInviteRole('editor');
        } else {
            showFeedback(result.error || 'Error al invitar', 'error');
        }
        setInviting(false);
    };

    const handleRoleChange = async (memberId, newRole) => {
        const result = await updateMemberRole(memberId, newRole);
        if (!result.success) {
            showFeedback(result.error, 'error');
        }
    };

    const handleRemove = async (memberId, memberEmail) => {
        if (!window.confirm(`¿Eliminar a ${memberEmail} del equipo?`)) return;

        const result = await removeMember(memberId);
        if (result.success) {
            showFeedback(`${memberEmail} fue eliminado del equipo`);
        } else {
            showFeedback(result.error, 'error');
        }
    };

    const getInitials = (member) => {
        if (member.displayName) {
            return member.displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return member.email?.[0]?.toUpperCase() || '?';
    };

    const isPending = (member) => !member.uid;
    const isSelf = (member) => member.uid === user?.uid || member.email?.toLowerCase() === user?.email?.toLowerCase();

    // Ordenar: owner primero, luego editores, luego viewers
    const sortedMembers = [...members].sort((a, b) => {
        const order = { owner: 0, editor: 1, viewer: 2 };
        return (order[a.role] ?? 3) - (order[b.role] ?? 3);
    });

    if (loading) {
        return (
            <div className="project-members-container">
                <div className="members-loading">
                    <div className="loading-spinner" />
                    <p>Cargando equipo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="project-members-container">
            {/* Header */}
            <div className="section-header-pro">
                <div className="section-title-group">
                    <h3 className="section-title-pro">Equipo del Proyecto</h3>
                    <p className="section-subtitle-pro">
                        {members.length} {members.length === 1 ? 'miembro' : 'miembros'} gestionando la obra.
                    </p>
                </div>
            </div>

            {/* Feedback toast */}
            {feedback && (
                <div className={`members-feedback ${feedback.type}`}>
                    <span className="feedback-icon">{feedback.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}</span>
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Formulario de invitación */}
            {canInvite && (
                <form className="invite-form" onSubmit={handleInvite}>
                    <div className="invite-input-group">
                        <span className="input-icon"><Mail size={16} /></span>
                        <input
                            type="email"
                            placeholder="Escribe el email del nuevo miembro..."
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            disabled={inviting}
                        />
                    </div>
                    <select
                        className="role-select"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        disabled={inviting}
                    >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                    </select>
                    <button
                        type="submit"
                        className="btn-invite"
                        disabled={inviting || !inviteEmail.trim()}
                    >
                        {inviting ? 'Invitando...' : 'Invitar'}
                    </button>
                </form>
            )}

            {/* Lista de miembros */}
            <div className="members-list">
                {sortedMembers.map(member => {
                    const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
                    const pending = isPending(member);
                    const self = isSelf(member);
                    const isOwnerMember = member.role === 'owner';

                    return (
                        <div
                            key={member.id}
                            className={`member-item ${pending ? 'pending' : ''} ${self ? 'is-self' : ''}`}
                        >
                            <div className="member-info">
                                <div className={`member-avatar ${roleConfig.className} ${pending ? 'pending' : ''}`}>
                                    {pending ? <Clock size={18} /> : getInitials(member)}
                                </div>
                                <div className="member-details">
                                    <span className="member-name">
                                        {pending ? member.email : member.displayName || member.email}
                                        {self && <span className="self-badge">(tú)</span>}
                                    </span>
                                    <span className="member-email">
                                        {pending
                                            ? 'Aún no ha iniciado sesión'
                                            : member.email
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="member-actions">
                                {isOwnerMember ? (
                                    <span className={`role-badge ${roleConfig.className}`}>
                                        <roleConfig.Icon size={14} /> {roleConfig.label}
                                    </span>
                                ) : canInvite && !self ? (
                                    <>
                                        <select
                                            className="role-select-sm"
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                        >
                                            <option value="editor">Editor</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                        <button
                                            className="btn-remove"
                                            onClick={() => handleRemove(member.id, member.email)}
                                            title="Eliminar del equipo"
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <span className={`role-badge ${roleConfig.className}`}>
                                        <roleConfig.Icon size={14} /> {roleConfig.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {members.length === 0 && (
                <div className="members-empty">
                    <p>No hay miembros en este proyecto.</p>
                </div>
            )}
        </div>
    );
};
