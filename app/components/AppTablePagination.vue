<script setup lang="ts">
withDefaults(defineProps<{
    page: number;
    perPage: number;
    total: number;
    summary: string;
    perPageOptions?: number[];
    disabled?: boolean;
    showEdges?: boolean;
    siblingCount?: number;
}>(), {
    perPageOptions: () => [20, 50, 100],
    disabled: false,
    showEdges: false,
    siblingCount: 1,
})

const emit = defineEmits<{
    page: [page: number];
    'per-page': [perPage: number];
}>()

const perPageId = useId()
</script>

<template>
    <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p class="min-w-0 text-sm text-muted">
            {{ summary }}
        </p>

        <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center md:ml-auto">
            <UFieldGroup class="w-full sm:w-auto">
                <UButton
                    as="label"
                    :for="perPageId"
                    color="neutral"
                    variant="subtle"
                    label="Limit"
                    class="shrink-0 cursor-pointer"
                />
                <USelect
                    :id="perPageId"
                    :model-value="perPage"
                    :items="perPageOptions"
                    :disabled="disabled"
                    class="min-w-0 flex-1 sm:flex-none"
                    @update:model-value="emit('per-page', Number($event))"
                />
            </UFieldGroup>

            <div class="min-w-0 overflow-x-auto">
                <UPagination
                    :page="page"
                    :items-per-page="perPage"
                    :total="total"
                    :disabled="disabled || total === 0"
                    :show-edges="showEdges"
                    :sibling-count="siblingCount"
                    class="w-max"
                    @update:page="emit('page', $event)"
                />
            </div>
        </div>
    </div>
</template>
