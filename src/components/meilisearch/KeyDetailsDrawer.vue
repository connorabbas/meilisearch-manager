<script setup lang="ts">
import { computed } from 'vue';
import type { Key } from 'meilisearch';
import { formatDate, maskedApiKey } from '@/utils';
import { useClipboard } from '@vueuse/core';
import { Copy } from 'lucide-vue-next';

const drawerOpen = defineModel<boolean>({ default: false });

const props = defineProps<{
    apiKey: Key,
}>();

defineEmits(['hide', 'copy-key']);

const { isSupported: canCopy } = useClipboard();

const keyName = computed(() => props.apiKey?.name ?? 'API Key Details');
const keyExpired = computed(() => {
    if (!props.apiKey.expiresAt) {
        return false;
    }
    const today = new Date();
    return props.apiKey.expiresAt < today;
});
</script>

<template>
    <Drawer
        :key="props.apiKey.uid"
        v-model:visible="drawerOpen"
        :header="keyName"
        class="w-full sm:w-[40rem]"
        position="right"
        blockScroll
        @hide="$emit('hide')"
    >
        <div class="space-y-4">
            <Fieldset legend="UID">
                {{ props.apiKey.uid }}
            </Fieldset>
            <Fieldset legend="Key">
                <div class="flex items-center gap-2">
                    <Inplace pt:display:class="p-0">
                        <template #display>
                            <div
                                v-tooltip.left="'Reveal API Key'"
                                class="p-2"
                            >
                                {{ maskedApiKey(props.apiKey.key) }}
                            </div>
                        </template>
                        <template #content>
                            <div class="whitespace-normal break-all">{{ props.apiKey.key }}</div>
                        </template>
                    </Inplace>
                    <Button
                        v-if="canCopy"
                        v-tooltip.right="'Copy'"
                        severity="secondary"
                        size="small"
                        text
                        @click="$emit('copy-key', props.apiKey.key)"
                    >
                        <Copy />
                    </Button>
                </div>
            </Fieldset>
            <Fieldset
                v-if="props.apiKey?.description"
                legend="Description"
            >
                {{ props.apiKey.description }}
            </Fieldset>
            <Fieldset legend="Indexes">
                <div
                    v-if="props.apiKey.indexes.length"
                    class="flex flex-wrap gap-2"
                >
                    <Tag
                        v-for="index in props.apiKey.indexes"
                        :key="index"
                        :value="index"
                        severity="secondary"
                    />
                </div>
                <Tag
                    v-else
                    value="none"
                    severity="danger"
                />
            </Fieldset>
            <Fieldset legend="Actions">
                <div
                    v-if="props.apiKey.actions.length"
                    class="flex flex-wrap gap-2"
                >
                    <Tag
                        v-for="action in props.apiKey.actions"
                        :key="action"
                        :value="action"
                        severity="secondary"
                    />
                </div>
                <Tag
                    v-else
                    value="none"
                    severity="danger"
                />
            </Fieldset>
            <Fieldset legend="Expires">
                <div
                    v-if="props.apiKey.expiresAt"
                    class="flex gap-2 items-center"
                >
                    <div>{{ formatDate(props.apiKey.expiresAt) }}</div>
                    <Tag
                        v-if="keyExpired"
                        value="Expired"
                        severity="danger"
                    />
                </div>
                <Tag
                    v-else
                    value="never"
                    severity="info"
                />
            </Fieldset>
            <Fieldset legend="Created">
                {{ formatDate(props.apiKey.createdAt) }}
            </Fieldset>
            <Fieldset
                v-if="props.apiKey.updatedAt"
                legend="Updated"
            >
                {{ formatDate(props.apiKey.updatedAt) }}
            </Fieldset>
        </div>
    </Drawer>
</template>