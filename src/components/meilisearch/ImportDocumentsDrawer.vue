<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';
import type { ContentType, RecordAny } from 'meilisearch';
import { Braces, Info, TriangleAlert, Upload } from 'lucide-vue-next';
import { Mode } from 'vanilla-jsoneditor';
import ThemedJsonEditor from '../ThemedJsonEditor.vue';
import { useDocuments } from '@/composables/meilisearch/useDocuments';
import FileUpload, { FileUploadSelectEvent } from 'primevue/fileupload';
import { readFileAsText } from '@/utils';
import { computed } from 'vue';

const props = defineProps<{
    indexUid: string,
    primaryKey?: string,
}>();

const emit = defineEmits(['hide', 'documents-imported']);

const drawerOpen = defineModel<boolean>({ default: false });

const { addOrUpdateDocuments, addOrUpdateDocumentsFromString, isSendingTask } = useDocuments();

// TODO: empty record with primary key set
const newDocuments = ref<RecordAny[]>([]);
const newDocumentsAsString = ref('');

const importMethod = ref<'upload' | 'manual'>('upload');
const importMode = ref<'addition' | 'update'>('addition');
const importModeOptions = [
    { label: 'Add or replace', value: 'addition' },
    { label: 'Add or update', value: 'update' },
];
const uploadContentType = ref<ContentType>('application/json');
const uploadOptions = [
    { label: 'CSV', value: 'text/csv' },
    { label: 'JSON', value: 'application/json' },
    //{ label: 'x-ndjson', value: 'application/x-ndjson' },
];

type FileUploadType = InstanceType<typeof FileUpload>;
const fileUploader = useTemplateRef<FileUploadType>('document-file-uploader');
const fileUploaderChanged = ref(0);
async function handleUpload(event: FileUploadSelectEvent) {
    const files: File[] = event.files as File[];
    const fileText = await readFileAsText(files[0]);
    newDocumentsAsString.value = fileText;
}
function handleUploaderReset() {
    newDocumentsAsString.value = '';
    fileUploaderChanged.value++;
}

const btnDisabled = computed(() => {
    if (importMethod.value === 'upload') {
        return newDocumentsAsString.value?.length === 0;
    } else if (importMethod.value === 'manual') {
        return newDocuments.value?.length === 0;
    }
    return true;
});

async function handleSaveDocument() {
    if (importMethod.value === 'manual') {
        // TODO: handle JSON errors (reference settings)
        addOrUpdateDocuments(importMode.value, props.indexUid, newDocuments.value, props.primaryKey)
            .then(() => {
                drawerOpen.value = false;
                emit('documents-imported');
            });
    } else {
        addOrUpdateDocumentsFromString(importMode.value, props.indexUid, newDocumentsAsString.value, uploadContentType.value)
            .then(() => {
                drawerOpen.value = false;
                emit('documents-imported');
            });
    }
}

function reset() {
    importMethod.value = 'upload';
    importMode.value = 'addition';
    uploadContentType.value = 'application/json';
    newDocuments.value = [];
    newDocumentsAsString.value = '';
}

function handleHidden() {
    emit('hide');
    reset();
}

watch(uploadContentType, (newVal) => {
    if (newVal && fileUploader.value) {
        handleUploaderReset();
    }
});

</script>

<template>
    <Drawer
        v-model:visible="drawerOpen"
        header="Import Documents"
        class="w-full sm:w-[60rem]"
        position="right"
        blockScroll
        @hide="handleHidden"
    >
        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <label for="new-mode">Import mode</label>
                <Select
                    id="new-mode"
                    v-model="importMode"
                    class="w-fit"
                    :options="importModeOptions"
                    optionLabel="label"
                    optionValue="value"
                />
            </div>
            <!-- TODO: error message -->
            <Message severity="info">
                <template #icon>
                    <Info />
                </template>
                <span class="font-bold">Note:</span> reference the Meilisearch docs for the difference between <a
                    class="text-inherit"
                    href="https://www.meilisearch.com/docs/reference/api/documents#add-or-replace-documents"
                    target="_blank"
                >add or
                    replace</a> vs. <a
                    class="text-inherit"
                    href="https://www.meilisearch.com/docs/reference/api/documents#add-or-update-documents"
                    target="_blank"
                >add or
                    update</a> functionality.
            </Message>
            <div>
                <Tabs v-model:value="importMethod">
                    <TabList>
                        <Tab
                            value="upload"
                            class="flex items-center gap-2"
                        >
                            <Upload /> Upload
                        </Tab>
                        <Tab
                            value="manual"
                            class="flex items-center gap-2"
                        >
                            <Braces /> Manual
                        </Tab>
                    </TabList>
                    <TabPanels class="p-0 pt-4">
                        <TabPanel value="upload">
                            <!-- TODO: https://primevue.org/progressbar/#dynamic -->
                            <div class="flex flex-col gap-4">
                                <Select
                                    id="new-mode"
                                    v-model="uploadContentType"
                                    class="w-fit"
                                    :options="uploadOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                />
                                <Message
                                    v-if="uploadContentType === 'text/csv'"
                                    severity="warn"
                                >
                                    <template #icon>
                                        <TriangleAlert class="text-base! size-[22px]!" />
                                    </template>
                                    <span class="font-bold">Warning:</span> CSV uploads do not handle array and nested object
                                    structures correctly, this option is only advised if your dataset has basic key:value pairs
                                </Message>
                                <FileUpload
                                    ref="document-file-uploader"
                                    :key="fileUploaderChanged"
                                    :accept="uploadContentType"
                                    :multiple="false"
                                    :previewWidth="0"
                                    :fileLimit="1"
                                    :showUploadButton="false"
                                    :showCancelButton="false"
                                    :pt="{
                                        pcProgressBar: {
                                            root: {
                                                class: 'hidden'
                                            }
                                        },
                                        file: { class: 'p-0' },
                                        fileThumbnail: { class: 'hidden' }
                                    }"
                                    customUpload
                                    auto
                                    @select="handleUpload($event)"
                                    @remove="handleUploaderReset"
                                    @removeUploadedFile="handleUploaderReset"
                                >
                                    <template #empty>
                                        <span>Or drag and drop a file here to upload.</span>
                                    </template>
                                </FileUpload>
                            </div>
                        </TabPanel>
                        <TabPanel value="manual">
                            <ThemedJsonEditor
                                v-model="newDocuments"
                                :mode="Mode.text"
                                :main-menu-bar="false"
                                :stringified="false"
                            />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </div>
        </div>
        <template #footer>
            <Button
                label="Submit"
                :loading="isSendingTask"
                :disabled="btnDisabled"
                @click="handleSaveDocument"
            />
        </template>
    </Drawer>
</template>