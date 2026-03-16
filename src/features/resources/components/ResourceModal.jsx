import { useState, useEffect } from 'react';
import { X, User, PenTool } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import './ResourceModal.css';

export const ResourceModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'person', // person, equipment
        role: '',
        color: '#3b82f6',
        quantity: '',
        unit: 'u' // u, kg, tn, m, m2, caj
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.documentElement.classList.add('modal-open');
            document.body.classList.add('modal-open');
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    type: initialData.type || 'person',
                    role: initialData.role || '',
                    color: initialData.color || '#3b82f6',
                    quantity: initialData.quantity || '',
                    unit: initialData.unit || 'u'
                });
            } else {
                setFormData({
                    name: '',
                    type: 'person',
                    role: '',
                    color: '#6366f1', // Color por defecto indigo (accent color)
                    quantity: '',
                    unit: 'u'
                });
            }
        }
        return () => {
            document.documentElement.classList.remove('modal-open');
            document.body.classList.remove('modal-open');
        };
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al guardar el recurso");
        } finally {
            setLoading(false);
        }
    };

    const typeOptions = [
        { id: 'person', label: 'Personal', icon: User },
        { id: 'equipment', label: 'Maquinaria', icon: PenTool },
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-content resource-modal">
                <div className="modal-header">
                    <h2>{initialData ? 'Editar Recurso' : 'Nuevo Recurso'}</h2>
                    <button onClick={onClose} className="btn-close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="input-wrapper">
                        <label className="input-label">Tipo de recurso</label>
                        <div className="type-selector">
                            {typeOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`type-option ${formData.type === opt.id ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, type: opt.id })}
                                >
                                    <opt.icon size={24} />
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Input
                        label="Nombre del recurso"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={formData.type === 'person' ? "Ej: Juan Pérez" : "Ej: Mezcladora de concreto"}
                        autoFocus
                        required
                    />



                    <Input
                        label={formData.type === 'person' ? "Rol / Especialidad" : "Descripción adicional"}
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder={formData.type === 'person' ? "Ej: Capataz, Operario..." : "Ej: Marca, Modelo..."}
                    />

                    <div className="input-wrapper">
                        <label className="input-label">Color identificador</label>
                        <div className="color-input-container">
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="color-picker"
                            />
                            <span className="color-value">{formData.color.toUpperCase()}</span>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" loading={loading} className="px-8">
                            {initialData ? 'Guardar Cambios' : 'Crear Recurso'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

