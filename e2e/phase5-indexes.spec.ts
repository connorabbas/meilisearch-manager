import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

function makeIndexes(count: number) {
    return Array.from({ length: count }, (_, itemIndex) => ({
        uid: `index-${itemIndex + 1}`,
        primaryKey: itemIndex === 0 ? null : 'id',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
    }))
}

test.beforeEach(async ({ page }) => {
    await seedInstance(page)
})

test('indexes use remote offsets and reset to page one when page size changes', async ({ page }) => {
    const indexRequests: URL[] = []
    await installMeilisearchMock(page, {
        indexes: makeIndexes(21),
        onIndexesRequest: request => indexRequests.push(new URL(request.url())),
    })
    await page.goto('/indexes')

    await expect(page.getByRole('cell', { name: 'index-1', exact: true })).toBeVisible()
    await expect(page.getByText('Not set', { exact: true })).toBeVisible()
    await expect(page.getByText('Showing 1 to 20 of 21 indexes')).toBeVisible()
    expect(indexRequests.at(-1)?.searchParams.get('offset')).toBe('0')
    expect(indexRequests.at(-1)?.searchParams.get('limit')).toBe('20')

    await page.getByRole('button', { name: 'Next Page' }).click()
    await expect(page.getByRole('cell', { name: 'index-21', exact: true })).toBeVisible()
    await expect.poll(() => indexRequests.at(-1)?.searchParams.get('offset')).toBe('20')

    await page.getByRole('combobox', { name: 'Rows per page' }).click()
    await page.getByRole('option', { name: '50', exact: true }).click()
    await expect(page.getByRole('cell', { name: 'index-1', exact: true })).toBeVisible()
    await expect(page.getByText('Showing 1 to 21 of 21 indexes')).toBeVisible()
    await expect.poll(() => ({
        offset: indexRequests.at(-1)?.searchParams.get('offset'),
        limit: indexRequests.at(-1)?.searchParams.get('limit'),
    })).toEqual({ offset: '0', limit: '50' })
})

test('index list clamps the page when the remote total shrinks', async ({ page }) => {
    const indexes = makeIndexes(21)
    const indexRequests: URL[] = []
    let shrunk = false
    await installMeilisearchMock(page, {
        indexes,
        getIndexes: () => shrunk ? indexes.slice(0, 1) : indexes,
        onIndexesRequest: request => indexRequests.push(new URL(request.url())),
    })
    await page.goto('/indexes')
    await page.getByRole('button', { name: 'Next Page' }).click()
    await expect(page.getByRole('cell', { name: 'index-21', exact: true })).toBeVisible()

    shrunk = true
    await page.getByRole('button', { name: 'Refresh' }).click()

    await expect(page.getByRole('cell', { name: 'index-1', exact: true })).toBeVisible()
    await expect(page.getByText('Showing 1 to 1 of 1 indexes')).toBeVisible()
    await expect.poll(() => indexRequests.slice(-2).map(request => request.searchParams.get('offset'))).toEqual(['20', '0'])
})

test('index creation validates the UID and omits an empty primary key', async ({ page }) => {
    let createPayload: unknown
    const postUrls: string[] = []
    page.on('request', request => {
        if (request.method() === 'POST') postUrls.push(request.url())
    })
    await installMeilisearchMock(page, {
        onCreateIndexRequest: request => createPayload = request.postDataJSON(),
    })
    await page.goto('/indexes')
    await page.getByRole('button', { name: 'New Index' }).click()

    const modal = page.getByRole('dialog', { name: 'New Index' })
    await modal.getByRole('button', { name: 'Create index' }).click()
    await expect(modal.getByText('Please provide an index UID')).toBeVisible()
    await expect(modal.getByLabel('UID')).toBeFocused()

    await modal.getByLabel('UID').fill('books')
    await expect(modal.getByText('Please provide an index UID')).toBeHidden()
    await modal.getByRole('button', { name: 'Create index' }).click()
    await expect.poll(() => createPayload).toEqual({ uid: 'books' })
    expect(postUrls).toContain('http://127.0.0.1:3000/__meili/indexes')
    await expect(modal).toBeHidden()
    await expect(page.getByRole('cell', { name: 'books', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('The new index: "books" was successfully created')).toBeVisible()
})

test('the pinned index action remains reachable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await installMeilisearchMock(page, { indexes: makeIndexes(1) })
    await page.goto('/indexes')

    const table = page.locator('table').locator('..')
    await table.evaluate(element => element.scrollLeft = element.scrollWidth)
    await expect(page.getByRole('link', { name: 'View', exact: true })).toBeVisible()
    expect(await page.locator('body').evaluate(body => body.scrollWidth <= body.clientWidth)).toBe(true)
})

test('the dashboard owns vertical table scrolling and pagination returns to the top', async ({ page }) => {
    await installMeilisearchMock(page, { indexes: makeIndexes(101) })
    await page.goto('/indexes')

    await page.getByRole('combobox', { name: 'Rows per page' }).click()
    await page.getByRole('option', { name: '100', exact: true }).click()
    await expect(page.getByRole('cell', { name: 'index-100', exact: true })).toBeVisible()

    const scrollContainer = page.locator('.app-scroll-container')
    const tableContainer = page.locator('table').locator('..')
    expect(await scrollContainer.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
    expect(await tableContainer.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true)

    await scrollContainer.evaluate(element => element.scrollTop = element.scrollHeight)
    await expect.poll(() => scrollContainer.evaluate(element => element.scrollTop)).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Next Page' }).click()
    await expect(page.getByRole('cell', { name: 'index-101', exact: true })).toBeVisible()
    await expect.poll(() => scrollContainer.evaluate(element => element.scrollTop)).toBe(0)
})
