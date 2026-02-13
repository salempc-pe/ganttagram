import { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useTasks } from '../../tasks/hooks/useTasks';
import { useMilestones } from '../../projects/hooks/useMilestones';
import { useDependencies } from '../../tasks/hooks/useDependencies';
import { useCategories } from '../../projects/hooks/useCategories';
import { calculateAutoSchedule } from '../../tasks/utils/scheduler';
import { format } from 'date-fns';
import './MilestoneModal.css';

export const MilestoneModal = ({ isOpen, onClose, onSubmit, projectId, initialData = null }) => {
    const { tasks, updateTasksBatch } = useTasks(projectId);
    const { milestones, updateMilestone } = useMilestones(projectId);
    const { dependencies, addDependency, deleteDependency } = useDependencies(projectId);
    const { categories, addCategory } = useCategories(projectId);

    const [formData, setFormData] = useState({
        name: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        categoryId: ''
    });

    const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#f97316'); // Naranja por defecto para hitos

    const [newDep, setNewDep] = useState({ fromTaskId: '', type: 'FS' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            setFormData({
                name: initialData.name,
                date: format(initialData.date, 'yyyy-MM-dd'),
                description: initialData.description || '',
                categoryId: initialData.categoryId || ''
            });
        } else {
            setFormData({
                name: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                description: '',
                categoryId: categories.length > 0 ? categories[0].id : ''
            });
        }
        setNewDep({ fromTaskId: '', type: 'FS' });
        setIsNewCategoryMode(false);

        // Bloquear scroll del fondo de forma agresiva
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');

        return () => {
            document.documentElement.classList.remove('modal-open');
            document.body.classList.remove('modal-open');
        };
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    // Dependencias actuales
    const myPredecessors = initialData
        ? dependencies.filter(d => d.toTaskId === initialData.id)
        : [];

    // Lista de elementos que pueden ser predecesores
    const availablePredecessors = [
        ...tasks.map(t => ({ id: t.id, name: t.name, type: 'task' })),
        ...milestones.map(m => ({ id: m.id, name: m.name, type: 'milestone' }))
    ].filter(p => !initialData || p.id !== initialData.id);

    const getItemName = (id) => {
        const item = availablePredecessors.find(p => p.id === id);
        return item ? item.name : 'Elemento desconocido';
    };

    const applyBatchUpdates = async (updatesMap) => {
        const taskUpdates = {};
        const milestoneUpdates = {};

        Object.entries(updatesMap).forEach(([id, data]) => {
            const isMilestone = milestones.some(m => m.id === id);
            if (isMilestone) milestoneUpdates[id] = data;
            else taskUpdates[id] = data;
        });

        if (Object.keys(taskUpdates).length > 0) await updateTasksBatch(taskUpdates);
        for (const [id, data] of Object.entries(milestoneUpdates)) await updateMilestone(id, data);
    };

    const handleAddDep = async () => {
        if (!newDep.fromTaskId || !initialData) return;

        const res = await addDependency(newDep.fromTaskId, initialData.id, newDep.type);
        if (!res.success) {
            alert(res.error);
            return;
        }

        const predecessor = tasks.find(t => t.id === newDep.fromTaskId) ||
            milestones.find(m => m.id === newDep.fromTaskId);

        if (predecessor) {
            const predDates = {
                startDate: predecessor.startDate || predecessor.date,
                endDate: predecessor.endDate || predecessor.date
            };

            const updatesMap = calculateAutoSchedule(
                tasks,
                [...dependencies, { fromTaskId: newDep.fromTaskId, toTaskId: initialData.id, type: newDep.type }],
                newDep.fromTaskId,
                predDates,
                milestones
            );

            await applyBatchUpdates(updatesMap);

            if (updatesMap[initialData.id]) {
                const myUpdates = updatesMap[initialData.id];
                setFormData(prev => ({
                    ...prev,
                    date: format(myUpdates.date || myUpdates.startDate, 'yyyy-MM-dd')
                }));
            }
        }

        setNewDep({ fromTaskId: '', type: 'FS' });
    };

    const handleRemoveDep = async (depId) => {
        await deleteDependency(depId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        if (isNewCategoryMode && !newCategoryName.trim()) return;

        setLoading(true);
        try {
            let categoryIdToUse = formData.categoryId;

            if (isNewCategoryMode && newCategoryName.trim()) {
                const catResult = await addCategory(newCategoryName, newCategoryColor);
                if (catResult.success) {
                    categoryIdToUse = catResult.id;
                } else {
                    alert('Error al crear categoría: ' + catResult.error);
                    setLoading(false);
                    return;
                }
            }

            const newDate = new Date(formData.date + 'T00:00:00');

            if (initialData) {
                // Auto-scheduling al cambiar la fecha del hito directamente
                const updatesMap = calculateAutoSchedule(
                    tasks,
                    dependencies,
                    initialData.id,
                    { date: newDate },
                    milestones
                );
                await applyBatchUpdates(updatesMap);
            }

            const payload = {
                name: formData.name.trim(),
                date: newDate,
                categoryId: categoryIdToUse,
                description: formData.description.trim()
            };
            await onSubmit(payload);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al guardar el hito");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content milestone-modal">
                <div className="modal-header">
                    <h2>{initialData ? 'Editar Hito' : 'Nuevo Hito'}</h2>
                    <button onClick={onClose} className="btn-close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <Input
                        label="Nombre del hito"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Fin de excavación"
                        autoFocus
                    />

                    <Input
                        type="date"
                        label="Fecha"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />

                    <div className="input-wrapper">
                        <div className="flex justify-between items-end mb-1">
                            <label className="input-label mb-0">Categoría</label>
                            <button
                                type="button"
                                className="text-xs text-blue-500 hover:underline"
                                onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}
                            >
                                {isNewCategoryMode ? 'Seleccionar existente' : '+ Crear nueva'}
                            </button>
                        </div>

                        {isNewCategoryMode ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Nombre categoría..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <input
                                    type="color"
                                    className="input-color-picker"
                                    value={newCategoryColor}
                                    onChange={(e) => setNewCategoryColor(e.target.value)}
                                />
                            </div>
                        ) : (
                            <select
                                className="input select"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">Sin categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="input-wrapper">
                        <label className="input-label">Descripción (opcional)</label>
                        <textarea
                            className="input textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                        />
                    </div>

                    {initialData && (
                        <div className="dependencies-manager">
                            <h3 className="section-title">
                                <LinkIcon size={16} /> Dependencias (Predecesores)
                            </h3>

                            <div className="dependency-add-row">
                                <select
                                    className="input select"
                                    value={newDep.fromTaskId}
                                    onChange={(e) => setNewDep({ ...newDep, fromTaskId: e.target.value })}
                                >
                                    <option value="">Seleccionar predecesor...</option>
                                    {availablePredecessors.map(p => (
                                        <option key={p.id} value={p.id}>
                                            ({p.type === 'task' ? 'T' : 'H'}) {p.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="input select type-select"
                                    value={newDep.type}
                                    onChange={(e) => setNewDep({ ...newDep, type: e.target.value })}
                                >
                                    <option value="FS">Fin-Inicio</option>
                                    <option value="SS">Inic-Inic</option>
                                    <option value="FF">Fin-Fin</option>
                                    <option value="SF">Inic-Fin</option>
                                </select>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleAddDep}
                                    disabled={!newDep.fromTaskId}
                                >
                                    Agregar
                                </Button>
                            </div>

                            <div className="dependencies-list">
                                {myPredecessors.length === 0 ? (
                                    <p className="empty-text">Sin dependencias asignadas</p>
                                ) : (
                                    myPredecessors.map(dep => (
                                        <div key={dep.id} className="dependency-item">
                                            <span className="dep-name">{getItemName(dep.fromTaskId)}</span>
                                            <span className="dep-type badge">{dep.type}</span>
                                            <button
                                                type="button"
                                                className="btn-delete-dep"
                                                onClick={() => handleRemoveDep(dep.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            {initialData ? 'Guardar' : 'Crear Hito'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
