import { Meilisearch } from 'meilisearch'
import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import type { MeilisearchInstanceConfig } from '@/types'

export const useMeilisearchStore = defineStore('meilisearch', () => {
    const toast = useToast()
    const { confirmAction } = useConfirmAction()

    // -- State --
    const singleInstanceProxyMode = ref(false)
    const initialized = ref(false)

    const instances = ref<MeilisearchInstanceConfig[]>([])
    const currentInstanceId = ref<string | null>(null)

    const client = shallowRef<Meilisearch | null>(null)
    const isConnecting = ref(false)
    const connectionError = ref<string | null>(null)

    // -- Computed --
    const isSingleInstanceProxyMode = computed(() => singleInstanceProxyMode.value)
    const currentInstance = computed(() => instances.value.find(i => i.id === currentInstanceId.value) ?? null)
    const hasConfiguredInstance = computed(() => instances.value.length > 0)
    const isConnected = computed(() => client.value !== null && !connectionError.value)

    // -- Watcher cleanup --
    let _unwatchInstances: (() => void) | undefined
    let _unwatchCurrentId: (() => void) | undefined

    // -- Initialization --
    function initializeSingleInstanceProxyMode(host: string) {
        if (initialized.value) return

        singleInstanceProxyMode.value = true
        instances.value = [{
            id: 'default',
            name: 'Default',
            host,
            apiKey: '',
        }]
        currentInstanceId.value = 'default'
        initialized.value = true
    }

    function initializeMultiInstance() {
        if (initialized.value) return

        const storedInstances = useStorage<MeilisearchInstanceConfig[]>('meilisearch-instances', [])
        const storedCurrentId = useStorage<string | null>('meilisearch-current-id', null)

        instances.value = storedInstances.value
        currentInstanceId.value = storedCurrentId.value

        _unwatchInstances = watch(instances, (val) => {
            storedInstances.value = val
        }, { deep: true })

        _unwatchCurrentId = watch(currentInstanceId, (val) => {
            storedCurrentId.value = val
        })

        singleInstanceProxyMode.value = false
        initialized.value = true
    }

    function dispose() {
        _unwatchInstances?.()
        _unwatchCurrentId?.()
        _unwatchInstances = undefined
        _unwatchCurrentId = undefined
        client.value = null
        connectionError.value = null
        instances.value = []
        currentInstanceId.value = null
        initialized.value = false
        singleInstanceProxyMode.value = false
    }

    async function checkConnection(host: string, apiKey: string): Promise<void> {
        try {
            const conn = new Meilisearch({ host, apiKey })
            await conn.health()
        } catch (err) {
            throw new Error(`Connection check failed: ${(err as Error).message}`)
        }
    }

    async function connect(id?: string) {
        let targetId = id ?? currentInstanceId.value ?? instances.value[0]?.id ?? null
        if (!targetId) {
            throw new Error('No instance selected')
        }
        if (client.value && !connectionError.value && currentInstanceId.value === targetId) {
            return client.value
        }
        isConnecting.value = true
        connectionError.value = null
        try {
            let inst = instances.value.find(i => i.id === targetId)
            if (!inst) {
                inst = instances.value[0]
                targetId = inst?.id ?? null
            }
            if (!inst || !targetId) {
                throw new Error('Instance not found')
            }
            const conn = new Meilisearch({ host: inst.host, apiKey: inst.apiKey })
            await conn.health()
            client.value = conn
            currentInstanceId.value = targetId
            return conn
        } catch (err) {
            client.value = null
            connectionError.value = (err as Error).message
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Connection Failed',
                description: connectionError.value,
                duration: 7500,
            })
            throw err
        } finally {
            isConnecting.value = false
        }
    }

    function getClient() {
        if (!currentInstanceId.value) {
            console.error('No current instance selected')
            return null
        }
        if (!client.value) {
            console.error('Meilisearch client is not initialized for the current instance')
            return null
        }
        return client.value
    }

    async function addInstance(config: Omit<MeilisearchInstanceConfig, 'id'>) {
        if (singleInstanceProxyMode.value) {
            throw new Error('Cannot add instances in single-instance proxy mode')
        }

        if (instances.value.some(i => i.host === config.host)) {
            const errorMessage = `An instance with host "${config.host}" already exists`
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Connection Failed',
                description: errorMessage,
                duration: 7500,
            })
            throw new Error(errorMessage)
        }

        try {
            await checkConnection(config.host, config.apiKey)
            const id = crypto.randomUUID()
            const instanceName = config.name || config.host
            instances.value.push({ id, name: instanceName, host: config.host, apiKey: config.apiKey })
            if (!currentInstanceId.value) {
                currentInstanceId.value = id
            }
            setCurrent(id)
            return id
        } catch (err) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Failed to Add New Instance',
                description: (err as Error).message,
                duration: 7500,
            })
            throw err
        }
    }

    function removeInstance(id: string) {
        if (singleInstanceProxyMode.value) return
        instances.value = instances.value.filter(i => i.id !== id)
        if (currentInstanceId.value === id) {
            currentInstanceId.value = instances.value[0]?.id ?? null
            client.value = null
            connectionError.value = null
        }
    }

    function confirmRemoveInstance(
        id: string,
        onRemovedCallback?: () => void | Promise<void>
    ) {
        if (singleInstanceProxyMode.value) return
        void confirmAction({
            title: 'Danger Zone',
            description: 'Are you sure you want to remove this instance?',
            confirmLabel: 'Remove',
        }, async () => {
            removeInstance(id)
            await onRemovedCallback?.()
        })
    }

    function setCurrent(id: string) {
        if (!instances.value.some(i => i.id === id)) {
            throw new Error('Invalid instance ID')
        }
        currentInstanceId.value = id
        client.value = null // Reset client when switching instances
        connectionError.value = null
    }

    return {
        client: readonly(client),
        isConnecting: readonly(isConnecting),
        isConnected,
        connectionError: readonly(connectionError),
        singleInstanceProxyMode: readonly(singleInstanceProxyMode),
        initialized: readonly(initialized),
        isSingleInstanceProxyMode,
        hasConfiguredInstance,
        instances: readonly(instances),
        currentInstance: readonly(currentInstance),
        initializeSingleInstanceProxyMode,
        initializeMultiInstance,
        dispose,
        connect,
        getClient,
        addInstance,
        removeInstance,
        confirmRemoveInstance,
        setCurrent,
    }
})
