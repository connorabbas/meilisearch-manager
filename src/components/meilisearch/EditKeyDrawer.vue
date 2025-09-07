<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useKeys } from '@/composables/meilisearch/useKeys';
import { useIndexes } from '@/composables/meilisearch/useIndexes';
import type { Key, KeyUpdate } from 'meilisearch';
import { useToast } from 'primevue';
import { CircleQuestionMark } from 'lucide-vue-next';
import { keyActions } from '@/utils/data';

const props = defineProps<{
    apiKey: Key,
}>();

const drawerOpen = defineModel<boolean>({ default: false });

const emit = defineEmits(['hide', 'key-updated']);

const toast = useToast();
const { indexes, isFetching: isFetchingIndexes, fetchAllIndexes } = useIndexes();
const { isLoading, updateKey } = useKeys();

const indexOptions = computed(() => ['*', ...indexes.value.map((index) => index.uid)]);
const actionsOptions = ['*', ...keyActions];

const keyToUpdate = ref<KeyUpdate>({
    name: props.apiKey?.name ?? undefined,
    description: props.apiKey?.description ?? undefined,
});
function saveNewKey() {
    updateKey(props.apiKey.key, keyToUpdate.value).then(() => {
        toast.add({
            severity: 'success',
            summary: 'API Key Updated',
            detail: `The API key: "${keyToUpdate.value.name}" was successfully updated`,
            life: 3000,
        });
        drawerOpen.value = false;
        emit('key-updated');
    }).catch(() => {
        //
    }).finally(() => {
        //
    });
}

watch(keyToUpdate, (newVal) => {
    if (newVal.name === '') {
        delete keyToUpdate.value.name;
    }
    if (newVal.description === '') {
        delete keyToUpdate.value.description;
    }
}, { deep: true });
</script>

<template>
    <Drawer
        v-model:visible="drawerOpen"
        header="Edit API Key"
        class="w-full sm:w-[40rem]"
        position="right"
        blockScroll
        @show="fetchAllIndexes"
        @hide="$emit('hide')"
    >
        <form
            class="space-y-6 sm:space-y-8"
            @submit.prevent="saveNewKey"
        >
            <div class="flex flex-col gap-2">
                <label for="new-key-uid">UID</label>
                <InputText
                    id="edit-key-uid"
                    :value="props.apiKey?.uid"
                    placeholder="optional - set UID"
                    type="text"
                    disabled
                    fluid
                />
            </div>
            <div class="flex flex-col gap-2">
                <label for="edit-key-name">Name</label>
                <InputText
                    id="edit-key-name"
                    v-model="keyToUpdate.name"
                    placeholder="name your key"
                    type="text"
                    autofocus
                    fluid
                />
            </div>
            <div class="flex flex-col gap-2">
                <label for="new-key-desc">Description</label>
                <Textarea
                    id="edit-key-desc"
                    v-model="keyToUpdate.description"
                    placeholder="optional - set description"
                    rows="2"
                    autoResize
                    fluid
                />
            </div>
            <div class="flex flex-col gap-2">
                <label for="new-key-indexes">Indexes</label>
                <MultiSelect
                    :modelValue="props.apiKey.indexes"
                    pt:label:class="flex flex-wrap"
                    :options="indexOptions"
                    display="comma"
                    placeholder="select permitted indexes"
                    inputId="edit-key-indexes"
                    :loading="isFetchingIndexes"
                    disabled
                    filter
                    fluid
                />
            </div>
            <div class="flex flex-col gap-2">
                <label
                    for="new-key-actions"
                    class="flex items-center gap-2"
                >
                    <span>Actions</span>
                    <a
                        href="https://www.meilisearch.com/docs/reference/api/keys#actions"
                        target="_blank"
                        class="text-inherit"
                    >
                        <CircleQuestionMark />
                    </a>
                </label>
                <MultiSelect
                    :modelValue="props.apiKey.actions"
                    pt:label:class="flex flex-wrap"
                    :options="actionsOptions"
                    display="comma"
                    placeholder="select permitted actions"
                    inputId="edit-key-actions"
                    disabled
                    filter
                    fluid
                />
            </div>
            <div class="flex flex-col gap-2">
                <label for="new-key-expires">Expires At</label>
                <DatePicker
                    id="edit-key-expires"
                    :modelValue="props.apiKey.expiresAt"
                    :minDate="new Date()"
                    placeholder="optional - select date & time"
                    hourFormat="12"
                    showTime
                    disabled
                    fluid
                />
            </div>
            <div>
                <Button
                    type="submit"
                    label="Save"
                    :loading="isLoading"
                />
            </div>
        </form>
    </Drawer>
</template>