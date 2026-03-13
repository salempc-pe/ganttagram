/**
 * Detecta si existe un ciclo de dependencias al intentar añadir una nueva relación.
 * Usa un algoritmo de búsqueda en profundidad (DFS).
 * 
 * @param {string} taskId - El ID de la tarea destino (la que recibirá la dependencia).
 * @param {string} potentialPredecessorId - El ID de la tarea que se quiere poner como predecesora.
 * @param {Array} dependencies - Lista actual de dependencias del proyecto.
 * @returns {boolean} - true si hay un ciclo, false si es seguro.
 */
export const hasCycle = (taskId, potentialPredecessorId, dependencies) => {
    if (taskId === potentialPredecessorId) return true;

    // Mapa de adyacencia: predecesora -> [sucesores]
    const adj = {};
    dependencies.forEach(dep => {
        if (!adj[dep.fromTaskId]) adj[dep.fromTaskId] = [];
        adj[dep.fromTaskId].push(dep.toTaskId);
    });

    // Añadir virtualmente la nueva dependencia
    if (!adj[potentialPredecessorId]) adj[potentialPredecessorId] = [];
    adj[potentialPredecessorId].push(taskId);

    const visited = new Set();
    const recStack = new Set();

    const check = (node) => {
        if (!visited.has(node)) {
            visited.add(node);
            recStack.add(node);

            const neighbors = adj[node] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor) && check(neighbor)) {
                    return true;
                } else if (recStack.has(neighbor)) {
                    return true;
                }
            }
        }
        recStack.delete(node);
        return false;
    };

    // Empezamos el chequeo desde la tarea destino para ver si llega a la predecesora
    // o simplemente recorremos todo el grafo afectado.
    // En realidad, cualquier nodo puede ser inicio, pero el potencial ciclo 
    // debe involucrar a potentialPredecessorId o taskId.
    return check(potentialPredecessorId);
};
