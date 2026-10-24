import { defineConfig } from 'vite';
import vinext from 'vinext';

// These device-local flows need no Cloudflare bindings. Keep their browser
// harness independent of the Workers runtime and production deployment config.
export default defineConfig({ plugins: [vinext()] });
