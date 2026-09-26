import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test('search rule can be created, edited, and deleted', async ({ page }) => {
    const payloads: unknown[] = []
    await installMeilisearchMock(page, { onDynamicSearchRulesRequest: request => {
        if (['PUT', 'PATCH'].includes(request.method())) payloads.push(request.postDataJSON())
    } })
    await seedInstance(page)
    await page.goto('/search-rules/create')
    await page.getByLabel('Rule UID').fill('summer-sale')
    await page.getByRole('button', { name: 'Add Condition' }).click()
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.getByRole('button', { name: 'Add Action' }).click()
    await page.getByLabel('Index').click()
    await page.getByRole('option', { name: 'movies' }).click()
    await page.getByLabel('Document ID').fill('1')
    await page.getByLabel('Document ID').press('Enter')
    await expect(page.getByText('Selected document')).toBeVisible()
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.getByRole('button', { name: 'Save Rule' }).click()
    await expect(page.getByRole('cell', { name: 'summer-sale' })).toBeVisible()
    expect(payloads.at(-1)).toMatchObject({
        precedence: null,
        conditions: { query: { isEmpty: true } },
        actions: [{
            selector: { indexUid: 'movies', id: '1' },
            action: { type: 'pin', position: 0 },
        }],
    })
    await page.getByRole('button', { name: 'Show search rule actions' }).last().click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()
    await expect(page.getByLabel('Rule UID')).toBeDisabled()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('button', { name: 'Show search rule actions' }).last().click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Task Succeeded', { exact: true })).toBeVisible()
    await expect(page.getByText('Rule Deleted', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('cell', { name: 'summer-sale' })).toHaveCount(0)
})

test('search rule deletion does not report success until its task succeeds', async ({ page }) => {
    await installMeilisearchMock(page, {
        getTask: (_, taskUid) => ({
            uid: taskUid,
            batchUid: 1,
            indexUid: null,
            status: 'canceled',
            type: 'dsrClear',
            canceledBy: 102,
            details: {},
            error: null,
            duration: 'PT0.001S',
            enqueuedAt: '2026-01-01T00:00:00.000Z',
            startedAt: '2026-01-01T00:00:00.000Z',
            finishedAt: '2026-01-01T00:00:01.000Z',
        }),
    })
    await seedInstance(page)
    await page.goto('/search-rules')

    await page.getByRole('button', { name: 'Show search rule actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByText('Task cancelled', { exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'featured-movie' })).toBeVisible()
    await expect(page.getByText('Rule Deleted', { exact: true })).toHaveCount(0)
})

test('inactive filter sends false and can be cleared', async ({ page }) => {
    const requests: unknown[] = []
    await installMeilisearchMock(page, { onDynamicSearchRulesRequest: request => { if (request.method() === 'POST') requests.push(request.postDataJSON()) } })
    await seedInstance(page)
    await page.goto('/search-rules')
    await page.getByRole('button', { name: 'Filter' }).click()
    await page.getByLabel('Status').click()
    await page.getByRole('option', { name: 'Inactive' }).click()
    await expect.poll(() => JSON.stringify(requests.at(-1))).toContain('"active":false')
})

test('precedence displays and priority sorting returns to default', async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/search-rules')

    const ruleRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'featured-movie' }) })
    await expect(ruleRow.getByRole('cell', { name: '1', exact: true }).first()).toBeVisible()
    const priority = page.getByRole('button', { name: 'Priority, not sorted' })
    await priority.click()
    await page.getByRole('button', { name: 'Priority, sorted ascending' }).click()
    await page.getByRole('button', { name: 'Priority, sorted descending' }).click()
    await expect(page.getByRole('button', { name: 'Priority, not sorted' })).toBeVisible()
})

test('document autocomplete only previews a selected result', async ({ page }) => {
    const exactDocumentRequests: string[] = []
    await installMeilisearchMock(page, { onGetDocumentsRequest: request => exactDocumentRequests.push(request.url()) })
    await seedInstance(page)
    await page.goto('/search-rules/create')
    await page.getByRole('button', { name: 'Add Action' }).click()
    await page.getByLabel('Index').click()
    await page.getByRole('option', { name: 'movies' }).click()
    await page.getByLabel('Document ID').fill('movie')
    await expect(page.getByText('title: Playwright Movie')).toBeVisible()
    await expect.poll(() => exactDocumentRequests).toEqual([])
    await page.getByRole('option', { name: /1 title: Playwright Movie/ }).click()
    await expect(page.getByText('Selected document')).toBeVisible()
    await page.getByLabel('Document ID').clear()
    await expect(page.getByText('Selected document')).toHaveCount(0)
    await expect.poll(() => exactDocumentRequests).toEqual([])
})

test('editing a pin action loads its selected document preview', async ({ page }) => {
    const exactDocumentRequests: string[] = []
    await installMeilisearchMock(page, { onGetDocumentsRequest: request => exactDocumentRequests.push(request.url()) })
    await seedInstance(page)
    await page.goto('/search-rules/featured-movie/edit')

    await page.getByRole('button', { name: 'Edit action 1' }).click()
    await expect(page.getByText('Selected document')).toBeVisible()
    await expect(page.getByText('Playwright Movie')).toBeVisible()
    await expect.poll(() => exactDocumentRequests.filter(url => url.endsWith('/indexes/movies/documents/1'))).toHaveLength(1)
})
