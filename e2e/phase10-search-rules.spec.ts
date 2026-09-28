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
        actions: { pin: [{ indexUid: 'movies', id: '1', position: 0 }], scale: [] },
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

test('filter condition and scale actions round-trip through the 1.54 API', async ({ page }) => {
    const payloads: any[] = []
    await installMeilisearchMock(page, { onDynamicSearchRulesRequest: request => {
        if (request.method() === 'PATCH') payloads.push(request.postDataJSON())
    } })
    await seedInstance(page)
    await page.goto('/search-rules/create')
    await page.getByLabel('Rule UID').fill('scaled-movies')
    await page.getByRole('button', { name: 'Add Condition' }).click()
    await page.getByLabel('Scope').click()
    await page.getByRole('option', { name: 'Filter' }).click()
    await page.getByRole('button', { name: 'Add value' }).click()
    await page.getByLabel('Filter attribute 1').fill('genre')
    await page.getByRole('textbox', { name: 'Filter value 1', exact: true }).fill('action')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    for (const [weight, ids] of [[4, '1, 2'], [0.5, '3'], [0, '4']] as const) {
        await page.getByRole('button', { name: 'Add Action' }).click()
        await page.getByLabel('Action type').click()
        await page.getByRole('option', { name: 'Scale' }).click()
        await page.getByLabel('Document IDs').fill(ids)
        if (weight === 4) await page.getByLabel('Document filter').fill('[["genre = action", "genre = comedy"]]')
        await page.getByLabel('Weight').fill(String(weight))
        await page.getByLabel('Weight').press('Tab')
        await page.getByRole('button', { name: 'Save', exact: true }).click()
    }
    await page.getByRole('button', { name: 'Save Rule' }).click()
    await expect(page.getByRole('cell', { name: 'scaled-movies' })).toBeVisible()
    expect(payloads.at(-1)).toMatchObject({
        conditions: { filter: { values: { genre: 'action' } } },
        actions: { pin: [], scale: [
            { ids: ['1', '2'], filter: [['genre = action', 'genre = comedy']], weight: 4 },
            { ids: ['3'], weight: 0.5 },
            { ids: ['4'], weight: 0 },
        ] },
    })
    await page.goto('/search-rules/scaled-movies/edit')
    await expect(page.getByText('genre: action')).toBeVisible()
    await page.getByRole('button', { name: 'Edit action 2' }).click()
    await expect(page.getByLabel('Weight')).toHaveValue('0.5')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.getByRole('button', { name: 'Save Rule' }).click()
    expect(payloads.at(-1).actions.scale.map((action: { weight: number }) => action.weight)).toEqual([4, 0.5, 0])
})

test('editing a filter condition keeps its values without leaking them into a new condition', async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/search-rules/create')
    await page.getByRole('button', { name: 'Add Condition' }).click()
    await page.getByLabel('Scope').click()
    await page.getByRole('option', { name: 'Filter' }).click()
    await page.getByRole('button', { name: 'Add value' }).click()
    await page.getByLabel('Filter attribute 1').fill('genre')
    await page.getByRole('textbox', { name: 'Filter value 1', exact: true }).fill('action')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await page.getByRole('button', { name: 'Edit condition 1' }).click()
    await expect(page.getByLabel('Filter attribute 1')).toHaveValue('genre')
    await expect(page.getByRole('textbox', { name: 'Filter value 1', exact: true })).toHaveValue('action')
    await page.getByRole('textbox', { name: 'Filter value 1', exact: true }).fill('comedy')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText('genre: comedy')).toBeVisible()

    await page.getByRole('button', { name: 'Edit condition 1' }).click()
    await page.getByLabel('Scope').click()
    await page.getByRole('option', { name: 'Query' }).click()
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.getByRole('button', { name: 'Add Condition' }).click()
    await page.getByLabel('Scope').click()
    await page.getByRole('option', { name: 'Filter' }).click()
    await expect(page.getByLabel('Filter attribute 1')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await page.getByRole('button', { name: 'Edit condition 1' }).click()
    await page.getByLabel('Match type').click()
    await page.getByRole('option', { name: 'Contains' }).click()
    await page.getByLabel('Query term').fill('movie')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.getByRole('button', { name: 'Edit condition 1' }).click()
    await expect(page.getByLabel('Query term')).toHaveValue('movie')
})

test('scale action requires nonempty IDs or a valid document filter', async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.goto('/search-rules/create')
    await page.getByRole('button', { name: 'Add Action' }).click()
    await page.getByLabel('Action type').click()
    await page.getByRole('option', { name: 'Scale' }).click()

    const save = page.getByRole('button', { name: 'Save', exact: true })
    const ids = page.getByLabel('Document IDs')
    const filter = page.getByLabel('Document filter')
    await expect(save).toBeDisabled()
    await expect(page.getByText('Enter at least one document ID or a document filter.', { exact: true })).toBeVisible()
    await ids.fill(' , \n ')
    await expect(save).toBeDisabled()
    await filter.fill('[]')
    await expect(save).toBeDisabled()
    await filter.fill('[[]]')
    await expect(save).toBeDisabled()
    await filter.fill('[" "]')
    await expect(save).toBeDisabled()
    await filter.fill('genre = action')
    await expect(save).toBeEnabled()
    await filter.clear()
    await ids.fill('1')
    await expect(save).toBeEnabled()
})

test('scale action builds a document filter without losing its other inputs', async ({ page }) => {
    const payloads: any[] = []
    await installMeilisearchMock(page, { onDynamicSearchRulesRequest: request => {
        if (request.method() === 'PATCH') payloads.push(request.postDataJSON())
    } })
    await seedInstance(page)
    await page.goto('/search-rules/create')
    await page.getByLabel('Rule UID').fill('builder-test')
    await page.getByRole('button', { name: 'Add Condition' }).click()
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.getByRole('button', { name: 'Add Action' }).click()
    await page.getByLabel('Action type').click()
    await page.getByRole('option', { name: 'Scale' }).click()
    await expect(page.getByLabel('Index')).toContainText('Any')
    await expect(page.getByRole('button', { name: 'Build filter' })).toBeDisabled()
    await page.getByLabel('Index').click()
    await page.getByRole('option', { name: 'movies' }).click()
    await page.getByLabel('Document IDs').fill('1')
    await page.getByLabel('Weight').fill('2')
    const filter = page.getByRole('textbox', { name: 'Document filter' })
    await filter.fill('original = true')
    await page.getByRole('button', { name: 'Build filter' }).click()
    await expect(page.getByText('Build document filter')).toBeVisible()
    await page.getByRole('button', { name: 'Add condition' }).click()
    await page.getByLabel('Value for condition 1 in group 1').fill('action')
    await expect(page.getByText('genre = \'action\'')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).last().click()
    await expect(filter).toHaveValue('original = true')
    await page.getByRole('button', { name: 'Build filter' }).click()
    await page.getByRole('button', { name: 'Use filter' }).click()
    await expect(filter).toHaveValue('genre = \'action\'')
    await expect(page.getByLabel('Document IDs')).toHaveValue('1')
    await expect(page.getByLabel('Weight')).toHaveValue('2')
    await page.getByLabel('Index').click()
    await page.getByRole('option', { name: 'Any', exact: true }).click()
    await expect(page.getByLabel('Index')).toContainText('Any')
    await expect(page.getByRole('button', { name: 'Build filter' })).toBeDisabled()
    await expect(filter).toHaveValue('genre = \'action\'')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.getByRole('button', { name: 'Save Rule' }).click()
    expect(payloads.at(-1).actions.scale).toEqual([{ ids: ['1'], filter: 'genre = \'action\'', weight: 2 }])
})

test('filter builder cannot submit without filterable attributes', async ({ page }) => {
    await installMeilisearchMock(page)
    await page.route('**/indexes/movies/settings/filterable-attributes', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
    await seedInstance(page)
    await page.goto('/search-rules/create')
    await page.getByRole('button', { name: 'Add Action' }).click()
    await page.getByLabel('Action type').click()
    await page.getByRole('option', { name: 'Scale' }).click()
    await page.getByLabel('Index').click()
    await page.getByRole('option', { name: 'movies' }).click()
    await page.getByRole('button', { name: 'Build filter' }).click()
    await expect(page.getByText('No filterable attributes')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Use filter' })).toBeDisabled()
    await page.getByRole('button', { name: 'Cancel' }).last().click()
    await page.getByRole('textbox', { name: 'Document filter' }).fill('genre = action')
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled()
})
