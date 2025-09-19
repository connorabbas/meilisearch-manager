<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { useKeys } from '@/composables/meilisearch/useKeys';
import AppLayout from '@/layouts/AppLayout.vue';
import Menu from '@/components/primevue/Menu.vue';
import PageTitleSection from '@/components/PageTitleSection.vue';
import { Copy, EllipsisVertical, Home, Info, Pencil, Plus, Trash2 } from 'lucide-vue-next';
import type { Key } from 'meilisearch';
import { formatDate, maskedApiKey } from '@/utils';
import { useClipboard } from '@vueuse/core';
import { useToast } from 'primevue';
import type { MenuItem } from '@/types';
import CreateKeyDrawer from '@/components/meilisearch/CreateKeyDrawer.vue';
import EditKeyDrawer from '@/components/meilisearch/EditKeyDrawer.vue';
import KeyDetailsDrawer from '@/components/meilisearch/KeyDetailsDrawer.vue';
import NotFoundMessage from '@/components/NotFoundMessage.vue';

const breadcrumbs = [{ route: { name: 'dashboard' }, lucideIcon: Home }, { label: 'Keys' }];

const toast = useToast();
const { isSupported: canCopy, copy } = useClipboard();
const { keys, isFetching: isFetchingKeys, fetchAllKeys, confirmDeleteKey } = useKeys();

await fetchAllKeys();

const newKeyDrawerOpen = ref(false);
const editKeyDrawerOpen = ref(false);
const keyDetailsDrawerOpen = ref(false);

const currentKey = ref<Key | null>(null);
function showKeyDetails(key: Key) {
    currentKey.value = key;
    keyDetailsDrawerOpen.value = true;
}
function editKey(key: Key) {
    currentKey.value = key;
    editKeyDrawerOpen.value = true;
}

const keyContextMenu = useTemplateRef('key-context-menu');
const keyContextMenuItems = ref<MenuItem[]>([]);
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
                    });
                    fetchAllKeys();
                });
            },
        },
    ];
    if (keyContextMenu.value && keyContextMenu.value?.$el) {
        keyContextMenu.value.$el.toggle(event);
    }
}

function resetCurrentKey() {
    // delayed null reset to allow the drawer close animation to complete
    setTimeout(() => {
        currentKey.value = null;
    }, 250);
}

function copyApiKey(key: string) {
    copy(key);
    toast.add({
        severity: 'success',
        summary: 'API key copied to clipboard',
        life: 3000,
    });
}
</script>

<template>
    <AppLayout :breadcrumbs>
        <KeyDetailsDrawer
            v-if="currentKey"
            v-model="keyDetailsDrawerOpen"
            :api-key="currentKey"
            @hide="resetCurrentKey"
            @copy-key="copyApiKey"
        />
        <CreateKeyDrawer
            v-model="newKeyDrawerOpen"
            @key-created="fetchAllKeys"
        />
        <EditKeyDrawer
            v-if="currentKey"
            v-model="editKeyDrawerOpen"
            :api-key="currentKey"
            @hide="resetCurrentKey"
            @key-updated="fetchAllKeys"
        />

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
                    :value="keys"
                    :loading="isFetchingKeys"
                    scrollable
                    columnResizeMode="fit"
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
                        <template #body="{ data }">
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
                                    @click="copyApiKey(data.key)"
                                >
                                    <Copy />
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
                        header="Action"
                        frozen
                        alignFrozen="right"
                    >
                        <template #body="{ data }">
                            <Button
                                v-tooltip.top="'Show Key Actions'"
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
    </AppLayout>
</template>
