import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
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

export const CategoryManager = ({ categories, onAdd, onUpdate, onDelete, canEdit }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [isAdding, setIsAdding] = useState(false);

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

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar esta categoría? Las tareas que la usen podrían perder su color.')) {
            await onDelete(id);
        }
    };

    const handleAdd = async () => {
        if (!editName.trim()) return alert('La categoría debe tener un nombre');
        await onAdd(editName, editColor || DEFAULT_COLOR);
        setIsAdding(false);
        setEditName('');
        setEditColor('');
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

            <div className="category-grid">
                {isAdding && (
                    <div className="category-card adding shadow-lg">
                        <div className="category-card-header">
                            <span className="text-xs uppercase font-bold text-secondary">Nueva Categoría</span>
                            <div className="flex gap-1">
                                <button onClick={handleAdd} className="action-btn-circle success"><Check size={18} /></button>
                                <button onClick={() => setIsAdding(false)} className="action-btn-circle error"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="category-card-body">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Nombre de categoría..."
                                className="category-name-input"
                                autoFocus
                            />
                            <div className="color-selection-area">
                                <ColorSelector selectedColor={editColor} onColorSelect={setEditColor} />
                            </div>
                        </div>
                    </div>
                )}

                {categories.map(cat => (
                    <div key={cat.id} className="category-card-wrapper">
                        {editingId === cat.id ? (
                            <div className="category-card editing shadow-lg">
                                <div className="category-card-header">
                                    <span className="text-xs uppercase font-bold text-secondary">Editando</span>
                                    <div className="flex gap-1">
                                        <button onClick={handleSave} className="action-btn-circle success"><Check size={18} /></button>
                                        <button onClick={() => setEditingId(null)} className="action-btn-circle error"><X size={18} /></button>
                                    </div>
                                </div>
                                <div className="category-card-body">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="category-name-input"
                                    />
                                    <div className="color-selection-area">
                                        <ColorSelector selectedColor={editColor} onColorSelect={setEditColor} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="category-card">
                                <div className="category-status-line" style={{ backgroundColor: cat.color }}></div>
                                <div className="category-card-content">
                                    <div className="category-card-main">
                                        <div className="category-avatar-preview" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                                            #
                                        </div>
                                        <span className="category-card-name">{cat.name}</span>
                                    </div>
                                    {canEdit && (
                                        <div className="category-card-actions">
                                            <button onClick={() => handleStartEdit(cat)} className="action-btn edit" title="Editar"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(cat.id)} className="action-btn delete" title="Eliminar"><Trash2 size={16} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
