import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [tool, ...args] = process.argv.slice(2);
if (!tool) {
  console.error('usage: node scripts/run-tool.mjs <tool> [...args]');
  process.exit(64);
}

const bin = resolve('node_modules', '.bin', process.platform === 'win32' ? `${tool}.cmd` : tool);
if (!existsSync(bin)) {
  console.error(`${tool} is unavailable. Run npm ci first.`);
  process.exit(69);
}

const child = spawn(bin, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    WRANGLER_WRITE_LOGS: process.env.WRANGLER_WRITE_LOGS ?? 'false',
    WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? '.wrangler/logs',
    MINIFLARE_REGISTRY_PATH: process.env.MINIFLARE_REGISTRY_PATH ?? '.wrangler/registry',
  },
  shell: false,
});

child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`${tool} terminated by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
