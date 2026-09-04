import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const vite = resolve('node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
if (!existsSync(vite)) {
  console.error('vite is unavailable. Run npm ci first.');
  process.exit(69);
}

const timeoutMs = Number.parseInt(process.env.MIZAN_BUILD_TIMEOUT_MS ?? '180000', 10);
const child = spawn(vite, ['build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    WRANGLER_WRITE_LOGS: process.env.WRANGLER_WRITE_LOGS ?? 'false',
    WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? '.wrangler/logs',
    MINIFLARE_REGISTRY_PATH: process.env.MINIFLARE_REGISTRY_PATH ?? '.wrangler/registry',
  },
  shell: false,
});

let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  console.error(`Build exceeded ${timeoutMs}ms; terminating.`);
  child.kill('SIGTERM');
  setTimeout(() => child.kill('SIGKILL'), 10_000).unref();
}, timeoutMs);

timer.unref();

child.on('error', (error) => {
  clearTimeout(timer);
  console.error(error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  clearTimeout(timer);
  if (timedOut) process.exit(124);
  if (signal) {
    console.error(`Build terminated by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
