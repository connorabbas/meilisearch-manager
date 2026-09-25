<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Key } from 'meilisearch'
import { useKeys } from '@/composables/meilisearch/useKeys'
import { formatDate, maskedApiKey } from '@/utils'
import { useClipboard } from '@vueuse/core'
import CreateKeySlideover from '@/components/meilisearch/CreateKeySlideover.vue'
import EditKeySlideover from '@/components/meilisearch/EditKeySlideover.vue'
import KeyDetailsSlideover from '@/components/meilisearch/KeyDetailsSlideover.vue'

definePageMeta({
    layout: 'app',
    title: 'Keys',
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Keys' }]
})

const toast = useToast()
const { isSupported: canCopy, copy, copied } = useClipboard()
const {
    currentPage,
    perPage,
    keys,
    totalKeys,
    paginationSummary,
    isFetching: isFetchingKeys,
    error,
    fetchKeysPaginated,
    paginate,
    confirmDeleteKey,
} = useKeys()

await fetchKeysPaginated()

const newKeySlideoverOpen = ref(false)
const editKeySlideoverOpen = ref(false)
const keyDetailsSlideoverOpen = ref(false)

const currentKey = ref<Key | null>()
function showKeyDetails(key: Key) {
    currentKey.value = key
    keyDetailsSlideoverOpen.value = true
}
function editKey(key: Key) {
    currentKey.value = key
    editKeySlideoverOpen.value = true
}

function keyActionItems(key: Key) {
    return [
        {
            label: 'Details',
            icon: 'i-lucide-info',
            onSelect: () => showKeyDetails(key),
        },
        {
            label: 'Edit',
            icon: 'i-lucide-pencil',
            onSelect: () => editKey(key),
        },
        {
            label: 'Delete',
            icon: 'i-lucide-trash-2',
            color: 'error' as const,
            onSelect: () => {
                confirmDeleteKey(key.uid, () => {
                    toast.add({
                        color: 'success',
                        icon: 'i-lucide-circle-check',
                        title: 'API Key Deleted',
                        description: `The API Key: "${key.name}" was successfully deleted`,
                    })
                    fetchKeysPaginated()
                })
            },
        },
    ]
}

watch(keyDetailsSlideoverOpen, (isOpen) => {
    if (!isOpen) {
        setTimeout(() => {
            currentKey.value = null
        }, 250)
    }
})
watch(editKeySlideoverOpen, (isOpen) => {
    if (!isOpen) {
        setTimeout(() => {
            currentKey.value = null
        }, 250)
    }
})

const lastCopiedKeyUid = ref()
async function copyApiKey(key: string, uid: string) {
    await copy(key)
    lastCopiedKeyUid.value = uid
    toast.add({
        color: 'success',
        icon: 'i-lucide-circle-check',
        title: 'API key copied to clipboard',
    })
}
const keyCopiedUid = computed(() => (copied.value && lastCopiedKeyUid.value) ? lastCopiedKeyUid.value : null)

const columns: TableColumn<Key>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'key',
        header: 'Key',
    },
    {
        accessorKey: 'indexes',
        header: 'Indexes',
    },
    {
        id: 'keyActions',
        accessorKey: 'actions',
        header: 'Actions',
    },
    {
        accessorKey: 'createdAt',
        header: 'Created',
    },
    {
        id: 'actions',
        enableHiding: false,
        size: 80,
        minSize: 80,
        maxSize: 80,
        meta: { class: { th: 'text-end', td: 'text-end' } },
    },
]

const columnPinning = ref({ right: ['actions'] })

async function changePage(page: number) {
    await paginate(page, perPage.value, fetchKeysPaginated)
}

async function changePageSize(pageSize: number) {
    await paginate(currentPage.value, pageSize, fetchKeysPaginated)
}
</script>

<template>
    <AppDashboardPanel id="keys">
        <Teleport to="body">
            <KeyDetailsSlideover
                v-if="currentKey"
                v-model:open="keyDetailsSlideoverOpen"
                :api-key="currentKey"
                :copied-key-uid="keyCopiedUid"
                @copy-key="copyApiKey"
            />
            <CreateKeySlideover
                v-model:open="newKeySlideoverOpen"
                @key-created="fetchKeysPaginated"
            />
            <EditKeySlideover
                v-if="currentKey"
                v-model:open="editKeySlideoverOpen"
                :api-key="currentKey"
                @key-updated="fetchKeysPaginated"
            />
        </Teleport>

        <template #actions>
            <AppPageActions>
                <UButton
                    label="Refresh"
                    icon="i-lucide-refresh-cw"
                    loading-icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="outline"
                    :loading="isFetchingKeys"
                    @click="fetchKeysPaginated()"
                />
                <UButton
                    label="New Key"
                    icon="i-lucide-plus"
                    @click="newKeySlideoverOpen = true"
                />
            </AppPageActions>
        </template>

        <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-x"
            title="Unable to load keys"
            :description="error"
            :actions="[{ label: 'Retry', onClick: () => fetchKeysPaginated() }]"
        />

        <UCard
            :ui="{ body: 'p-0 sm:p-0' }"
            variant="outline"
            class="shrink-0"
        >
            <UTable
                v-model:column-pinning="columnPinning"
                :data="keys ?? []"
                :columns="columns"
                :get-row-id="row => row.uid"
                :loading="isFetchingKeys"
            >
                <template #name-cell="{ row }">
                    <UTooltip
                        v-if="row.original.description"
                        :text="row.original.description"
                        :content="{ side: 'top' }"
                    >
                        <span class="block max-w-64 truncate">{{ row.original.name }}</span>
                    </UTooltip>
                    <span v-else>{{ row.original.name }}</span>
                </template>

                <template #key-cell="{ row }">
                    <div class="flex min-w-0 items-center gap-1">
                        <span class="min-w-0 whitespace-nowrap font-mono text-sm">
                            {{ maskedApiKey(row.original.key) }}
                        </span>
                        <UTooltip text="Copy API Key">
                            <UButton
                                v-if="canCopy"
                                aria-label="Copy API key"
                                :icon="keyCopiedUid === row.original.uid ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                                color="neutral"
                                variant="ghost"
                                size="sm"
                                square
                                @click="copyApiKey(row.original.key, row.original.uid)"
                            />
                        </UTooltip>
                    </div>
                </template>

                <template #indexes-cell="{ row }">
                    <div class="flex flex-wrap gap-1">
                        <UBadge
                            v-for="index in row.original.indexes"
                            :key="index"
                            color="neutral"
                            variant="subtle"
                            :label="index"
                        />
                    </div>
                </template>

                <template #keyActions-cell="{ row }">
                    <div class="flex flex-wrap gap-1">
                        <UBadge
                            v-for="action in row.original.actions"
                            :key="action"
                            color="neutral"
                            variant="subtle"
                            :label="action"
                        />
                    </div>
                </template>

                <template #createdAt-cell="{ row }">
                    {{ formatDate(row.original.createdAt) }}
                </template>

                <template #actions-cell="{ row }">
                    <UDropdownMenu :items="keyActionItems(row.original)">
                        <UButton
                            aria-label="Show key actions"
                            icon="i-lucide-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                            square
                        />
                    </UDropdownMenu>
                </template>

                <template #loading>
                    <div class="flex justify-center py-4">
                        <USkeleton class="h-5 w-48" />
                    </div>
                </template>

                <template #empty>
                    <UEmpty
                        variant="naked"
                        icon="i-lucide-key-round"
                        title="No keys found"
                    />
                </template>
            </UTable>

            <template #footer>
                <AppTablePagination
                    :page="currentPage"
                    :per-page="perPage"
                    :total="totalKeys"
                    :summary="paginationSummary"
                    :disabled="isFetchingKeys"
                    show-edges
                    @page="changePage"
                    @per-page="changePageSize"
                />
            </template>
        </UCard>
    </AppDashboardPanel>
</template>
