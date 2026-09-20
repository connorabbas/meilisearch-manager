import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test.beforeEach(async ({ page }) => {
    await seedInstance(page)
})

test('index detail uses shareable route navigation and renders a theme-safe chart', async ({ page }) => {
    let indexRequests = 0
    let statsRequests = 0
    await installMeilisearchMock(page, {
        onIndexStatsRequest: () => statsRequests++,
    })
    page.on('request', request => {
        if (request.method() === 'GET' && new URL(request.url()).pathname.endsWith('/indexes/movies')) indexRequests++
    })

    await page.goto('/indexes/movies')
    await expect(page.getByRole('link', { name: 'Stats', exact: true })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Field distribution chart' })).toBeVisible()
    await expect(page.getByText('Total Documents')).toBeVisible()
    await expect(page.getByText('Primary Key')).toBeVisible()
    await expect(page.getByText('id')).toBeVisible()
    await expect(page.getByText('Actively Indexing')).toBeVisible()
    await expect(page.getByText('No')).toBeVisible()
    await expect(page.getByText('Average Document Size')).toBeVisible()
    await expect(page.getByText('100 B')).toBeVisible()
    await page.getByRole('button', { name: 'Color mode' }).click()
    await expect(page.getByRole('img', { name: 'Field distribution chart' })).toBeVisible()
    const initialRequests = { indexRequests, statsRequests }
    await page.getByRole('button', { name: 'Refresh' }).click()
    await expect.poll(() => ({ indexRequests, statsRequests })).toEqual({
        indexRequests: initialRequests.indexRequests + 1,
        statsRequests: initialRequests.statsRequests + 1,
    })

    await page.getByRole('link', { name: 'Settings', exact: true }).click()
    await expect(page).toHaveURL(/\/indexes\/movies\/settings$/)
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()

    await page.setViewportSize({ width: 375, height: 812 })
    expect(await page.locator('body').evaluate(body => body.scrollWidth <= body.clientWidth)).toBe(true)
})

test('settings save the full JSON payload after task completion', async ({ page }) => {
    let settingsPayload: unknown
    await installMeilisearchMock(page, {
        onUpdateSettingsRequest: request => settingsPayload = request.postDataJSON(),
    })
    await page.goto('/indexes/movies/settings')

    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()

    await page.getByRole('button', { name: 'Save' }).click()

    await expect.poll(() => settingsPayload).toEqual({
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
    })
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
})

test('primary key and delete-all-documents keep their distinct task-backed operations', async ({ page }) => {
    let primaryKeyPayload: unknown
    let deleteAllRequests = 0
    await installMeilisearchMock(page, {
        onUpdateIndexRequest: request => primaryKeyPayload = request.postDataJSON(),
        onDeleteAllDocumentsRequest: () => deleteAllRequests++,
    })
    await page.goto('/indexes/movies/edit')

    const primaryKey = page.getByLabel('Primary Key')
    await expect(primaryKey).toHaveValue('id')
    await primaryKey.fill('movieId')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect.poll(() => primaryKeyPayload).toEqual({ primaryKey: 'movieId' })
    await expect(primaryKey).toHaveValue('movieId')

    await page.getByRole('button', { name: 'Delete all documents' }).click()
    const confirmation = page.getByRole('dialog', { name: 'Danger Zone' })
    await confirmation.getByRole('button', { name: 'Cancel' }).click()
    expect(deleteAllRequests).toBe(0)

    await page.getByRole('button', { name: 'Delete all documents' }).click()
    await confirmation.getByRole('button', { name: 'Delete' }).click()
    await expect.poll(() => deleteAllRequests).toBe(1)
    await expect(page).toHaveURL(/\/indexes\/movies\/edit$/)
    await expect(page.getByText('All documents from index: "movies" have been successfully deleted', { exact: true })).toBeVisible()
})
