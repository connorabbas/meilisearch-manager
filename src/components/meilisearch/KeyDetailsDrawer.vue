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
                <div
                    v-if="canCopy"
                    class="flex items-center gap-4"
                >
                    <div>
                        {{ maskedApiKey(props.apiKey.key) }}
                    </div>
                    <Button
                        v-tooltip.right="'Copy'"
                        severity="secondary"
                        size="small"
                        text
                        @click="$emit('copy-key', props.apiKey.key)"
                    >
                        <Copy />
                    </Button>
                </div>
                <Inplace v-else>
                    <template #display>
                        Reveal API Key
                    </template>
                    <template #content>
                        {{ props.apiKey.key }}
                    </template>
                </Inplace>
            </Fieldset>
            <Fieldset
                v-if="props.apiKey?.description"
                legend="Description"
            >
                {{ props.apiKey.description }}
            </Fieldset>
            <Fieldset legend="Indexes">
                <div class="flex flex-wrap gap-2">
                    <Tag
                        v-for="index in props.apiKey.indexes"
                        :key="index"
                        :value="index"
                        severity="secondary"
                    />
                </div>
            </Fieldset>
            <Fieldset legend="Actions">
                <div class="flex flex-wrap gap-2">
                    <Tag
                        v-for="action in props.apiKey.actions"
                        :key="action"
                        :value="action"
                        severity="secondary"
                    />
                </div>
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