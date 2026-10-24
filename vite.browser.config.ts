import { defineConfig } from "vite";
import vinext from "vinext";

// Browser QA runs without Cloudflare bindings. Production config is unchanged.
export default defineConfig({ plugins: [vinext()] });
