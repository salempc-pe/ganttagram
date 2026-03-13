import { useState, useEffect } from 'react';
import { X, Calendar, User, Link as LinkIcon, Trash2, Tag, Percent, Users, AlignLeft, Clock, Plus, Settings2, FolderTree } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useCategories } from '../../projects/hooks/useCategories';
import { useResources } from '../../resources/hooks/useResources';
import { useDependencies } from '../../tasks/hooks/useDependencies';
import { useMilestones } from '../../projects/hooks/useMilestones';
import { useTasks } from '../../tasks/hooks/useTasks';
import { calculateAutoSchedule, snapToPredecessors } from '../../tasks/utils/scheduler';
import { getDescendantIds, isParentTask } from '../../tasks/utils/hierarchy';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { adjustToWorkingDay, getWorkingDuration, addWorkingDays } from '../../../shared/utils/calendar';
import { hasCycle } from '../../tasks/utils/cycles';
import { MessageSquare, Send } from 'lucide-react';
import { useComments } from '../../tasks/hooks/useComments';
import './TaskModal.css';

export const TaskModal = ({ isOpen, onClose, onSubmit, projectId, initialData = null, calendar = null }) => {
    const { categories, addCategory } = useCategories(projectId);
    const { resources, addResource } = useResources(projectId);
    const { milestones, updateMilestone } = useMilestones(projectId);
    const { tasks, updateTasksBatch, deleteTask } = useTasks(projectId);
    const { dependencies, addDependency, deleteDependency } = useDependencies(projectId);

    const [formData, setFormData] = useState({
        name: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        categoryId: '',
        description: '',
        progress: 0,
        resources: [],
        duration: 1,
        parentId: null
    });

    const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

    // Estado para nuevo recurso inline
    const [isNewResourceMode, setIsNewResourceMode] = useState(false);
    const [newResourceName, setNewResourceName] = useState('');
    const [newResourceColor, setNewResourceColor] = useState('#3b82f6');
    const [newResourceType, setNewResourceType] = useState('person');
    const [newResourceRole, setNewResourceRole] = useState('');

    // Estado para nueva dependencia
    const [newDep, setNewDep] = useState({ fromTaskId: '', type: 'FS', lag: 0 });
    const [pendingDeps, setPendingDeps] = useState([]);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('details');

    const { comments, loading: commentsLoading, addComment } = useComments(projectId, initialData?.id);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            const startStr = initialData.startDate instanceof Date
                ? format(initialData.startDate, 'yyyy-MM-dd')
                : format(new Date(initialData.startDate), 'yyyy-MM-dd');

            const endStr = initialData.endDate instanceof Date
                ? format(initialData.endDate, 'yyyy-MM-dd')
                : format(new Date(initialData.endDate), 'yyyy-MM-dd');

            setFormData({
                name: initialData.name,
                startDate: startStr,
                endDate: endStr,
                categoryId: initialData.categoryId || '',
                description: initialData.description || '',
                progress: initialData.progress || 0,
                resources: initialData.resources || [],
                duration: getWorkingDuration(new Date(startStr + 'T00:00:00'), new Date(endStr + 'T00:00:00'), calendar),
                parentId: initialData.parentId || null
            });
        } else {
            setFormData(prev => ({
                ...prev,
                name: '',
                description: '',
                progress: 0,
                categoryId: categories.length > 0 ? categories[0].id : '',
                resources: [],
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
                duration: 1,
                parentId: null
            }));
            setPendingDeps([]);
        }
        setIsNewCategoryMode(false);
        setNewCategoryName('');
        setIsNewResourceMode(false);
        setNewResourceName('');
        setNewResourceRole('');
        setNewDep({ fromTaskId: '', type: 'FS', lag: 0 });

        // Bloquear scroll del fondo de forma agresiva
        document.body.style.overflow = 'hidden';

        // Ocultar tooltips del gantt que puedan haber quedado abiertos (fix visual)
        const tooltips = document.querySelectorAll('.gantt-tooltip');
        tooltips.forEach(t => t.style.display = 'none');

        return () => {
            document.body.style.overflow = 'unset';
            // Restaurar tooltips si es necesario (el gantt los maneja, así que solo limpiar style)
            tooltips.forEach(t => t.style.display = '');
        };
    }, [isOpen, initialData, categories, projectId, calendar]);

    const handleDelete = async () => {
        if (!initialData) return;

        const hasChildren = isParentTask(initialData.id, tasks);
        const confirmMessage = hasChildren
            ? "⚠️ Esta es una tarea principal. Si la eliminas, se borrarán TAMBIÉN todas sus subtareas.\n\n¿Estás seguro de continuar?"
            : "¿Estás seguro de que deseas eliminar esta tarea?";

        if (window.confirm(confirmMessage)) {
            setLoading(true);
            const result = await deleteTask(initialData.id);
            setLoading(false);
            if (result.success) {
                onClose();
            } else {
                alert('Error al eliminar: ' + result.error);
            }
        }
    };

    if (!isOpen) return null;

    // Detectar si esta tarea es "padre" (tiene subtareas)
    const isThisAParent = initialData ? isParentTask(initialData.id, tasks) : false;

    // Tareas que NO pueden ser seleccionadas como padre:
    // 1. La tarea misma
    // 2. Sus descendientes (evitar ciclos)
    const excludedIds = initialData
        ? [initialData.id, ...getDescendantIds(initialData.id, tasks)]
        : [];

    // Lista de tareas disponibles como "Tarea Principal"
    const availableParents = tasks.filter(t => !excludedIds.includes(t.id));

    // Helper para construir nombre indentado en el selector de padres
    const getParentLabel = (task) => {
        let level = 0;
        let current = task;
        while (current.parentId) {
            level++;
            current = tasks.find(t => t.id === current.parentId) || {};
        }
        return `${'─'.repeat(level)} ${task.name}`;
    };

    // Obtener mis dependencias (quiénes son mis predecesores)
    const myPredecessors = initialData
        ? dependencies.filter(d => d.toTaskId === initialData.id)
        : [];

    // Lista de elementos que pueden ser predecesores (todos excepto yo)
    const availablePredecessors = [
        ...tasks.map(t => ({ id: t.id, name: t.name, type: 'task' })),
        ...milestones.map(m => ({ id: m.id, name: m.name, type: 'milestone' }))
    ].filter(p => !initialData || p.id !== initialData.id);

    const getItemName = (id) => {
        const item = availablePredecessors.find(p => p.id === id);
        return item ? item.name : 'Elemento desconocido';
    };

    const depTypeLabels = {
        'FS': 'F-I',
        'SS': 'I-I',
        'FF': 'F-F',
        'SF': 'I-F'
    };

    const toggleResource = (resourceId) => {
        setFormData(prev => {
            const current = prev.resources || [];
            if (current.includes(resourceId)) {
                return { ...prev, resources: current.filter(id => id !== resourceId) };
            } else {
                return { ...prev, resources: [...current, resourceId] };
            }
        });
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

        for (const [id, data] of Object.entries(milestoneUpdates)) {
            await updateMilestone(id, data);
        }
    };

    const handleAddDep = async () => {
        if (!newDep.fromTaskId) return;

        const predecessor = tasks.find(t => t.id === newDep.fromTaskId) ||
            milestones.find(m => m.id === newDep.fromTaskId);

        if (!predecessor) return;

        // Validar Ciclos (Fase 3)
        if (initialData) {
            if (hasCycle(initialData.id, newDep.fromTaskId, dependencies)) {
                alert("⚠️ Error: Se ha detectado una dependencia circular. No se puede vincular esta tarea.");
                return;
            }
        } else {
             // En modo creación, usamos las dependencias existentes + las que ya están en la cola 'pendingDeps'
            const currentDepsAndPending = [...dependencies, ...pendingDeps];
            // ID temporal para la tarea que aún no existe
            const tempId = 'NEW_TASK_TEMP_ID';
            if (hasCycle(tempId, newDep.fromTaskId, currentDepsAndPending)) {
                alert("⚠️ Error: Se ha detectado una dependencia circular con las tareas seleccionadas.");
                return;
            }
        }

        const currentDuration = getWorkingDuration(
            new Date(formData.startDate + 'T00:00:00'),
            new Date(formData.endDate + 'T00:00:00'),
            calendar
        );

        // Si estamos editando, guardar en DB
        if (initialData) {
            const res = await addDependency(newDep.fromTaskId, initialData.id, newDep.type, newDep.lag);
            if (!res.success) {
                alert(res.error);
                return;
            }

            const predDates = {
                startDate: predecessor.startDate || predecessor.date,
                endDate: predecessor.endDate || predecessor.date
            };

            const updatesMap = calculateAutoSchedule(
                tasks,
                [...dependencies, { fromTaskId: newDep.fromTaskId, toTaskId: initialData.id, type: newDep.type, lag: Number(newDep.lag || 0) }],
                newDep.fromTaskId,
                predDates,
                milestones,
                calendar
            );

            await applyBatchUpdates(updatesMap);

            if (updatesMap[initialData.id]) {
                const myUpdates = updatesMap[initialData.id];
                const newS = myUpdates.startDate || myUpdates.date;
                const newE = myUpdates.endDate || myUpdates.date;
                setFormData(prev => ({
                    ...prev,
                    startDate: format(newS, 'yyyy-MM-dd'),
                    endDate: format(newE, 'yyyy-MM-dd'),
                    duration: getWorkingDuration(newS, newE, calendar)
                }));
            }
        } else {
            // Si es creación, guardar localmente y ajustar fechas
            if (pendingDeps.some(d => d.fromTaskId === newDep.fromTaskId)) {
                alert('Esta dependencia ya ha sido añadida');
                return;
            }

            const updatedPending = [...pendingDeps, { ...newDep, id: Date.now() }];
            setPendingDeps(updatedPending);

            // Lógica de cálculo de restricción para la NUEVA tarea (Fase 3: Motor Unificado)
            const tempTaskId = 'NEW_TASK_TEMP_ID';
            const itemMap = {
                [tempTaskId]: {
                    id: tempTaskId,
                    _start: new Date(formData.startDate + 'T00:00:00'),
                    _end: new Date(formData.endDate + 'T00:00:00'),
                    duration: formData.duration.toString(),
                    _type: 'task'
                },
                [predecessor.id]: {
                    id: predecessor.id,
                    _start: new Date(predecessor.startDate || predecessor.date),
                    _end: new Date(predecessor.endDate || predecessor.date),
                    _type: (predecessor.startDate || predecessor.endDate) ? 'task' : 'milestone'
                }
            };

            const latestDep = { fromTaskId: newDep.fromTaskId, toTaskId: tempTaskId, type: newDep.type, lag: Number(newDep.lag || 0) };

            snapToPredecessors(tempTaskId, itemMap, [latestDep], calendar);

            const adjustedItem = itemMap[tempTaskId];
            setFormData(prev => ({
                ...prev,
                startDate: format(adjustedItem._start, 'yyyy-MM-dd'),
                endDate: format(adjustedItem._end, 'yyyy-MM-dd')
            }));
        }

        setNewDep({ fromTaskId: '', type: 'FS', lag: 0 });
    };

    const handleDateChange = (field, value) => {

        if (field === 'startDate') {
            // Si cambia inicio, mantenemos duración y movemos fin
            const start = new Date(value + 'T00:00:00');
            const end = addWorkingDays(start, formData.duration - 1, calendar);
            setFormData(prev => ({
                ...prev,
                startDate: value,
                endDate: format(end, 'yyyy-MM-dd')
            }));
        } else if (field === 'endDate') {
            // Si cambia fin, recalculamos duración
            const start = new Date(formData.startDate + 'T00:00:00');
            const end = new Date(value + 'T00:00:00');
            const newDuration = getWorkingDuration(start, end, calendar);
            setFormData(prev => ({
                ...prev,
                endDate: value,
                duration: newDuration
            }));
        }
    };

    const handleDurationChange = (value) => {
        // Allow empty field while the user is typing/deleting
        if (value === '' || value === null || value === undefined) {
            setFormData(prev => ({ ...prev, duration: '' }));
            return;
        }

        const dur = parseInt(value);
        if (isNaN(dur) || dur < 1) return;

        // Si cambia duración, mantenemos inicio y movemos fin
        const start = new Date(formData.startDate + 'T00:00:00');
        const end = addWorkingDays(start, dur - 1, calendar);

        setFormData(prev => ({
            ...prev,
            duration: dur,
            endDate: format(end, 'yyyy-MM-dd')
        }));
    };

    const handleRemoveDep = async (depId) => {
        if (initialData) {
            await deleteDependency(depId);
        } else {
            setPendingDeps(prev => prev.filter(d => d.id !== depId));
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

            let resourcesToUse = [...formData.resources];
            if (isNewResourceMode && newResourceName.trim()) {
                const resResult = await addResource({
                    name: newResourceName.trim(),
                    type: newResourceType,
                    role: newResourceRole.trim(),
                    color: newResourceColor
                });
                if (resResult.success) {
                    resourcesToUse.push(resResult.id);
                } else {
                    alert('Error al crear recurso: ' + resResult.error);
                    setLoading(false);
                    return;
                }
            }

            const taskPayload = {
                name: formData.name.trim(),
                startDate: new Date(formData.startDate + 'T00:00:00'),
                endDate: new Date(formData.endDate + 'T23:59:59'),
                categoryId: categoryIdToUse,
                description: formData.description.trim(),
                progress: Number(formData.progress),
                resources: resourcesToUse,
                parentId: formData.parentId || null
            };

            const result = await onSubmit(taskPayload);

            // Si es nuevo, guardar las dependencias pendientes
            if (!initialData && result?.success && result?.id && pendingDeps.length > 0) {
                // Ejecutar en serie para asegurar integridad
                for (const dep of pendingDeps) {
                    await addDependency(dep.fromTaskId, result.id, dep.type);
                }
            }

            onClose();
        } catch (error) {
            console.error("Error submitting task:", error);
            alert("Error al guardar la tarea");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAddResource = async () => {
        if (!newResourceName.trim()) return;
        setLoading(true);
        const resResult = await addResource({
            name: newResourceName.trim(),
            type: newResourceType,
            role: newResourceRole.trim(),
            color: newResourceColor
        });
        setLoading(false);
        if (resResult.success) {
            toggleResource(resResult.id);
            setNewResourceName('');
            setNewResourceRole('');
            setIsNewResourceMode(false);
        } else {
            alert('Error al crear recurso: ' + resResult.error);
        }
    };

    async function handleAddComment() {
        if (!commentText.trim()) return;
        const res = await addComment(commentText);
        if (res.success) setCommentText('');
    }

    return (
        <div className="modal-overlay task-modal-overlay">
            <div className="modal-content task-modal">
                <div className="modal-header">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-0">
                            <Clock style={{ color: 'var(--text-primary)' }} size={28} strokeWidth={2.5} />
                            <h2 className="m-0 leading-none">{initialData ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                        </div>
                        {initialData && (
                            <div className="modal-tabs mt-4">
                                <button
                                    className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('details')}
                                >
                                    Detalles
                                </button>
                                <button
                                    className={`modal-tab ${activeTab === 'comments' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('comments')}
                                >
                                    Comentarios ({comments.length})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {activeTab === 'details' ? (
                    <>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <Input
                                label={
                                    <span className="input-label-with-icon">
                                        <AlignLeft size={14} /> TAREA
                                    </span>
                                }
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Vaciado de columnas, Tarrajeo de muros..."
                                required
                            />

                            <div className="form-row">
                                <div className="form-col-flex">
                                    <label className="input-label-with-icon">
                                        <FolderTree size={14} /> TAREA PRINCIPAL
                                    </label>
                                    <select
                                        className="select"
                                        value={formData.parentId || ''}
                                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                                    >
                                        <option value="">Sin tarea principal (raíz)</option>
                                        {availableParents.map(t => (
                                            <option key={t.id} value={t.id}>{getParentLabel(t)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {isThisAParent && (
                                <div className="parent-task-notice">
                                    <FolderTree size={16} />
                                    <span>Esta tarea es <strong>Resumen</strong>: sus fechas y progreso se calculan automáticamente desde sus subtareas.</span>
                                </div>
                            )}

                            <div className="form-row">
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

                            <div className="form-row-dates" style={{ padding: '0.75rem', background: 'var(--bg-secondary)', flexDirection: 'column', gap: '8px' }}>
                                <label className="input-label-with-icon" style={{ marginBottom: 0 }}>
                                    <Percent size={14} /> AVANCE DEL PROYECTO
                                </label>
                                <div className="flex items-center gap-4 w-full">
                                    <input
                                        type="range"
                                        className="flex-1 w-full accent-indigo-600 h-2 bg-slate-200 rounded-[10px] appearance-none cursor-pointer"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={formData.progress}
                                        onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                                        disabled={isThisAParent}
                                        style={{ opacity: isThisAParent ? 0.5 : 1, cursor: isThisAParent ? 'not-allowed' : 'pointer' }}
                                    />
                                    <div className="flex items-center justify-center min-w-[70px] h-10 bg-white border-2 border-indigo-600/20 rounded-lg shadow-sm shrink-0">
                                        <span className="font-tech font-bold text-indigo-700 text-lg">{formData.progress}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row-dates">
                                <div className="form-col-date">
                                    <label className="input-label-with-icon">
                                        <Calendar size={14} /> Inicio
                                    </label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.startDate}
                                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                                        required
                                        disabled={isThisAParent}
                                        style={{ opacity: isThisAParent ? 0.6 : 1, cursor: isThisAParent ? 'not-allowed' : 'text' }}
                                    />
                                </div>
                                <div className="form-col-duration">
                                    <label className="input-label-with-icon">
                                        <Clock size={14} /> Días
                                    </label>
                                    <input
                                        type="number"
                                        className="input text-center"
                                        min="1"
                                        value={formData.duration}
                                        onChange={(e) => handleDurationChange(e.target.value)}
                                        onBlur={() => {
                                            if (!formData.duration || formData.duration === '') {
                                                handleDurationChange('1');
                                            }
                                        }}
                                        required
                                        disabled={isThisAParent}
                                        style={{ opacity: isThisAParent ? 0.6 : 1, cursor: isThisAParent ? 'not-allowed' : 'text' }}
                                    />
                                </div>
                                <div className="form-col-date">
                                    <label className="input-label-with-icon">
                                        <Calendar size={14} /> Fin
                                    </label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.endDate}
                                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                                        required
                                        disabled={isThisAParent}
                                        style={{ opacity: isThisAParent ? 0.6 : 1, cursor: isThisAParent ? 'not-allowed' : 'text' }}
                                    />
                                </div>
                            </div>

                            <div className="input-wrapper mb-0">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="input-label-with-icon mb-0">
                                        <Users size={14} /> RECURSOS
                                    </label>
                                    <button
                                        type="button"
                                        className="text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                                        onClick={() => setIsNewResourceMode(!isNewResourceMode)}
                                    >
                                        {isNewResourceMode ? 'Cancelar' : '+ Nuevo Recurso'}
                                    </button>
                                </div>
                                <div className="resources-selector">
                                    {isNewResourceMode && (
                                        <div className="bg-indigo-50/50 p-4 rounded-lg flex flex-col gap-3 border border-indigo-100 mb-4 animate-in">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase">Nuevo Recurso Maestro</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    className="input bg-white"
                                                    placeholder="Nombre: Juan Pérez..."
                                                    value={newResourceName}
                                                    onChange={(e) => setNewResourceName(e.target.value)}
                                                />
                                                <select
                                                    className="select bg-white"
                                                    value={newResourceType}
                                                    onChange={(e) => setNewResourceType(e.target.value)}
                                                >
                                                    <option value="person">Persona</option>
                                                    <option value="equipment">Maquinaria</option>
                                                    <option value="material">Material</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-3 items-center">
                                                <input
                                                    type="text"
                                                    className="input flex-1 bg-white"
                                                    placeholder="Rol: Operario, Ingeniero..."
                                                    value={newResourceRole}
                                                    onChange={(e) => setNewResourceRole(e.target.value)}
                                                />
                                                <input
                                                    type="color"
                                                    className="input-color-picker"
                                                    value={newResourceColor}
                                                    onChange={(e) => setNewResourceColor(e.target.value)}
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleQuickAddResource}
                                                    disabled={!newResourceName.trim()}
                                                >
                                                    Agregar
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {resources.length === 0 ? (
                                        <div className="text-center py-4 text-xs text-tertiary italic">
                                            No hay recursos registrados. Crea uno nuevo arriba.
                                        </div>
                                    ) : (
                                        <div className="resources-chips">
                                            {resources.map(res => (
                                                <div
                                                    key={res.id}
                                                    className={`resource-chip ${formData.resources.includes(res.id) ? 'active' : ''}`}
                                                    onClick={() => toggleResource(res.id)}
                                                    style={{
                                                        '--res-color': res.color || '#3b82f6',
                                                    }}
                                                >
                                                    <User size={14} />
                                                    <span>{res.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="input-wrapper mb-0">
                                <label className="input-label-with-icon">
                                    <LinkIcon size={14} /> DEPENDENCIAS
                                </label>
                                <div className="dependencies-manager">
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
                                                    <option key={p.id} value={p.id}>{p.name}</option>
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
                            </div>

                            <div className="input-wrapper mb-0">
                                <label className="input-label-with-icon">
                                    <Settings2 size={14} /> Descripción / Notas
                                </label>
                                <textarea
                                    className="input textarea"
                                    placeholder="Detalles adicionales sobre el procedimiento o requerimientos..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
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
                                    title="Eliminar tarea"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                                onClick={handleSubmit}
                                className="btn-save-large"
                            >
                                {initialData ? 'GUARDAR' : 'CREAR TAREA'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="comments-section p-6 flex flex-col h-[550px] bg-slate-50/50">
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 comments-list">
                            {commentsLoading ? (
                                <p className="text-center text-secondary py-4">Cargando comentarios...</p>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-16 text-slate-300">
                                    <MessageSquare size={64} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-lg font-medium">Sin comentarios aún</p>
                                    <p className="text-sm">Sé el primero en anotar algo sobre esta tarea.</p>
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="comment-item bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                    {comment.userName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{comment.userName}</span>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                                {format(comment.createdAt, 'dd MMM, HH:mm', { locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pl-10">{comment.text}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="comment-input-area flex gap-3 pt-6 border-t border-slate-200 bg-transparent">
                            <textarea
                                className="input flex-1 resize-none py-3 px-4 bg-white border-slate-200 rounded-xl shadow-inner focus:shadow-none"
                                placeholder="Escribe una observación o actualización..."
                                rows={2}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                }}
                            />
                            <Button
                                variant="primary"
                                className="h-auto px-6 rounded-xl shadow-lg shadow-indigo-100"
                                onClick={handleAddComment}
                                disabled={!commentText.trim()}
                            >
                                <Send size={20} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

