<script setup lang="ts">
import { ref, watch } from 'vue';
import { useIndexes } from '@/composables/meilisearch/useIndexes';
import type { IndexOptions } from 'meilisearch';

const drawerOpen = defineModel<boolean>({ default: false });

const emit = defineEmits(['hide', 'index-created']);

const { isSendingTask, createIndex } = useIndexes();

const uid = ref<string>('');
const primaryKey = ref<string>();
function submitNewIndex() {
    createIndex(uid.value, { primaryKey: primaryKey.value } as IndexOptions).then(() => {
        drawerOpen.value = false;
        emit('index-created');
    }).catch(() => {
        //
    }).finally(() => {
        //
    });
}

function reset() {
    uid.value = '';
    primaryKey.value = undefined;
}

function handleHideDrawer() {
    reset();
    emit('hide');
}

watch(primaryKey, (newVal) => {
    if (newVal === '') {
        primaryKey.value = undefined;
    }
});
</script>

<template>
    <Drawer
        v-model:visible="drawerOpen"
        header="New Index"
        class="w-full sm:w-[40rem]"
        position="right"
        :autoZIndex="false"
        blockScroll
        @hide="handleHideDrawer"
    >
        <form
            class="space-y-6 sm:space-y-8"
            @submit.prevent="submitNewIndex"
        >
            <div class="flex flex-col gap-2">
                <label for="new-index-uid">UID</label>
                <InputText
                    ref="uid-input"
                    id="new-index-uid"
                    v-model="uid"
                    placeholder="uid of the requested index"
                    type="text"
                    autofocus
                    fluid
                />
            </div>
            <div class="flex flex-col gap-2">
                <label for="new-index-pk">Primary Key</label>
                <InputText
                    id="new-index-pk"
                    v-model="primaryKey"
                    placeholder="optional - primary key of the requested index"
                    type="text"
                    fluid
                />
            </div>
            <div>
                <Button
                    type="submit"
                    label="Submit"
                    :loading="isSendingTask"
                />
            </div>
        </form>
    </Drawer>
</template>