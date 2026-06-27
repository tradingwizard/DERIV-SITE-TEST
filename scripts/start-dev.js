const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
let shuttingDown = false;

const processes = [
    {
        name: 'server',
        args: ['server/index.js'],
    },
    {
        name: 'web',
        args: [path.join('node_modules', '@rsbuild', 'core', 'bin', 'rsbuild.js'), 'dev'],
    },
];

const children = processes.map(({ name, args }) => {
    const child = spawn(process.execPath, args, {
        cwd: root,
        env: process.env,
        stdio: 'inherit',
        shell: false,
    });

    child.on('exit', code => {
        if (code && !shuttingDown) {
            console.error(`[${name}] exited with code ${code}`);
            shutdown(code);
        }
    });

    return child;
});

function shutdown(code = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    children.forEach(child => {
        if (!child.killed) child.kill();
    });
    process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
