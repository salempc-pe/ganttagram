import { hasCycle } from '../src/features/tasks/utils/cycles.js';

const mockDeps = [
    { fromTaskId: 'A', toTaskId: 'B' },
    { fromTaskId: 'B', toTaskId: 'C' }
];

console.log("Test 1: Ciclo A -> B -> C -> A (Debe ser TRUE)");
const res1 = hasCycle('A', 'C', mockDeps);
console.log("Resultado:", res1);

console.log("\nTest 2: No ciclo A -> B -> C, intentar D -> A (Debe ser FALSE)");
const res2 = hasCycle('A', 'D', mockDeps);
console.log("Resultado:", res2);

console.log("\nTest 3: Autoreferencia A -> A (Debe ser TRUE)");
const res3 = hasCycle('A', 'A', mockDeps);
console.log("Resultado:", res3);

if (res1 === true && res2 === false && res3 === true) {
    console.log("\n✅ PRUEBAS COMPLETADAS CON ÉXITO");
} else {
    console.log("\n❌ ALGUNAS PRUEBAS FALLARON");
    process.exit(1);
}
