import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
//import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // https://vite.dev/config/#using-environment-variables-in-config
    const env = loadEnv(mode, process.cwd(), '');
    const devPort = env.APP_PORT ? Number(env.APP_PORT) : 5173;

    return {
        plugins: [
            vue(),
            //vueDevTools(),
            tailwindcss(),
        ],
        define: {
            // Provide an explicit app-level constant derived from an env var.
            __APP_ENV__: JSON.stringify(env.APP_ENV),
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        server: {
            host: true,
            port: devPort,
            watch: {
                usePolling: true,
            },
        },
        preview: {
            port: devPort,
        },
    };
});
