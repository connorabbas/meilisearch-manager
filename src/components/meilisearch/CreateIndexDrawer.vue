<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import type { IndexOptions } from 'meilisearch'

const drawerOpen = defineModel<boolean>({ default: false })

const emit = defineEmits(['hide', 'index-created'])

const { isSendingTask, createIndex } = useIndexes()

const uid = ref<string>('')
const primaryKey = ref<string>()
function submitNewIndex() {
    createIndex(uid.value, { primaryKey: primaryKey.value } as IndexOptions).then(() => {
        drawerOpen.value = false
        emit('index-created')
    }).catch(() => {
        // TODO
    })
}

function reset() {
    uid.value = ''
    primaryKey.value = undefined
}

function handleHideDrawer() {
    reset()
    emit('hide')
}

watch(primaryKey, (newVal) => {
    if (newVal === '') {
        primaryKey.value = undefined
    }
})
</script>

<template>
    <Drawer
        v-model:visible="drawerOpen"
        header="New Index"
        class="w-full sm:w-[40rem]"
        position="right"
        blockScroll
        @hide="handleHideDrawer"
    >
        <form
            id="create-index-form"
            class="space-y-6 sm:space-y-8"
            @submit.prevent="submitNewIndex"
        >
            <div class="flex flex-col gap-2">
                <label for="new-index-uid">UID</label>
                <InputText
                    id="new-index-uid"
                    ref="uid-input"
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
        </form>
        <template #footer>
            <Button
                type="submit"
                form="create-index-form"
                label="Submit"
                :loading="isSendingTask"
            />
        </template>
    </Drawer>
</template>