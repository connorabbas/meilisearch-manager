import { createRouter, createWebHistory } from 'vue-router';
import progress from '@/utils/progress';
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
            path: '/indexes/:indexUid',
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
            component: () => import('../views/error/MeilisearchConnection.vue'),
            beforeEnter: () => {
                const meilisearchStore = useMeilisearchStore();
                if (meilisearchStore.isConnected) {
                    return { name: 'indexes' };
                }
            },
        },
        {
            path: '/:pathMatch(.*)*', // 404 route not found
            name: 'NotFound',
            component: () => import('../views/error/NotFound.vue'),
        },
    ],
});

let progressTimer: number | null = null;
let isAsyncComponentLoading = false;

router.beforeEach(async (to, from) => {
    if (progress.isStarted()) {
        progress.done();
    }
    if (progressTimer) {
        clearTimeout(progressTimer);
        progressTimer = null;
    }
    if (to.path !== from.path) {
        isAsyncComponentLoading = true;
        progressTimer = setTimeout(() => {
            if (isAsyncComponentLoading) {
                progress.start();
            }
            progressTimer = null;
        }, 150);
    }

    const meilisearchStore = useMeilisearchStore();
    try {
        await meilisearchStore.connect();
    } catch (err) {
        console.error(err);
    }

    if (to.name === 'connection-error') {
        return;
    }
    if (!meilisearchStore.isConnected || meilisearchStore.connectionError) {
        return { name: 'connection-error' };
    }
});

router.onError(() => {
    isAsyncComponentLoading = false;
    if (progressTimer) {
        clearTimeout(progressTimer);
        progressTimer = null;
    }
    progress.done();
});

router.afterEach(() => {
    console.log('test')
})

export function completeAsyncLoading() {
    isAsyncComponentLoading = false;
    if (progressTimer) {
        clearTimeout(progressTimer);
        progressTimer = null;
    }
    progress.done();
}

export default router;