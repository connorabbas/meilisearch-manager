import { createRouter, createWebHistory } from 'vue-router'
import progress from '@/utils/progress'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { useToast } from 'primevue/usetoast'

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_PATH),
    linkActiveClass: 'text-primary!',
    routes: [
        {
            path: '/',
            name: 'welcome',
            redirect: { name: 'dashboard' },
        },
        {
            path: '/new-instance',
            name: 'new-instance',
            component: () => import('../views/NewInstance.vue'),
            beforeEnter: () => {
                const meilisearchStore = useMeilisearchStore()
                if (meilisearchStore.singleInstanceMode) {
                    return { name: 'dashboard' }
                }
            },
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
                const meilisearchStore = useMeilisearchStore()
                if (meilisearchStore.isConnected) {
                    return { name: 'indexes' }
                }
            },
        },
        {
            path: '/:pathMatch(.*)*', // 404 route not found
            name: 'NotFound',
            component: () => import('../views/error/NotFound.vue'),
        },
    ],
})

let progressTimer: number | null = null
let isAsyncComponentLoading = false

router.beforeEach(async (to, from) => {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()
    if (to.name === 'connection-error' || to.name === 'new-instance') {
        return
    }
    if (meilisearchStore.instances.length === 0) {
        toast.add({
            severity: 'info',
            summary: 'No Instances Found',
            detail: 'Please connect at least one Meilisearch instance',
            life: 7500,
        })
        return { name: 'new-instance' }
    }

    if (progress.isStarted()) {
        progress.done()
    }
    if (progressTimer) {
        clearTimeout(progressTimer)
        progressTimer = null
    }
    if (to.path !== from.path) {
        isAsyncComponentLoading = true
        progressTimer = setTimeout(() => {
            if (isAsyncComponentLoading) {
                progress.start()
            }
            progressTimer = null
        }, 150)
    }

    try {
        await meilisearchStore.connect()
    } catch (err) {
        console.error(err)
    }
    if (!meilisearchStore.isConnected || meilisearchStore.connectionError) {
        return { name: 'connection-error' }
    }
})

router.onError(() => {
    isAsyncComponentLoading = false
    if (progressTimer) {
        clearTimeout(progressTimer)
        progressTimer = null
    }
    progress.done()
})

export function completeAsyncLoading() {
    isAsyncComponentLoading = false
    if (progressTimer) {
        clearTimeout(progressTimer)
        progressTimer = null
    }
    progress.done()
}

export default router
