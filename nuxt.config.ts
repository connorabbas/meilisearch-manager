// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        head: {
            bodyAttrs: {
                class: 'antialiased font-sans h-full bg-default text-default'
            },
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/meili-logo.svg' }
            ]
        }
    },
    compatibilityDate: '2025-07-15',
    css: ['maplibre-gl/dist/maplibre-gl.css', '~/assets/css/main.css'],
    devtools: { enabled: false },
    modules: ['@nuxt/ui', '@nuxt/fonts', '@pinia/nuxt', '@nuxt/eslint', 'nuxt-maplibre'],
    nitro: {
        prerender: {
            crawlLinks: false,
            routes: [],
            failOnError: false,
        },
    },
    runtimeConfig: {
        meilisearchSingleInstanceProxyMode: 'auto',
        meilisearchHost: '',
        meilisearchApiKey: '',
        public: {
            staticDeploy: false,
        },
    },
    ui: {
        fonts: false,
    },
    ssr: false,
})
