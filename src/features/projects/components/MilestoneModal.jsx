import { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Trash2, Plus, Flag, AlignLeft, Calendar, Tag, Settings2 } from 'lucide-react';
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
    const { milestones, updateMilestone, deleteMilestone } = useMilestones(projectId);
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

    const [newDep, setNewDep] = useState({ fromTaskId: '', type: 'FS', lag: 0 });
    const [pendingDeps, setPendingDeps] = useState([]);
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
        setNewDep({ fromTaskId: '', type: 'FS', lag: 0 });
        setPendingDeps([]);
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
        if (!newDep.fromTaskId) return;

        if (initialData) {
            const res = await addDependency(newDep.fromTaskId, initialData.id, newDep.type, newDep.lag);
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
                    [...dependencies, { fromTaskId: newDep.fromTaskId, toTaskId: initialData.id, type: newDep.type, lag: Number(newDep.lag || 0) }],
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
        } else {
            if (pendingDeps.some(d => d.fromTaskId === newDep.fromTaskId)) {
                alert('Esta dependencia ya ha sido añadida');
                return;
            }

            const predecessor = tasks.find(t => t.id === newDep.fromTaskId) ||
                milestones.find(m => m.id === newDep.fromTaskId);

            const updatedPending = [...pendingDeps, { ...newDep, id: Date.now() }];
            setPendingDeps(updatedPending);

            if (predecessor) {
                const predEnd = predecessor.endDate || predecessor.date;
                const predStart = predecessor.startDate || predecessor.date;
                let suggestedDate = new Date(formData.date + 'T00:00:00');

                if (newDep.type === 'FS') {
                    suggestedDate = new Date(predEnd);
                } else if (newDep.type === 'SS') {
                    suggestedDate = new Date(predStart);
                }

                const currentStart = new Date(formData.date + 'T00:00:00');
                if (suggestedDate > currentStart) {
                    setFormData(prev => ({
                        ...prev,
                        date: format(suggestedDate, 'yyyy-MM-dd')
                    }));
                }
            }
        }

        setNewDep({ fromTaskId: '', type: 'FS', lag: 0 });
    };

    const handleRemoveDep = async (depId) => {
        if (initialData) {
            await deleteDependency(depId);
        } else {
            setPendingDeps(prev => prev.filter(d => d.id !== depId));
        }
    };

    const handleDelete = async () => {
        if (!initialData) return;

        if (window.confirm("¿Estás seguro de que deseas eliminar este hito?")) {
            setLoading(true);
            const result = await deleteMilestone(initialData.id);
            setLoading(false);
            if (result.success) {
                onClose();
            } else {
                alert('Error al eliminar: ' + result.error);
            }
        }
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
            const result = await onSubmit(payload);

            if (!initialData && result?.success && result?.id && pendingDeps.length > 0) {
                for (const dep of pendingDeps) {
                    await addDependency(dep.fromTaskId, result.id, dep.type, dep.lag);
                }
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al guardar el hito");
        } finally {
            setLoading(false);
        }
    };

    const depTypeLabels = {
        'FS': 'F-I',
        'SS': 'I-I',
        'FF': 'F-F',
        'SF': 'I-F'
    };

    return (
        <div className="modal-overlay task-modal-overlay">
            <div className="modal-content task-modal milestone-modal-sizing">
                <div className="modal-header">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-0">
                            <Flag className="text-slate-900" size={28} strokeWidth={2.5} />
                            <h2 className="m-0 leading-none">{initialData ? 'Editar Hito' : 'Nuevo Hito'}</h2>
                        </div>
                    </div>
                </div>

                <form id="milestone-form" onSubmit={handleSubmit} className="modal-form">
                    <Input
                        label={
                            <span className="input-label-with-icon">
                                <AlignLeft size={14} /> HITO
                            </span>
                        }
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Fin de excavación"
                        autoFocus
                    />

                    <div className="form-section">
                        <div className="form-row">
                            <div className="form-col-flex">
                                <label className="input-label-with-icon">
                                    <Calendar size={14} /> FECHA
                                </label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row mt-4">
                            <div className="form-col-flex">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="input-label-with-icon">
                                        <Tag size={14} /> CATEGORÍA
                                    </label>
                                    {!isNewCategoryMode && (
                                        <button
                                            type="button"
                                            className="text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                                            onClick={() => setIsNewCategoryMode(true)}
                                        >
                                            + Nueva
                                        </button>
                                    )}
                                </div>

                                {isNewCategoryMode ? (
                                    <div className="flex gap-2 animate-in slide-in-from-top-1 duration-200">
                                        <input
                                            type="text"
                                            className="input flex-1"
                                            placeholder="Nombre categoría..."
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            autoFocus
                                        />
                                        <input
                                            type="color"
                                            className="input-color-picker"
                                            value={newCategoryColor}
                                            onChange={(e) => setNewCategoryColor(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            onClick={() => setIsNewCategoryMode(false)}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        className="select"
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
                        </div>
                    </div>

                    <div className="input-wrapper mb-0">
                        <label className="input-label-with-icon">
                            <Settings2 size={14} /> Descripción / Notas
                        </label>
                        <textarea
                            className="input textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    <div className="dependencies-manager">
                        <h3 className="section-title">
                            <LinkIcon size={16} /> Dependencias (Predecesores)
                        </h3>

                        {(initialData ? myPredecessors : pendingDeps).length > 0 && (
                            <div className="dependencies-list mb-4 space-y-1">
                                {(initialData ? myPredecessors : pendingDeps).map(dep => (
                                    <div key={dep.id} className="dependency-item group">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {depTypeLabels[dep.type] || dep.type}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 truncate">
                                                {getItemName(dep.fromTaskId)}
                                            </span>
                                            {dep.lag && dep.lag !== 0 && (
                                                <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium ml-2">
                                                    {dep.lag > 0 ? `+${dep.lag}d` : `${dep.lag}d`}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                            onClick={() => handleRemoveDep(dep.id)}
                                            title="Eliminar dependencia"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="dep-input-row">
                            <div className="dep-input-task">
                                <label className="dep-label">Predecesora</label>
                                <select
                                    className="select"
                                    value={newDep.fromTaskId}
                                    onChange={(e) => setNewDep({ ...newDep, fromTaskId: e.target.value })}
                                >
                                    <option value="">Seleccionar tarea/hito...</option>
                                    {availablePredecessors.map(p => (
                                        <option key={p.id} value={p.id}>
                                            ({p.type === 'task' ? 'T' : 'H'}) {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="dep-input-type">
                                <label className="dep-label">Tipo</label>
                                <select
                                    className="select"
                                    value={newDep.type}
                                    onChange={(e) => setNewDep({ ...newDep, type: e.target.value })}
                                >
                                    <option value="FS">F-I</option>
                                    <option value="SS">I-I</option>
                                    <option value="FF">F-F</option>
                                    <option value="SF">I-F</option>
                                </select>
                            </div>
                            <div className="dep-input-lag">
                                <label className="dep-label">Días</label>
                                <input
                                    type="number"
                                    className="input text-center px-1"
                                    value={newDep.lag}
                                    onChange={(e) => setNewDep({ ...newDep, lag: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                />
                            </div>
                            <button
                                type="button"
                                className="dep-add-btn"
                                onClick={handleAddDep}
                                disabled={!newDep.fromTaskId}
                                title="Añadir dependencia"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                </form>

                <div className="modal-actions-compact">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-cancel-mini"
                        title="Cancelar"
                    >
                        <X size={20} />
                    </button>

                    {initialData && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="btn-delete-mini"
                            title="Eliminar hito"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}

                    <Button
                        type="submit"
                        form="milestone-form"
                        onClick={handleSubmit}
                        variant="primary"
                        loading={loading}
                        className="btn-save-large"
                    >
                        {initialData ? 'GUARDAR' : 'CREAR HITO'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
