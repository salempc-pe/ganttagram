import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot } from '../../../services/firebase/config';
import { useAuth } from '../../auth/AuthContext';

/**
 * Hook para obtener un resumen global de todos los proyectos del usuario.
 * Agrega hitos próximos y tareas críticas.
 */
export const useGlobalSummary = () => {
    const { user } = useAuth();
    const [milestones, setMilestones] = useState([]);
    const [criticalTasks, setCriticalTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setMilestones([]);
            setCriticalTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // 1. Obtener los proyectos que el usuario posee
        // (En el futuro esto debería incluir proyectos donde es miembro)
        const projectsRef = collection(db, 'projects');
        const projectsQuery = query(projectsRef, where('memberUids', 'array-contains', user.uid));

        let projectSubscriptions = [];

        const unsubscribeProjects = onSnapshot(projectsQuery, (projectsSnapshot) => {
            // Limpiar suscripciones anteriores de hilos/tareas cuando cambian los proyectos
            projectSubscriptions.forEach(unsub => unsub());
            projectSubscriptions = [];

            const projectIds = projectsSnapshot.docs.map(doc => doc.id);
            const projectMap = {};
            projectsSnapshot.docs.forEach(doc => {
                projectMap[doc.id] = doc.data().name;
            });

            if (projectIds.length === 0) {
                setMilestones([]);
                setCriticalTasks([]);
                setLoading(false);
                return;
            }

            const limitedProjectIds = projectIds.slice(0, 10);

            const safeDate = (date) => {
                try {
                    if (!date) return new Date();
                    if (typeof date.toDate === 'function') return date.toDate();
                    if (date.seconds !== undefined) return new Date(date.seconds * 1000);
                    const d = new Date(date);
                    return isNaN(d.getTime()) ? new Date() : d;
                } catch {
                    return new Date();
                }
            };

            limitedProjectIds.forEach(projectId => {
                // Hitos
                const msRef = collection(db, `projects/${projectId}/milestones`);
                const msUnsub = onSnapshot(msRef, (snapshot) => {
                    const msData = snapshot.docs.map(doc => {
                        try {
                            return {
                                id: doc.id,
                                projectId,
                                projectName: projectMap[projectId],
                                ...doc.data(),
                                date: safeDate(doc.data().date)
                            };
                        } catch (e) {
                            console.error("Error parsing milestone:", e);
                            return null;
                        }
                    }).filter(Boolean);

                    setMilestones(prev => {
                        const filtered = prev.filter(m => m.projectId !== projectId);
                        return [...filtered, ...msData].sort((a, b) => a.date - b.date);
                    });
                });
                projectSubscriptions.push(msUnsub);

                // Tareas Críticas
                const tasksRef = collection(db, `projects/${projectId}/tasks`);
                const tasksUnsub = onSnapshot(tasksRef, (snapshot) => {
                    const now = new Date();
                    const nextWeek = new Date();
                    nextWeek.setDate(now.getDate() + 7);

                    const tasksData = snapshot.docs.map(doc => {
                        try {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                projectId,
                                projectName: projectMap[projectId],
                                ...data,
                                startDate: safeDate(data.startDate),
                                endDate: safeDate(data.endDate)
                            };
                        } catch (e) {
                            console.error("Error parsing task:", e);
                            return null;
                        }
                    }).filter(task => {
                        if (!task) return false;
                        const isOverdue = task.endDate < now && task.progress < 100;
                        const isUpcomingCritical = task.endDate <= nextWeek && task.progress < 100;
                        return isOverdue || isUpcomingCritical;
                    });

                    setCriticalTasks(prev => {
                        const filtered = prev.filter(t => t.projectId !== projectId);
                        return [...filtered, ...tasksData].sort((a, b) => a.endDate - b.endDate);
                    });
                });
                projectSubscriptions.push(tasksUnsub);
            });

            setLoading(false);
        }, (err) => {
            console.error("Dashboard aggregation error:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => {
            unsubscribeProjects();
            projectSubscriptions.forEach(unsub => unsub());
        };
    }, [user]);

    return { milestones, criticalTasks, loading, error };
};
