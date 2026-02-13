import { useMemo } from 'react';
import { useTasks } from '../../tasks/hooks/useTasks';
import { useMilestones } from '../../projects/hooks/useMilestones';
import { useDependencies } from '../../tasks/hooks/useDependencies';
import { useResources } from '../../resources/hooks/useResources';
import { useCategories } from '../../projects/hooks/useCategories';

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

        // Transformar tareas (filtrando las que no tienen fechas válidas)
        const formattedTasks = tasks
            .filter(task => task.startDate && task.endDate)
            .map(task => {
                const start = toDate(task.startDate);
                const end = toDate(task.endDate);

                // Buscar dependencias donde esta tarea es la "hija" (toTaskId)
                const taskDeps = dependencies
                    .filter(d => d.toTaskId === task.id)
                    .map(d => d.fromTaskId)
                    .filter(fromId =>
                        tasks.some(t => t.id === fromId) ||
                        milestones.some(m => m.id === fromId)
                    );

                // Mapear recursos
                const taskResources = (task.resources || []).map(resId => {
                    return resources.find(r => r.id === resId);
                }).filter(Boolean);

                // Obtener color de categoría
                const category = categories.find(c => c.id === task.categoryId);
                const categoryColor = category ? category.color : '#3b82f6';

                return {
                    id: task.id,
                    name: task.name,
                    start,
                    end,
                    progress: task.progress || 0,
                    type: 'task',
                    dependencies: taskDeps,
                    resources: taskResources,
                    displayResources: taskResources.map(r => r.name).join(', '),
                    styles: {
                        backgroundColor: categoryColor,
                        backgroundSelectedColor: categoryColor,
                        progressColor: 'rgba(255,255,255,0.4)',
                        progressSelectedColor: 'rgba(255,255,255,0.6)'
                    },
                    isDisabled: false,
                    project: projectId
                };
            });

        // Transformar hitos (solo si tienen fecha)
        const formattedMilestones = milestones
            .filter(ms => ms.date)
            .map(ms => {
                const date = toDate(ms.date);
                const msDeps = dependencies
                    .filter(d => d.toTaskId === ms.id)
                    .map(d => d.fromTaskId);

                return {
                    id: ms.id,
                    name: ms.name,
                    start: date,
                    end: date,
                    progress: 100,
                    type: 'milestone',
                    dependencies: msDeps,
                    isDisabled: false,
                    project: projectId
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

        const projectRoot = {
            id: projectId,
            name: "Proyecto",
            start: minDate,
            end: maxDate,
            progress: 0,
            type: 'project',
            hideChildren: false,
            dependencies: []
        };

        return [projectRoot, ...formattedTasks, ...formattedMilestones];
    }, [tasks, milestones, dependencies, resources, categories, tasksLoading, milestonesLoading, depsLoading, resourcesLoading, categoriesLoading, projectId]);

    return {
        data: ganttTasks,
        loading: tasksLoading || milestonesLoading || depsLoading || resourcesLoading
    };
};
