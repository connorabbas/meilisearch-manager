<script setup lang="ts">
import { ref } from 'vue'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'

const modalOpen = defineModel<boolean>({ default: false })

const route = useRoute()
const router = useRouter()
const meilisearchStore = useMeilisearchStore()

const currentInstanceId = ref(meilisearchStore.currentInstance?.id)

async function handleChangeInstance() {
    if (currentInstanceId.value) {
        meilisearchStore.setCurrent(currentInstanceId.value)
        modalOpen.value = false
        await router.push(route.name === 'dashboard' ? { name: 'indexes' } : { name: 'dashboard' })
    }
}
</script>

<template>
    <Dialog
        v-model:visible="modalOpen"
        class="w-[30rem]"
        position="center"
        header="Change Instance"
        :draggable="false"
        dismissableMask
        modal
    >
        <div>
            <Select
                v-if="!meilisearchStore.singleInstanceMode && meilisearchStore.instances.length"
                v-model="currentInstanceId"
                :options="(meilisearchStore.instances as any[])"
                optionLabel="name"
                optionValue="id"
                fluid
            >
                <template #footer>
                    <div class="p-2">
                        <RouterLink :to="{ name: 'new-instance' }">
                            <Button
                                label="Add new instance"
                                severity="secondary"
                                size="small"
                                text
                                fluid
                            >
                                <template #icon>
                                    <Plus />
                                </template>
                            </Button>
                        </RouterLink>
                    </div>
                </template>
            </Select>
        </div>
        <template #footer>
            <div class="flex gap-4">
                <Button
                    label="Cancel"
                    plain
                    text
                    @click="modalOpen = false"
                />
                <Button
                    label="Submit"
                    @click="handleChangeInstance"
                />
            </div>
        </template>
    </Dialog>
</template>
