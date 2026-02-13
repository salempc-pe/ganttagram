import { unlink } from 'fs/promises';
import { join } from 'path';

const filesToDelete = [
    'node_modules/@firebase/analytics/dist/src/global_index.d.ts',
    'node_modules/@firebase/app/dist/app-public.d.ts',
    'node_modules/@firebase/app/dist/app.d.ts',
    'node_modules/@firebase/app/dist/app/src/global_index.d.ts'
];

async function clean() {
    for (const file of filesToDelete) {
        try {
            await unlink(join(process.cwd(), file));
            console.log(`Successfully deleted: ${file}`);
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log(`File not found, skipping: ${file}`);
            } else {
                console.error(`Error deleting ${file}:`, err);
            }
        }
    }
}

clean();
