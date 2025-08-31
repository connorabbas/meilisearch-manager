import { createRouter, createWebHistory } from 'vue-router';
import { useMeilisearchStore } from '@/stores/meilisearch';
import Welcome from '@/views/Welcome.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    linkActiveClass: 'text-primary!',
    routes: [
        {
            path: '/',
            name: 'welcome',
            component: Welcome,
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: () => import('../views/Dashboard.vue'),
        },
        {
            path: '/indexes',
            name: 'indexes',
            component: () => import('../views/Indexes.vue'),
        },
        {
            path: '/indexes/:indexUID',
            component: () => import('@/layouts/IndexLayout.vue'),
            props: true,
            children: [
                {
                    path: 'details',
                    name: 'index-details',
                    component: () => import('@/views/IndexDetails.vue'),
                    props: true,
                    meta: { breadcrumbLabel: 'Details' },
                },
                {
                    path: 'documents',
                    name: 'index-documents',
                    component: () => import('@/views/IndexDocuments.vue'),
                    props: true,
                    meta: { breadcrumbLabel: 'Documents' },
                },
                {
                    path: 'settings',
                    name: 'index-settings',
                    component: () => import('@/views/IndexSettings.vue'),
                    props: true,
                    meta: { breadcrumbLabel: 'Settings' },
                },
                {
                    path: 'edit',
                    name: 'edit-index',
                    component: () => import('@/views/EditIndex.vue'),
                    props: true,
                    meta: { breadcrumbLabel: 'Edit' },
                },
            ],
        },
        {
            path: '/tasks',
            name: 'tasks',
            component: () => import('../views/Tasks.vue'),
        },
        {
            path: '/keys',
            name: 'keys',
            component: () => import('../views/Keys.vue'),
        },
        {
            path: '/connection-error',
            name: 'connection-error',
            component: () => import('../views/ConnectionError.vue'),
            beforeEnter: () => {
                const meiliStore = useMeilisearchStore();
                if (meiliStore.isConnected) {
                    return { name: 'indexes' };
                }
            },
        },
        // TODO: 404
    ],
});

router.beforeEach(async (to) => {
    // TODO: nprogress loader
    //await new Promise(resolve => setTimeout(resolve, 2000));
    const meiliStore = useMeilisearchStore();
    await meiliStore.connect();

    if (to.name === 'connection-error') {
        return;
    }
    if (!meiliStore.isConnected || meiliStore.connectionError) {
        return { name: 'connection-error' };
    }
});

export default router;
