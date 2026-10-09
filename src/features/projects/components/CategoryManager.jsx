import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import './CategoryManager.css';

const DEFAULT_COLOR = '#3b82f6';

const ColorSelector = ({ selectedColor, onColorSelect }) => {
    return (
        <div className="color-input-container">
            <input
                type="color"
                value={selectedColor || DEFAULT_COLOR}
                onChange={(e) => onColorSelect(e.target.value)}
                className="color-picker"
            />
            <span className="color-value">{selectedColor || DEFAULT_COLOR}</span>
        </div>
    );
};

export const CategoryManager = ({ categories, tasks = [], onAdd, onUpdate, onDelete, canEdit }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);

    const handleStartEdit = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditColor(cat.color);
    };

    const handleSave = async () => {
        if (!editName.trim()) return;
        await onUpdate(editingId, { name: editName, color: editColor });
        setEditingId(null);
    };

    const handleDelete = (id) => {
        setCategoryToDeleteId(id);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDeleteAction = async () => {
        if (categoryToDeleteId) {
            await onDelete(categoryToDeleteId);
            setCategoryToDeleteId(null);
        }
    };

    const handleAdd = async () => {
        if (!editName.trim()) return alert('La categoría debe tener un nombre');
        await onAdd(editName, editColor || DEFAULT_COLOR);
        setIsAdding(false);
        setEditName('');
        setEditColor('');
    };

    const getAssignedTasks = (categoryId) => {
        return tasks.filter(task => task.categoryId === categoryId);
    };

    return (
        <div className="category-manager">
            <div className="section-header-pro">
                <div className="section-title-group">
                    <h3 className="section-title-pro">Categorías</h3>
                    <p className="section-subtitle-pro">Etiquetas técnicas de organización.</p>
                </div>
                {canEdit && !isAdding && (
                    <Button variant="primary" size="sm" onClick={() => { setIsAdding(true); setEditName(''); setEditColor(DEFAULT_COLOR); }} className="btn-add-pro">
                        <Plus size={16} />
                        <span>Nueva</span>
                    </Button>
                )}
            </div>

            <div className="category-list-compact" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                {isAdding && (
                    <div className="category-list-row adding" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nueva Categoría</span>
                            <div className="flex gap-2">
                                <button onClick={handleAdd} className="action-btn-circle success" style={{ padding: '4px', borderRadius: '50%', background: '#22c55e20', color: '#16a34a', border: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                                <button onClick={() => setIsAdding(false)} className="action-btn-circle error" style={{ padding: '4px', borderRadius: '50%', background: '#ef444420', color: '#dc2626', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nombre de la categoría..."
                            className="input"
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            autoFocus
                        />
                        <div style={{ marginTop: '0.25rem' }}>
                            <ColorSelector selectedColor={editColor} onColorSelect={setEditColor} />
                        </div>
                    </div>
                )}

                {categories.length === 0 && !isAdding && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center', margin: '1rem 0' }}>No hay categorías registradas.</p>
                )}

                {categories.map(cat => {
                    const assignedTasks = getAssignedTasks(cat.id);
                    const isEditing = editingId === cat.id;

                    return (
                        <div key={cat.id} className="category-list-item-wrapper" style={{
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '0.75rem',
                            marginBottom: '0.25rem',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {isEditing ? (
                                <div className="category-list-row editing" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Editando Categoría</span>
                                        <div className="flex gap-2">
                                            <button onClick={handleSave} className="action-btn-circle success" style={{ padding: '4px', borderRadius: '50%', background: '#22c55e20', color: '#16a34a', border: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                                            <button onClick={() => setEditingId(null)} className="action-btn-circle error" style={{ padding: '4px', borderRadius: '50%', background: '#ef444420', color: '#dc2626', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="input"
                                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                    />
                                    <div>
                                        <ColorSelector selectedColor={editColor} onColorSelect={setEditColor} />
                                    </div>
                                </div>
                            ) : (
                                <div className="category-list-row-view" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.25rem 0.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: cat.color
                                        }}></div>
                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{cat.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>
                                            ({assignedTasks.length} {assignedTasks.length === 1 ? 'tarea asignada' : 'tareas asignadas'})
                                        </span>
                                    </div>
                                    {canEdit && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleStartEdit(cat)} className="action-btn edit" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Editar"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(cat.id)} className="action-btn delete" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Eliminar"><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => { setIsConfirmDeleteOpen(false); setCategoryToDeleteId(null); }}
                onConfirm={confirmDeleteAction}
                title="¿Eliminar Categoría?"
                message="¿Estás seguro de que deseas eliminar esta categoría? Las tareas que la usen podrían perder su color."
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};
