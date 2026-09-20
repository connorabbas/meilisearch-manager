<script setup lang="ts">
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { useDocuments } from '@/composables/meilisearch/useDocuments'
import UpdateIndexPrimaryKeyForm from '@/components/meilisearch/UpdateIndexPrimaryKeyForm.vue'

definePageMeta({
    layout: 'app',
    title: 'Edit Index',
})

const route = useRoute()
const indexUid = computed(() => String(route.params.uid ?? ''))
const { currentIndex, isFetching, error, fetchIndex } = useIndexes()
const { confirmDeleteIndex, isLoadingTask: deletingIndex } = useIndexes()
const { confirmDeleteAllDocuments, isLoadingTask: deletingDocuments } = useDocuments()
const primaryKeyFormId = 'update-index-primary-key-form'
const updatingPrimaryKey = ref(false)
const isDeleting = computed(() => deletingIndex.value || deletingDocuments.value)

watch(indexUid, () => {
    void fetchIndex(indexUid.value)
}, { immediate: true })

function handleDeleteIndex() {
    confirmDeleteIndex(indexUid.value, undefined, () => {
        void navigateTo('/dashboard')
    })
}

function handleDeleteAllDocuments() {
    confirmDeleteAllDocuments(indexUid.value)
}
</script>

<template>
    <div class="mx-auto max-w-xl space-y-4 md:space-y-6">
        <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-x"
            title="Unable to load index"
            :description="error"
            :actions="[{ label: 'Retry', onClick: () => fetchIndex(indexUid) }]"
        />

        <template v-if="isFetching && !currentIndex">
            <USkeleton class="h-72 rounded-lg" />
            <USkeleton class="h-48 rounded-lg" />
        </template>

        <template v-else-if="currentIndex">
            <UCard
                title="Primary Key"
                variant="subtle"
            >
                <UpdateIndexPrimaryKeyForm
                    :form-id="primaryKeyFormId"
                    :index-uid="indexUid"
                    :index="currentIndex"
                    @update:loading="updatingPrimaryKey = $event"
                    @refetch-index="fetchIndex(indexUid)"
                />

                <template #footer>
                    <div class="flex justify-end">
                        <UButton
                            type="submit"
                            :form="primaryKeyFormId"
                            label="Save"
                            icon="i-lucide-save"
                            :loading="updatingPrimaryKey"
                        />
                    </div>
                </template>
            </UCard>

            <UCard
                title="Delete"
                variant="subtle"
            >
                <UAlert
                    color="error"
                    variant="subtle"
                    icon="i-lucide-triangle-alert"
                    title="Warning"
                    description="Please proceed with caution. These actions cannot be undone."
                />

                <template #footer>
                    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <UButton
                            label="Delete all documents"
                            icon="i-lucide-file-x-2"
                            color="error"
                            variant="outline"
                            :loading="deletingDocuments"
                            :disabled="isDeleting"
                            class="justify-center"
                            @click="handleDeleteAllDocuments"
                        />
                        <UButton
                            label="Delete this index"
                            icon="i-lucide-trash-2"
                            color="error"
                            :loading="deletingIndex"
                            :disabled="isDeleting"
                            class="justify-center"
                            @click="handleDeleteIndex"
                        />
                    </div>
                </template>
            </UCard>
        </template>
    </div>
</template>
