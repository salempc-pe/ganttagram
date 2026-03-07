import { useMemo } from 'react';
import { useTasks } from '../../tasks/hooks/useTasks';
import { useMilestones } from '../../projects/hooks/useMilestones';
import { useDependencies } from '../../tasks/hooks/useDependencies';
import { useResources } from '../../resources/hooks/useResources';
import { useCategories } from '../../projects/hooks/useCategories';
import { buildFlatTree, isParentTask } from '../../tasks/utils/hierarchy';

export const useGanttData = (projectId) => {
    const { tasks, loading: tasksLoading } = useTasks(projectId);
    const { milestones, loading: milestonesLoading } = useMilestones(projectId);
    const { dependencies, loading: depsLoading } = useDependencies(projectId);
    const { resources, loading: resourcesLoading } = useResources(projectId);
    const { categories, loading: categoriesLoading } = useCategories(projectId);

    const ganttTasks = useMemo(() => {
        if (tasksLoading || milestonesLoading || depsLoading || resourcesLoading || categoriesLoading) return [];

        const toDate = (date) => {
            if (!date) return new Date();
            if (typeof date.toDate === 'function') return date.toDate();
            if (date.seconds !== undefined) return new Date(date.seconds * 1000);
            const d = new Date(date);
            return isNaN(d.getTime()) ? new Date() : d;
        };

        const parentIds = new Set(tasks.map(t => t.parentId).filter(Boolean));
        const validNodeIds = new Set([...tasks.map(t => t.id), ...milestones.map(m => m.id)]);

        const depsByToTaskId = new Map();
        dependencies.forEach(d => {
            if (validNodeIds.has(d.fromTaskId)) {
                if (!depsByToTaskId.has(d.toTaskId)) {
                    depsByToTaskId.set(d.toTaskId, []);
                }
                depsByToTaskId.get(d.toTaskId).push(d.fromTaskId);
            }
        });

        const resourceMap = new Map(resources.map(r => [r.id, r]));
        const categoryMap = new Map(categories.map(c => [c.id, c.color]));

        // --- Construir estructura de árbol plano (DFS) ---
        const orderedTasks = buildFlatTree(tasks.filter(t => t.startDate && t.endDate));

        // Transformar tareas en formato Gantt
        const formattedTasks = orderedTasks.map(task => {
            const start = toDate(task.startDate);
            const end = toDate(task.endDate);
            const hasChildren = parentIds.has(task.id);

            // Buscar dependencias donde esta tarea es la "hija" (toTaskId)
            const taskDeps = depsByToTaskId.get(task.id) || [];

            // Mapear recursos
            const taskResources = (task.resources || [])
                .map(resId => resourceMap.get(resId))
                .filter(Boolean);

            // Obtener color de categoría
            const categoryColor = categoryMap.get(task.categoryId) || '#3b82f6';

            // Si es tarea padre, se muestra como tipo "project" en el Gantt
            // para que gantt-task-react la renderice como barra de resumen
            const ganttType = hasChildren ? 'project' : 'task';

            const progress = task.progress || 0;

            return {
                id: task.id,
                name: `${task.name} (${progress}%)`,
                _rawName: task.name,
                start,
                end,
                progress,
                type: ganttType,
                dependencies: taskDeps,
                resources: taskResources,
                displayResources: taskResources.map(r => r.name).join(', '),
                styles: {
                    backgroundColor: hasChildren ? '#64748b' : categoryColor,
                    backgroundSelectedColor: hasChildren ? '#475569' : categoryColor,
                    progressColor: hasChildren ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.4)',
                    progressSelectedColor: 'rgba(255,255,255,0.6)'
                },
                isDisabled: false,
                project: task.parentId || projectId,
                // Campos de jerarquía para la lista personalizada
                _level: task._level || 0,
                _hasChildren: hasChildren,
                _parentId: task.parentId || null,
                // Las tareas-padre comienzan expandidas
                hideChildren: hasChildren ? false : undefined
            };
        });

        // Transformar hitos (solo si tienen fecha)
        const formattedMilestones = milestones
            .filter(ms => ms.date)
            .map(ms => {
                const date = toDate(ms.date);
                const msDeps = depsByToTaskId.get(ms.id) || [];

                return {
                    id: ms.id,
                    name: ms.name,
                    start: date,
                    end: date,
                    progress: 100,
                    type: 'milestone',
                    dependencies: msDeps,
                    isDisabled: false,
                    project: projectId,
                    _level: 0,
                    _hasChildren: false,
                    _parentId: null
                };
            });

        if (formattedTasks.length === 0 && formattedMilestones.length === 0) return [];

        // Calcular rango del proyecto
        const allDates = [
            ...formattedTasks.map(t => t.start.getTime()),
            ...formattedTasks.map(t => t.end.getTime()),
            ...formattedMilestones.map(m => m.start.getTime())
        ];

        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));

        // Calcular progreso promedio del proyecto (basado en tareas hoja)
        let totalProgress = 0;
        let leafTasksCount = 0;
        formattedTasks.forEach(t => {
            if (!t._hasChildren) {
                totalProgress += t.progress;
                leafTasksCount++;
            }
        });
        const projectProgress = leafTasksCount > 0 ? Math.round(totalProgress / leafTasksCount) : 0;

        const projectRoot = {
            id: projectId,
            name: `Proyecto (${projectProgress}%)`,
            _rawName: "Proyecto",
            start: minDate,
            end: maxDate,
            progress: projectProgress,
            type: 'project',
            hideChildren: false,
            dependencies: [],
            _level: -1,
            _hasChildren: true,
            _parentId: null
        };

        return [projectRoot, ...formattedTasks, ...formattedMilestones];
    }, [tasks, milestones, dependencies, resources, categories, tasksLoading, milestonesLoading, depsLoading, resourcesLoading, categoriesLoading, projectId]);

    return {
        data: ganttTasks,
        loading: tasksLoading || milestonesLoading || depsLoading || resourcesLoading
    };
};
