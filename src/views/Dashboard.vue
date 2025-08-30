<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import SelectColorModeButton from '@/components/SelectColorModeButton.vue';
import Card from 'primevue/card';

const breadcrumbs = [{ label: 'Dashboard' }];
</script>

<template>
    <AppLayout :breadcrumbs>
        <Card>
            <template #content>
                <SelectColorModeButton />
            </template>
        </Card>
    </AppLayout>
</template>
