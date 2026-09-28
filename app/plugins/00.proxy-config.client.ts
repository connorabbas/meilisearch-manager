export default defineNuxtPlugin(async () => {
    const store = useMeilisearchStore()
    const runtimeConfig = useRuntimeConfig()

    // Static deployment (e.g. GitHub Pages): skip server config entirely
    if (runtimeConfig.public.staticDeploy) {
        store.initializeMultiInstance()
        return
    }

    // Server deployment: fetch config to determine single-instance proxy vs. multi-instance mode
    let config: { singleInstanceProxyMode: boolean }
    try {
        config = await $fetch<{ singleInstanceProxyMode: boolean }>(new URL('api/config', window.location.origin + runtimeConfig.app.baseURL).toString())
    } catch (err: any) {
        // 404 likely static hosting without the flag set -> graceful fallback
        if (err?.statusCode === 404 || err?.status === 404) {
            store.initializeMultiInstance()
            return
        }

        // Server error details live in the response body (err.data)
        const serverError = err?.data || {}
        const statusText = serverError.statusMessage || serverError.message || err?.statusMessage || 'Server Error'
        const message = serverError.data?.detail || serverError.message || statusText

        throw createError({
            status: err?.statusCode || err?.status || 500,
            statusText,
            message,
            fatal: true,
        })
    }

    const proxyHost = new URL('api/meilisearch', window.location.origin + runtimeConfig.app.baseURL).toString()

    if (config.singleInstanceProxyMode) {
        store.initializeSingleInstanceProxyMode(proxyHost)
    } else {
        store.initializeMultiInstance()
    }
})
