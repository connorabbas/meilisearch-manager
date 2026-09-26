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

type FixtureIndex = {
    uid: string;
    primaryKey: string | null;
    createdAt: string;
    updatedAt: string;
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

const indexSettings = {
    displayedAttributes: ['*'],
    searchableAttributes: ['title'],
    filterableAttributes: ['genre'],
    sortableAttributes: ['year'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    stopWords: [],
    separatorTokens: [],
    nonSeparatorTokens: [],
    dictionary: [],
    synonyms: {},
    distinctAttribute: null,
    typoTolerance: { enabled: true },
    faceting: { maxValuesPerFacet: 100, sortFacetValuesBy: { '*': 'alpha' } },
    pagination: { maxTotalHits: 1000 },
    embedders: {},
    searchCutoffMs: null,
    localizedAttributes: [],
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

export type FixtureTask = typeof task

type FixtureKey = {
    uid: string;
    name: string;
    description: string | null;
    key: string;
    actions: string[];
    indexes: string[];
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

const key: FixtureKey = {
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

const defaultKeys: FixtureKey[] = [
    key,
    {
        uid: '00000000-0000-4000-8000-000000000002',
        name: 'Playwright admin key',
        description: null,
        key: 'playwright-admin-secret-key',
        actions: ['*'],
        indexes: ['*'],
        expiresAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
        uid: '00000000-0000-4000-8000-000000000003',
        name: 'Playwright expired key',
        description: null,
        key: 'playwright-expired-secret-key',
        actions: ['search'],
        indexes: ['movies'],
        expiresAt: '2026-01-02T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
]

export type MeilisearchMockOptions = {
    version?: string,
    dynamicSearchRules?: boolean,
    experimentalFeatures?: Record<string, boolean | null>,
    singleInstanceProxyMode?: boolean,
    healthFailures?: number,
    onStatsRequest?: (request: Request) => void,
    onIndexesRequest?: (request: Request) => void,
    onCreateIndexRequest?: (request: Request) => void,
    indexes?: FixtureIndex[],
    getIndexes?: (request: Request, indexes: FixtureIndex[]) => FixtureIndex[],
    onSearchRequest?: (request: Request) => void,
    documents?: Array<Record<string, unknown>>,
    indexStats?: Omit<typeof indexStats, 'fieldDistribution'> & { fieldDistribution: Record<string, number> },
    indexSettings?: Omit<typeof indexSettings, 'embedders'> & { embedders: Record<string, unknown> },
    paginationMaxTotalHits?: number,
    sortableAttributes?: string[],
    onImportDocumentsRequest?: (request: Request) => void,
    onDeleteDocumentRequest?: (request: Request) => void,
    onGetDocumentsRequest?: (request: Request) => void,
    onTasksRequest?: (request: Request) => void,
    onDeleteIndexRequest?: (request: Request) => void,
    onIndexStatsRequest?: (request: Request) => void,
    onSettingsRequest?: (request: Request) => void,
    onUpdateSettingsRequest?: (request: Request) => void,
    onUpdateIndexRequest?: (request: Request) => void,
    onDeleteAllDocumentsRequest?: (request: Request) => void,
    onCreateDumpRequest?: (request: Request) => void,
    onCreateSnapshotRequest?: (request: Request) => void,
    onExperimentalFeaturesRequest?: (request: Request) => void,
    onDynamicSearchRulesRequest?: (request: Request) => void,
    keys?: FixtureKey[],
    getKeys?: (request: Request, keys: FixtureKey[]) => FixtureKey[],
    onCreateKeyRequest?: (request: Request) => void,
    onUpdateKeyRequest?: (request: Request) => void,
    onDeleteKeyRequest?: (request: Request) => void,
    tasks?: FixtureTask[],
    getTasks?: (request: Request, tasks: FixtureTask[]) => FixtureTask[],
    onDeleteTasksRequest?: (request: Request, deletedCount: number) => void,
    onCancelTasksRequest?: (request: Request, canceledUids: number[]) => void,
    cancelTasksFailure?: boolean,
    getTask?: (request: Request, taskUid: number) => FixtureTask,
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

function noContent(route: Route) {
    return route.fulfill({
        status: 204,
        headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
        },
    })
}

export async function installMeilisearchMock(page: Page, options: MeilisearchMockOptions = {}) {
    let healthFailuresRemaining = options.healthFailures ?? 0
    const indexes = [...(options.indexes ?? [index])]
    const movieIndex = { ...index }
    let movieSettings = structuredClone(indexSettings)
    const dynamicSearchRules = [{
        uid: 'featured-movie',
        description: 'Playwright rule',
        precedence: 1,
        active: true,
        conditions: { query: { words: 'movie' } },
        actions: [{ selector: { indexUid: 'movies', id: '1' }, action: { type: 'pin', position: 0 } }],
    }]
    if (options.indexSettings) movieSettings = structuredClone(options.indexSettings)
    if (options.paginationMaxTotalHits !== undefined) movieSettings.pagination.maxTotalHits = options.paginationMaxTotalHits
    const documents = structuredClone(options.documents ?? Array.from({ length: 21 }, (_, itemIndex) => ({
        id: itemIndex + 1,
        title: itemIndex === 0 ? 'Playwright Movie' : itemIndex === 20 ? 'Page Two Movie' : `Movie ${itemIndex + 1}`,
        year: itemIndex === 20 ? 2025 : 2026,
    })))
    const keys = structuredClone(options.keys ?? defaultKeys)
    let createdKeyCounter = 0
    const tasks: FixtureTask[] = structuredClone(options.tasks ?? [task])

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
                indexes: Object.fromEntries(indexes.map(item => [item.uid, item.uid === 'movies' ? (options.indexStats ?? indexStats) : {
                    ...indexStats,
                    numberOfDocuments: 0,
                }])),
            })
        } else if (path === '/version') {
            await json(route, {
                commitSha: 'playwright',
                commitDate: '2026-01-01',
                pkgVersion: options.version ?? '1.41.0',
            })
        } else if (path === '/indexes' && request.method() === 'GET') {
            options.onIndexesRequest?.(request)
            const availableIndexes = options.getIndexes?.(request, indexes) ?? indexes
            const offset = Number(url.searchParams.get('offset') ?? 0)
            const limit = Number(url.searchParams.get('limit') ?? 20)
            await json(route, {
                results: availableIndexes.slice(offset, offset + limit),
                offset,
                limit,
                total: availableIndexes.length,
            })
        } else if (path === '/indexes' && request.method() === 'POST') {
            options.onCreateIndexRequest?.(request)
            const payload = request.postDataJSON() as { uid: string, primaryKey?: string }
            const createdIndex: FixtureIndex = {
                uid: payload.uid,
                primaryKey: payload.primaryKey ?? null,
                createdAt: '2026-01-03T00:00:00.000Z',
                updatedAt: '2026-01-03T00:00:00.000Z',
            }
            indexes.push(createdIndex)
            await json(route, {
                taskUid: 102,
                indexUid: payload.uid,
                status: 'enqueued',
                type: 'indexCreation',
            })
        } else if (path === '/indexes/movies' && request.method() === 'GET') {
            await json(route, movieIndex)
        } else if (path === '/indexes/movies' && request.method() === 'PATCH') {
            options.onUpdateIndexRequest?.(request)
            const payload = request.postDataJSON() as { primaryKey: string }
            movieIndex.primaryKey = payload.primaryKey
            await json(route, { taskUid: task.uid, indexUid: movieIndex.uid, status: 'enqueued', type: 'indexUpdate' })
        } else if (path === '/indexes/movies' && request.method() === 'DELETE') {
            options.onDeleteIndexRequest?.(request)
            await json(route, { taskUid: task.uid, indexUid: movieIndex.uid, status: 'enqueued', type: 'indexDeletion' })
        } else if (path === '/indexes/movies/stats') {
            options.onIndexStatsRequest?.(request)
            await json(route, options.indexStats ?? indexStats)
        } else if (path === '/indexes/movies/settings' && request.method() === 'GET') {
            options.onSettingsRequest?.(request)
            await json(route, movieSettings)
        } else if (path === '/indexes/movies/settings' && request.method() === 'PATCH') {
            options.onUpdateSettingsRequest?.(request)
            movieSettings = request.postDataJSON() as typeof indexSettings
            await json(route, { taskUid: task.uid, indexUid: movieIndex.uid, status: 'enqueued', type: 'settingsUpdate' })
        } else if (path === '/indexes/movies/settings/pagination' && request.method() === 'GET') {
            await json(route, movieSettings.pagination)
        } else if (path === '/indexes/movies/search') {
            options.onSearchRequest?.(request)
            const body = request.postDataJSON() as { offset?: number, limit?: number, q?: string, showRankingScore?: boolean, showRankingScoreDetails?: boolean }
            const offset = body.offset ?? 0
            const limit = body.limit ?? 20
            const maxTotalHits = movieSettings.pagination.maxTotalHits ?? 1000
            const reachableDocuments = documents.slice(0, maxTotalHits)
            const hits = reachableDocuments.slice(offset, offset + limit).map((document, hitIndex) => ({
                ...document,
                ...(body.showRankingScore ? { _rankingScore: Math.max(0, 0.9 - (hitIndex * 0.02)) } : {}),
                ...(body.showRankingScoreDetails ? { _rankingScoreDetails: { words: { order: hitIndex } } } : {}),
            }))
            await json(route, {
                hits,
                processingTimeMs: 1,
                query: body.q ?? '',
                offset,
                limit,
                estimatedTotalHits: documents.length,
            })
        } else if (path === '/indexes/movies/facet-search') {
            await json(route, { facetHits: [{ value: 'Drama', count: 2 }, { value: 'Children\'s', count: 1 }], facetQuery: null, processingTimeMs: 1 })
        } else if (path === '/indexes/movies/settings/filterable-attributes') {
            await json(route, movieSettings.filterableAttributes)
        } else if (path === '/indexes/movies/settings/sortable-attributes') {
            await json(route, options.sortableAttributes ?? movieSettings.sortableAttributes)
        } else if (path === '/indexes/movies/settings/embedders') {
            await json(route, movieSettings.embedders)
        } else if (path === '/indexes/movies/documents' && request.method() === 'GET') {
            options.onGetDocumentsRequest?.(request)
            const offset = Number(url.searchParams.get('offset') ?? 0)
            const limit = Number(url.searchParams.get('limit') ?? 20)
            await json(route, { results: documents.slice(offset, offset + limit), offset, limit, total: documents.length })
        } else if (path === '/indexes/movies/documents' && ['POST', 'PUT'].includes(request.method())) {
            options.onImportDocumentsRequest?.(request)
            await json(route, { taskUid: task.uid, indexUid: movieIndex.uid, status: 'enqueued', type: 'documentAdditionOrUpdate' })
        } else if (path === '/indexes/movies/documents' && request.method() === 'DELETE') {
            options.onDeleteAllDocumentsRequest?.(request)
            await json(route, { taskUid: task.uid, indexUid: movieIndex.uid, status: 'enqueued', type: 'documentDeletion' })
        } else if (/^\/indexes\/movies\/documents\/[^/]+$/.test(path) && request.method() === 'GET') {
            options.onGetDocumentsRequest?.(request)
            const identifier = decodeURIComponent(path.split('/').at(-1) ?? '')
            const document = documents.find(item => String(item.id) === identifier)
            if (document) await json(route, document)
            else await json(route, { message: `Document "${identifier}" not found` }, 404)
        } else if (/^\/indexes\/movies\/documents\/[^/]+$/.test(path) && request.method() === 'DELETE') {
            options.onDeleteDocumentRequest?.(request)
            const identifier = decodeURIComponent(path.split('/').at(-1) ?? '')
            const documentIndex = documents.findIndex(document => String(document.id) === identifier)
            if (documentIndex >= 0) documents.splice(documentIndex, 1)
            await json(route, { taskUid: task.uid, indexUid: movieIndex.uid, status: 'enqueued', type: 'documentDeletion' })
        } else if (path === '/tasks/cancel' && request.method() === 'POST') {
            const canceledUids = url.searchParams.getAll('uids').flatMap(value => value.split(',')).filter(Boolean).map(Number)
            options.onCancelTasksRequest?.(request, canceledUids)
            if (options.cancelTasksFailure) {
                await json(route, { message: 'Fixture could not cancel task', code: 'fixture_cancel_failed', type: 'invalid_request', link: 'https://example.test' }, 400)
            } else {
                await json(route, { taskUid: task.uid + 1, status: 'enqueued', type: 'taskCancelation' })
            }
        } else if (path === '/tasks' && request.method() === 'DELETE') {
            const query = {
                statuses: url.searchParams.getAll('statuses').flatMap(value => value.split(',')).filter(Boolean),
                types: url.searchParams.getAll('types').flatMap(value => value.split(',')).filter(Boolean),
                indexUids: url.searchParams.getAll('indexUids').flatMap(value => value.split(',')).filter(Boolean),
            }
            const matchesQuery = (item: FixtureTask) => (query.statuses.length === 0 || query.statuses.includes(item.status))
                && (query.types.length === 0 || query.types.includes(item.type))
                && (query.indexUids.length === 0 || query.indexUids.includes(item.indexUid ?? ''))
            const beforeCount = tasks.length
            const remainingTasks = tasks.filter(item => !matchesQuery(item))
            tasks.splice(0, tasks.length, ...remainingTasks)
            options.onDeleteTasksRequest?.(request, beforeCount - tasks.length)
            await json(route, { taskUid: task.uid, status: 'enqueued', type: 'taskDeletion' })
        } else if (path === '/tasks') {
            options.onTasksRequest?.(request)
            const availableTasks = options.getTasks?.(request, tasks) ?? tasks
            const queryStatuses = url.searchParams.getAll('statuses').flatMap(value => value.split(',')).filter(Boolean)
            const queryTypes = url.searchParams.getAll('types').flatMap(value => value.split(',')).filter(Boolean)
            const queryIndexUids = url.searchParams.getAll('indexUids').flatMap(value => value.split(',')).filter(Boolean)
            const matchingTasks = availableTasks.filter(item => (queryStatuses.length === 0 || queryStatuses.includes(item.status))
                && (queryTypes.length === 0 || queryTypes.includes(item.type))
                && (queryIndexUids.length === 0 || queryIndexUids.includes(item.indexUid ?? '')))
            const limit = Number(url.searchParams.get('limit') ?? 20)
            const from = url.searchParams.get('from')
            const startIndex = from === null ? 0 : matchingTasks.findIndex(item => item.uid >= Number(from))
            const pageTasks = startIndex === -1 ? [] : matchingTasks.slice(startIndex, startIndex + limit)
            const lastTask = pageTasks.at(-1)
            const next = lastTask
                ? matchingTasks.find(item => item.uid > lastTask.uid)?.uid ?? null
                : null
            await json(route, {
                results: pageTasks,
                total: matchingTasks.length,
                limit,
                from: from === null ? null : Number(from),
                next,
            })
        } else if (/^\/tasks\/\d+$/.test(path)) {
            const taskUid = Number(path.split('/').at(-1))
            const returnedTask = options.getTask?.(request, taskUid) ?? {
                ...task,
                uid: taskUid,
                indexUid: taskUid === 102 ? 'created-index' : task.indexUid,
                type: taskUid === 102 ? 'indexCreation' : 'indexDeletion',
            }
            await json(route, returnedTask)
        } else if (path === '/keys' && request.method() === 'GET') {
            const availableKeys = options.getKeys?.(request, keys) ?? keys
            const offset = Number(url.searchParams.get('offset') ?? 0)
            const limit = Number(url.searchParams.get('limit') ?? 20)
            await json(route, {
                results: availableKeys.slice(offset, offset + limit),
                offset,
                limit,
                total: availableKeys.length,
            })
        } else if (path === '/keys' && request.method() === 'POST') {
            options.onCreateKeyRequest?.(request)
            const payload = request.postDataJSON() as Partial<FixtureKey>
            createdKeyCounter++
            const createdKey: FixtureKey = {
                uid: payload.uid ?? `00000000-0000-4000-8000-1000000000${String(createdKeyCounter).padStart(2, '0')}`,
                name: payload.name ?? '',
                description: payload.description ?? null,
                key: `playwright-generated-key-${createdKeyCounter}`,
                actions: payload.actions ?? [],
                indexes: payload.indexes ?? [],
                expiresAt: payload.expiresAt instanceof Date
                    ? payload.expiresAt.toISOString()
                    : payload.expiresAt ?? null,
                createdAt: '2026-01-03T00:00:00.000Z',
                updatedAt: '2026-01-03T00:00:00.000Z',
            }
            keys.push(createdKey)
            await json(route, createdKey)
        } else if (/^\/keys\/[^/]+$/.test(path) && request.method() === 'PATCH') {
            options.onUpdateKeyRequest?.(request)
            const identifier = decodeURIComponent(path.split('/').at(-1) ?? '')
            const existingKey = keys.find(item => item.uid === identifier || item.key === identifier)
            if (!existingKey) {
                await json(route, {
                    message: `Playwright fixture key: "${identifier}" not found`,
                    code: 'fixture_key_not_found',
                    type: 'invalid_request',
                    link: 'https://example.test/fixture-key-not-found',
                }, 404)
            } else {
                const payload = request.postDataJSON() as Partial<FixtureKey>
                if (payload.name !== undefined) {
                    existingKey.name = payload.name
                }
                if (payload.description !== undefined) {
                    existingKey.description = payload.description
                }
                existingKey.updatedAt = '2026-01-04T00:00:00.000Z'
                await json(route, existingKey)
            }
        } else if (/^\/keys\/[^/]+$/.test(path) && request.method() === 'DELETE') {
            options.onDeleteKeyRequest?.(request)
            const identifier = decodeURIComponent(path.split('/').at(-1) ?? '')
            const existingKeyIndex = keys.findIndex(item => item.uid === identifier || item.key === identifier)
            if (existingKeyIndex === -1) {
                await json(route, {
                    message: `Playwright fixture key: "${identifier}" not found`,
                    code: 'fixture_key_not_found',
                    type: 'invalid_request',
                    link: 'https://example.test/fixture-key-not-found',
                }, 404)
            } else {
                keys.splice(existingKeyIndex, 1)
                await noContent(route)
            }
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
            options.onDynamicSearchRulesRequest?.(request)
            const payload = request.postDataJSON() ?? {}
            const query = payload.filter?.query ?? ''
            const filtered = dynamicSearchRules.filter(rule =>
                (!query || rule.uid.includes(query))
                && (payload.filter?.active === undefined || rule.active === payload.filter.active)
            )
            const offset = payload.offset ?? 0
            const limit = payload.limit ?? 20
            await json(route, {
                results: filtered.slice(offset, offset + limit),
                offset,
                limit,
                total: filtered.length,
            })
        } else if (path.startsWith('/dynamic-search-rules/') && request.method() === 'GET') {
            const uid = decodeURIComponent(path.slice('/dynamic-search-rules/'.length))
            const rule = dynamicSearchRules.find(item => item.uid === uid)
            if (rule) await json(route, rule)
            else await json(route, { message: 'Search rule not found' }, 404)
        } else if (path.startsWith('/dynamic-search-rules/') && ['PUT', 'PATCH'].includes(request.method())) {
            options.onDynamicSearchRulesRequest?.(request)
            const uid = decodeURIComponent(path.slice('/dynamic-search-rules/'.length))
            const payload = request.postDataJSON()
            const rule = { uid, ...payload }
            const index = dynamicSearchRules.findIndex(item => item.uid === uid)
            if (index >= 0) dynamicSearchRules[index] = rule
            else dynamicSearchRules.push(rule)
            await json(route, {
                taskUid: task.uid,
                indexUid: null,
                status: 'enqueued',
                type: 'dsrUpdate',
                enqueuedAt: '2026-01-02T00:00:00.000Z',
            })
        } else if (path.startsWith('/dynamic-search-rules/') && request.method() === 'DELETE') {
            options.onDynamicSearchRulesRequest?.(request)
            const uid = decodeURIComponent(path.slice('/dynamic-search-rules/'.length))
            const index = dynamicSearchRules.findIndex(item => item.uid === uid)
            if (index >= 0) dynamicSearchRules.splice(index, 1)
            await json(route, {
                taskUid: task.uid,
                indexUid: null,
                status: 'enqueued',
                type: 'dsrUpdate',
                enqueuedAt: '2026-01-02T00:00:00.000Z',
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
        localStorage.setItem('meilisearch-index-stats-polling-enabled', 'false')
        localStorage.setItem('nuxt-color-mode', 'light')
    }, { instances, currentInstanceId })
}
