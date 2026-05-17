import { parentPort, workerData } from 'worker_threads';
import chokidar from 'chokidar';
import path from 'path';

const { targetPath } = workerData;

if (!targetPath) {
    process.exit(1);
}

const watcher = chokidar.watch(targetPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    depth: 5
});

watcher.on('all', (event, filePath) => {
    const relativePath = path.relative(targetPath, filePath);
    parentPort?.postMessage({
        event,
        path: relativePath,
        timestamp: new Date().toISOString()
    });
});

process.on('SIGTERM', () => {
    watcher.close().then(() => process.exit(0));
});
