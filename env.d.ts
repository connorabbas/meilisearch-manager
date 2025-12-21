/// <reference types="vite/client" />
declare module "envConfig";

declare module 'primevue' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
    export * from 'primevue/index' // This helps resolve the index.js exports
}

// Allow sub-module imports from the src directory
declare module 'primevue/*' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}
