import type { Page, Request, Route } from '@playwright/test'

export const instance = {
    id: 'playwright-instance',
    name: 'Playwright Instance',
    host: 'http://127.0.0.1:3000/__meili',
    apiKey: 'playwright-key',
}

export const secondaryInstance = {
    id: 'playwright-instance-secondary',
    name: 'Secondary Playwright Instance',
    host: 'http://127.0.0.1:3000/__meili',
    apiKey: 'playwright-key-secondary',
}

const index = {
    uid: 'movies',
    primaryKey: 'id',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
}

const indexStats = {
    numberOfDocuments: 21,
    isIndexing: false,
    fieldDistribution: { id: 21, title: 21, year: 21 },
    numberOfEmbeddedDocuments: 0,
    numberOfEmbeddings: 0,
    rawDocumentDbSize: 2048,
    avgDocumentSize: 100,
}

const task = {
    uid: 101,
    batchUid: 1,
    indexUid: 'movies',
    status: 'succeeded',
    type: 'documentAdditionOrUpdate',
    canceledBy: null,
    details: { receivedDocuments: 1, indexedDocuments: 1 },
    error: null,
    duration: 'PT0.001S',
    enqueuedAt: '2026-01-01T00:00:00.000Z',
    startedAt: '2026-01-01T00:00:00.000Z',
    finishedAt: '2026-01-01T00:00:01.000Z',
}

const key = {
    uid: '00000000-0000-4000-8000-000000000001',
    name: 'Playwright key',
    description: 'Deterministic browser fixture',
    key: 'playwright-secret-key',
    actions: ['search'],
    indexes: ['movies'],
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
}

export type MeilisearchMockOptions = {
    version?: string,
    dynamicSearchRules?: boolean,
    experimentalFeatures?: Record<string, boolean | null>,
    singleInstanceProxyMode?: boolean,
    healthFailures?: number,
    onStatsRequest?: (request: Request) => void,
    onSearchRequest?: (request: Request) => void,
    onTasksRequest?: (request: Request) => void,
    onDeleteIndexRequest?: (request: Request) => void,
    onCreateDumpRequest?: (request: Request) => void,
    onCreateSnapshotRequest?: (request: Request) => void,
    onExperimentalFeaturesRequest?: (request: Request) => void,
}

function json(route: Route, body: unknown, status = 200) {
    return route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
        headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
        },
    })
}

export async function installMeilisearchMock(page: Page, options: MeilisearchMockOptions = {}) {
    let healthFailuresRemaining = options.healthFailures ?? 0

    await page.route('**/api/config', route => json(route, { singleInstanceProxyMode: options.singleInstanceProxyMode ?? false }))
    await page.route('**/{__meili,api/meilisearch}/**', async (route) => {
        const request = route.request()
        const url = new URL(request.url())
        const path = url.pathname.replace(/^\/(?:__meili|api\/meilisearch)/, '')

        if (request.method() === 'OPTIONS') {
            await route.fulfill({
                status: 204,
                headers: {
                    'access-control-allow-origin': '*',
                    'access-control-allow-headers': '*',
                    'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                },
            })
            return
        }

        if (path === '/health') {
            if (healthFailuresRemaining > 0) {
                healthFailuresRemaining--
                await json(route, {
                    message: 'Playwright fixture connection failure',
                    code: 'fixture_connection_failure',
                    type: 'system',
                    link: 'https://example.test/fixture-connection-failure',
                }, 503)
            } else {
                await json(route, { status: 'available' })
            }
        } else if (path === '/stats') {
            options.onStatsRequest?.(request)
            await json(route, {
                databaseSize: 4096,
                usedDatabaseSize: 2048,
                lastUpdate: '2026-01-02T00:00:00.000Z',
                indexes: { movies: indexStats },
            })
        } else if (path === '/version') {
            await json(route, {
                commitSha: 'playwright',
                commitDate: '2026-01-01',
                pkgVersion: options.version ?? '1.41.0',
            })
        } else if (path === '/indexes' && request.method() === 'GET') {
            await json(route, { results: [index], offset: 0, limit: 20, total: 1 })
        } else if (path === '/indexes/movies' && request.method() === 'GET') {
            await json(route, index)
        } else if (path === '/indexes/movies' && request.method() === 'DELETE') {
            options.onDeleteIndexRequest?.(request)
            await json(route, { taskUid: task.uid, indexUid: index.uid, status: 'enqueued', type: 'indexDeletion' })
        } else if (path === '/indexes/movies/stats') {
            await json(route, indexStats)
        } else if (path === '/indexes/movies/search') {
            options.onSearchRequest?.(request)
            const body = request.postDataJSON() as { offset?: number, q?: string }
            const offset = body.offset ?? 0
            const hits = offset === 20
                ? [{ id: 21, title: 'Page Two Movie', year: 2025 }]
                : Array.from({ length: 20 }, (_, itemIndex) => ({
                    id: itemIndex + 1,
                    title: itemIndex === 0 ? 'Playwright Movie' : `Movie ${itemIndex + 1}`,
                    year: 2026,
                }))
            await json(route, {
                hits,
                processingTimeMs: 1,
                query: body.q ?? '',
                offset,
                limit: 20,
                estimatedTotalHits: 21,
            })
        } else if (path === '/indexes/movies/settings/filterable-attributes') {
            await json(route, ['genre'])
        } else if (path === '/indexes/movies/settings/sortable-attributes') {
            await json(route, ['year'])
        } else if (path === '/indexes/movies/settings/embedders') {
            await json(route, {})
        } else if (path === '/tasks') {
            options.onTasksRequest?.(request)
            await json(route, { results: [task], total: 1, limit: 50, from: 101, next: null })
        } else if (path === `/tasks/${task.uid}`) {
            await json(route, { ...task, type: 'indexDeletion' })
        } else if (path === '/keys') {
            await json(route, { results: [key], offset: 0, limit: 20, total: 1 })
        } else if (path === '/dumps' && request.method() === 'POST') {
            options.onCreateDumpRequest?.(request)
            await json(route, { taskUid: task.uid, status: 'enqueued', type: 'dumpCreation' })
        } else if (path === '/snapshots' && request.method() === 'POST') {
            options.onCreateSnapshotRequest?.(request)
            await json(route, { taskUid: task.uid, status: 'enqueued', type: 'snapshotCreation' })
        } else if (path === '/experimental-features' && request.method() === 'GET') {
            await json(route, options.experimentalFeatures ?? { dynamicSearchRules: options.dynamicSearchRules ?? true })
        } else if (path === '/experimental-features' && request.method() === 'PATCH') {
            options.onExperimentalFeaturesRequest?.(request)
            await json(route, request.postDataJSON())
        } else if (path === '/dynamic-search-rules' && request.method() === 'POST') {
            await json(route, {
                results: [{
                    uid: 'featured-movie',
                    description: 'Playwright rule',
                    priority: 1,
                    active: true,
                    conditions: [{ scope: 'query', contains: 'movie' }],
                    actions: [{
                        selector: { indexUid: 'movies', id: '1' },
                        action: { type: 'pin', position: 0 },
                    }],
                }],
                offset: 0,
                limit: 20,
                total: 1,
            })
        } else {
            await json(route, {
                message: `No Playwright fixture for ${request.method()} ${path}`,
                code: 'fixture_not_found',
                type: 'invalid_request',
                link: 'https://example.test/fixture-not-found',
            }, 404)
        }
    })
}

export async function seedInstance(page: Page) {
    await seedInstances(page, [instance])
}

export async function seedInstances(page: Page, instances: typeof instance[], currentInstanceId = instances[0]?.id) {
    await page.addInitScript((seededInstance) => {
        localStorage.setItem('meilisearch-instances', JSON.stringify(seededInstance.instances))
        localStorage.setItem('meilisearch-current-id', seededInstance.currentInstanceId)
        localStorage.setItem('meilisearch-tasks-polling-enabled', 'false')
        localStorage.setItem('nuxt-color-mode', 'light')
    }, { instances, currentInstanceId })
}
