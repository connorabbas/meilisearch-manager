<script setup lang="ts">
import PageTitleSection from '@/components/PageTitleSection.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { Home } from 'lucide-vue-next';
import Card from 'primevue/card';

const props = defineProps<{
    indexUID?: string,
}>();

const breadcrumbs = [{ route: { name: 'dashboard' }, lucideIcon: Home }, { label: 'Tasks' }];
</script>

<template>
    <AppLayout :breadcrumbs>
        <PageTitleSection>
            <template #title>
                Tasks
            </template>
        </PageTitleSection>
        <Card>
            <template #content>
                Tasks {{ props.indexUID }}
            </template>
        </Card>
    </AppLayout>
</template>
