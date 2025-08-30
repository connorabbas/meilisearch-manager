<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import PageTitleSection from '@/components/PageTitleSection.vue';
import { Home, Plus } from 'lucide-vue-next';

const breadcrumbs = [{ route: { name: 'dashboard' }, lucideIcon: Home }, { label: 'Keys' }];
</script>

<template>
    <AppLayout :breadcrumbs>
        <PageTitleSection>
            <template #title>
                Keys
            </template>
            <template #end>
                <Button label="Create New Key">
                    <template #icon>
                        <Plus />
                    </template>
                </Button>
            </template>
        </PageTitleSection>
        <Card>
            <template #content>
                Keys
            </template>
        </Card>
    </AppLayout>
</template>
