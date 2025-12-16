<script setup lang="ts">
import { computed, ref } from 'vue'
import Container from '@/components/Container.vue'
import PopupMenuButton from '@/components/PopupMenuButton.vue'
import ChangeInstanceModal from '@/components/meilisearch/ChangeInstanceModal.vue'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { ArrowLeftRight, CircleX, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { MenuItem } from '@/types'

const router = useRouter()
const meilisearchStore = useMeilisearchStore()

const error = computed(() => {
    return meilisearchStore.connectionError || 'Unable to connect to to the configured Meilisearch instance...'
})

const retryConnection = async () => {
    await meilisearchStore.connect()
    if (meilisearchStore.isConnected) {
        router.push({ name: 'indexes' })
    }
}
const changeInstanceModalOpen = ref(false)

const menuItems: MenuItem[] = [
    {
        label: 'Refresh Connection',
        lucideIcon: RefreshCw,
        lucideIconClass: meilisearchStore.isConnecting ? 'animate-spin' : '',
        command: () => retryConnection(),
    },
    {
        label: 'Add New Instance',
        route: { name: 'new-instance' },
        lucideIcon: Plus,
    },
    {
        label: 'Change Instance',
        lucideIcon: ArrowLeftRight,
        command: () => changeInstanceModalOpen.value = true,
    },
    {
        label: 'Remove Instance',
        lucideIcon: Trash2,
        class: 'delete-menu-item',
        lucideIconClass: 'text-red-500 dark:text-red-400',
        command: async () => {
            if (meilisearchStore?.currentInstance?.id) {
                meilisearchStore.confirmRemoveInstance(meilisearchStore.currentInstance.id, async () => {
                    await router.push({ name: 'dashboard' })
                    router.go(0)
                })
            }
        },
    },
]
</script>

<template>
    <Container fluid>
        <ChangeInstanceModal v-model="changeInstanceModalOpen" />
        <main>
            <div class="h-screen flex items-center justify-center">
                <Card pt:body:class="p-4 py-6 sm:p-12">
                    <template #content>
                        <div class="text-center">
                            <section class="flex flex-col gap-6 md:gap-8 items-center justify-center text-center">
                                <h1 class="font-extrabold text-6xl">
                                    Connection Error
                                </h1>
                                <Message severity="error">
                                    <template #icon>
                                        <CircleX />
                                    </template>
                                    {{ error }}
                                </Message>
                                <div
                                    v-if="!meilisearchStore.singleInstanceMode"
                                    class="flex gap-4"
                                >
                                    <PopupMenuButton
                                        name="failed-connection-dd"
                                        severity="secondary"
                                        label="Instance Options"
                                        :menu-items="menuItems"
                                    />
                                </div>
                                <div v-else>
                                    <Button
                                        v-if="meilisearchStore.currentInstance"
                                        label="Retry Connection"
                                        :loading="meilisearchStore.isConnecting"
                                        @click="retryConnection"
                                    >
                                        <template #icon>
                                            <RefreshCw />
                                        </template>
                                        <template #loadingicon>
                                            <RefreshCw class="animate-spin" />
                                        </template>
                                    </Button>
                                </div>
                            </section>
                        </div>
                    </template>
                </Card>
            </div>
        </main>
    </Container>
</template>
