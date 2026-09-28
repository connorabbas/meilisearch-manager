<script setup lang="ts">
import { useMeilisearchStore } from '@/stores/meilisearch'
const modalOpen = defineModel<boolean>({ default: false })

const meilisearchStore = useMeilisearchStore()

const currentInstanceId = ref(meilisearchStore.currentInstance?.id)

watch(modalOpen, (isOpen) => {
    if (isOpen) {
        currentInstanceId.value = meilisearchStore.currentInstance?.id
    }
})

async function handleChangeInstance() {
    if (currentInstanceId.value) {
        meilisearchStore.setCurrent(currentInstanceId.value)
        modalOpen.value = false
        await navigateTo('/dashboard', { replace: true })
    }
}
</script>

<template>
    <UModal
        v-model:open="modalOpen"
        title="Change Instance"
        description="Select the Meilisearch instance to use."
    >
        <template #footer>
            <UButton
                label="Add new instance"
                icon="i-lucide-plus"
                color="neutral"
                variant="ghost"
                to="/new-instance"
            />
            <div class="ms-auto flex gap-2">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    @click="modalOpen = false"
                />
                <UButton
                    label="Change instance"
                    :disabled="!currentInstanceId"
                    @click="handleChangeInstance"
                />
            </div>
        </template>
        <template #body>
            <USelect
                v-if="!meilisearchStore.isSingleInstanceProxyMode && meilisearchStore.instances.length"
                v-model="currentInstanceId"
                :items="meilisearchStore.instances.map(instance => ({ label: instance.name, value: instance.id }))"
                class="w-full"
            />
        </template>
    </UModal>
</template>
