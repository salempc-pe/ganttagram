import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { X } from 'lucide-react';
import './ProjectModal.css';

export const ProjectModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        emoji: initialData?.emoji || '🏗️'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.documentElement.classList.add('modal-open');
            document.body.classList.add('modal-open');
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    description: initialData.description || '',
                    emoji: initialData.emoji || '🏗️'
                });
            } else {
                setFormData({ name: '', description: '', emoji: '🏗️' });
            }
        }
        return () => {
            document.documentElement.classList.remove('modal-open');
            document.body.classList.remove('modal-open');
        };
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const COMMON_EMOJIS = ['🏗️', '🏠', '🌆', '🌉', '🏨', '🏢', '🏭', '🚧', '📐', '🛠️', '🌳', '🌊', '⚡', '💧', '🩹'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setLoading(true);
        await onSubmit(formData);
        setLoading(false);
        onClose();
        setFormData({ name: '', description: '', emoji: '🏗️' });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content project-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header border-b border-slate-100 bg-slate-50/50 py-4 px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-200">
                            {formData.emoji}
                        </div>
                        <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-800">
                            {initialData ? 'Configurar Proyecto' : 'Nuevo Proyecto Técnico'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="btn-close hover:bg-slate-200 p-1.5 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form p-6 space-y-6">
                    <div>
                        <label className="input-label font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2 block">Identificador Visual (Emoji)</label>
                        <div className="emoji-selector-grid">
                            {COMMON_EMOJIS.map(emo => (
                                <button
                                    key={emo}
                                    type="button"
                                    className={`emoji-option ${formData.emoji === emo ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, emoji: emo })}
                                >
                                    {emo}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Input
                        label="Nombre del Proyecto"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Residencia San Isidro V2"
                        required
                        autoFocus
                    />

                    <div className="input-wrapper">
                        <label className="input-label font-bold text-[10px] uppercase tracking-wider text-slate-400">Descripción del Alcance</label>
                        <textarea
                            className="input textarea min-h-[100px] mt-1"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalles técnicos, ubicación o notas generales..."
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions pt-6 border-t border-slate-100 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="font-bold">
                            CANCELAR
                        </Button>
                        <Button type="submit" variant="primary" loading={loading} className="px-8 shadow-lg shadow-blue-200 uppercase font-black tracking-widest text-[11px]">
                            {initialData ? 'Guardar Cambios' : 'Inicializar Proyecto'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
