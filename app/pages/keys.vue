<script setup lang="ts">
import { useKeys } from '@/composables/meilisearch/useKeys'
import Menu from '@/components/router-link-menus/Menu.vue'
import PageTitleSection from '@/components/PageTitleSection.vue'
import { Check, Copy, EllipsisVertical, Home, Info, Pencil, Plus, Trash2 } from '@lucide/vue'
import type { Key } from 'meilisearch'
import { formatDate, maskedApiKey } from '@/utils'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue'
import type { MenuItem } from '@/types'
import CreateKeyDrawer from '@/components/meilisearch/CreateKeyDrawer.vue'
import EditKeyDrawer from '@/components/meilisearch/EditKeyDrawer.vue'
import KeyDetailsDrawer from '@/components/meilisearch/KeyDetailsDrawer.vue'

definePageMeta({
    layout: 'app',
    title: 'Tasks',
    breadcrumbs: [{ route: { name: 'dashboard' }, lucideIcon: Home }, { label: 'Keys' }]
})

const toast = useToast()
const { isSupported: canCopy, copy, copied } = useClipboard()
const {
    perPage,
    firstDatasetIndex,
    keys,
    keysResults,
    isFetching: isFetchingKeys,
    fetchKeysPaginated,
    handlePageEvent,
    confirmDeleteKey,
} = useKeys()

await fetchKeysPaginated()

const newKeyDrawerOpen = ref(false)
const editKeyDrawerOpen = ref(false)
const keyDetailsDrawerOpen = ref(false)

const currentKey = ref<Key | null>()
function showKeyDetails(key: Key) {
    currentKey.value = key
    keyDetailsDrawerOpen.value = true
}
function editKey(key: Key) {
    currentKey.value = key
    editKeyDrawerOpen.value = true
}

const keyContextMenu = useTemplateRef('key-context-menu')
const keyContextMenuItems = ref<MenuItem[]>([])
function toggleKeyContextMenu(event: Event, key: Key) {
    keyContextMenuItems.value = [
        {
            label: 'Details',
            lucideIcon: Info,
            command: () => showKeyDetails(key),
        },
        {
            label: 'Edit',
            lucideIcon: Pencil,
            command: () => editKey(key),
        },
        {
            label: 'Delete',
            lucideIcon: Trash2,
            class: 'delete-menu-item',
            lucideIconClass: 'text-red-500 dark:text-red-400',
            command: () => {
                confirmDeleteKey(key.uid, () => {
                    toast.add({
                        severity: 'success',
                        summary: 'API Key Deleted',
                        detail: `THe API Key: "${key.name}" was successfully deleted`,
                        life: 3000,
                    })
                    fetchKeysPaginated()
                })
            },
        },
    ]
    if (keyContextMenu.value && keyContextMenu.value?.$el) {
        keyContextMenu.value.$el.toggle(event)
    }
}

watch(keyDetailsDrawerOpen, (isOpen) => {
    if (!isOpen) {
        setTimeout(() => {
            currentKey.value = null
        }, 250)
    }
})
watch(editKeyDrawerOpen, (isOpen) => {
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
        severity: 'success',
        summary: 'API key copied to clipboard',
        life: 3000,
    })
}
const keyCopiedUid = computed(() => (copied.value && lastCopiedKeyUid.value) ? lastCopiedKeyUid.value : null)
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <Teleport to="body">
            <KeyDetailsDrawer
                v-if="currentKey"
                v-model:visible="keyDetailsDrawerOpen"
                :api-key="currentKey"
                :copied-key-uid="keyCopiedUid"
                @copy-key="copyApiKey"
            />
            <CreateKeyDrawer
                v-model:visible="newKeyDrawerOpen"
                @key-created="fetchKeysPaginated"
            />
            <EditKeyDrawer
                v-model:visible="editKeyDrawerOpen"
                :api-key="currentKey"
                @key-updated="fetchKeysPaginated"
            />
        </Teleport>

        <PageTitleSection>
            <template #title>
                API Keys
            </template>
            <template #end>
                <Button
                    label="New Key"
                    @click="newKeyDrawerOpen = true"
                >
                    <template #icon>
                        <Plus />
                    </template>
                </Button>
            </template>
        </PageTitleSection>

        <Card>
            <template #content>
                <Menu
                    ref="key-context-menu"
                    class="shadow-sm"
                    :model="keyContextMenuItems"
                    popup
                />
                <DataTable
                    lazy
                    paginator
                    :value="keys"
                    :loading="isFetchingKeys"
                    :rows="perPage"
                    :first="firstDatasetIndex"
                    :totalRecords="keysResults?.total"
                    :rowsPerPageOptions="[20, 50, 100]"
                    :pt="{
                        tableContainer: {
                            id: 'keys-data-table-container'
                        },
                        thead: {
                            class: 'z-2'
                        }
                    }"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    scrollable
                    columnResizeMode="fit"
                    @page="handlePageEvent($event, () => fetchKeysPaginated())"
                >
                    <template #empty>
                        <NotFoundMessage subject="Key" />
                    </template>
                    <Column
                        field="name"
                        header="Name"
                    >
                        <template #body="{ data }">
                            <span v-tooltip.top="(data as Key).description">{{ (data as Key).name }}</span>
                        </template>
                    </Column>
                    <Column
                        field="key"
                        header="Key"
                    >
                        <template #body="{ data }: { data: Key }">
                            <div class="flex items-center gap-2">
                                <Inplace pt:display:class="p-0">
                                    <template #display>
                                        <div
                                            v-tooltip.left="'Reveal API Key'"
                                            class="p-2"
                                        >
                                            {{ maskedApiKey(data.key) }}
                                        </div>
                                    </template>
                                    <template #content>
                                        <div class="whitespace-normal break-all max-w-[20rem]">
                                            {{ data.key }}
                                        </div>
                                    </template>
                                </Inplace>
                                <Button
                                    v-if="canCopy"
                                    v-tooltip.right="'Copy'"
                                    severity="secondary"
                                    size="small"
                                    text
                                    @click="copyApiKey(data.key, data.uid)"
                                >
                                    <Check v-if="keyCopiedUid === data.uid" />
                                    <Copy v-else />
                                </Button>
                            </div>
                        </template>
                    </Column>
                    <Column
                        field="indexes"
                        header="Indexes"
                    >
                        <template #body="{ data }">
                            <div class="flex flex-wrap gap-2">
                                <Tag
                                    v-for="index in (data as Key).indexes"
                                    :key="index"
                                    :value="index"
                                    severity="secondary"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column
                        field="actions"
                        header="Actions"
                    >
                        <template #body="{ data }">
                            <div class="flex flex-wrap gap-2">
                                <Tag
                                    v-for="action in (data as Key).actions"
                                    :key="action"
                                    :value="action"
                                    severity="secondary"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column
                        field="createdAt"
                        header="Created"
                    >
                        <template #body="{ data }">
                            {{ formatDate((data as Key).createdAt) }}
                        </template>
                    </Column>
                    <Column
                        frozen
                        alignFrozen="right"
                    >
                        <template #body="{ data }">
                            <Button
                                v-tooltip.top="'Show Key Actions'"
                                aria-label="Show key actions"
                                type="button"
                                severity="secondary"
                                rounded
                                text
                                @click="toggleKeyContextMenu($event, (data as Key))"
                            >
                                <template #icon>
                                    <EllipsisVertical class="size-5!" />
                                </template>
                            </Button>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
    </div>
</template>
