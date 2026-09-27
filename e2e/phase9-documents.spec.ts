import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test.beforeEach(async ({ page }) => {
    await seedInstance(page)
})

async function openDocuments(page: import('@playwright/test').Page) {
    await page.goto('/indexes')
    await expect(page.getByRole('cell', { name: 'movies', exact: true })).toBeVisible()
    await page.getByRole('row').filter({ hasText: 'movies' }).getByRole('link', { name: 'View' }).click()
    await page.getByRole('link', { name: 'Documents', exact: true }).click()
    await expect(page.getByRole('searchbox', { name: 'Search documents' })).toBeVisible()
}

test('shared taskbar drives search, views, sorting, ranking, and pagination', async ({ page }) => {
    const requests: Array<Record<string, unknown>> = []
    await installMeilisearchMock(page, {
        onSearchRequest: request => requests.push(request.postDataJSON()),
    })
    await openDocuments(page)

    await expect(page.getByRole('searchbox', { name: 'Search documents' })).toBeVisible()
    await expect(page.getByText('21 total hits')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open search options' })).toBeHidden()

    await page.getByRole('searchbox', { name: 'Search documents' }).fill('Playwright')
    await expect.poll(() => requests.filter(request => request.q === 'Playwright').length).toBe(1)

    const beforeViewChange = requests.length
    await page.getByRole('tab', { name: 'Table' }).click()
    await expect(page.getByRole('table')).toBeVisible()
    expect(requests).toHaveLength(beforeViewChange)

    await page.getByRole('button', { name: 'Toggle ranking score' }).click()
    await expect.poll(() => requests.some(request => request.showRankingScore === true && request.showRankingScoreDetails === true)).toBe(true)
    await expect(page.getByRole('columnheader', { name: 'Ranking Score' })).toBeVisible()

    await page.getByRole('combobox', { name: 'Sort documents' }).click()
    await page.getByRole('option', { name: 'year:desc' }).click()
    await expect.poll(() => requests.some(request => JSON.stringify(request.sort) === JSON.stringify(['year:desc']))).toBe(true)

    await page.locator('.app-scroll-container').evaluate(element => element.scrollTo({ top: element.scrollHeight }))
    await page.getByRole('button', { name: 'Next Page' }).click()
    await expect.poll(() => requests.some(request => request.offset === 20 && request.limit === 20)).toBe(true)

})

test('mobile document toolbar keeps search and views visible while collapsing search options', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const requests: Array<Record<string, unknown>> = []
    await installMeilisearchMock(page, {
        indexSettings: {
            displayedAttributes: ['*'],
            searchableAttributes: ['title'],
            filterableAttributes: ['genre'],
            sortableAttributes: ['year'],
            rankingRules: ['words'],
            stopWords: [],
            separatorTokens: [],
            nonSeparatorTokens: [],
            dictionary: [],
            synonyms: {},
            distinctAttribute: null,
            typoTolerance: { enabled: true },
            faceting: { maxValuesPerFacet: 100, sortFacetValuesBy: { '*': 'alpha' } },
            pagination: { maxTotalHits: 1000 },
            embedders: { default: { source: 'huggingFace', model: 'test-model' } },
            searchCutoffMs: null,
            localizedAttributes: [],
        },
        onSearchRequest: request => requests.push(request.postDataJSON()),
    })
    await openDocuments(page)

    await expect(page.getByRole('searchbox', { name: 'Search documents' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'JSON' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Table' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open search options' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Sort documents' })).toBeHidden()
    await page.getByText('Showing 1 to 20 of 21 documents').scrollIntoViewIfNeeded()
    await expect(page.getByText('Showing 1 to 20 of 21 documents')).toBeVisible()

    await page.getByRole('button', { name: 'Open search options' }).click()
    await expect(page.getByRole('combobox', { name: 'Sort documents' }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Filter' }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Configure hybrid search' }).last()).toBeVisible()
    await page.getByRole('button', { name: 'Toggle ranking score' }).last().click()
    await expect.poll(() => requests.some(request => request.showRankingScore === true)).toBe(true)
    await page.getByRole('button', { name: 'Open search options' }).click()
    await page.getByRole('button', { name: 'Filter' }).last().click()
    const filters = page.getByRole('dialog', { name: 'Filter Documents' })
    await expect.poll(async () => (await filters.boundingBox())!.width).toBe(390)
    await page.setViewportSize({ width: 900, height: 844 })
    await expect.poll(async () => (await filters.boundingBox())!.width).toBe(900)
})

test('caps reachable document pages at pagination.maxTotalHits', async ({ page }) => {
    const requests: Array<Record<string, unknown>> = []
    await installMeilisearchMock(page, {
        documents: Array.from({ length: 41 }, (_, index) => ({ id: index + 1, title: `Movie ${index + 1}` })),
        paginationMaxTotalHits: 25,
        onSearchRequest: request => requests.push(request.postDataJSON()),
    })

    await page.goto('/indexes/movies/documents')
    await expect(page.getByRole('searchbox', { name: 'Search documents' })).toBeVisible()
    await page.getByRole('button', { name: 'Next Page' }).click()

    await expect.poll(() => requests.some(request => request.offset === 20 && request.limit === 20)).toBe(true)
    await expect(page.getByText('25 total hits')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: 'Next Page' })).toBeDisabled()
    expect(requests.some(request => Number(request.offset) >= 25)).toBe(false)
})

test('builder applies typed groups, resets pagination, and clears on mode switch', async ({ page }) => {
    const requests: Array<Record<string, unknown>> = []
    await installMeilisearchMock(page, {
        searchDelayMs: 300,
        indexSettings: {
            displayedAttributes: ['*'], searchableAttributes: ['title'],
            filterableAttributes: ['genre', 'year', 'rating'], sortableAttributes: ['year'],
            rankingRules: ['words'], stopWords: [], separatorTokens: [], nonSeparatorTokens: [],
            dictionary: [], synonyms: {}, distinctAttribute: null, typoTolerance: { enabled: true },
            faceting: { maxValuesPerFacet: 100, sortFacetValuesBy: { '*': 'alpha' } },
            pagination: { maxTotalHits: 1000 }, embedders: {}, searchCutoffMs: null, localizedAttributes: [],
        },
        onSearchRequest: request => requests.push(request.postDataJSON()),
    })
    await openDocuments(page)
    await page.getByRole('button', { name: 'Next Page' }).click()
    await expect.poll(() => requests.at(-1)?.offset).toBe(20)

    await page.getByRole('button', { name: 'Filter' }).click()
    const filters = page.getByRole('dialog', { name: 'Filter Documents' })
    const facetWidth = (await filters.boundingBox())!.width
    await filters.getByRole('tab', { name: 'Builder' }).click()
    await expect.poll(async () => Math.abs((await filters.boundingBox())!.width - facetWidth) < 1).toBe(true)
    await expect(filters.getByRole('table')).toHaveCount(1)
    await expect(filters.getByRole('columnheader', { name: 'Attribute' })).toBeVisible()
    await filters.getByRole('button', { name: 'Add condition' }).click()
    const tableFillsCard = await filters.getByRole('table').evaluate((table) => {
        const cell = table.querySelector('tbody td')!
        const select = cell.querySelector('button')!
        const padding = parseFloat(getComputedStyle(cell).paddingLeft) + parseFloat(getComputedStyle(cell).paddingRight)
        return table.getBoundingClientRect().width >= table.parentElement!.getBoundingClientRect().width - 1
            && table.parentElement!.scrollWidth <= table.parentElement!.clientWidth
            && select.getBoundingClientRect().width >= cell.getBoundingClientRect().width - padding - 1
    })
    expect(tableFillsCard).toBe(true)
    await filters.getByRole('combobox', { name: 'Attribute for condition 1 in group 1' }).click()
    await page.getByRole('option', { name: 'year', exact: true }).click()
    await filters.getByRole('combobox', { name: 'Value type for condition 1 in group 1' }).click()
    await page.getByRole('option', { name: 'Number', exact: true }).click()
    await filters.getByRole('combobox', { name: 'Operator for condition 1 in group 1' }).click()
    await page.getByRole('option', { name: 'at least (>=)' }).click()
    await filters.getByRole('spinbutton', { name: 'Value for condition 1 in group 1' }).fill('2000')

    await filters.getByRole('button', { name: 'Add condition' }).click()
    await filters.getByRole('combobox', { name: 'Attribute for condition 2 in group 1' }).click()
    await page.getByRole('option', { name: 'genre', exact: true }).click()
    await filters.getByRole('textbox', { name: 'Value for condition 2 in group 1' }).fill('Children\'s')
    await expect(filters.getByRole('textbox', { name: 'Value for condition 2 in group 1' })).toHaveValue('Children\'s')
    await expect(filters.getByText('genre = \'Children\\\'s\'')).toBeVisible()
    await filters.getByRole('combobox', { name: 'Match conditions in group 1' }).click()
    await page.getByRole('option', { name: 'Any (OR)' }).click()
    await expect(filters.getByText('(year >= 2000 OR genre = \'Children\\\'s\')')).toBeVisible()
    expect(requests.some(request => request.filter)).toBe(false)

    await filters.getByRole('button', { name: 'Close' }).click()
    await page.getByRole('button', { name: 'Filter' }).click()
    await expect(filters.getByRole('tab', { name: 'Builder' })).toHaveAttribute('data-state', 'active')
    await expect(filters.getByRole('spinbutton', { name: 'Value for condition 1 in group 1' })).toHaveValue('2000')
    await expect(filters.getByRole('textbox', { name: 'Value for condition 2 in group 1' })).toHaveValue('Children\'s')
    await expect(filters.getByText('(year >= 2000 OR genre = \'Children\\\'s\')')).toBeVisible()

    await filters.getByRole('button', { name: 'Add group' }).click()
    await filters.getByRole('combobox', { name: 'Attribute for condition 1 in group 2' }).click()
    await page.getByRole('option', { name: 'rating', exact: true }).click()
    await filters.getByRole('combobox', { name: 'Value type for condition 1 in group 2' }).click()
    await page.getByRole('option', { name: 'Number', exact: true }).click()
    await filters.getByRole('combobox', { name: 'Operator for condition 1 in group 2' }).click()
    await page.getByRole('option', { name: 'greater than (>)' }).click()
    await filters.getByRole('spinbutton', { name: 'Value for condition 1 in group 2' }).fill('4')
    const expectedFilter = '(year >= 2000 OR genre = \'Children\\\'s\') AND rating > 4'
    await expect(filters.locator('pre').filter({ hasText: expectedFilter })).toBeVisible()
    await filters.getByRole('button', { name: 'Apply filters' }).click()
    await expect(filters.getByRole('button', { name: 'Searching' })).toBeVisible()
    await expect(filters).toBeVisible()
    await expect.poll(() => requests.at(-1)?.filter).toBe(expectedFilter)
    expect(requests.at(-1)?.offset).toBe(0)

    await expect(filters).toBeHidden()
    await page.getByRole('button', { name: 'Filter' }).click()
    await expect(filters.locator('pre').filter({ hasText: expectedFilter })).toBeVisible()
    await expect(filters.getByRole('button', { name: 'Apply filters' })).toBeDisabled()

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await filters.getByRole('button', { name: 'Copy', exact: true }).click()
    await expect(filters.getByRole('button', { name: 'Copied' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedFilter)

    const requestCount = requests.length
    await filters.getByRole('tab', { name: 'Facets' }).click()
    await page.waitForTimeout(350)
    expect(requests).toHaveLength(requestCount)
    await expect(filters.getByText(expectedFilter)).toBeVisible()
    await filters.getByRole('tab', { name: 'Builder' }).click()
    await expect(filters.locator('pre').filter({ hasText: expectedFilter })).toBeVisible()
})

test('builder respects granular filter capabilities', async ({ page }) => {
    await installMeilisearchMock(page, {
        version: '1.14.0',
        indexStats: {
            numberOfDocuments: 1, isIndexing: false,
            fieldDistribution: { id: 1, genre: 1, year: 1, 'author.name': 1 },
            numberOfEmbeddedDocuments: 0, numberOfEmbeddings: 0,
            rawDocumentDbSize: 512, avgDocumentSize: 512,
        },
        indexSettings: {
            displayedAttributes: ['*'], searchableAttributes: ['title'],
            filterableAttributes: [
                { attributePatterns: ['genre'], features: { facetSearch: true, filter: { equality: true, comparison: false } } },
                { attributePatterns: ['year'], features: { facetSearch: false, filter: { equality: false, comparison: true } } },
                'author',
                { attributePatterns: ['*'], features: { facetSearch: false, filter: { equality: true, comparison: false } } },
            ],
            sortableAttributes: [], rankingRules: ['words'], stopWords: [], separatorTokens: [], nonSeparatorTokens: [],
            dictionary: [], synonyms: {}, distinctAttribute: null, typoTolerance: { enabled: true },
            faceting: { maxValuesPerFacet: 100, sortFacetValuesBy: { '*': 'alpha' } },
            pagination: { maxTotalHits: 1000 }, embedders: {}, searchCutoffMs: null, localizedAttributes: [],
        },
    })
    await openDocuments(page)
    await page.getByRole('button', { name: 'Filter' }).click()
    const filters = page.getByRole('dialog', { name: 'Filter Documents' })
    await filters.getByRole('button', { name: 'Filterable facets' }).click()
    await expect(page.getByRole('option', { name: 'genre', exact: true })).toBeVisible()
    await expect(page.getByRole('option', { name: 'year', exact: true })).toHaveCount(0)
    await page.keyboard.press('Escape')

    await filters.getByRole('tab', { name: 'Builder' }).click()
    await filters.getByRole('button', { name: 'Add condition' }).click()
    await filters.getByRole('combobox', { name: 'Attribute for condition 1 in group 1' }).click()
    await expect(page.getByRole('option', { name: 'author.name', exact: true })).toBeVisible()
    await page.getByRole('option', { name: 'year', exact: true }).click()
    await filters.getByRole('combobox', { name: 'Operator for condition 1 in group 1' }).click()
    await expect(page.getByRole('option', { name: 'greater than (>)' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'is (=)' })).toHaveCount(0)
})

test('image thumbnails open a reusable modal preview in JSON and table views', async ({ page }) => {
    await installMeilisearchMock(page, {
        documents: [{ id: 1, title: 'Image movie', poster: 'https://example.test/poster.jpg' }],
        indexStats: {
            numberOfDocuments: 1,
            isIndexing: false,
            fieldDistribution: { id: 1, title: 1, poster: 1 },
            numberOfEmbeddedDocuments: 0,
            numberOfEmbeddings: 0,
            rawDocumentDbSize: 512,
            avgDocumentSize: 512,
        },
    })
    await openDocuments(page)

    const previewButton = page.getByRole('button', { name: /Enlarge .*image/ })
    await expect(previewButton).toHaveAttribute('aria-haspopup', 'dialog')
    const previewDialog = page.getByRole('dialog', { name: 'poster' })
    await expect(previewDialog).toBeHidden()

    await previewButton.click()
    await expect(previewDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(previewDialog).toBeHidden()

    await page.getByRole('tab', { name: 'Table' }).click()
    const tablePreviewButton = page.getByRole('button', { name: /Enlarge poster document image/ })
    await tablePreviewButton.click()
    await expect(page.getByRole('dialog', { name: 'poster' })).toBeVisible()
})

test('facet, geo, and hybrid controls preserve search parameters', async ({ page }) => {
    const requests: Array<Record<string, unknown>> = []
    const facetQueries: string[] = []
    await installMeilisearchMock(page, {
        documents: [{ id: 1, title: 'Geo movie', genre: 'Children\'s', _geo: { lat: 45.47, lng: 9.18 } }],
        indexStats: {
            numberOfDocuments: 1,
            isIndexing: false,
            fieldDistribution: { id: 1, title: 1, genre: 1, _geo: 1 },
            numberOfEmbeddedDocuments: 1,
            numberOfEmbeddings: 1,
            rawDocumentDbSize: 512,
            avgDocumentSize: 512,
        },
        indexSettings: {
            displayedAttributes: ['*'],
            searchableAttributes: ['title'],
            filterableAttributes: ['genre', '_geo'],
            sortableAttributes: ['year', '_geo'],
            rankingRules: ['words'],
            stopWords: [],
            separatorTokens: [],
            nonSeparatorTokens: [],
            dictionary: [],
            synonyms: {},
            distinctAttribute: null,
            typoTolerance: { enabled: true },
            faceting: { maxValuesPerFacet: 100, sortFacetValuesBy: { '*': 'alpha' } },
            pagination: { maxTotalHits: 1000 },
            embedders: { default: { source: 'huggingFace', model: 'test-model' } },
            searchCutoffMs: null,
            localizedAttributes: [],
        },
        onSearchRequest: request => requests.push(request.postDataJSON()),
        onFacetSearchRequest: request => facetQueries.push(request.postDataJSON().facetQuery),
    })
    await openDocuments(page)
    await expect(page.getByRole('tab', { name: 'Geo' })).toBeVisible()
    await page.getByRole('button', { name: 'Configure hybrid search' }).click()
    const hybrid = page.getByRole('dialog', { name: 'Hybrid Search' })
    await expect(hybrid).toBeVisible()
    await hybrid.getByRole('switch', { name: 'Enabled' }).check()
    await hybrid.getByRole('slider').press('ArrowRight')
    await hybrid.getByRole('button', { name: 'Apply' }).click()
    await expect.poll(() => requests.some(request => JSON.stringify(request.hybrid) === JSON.stringify({ embedder: 'default', semanticRatio: 0.55 }))).toBe(true)
    await page.getByRole('button', { name: 'Configure hybrid search' }).click()
    await expect(hybrid.getByRole('switch', { name: 'Enabled' })).toBeChecked()
    await hybrid.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('button', { name: 'Configure hybrid search' }).click()
    await hybrid.getByRole('switch', { name: 'Enabled' }).uncheck()
    await hybrid.getByRole('button', { name: 'Apply' }).click()
    await expect.poll(() => requests.at(-1)?.hybrid).toBeUndefined()

    await page.getByRole('tab', { name: 'Geo' }).click()
    await expect(page.getByRole('region', { name: 'Map' })).toBeVisible()
    await page.getByRole('button', { name: 'Filter' }).click()
    const filters = page.getByRole('dialog', { name: 'Filter Documents' })
    await filters.getByRole('button', { name: 'Filterable facets' }).click()
    await page.getByRole('option', { name: 'genre' }).click()
    await page.keyboard.press('Escape')
    await filters.getByRole('button', { name: 'genre values' }).click()
    await page.getByPlaceholder('Search facet values').fill('Drama')
    await expect.poll(() => facetQueries.includes('Drama')).toBe(true)
    await expect(page.getByRole('option', { name: /Children's/ })).toHaveCount(0)
    await page.getByPlaceholder('Search facet values').fill('')
    await expect(page.getByRole('option', { name: /Children's/ })).toBeVisible()
    await page.getByRole('option', { name: /Children's/ }).click()
    expect(requests.some(request => request.filter)).toBe(false)
    await page.keyboard.press('Escape')

    await filters.getByRole('combobox', { name: 'Geo filter' }).click()
    await page.getByRole('option', { name: 'Radius' }).click()
    await filters.getByRole('textbox', { name: 'Latitude', exact: true }).fill('45.47')
    await filters.getByRole('textbox', { name: 'Longitude', exact: true }).fill('9.18')
    await filters.getByRole('textbox', { name: 'Radius (meters)' }).fill('2000')
    expect(requests.some(request => request.filter)).toBe(false)
    await filters.getByRole('button', { name: 'Apply filters' }).click()
    await expect.poll(() => requests.at(-1)?.filter).toBe('(genre = \'Children\\\'s\') AND _geoRadius(45.47, 9.18, 2000)')
    await expect(filters).toBeHidden()
    await page.getByRole('button', { name: 'Filter' }).click()

    await filters.getByRole('combobox', { name: 'Geo sort' }).click()
    await page.getByRole('option', { name: 'Nearest First' }).click()
    await filters.getByRole('textbox', { name: 'Reference latitude' }).fill('48.85')
    await filters.getByRole('textbox', { name: 'Reference longitude' }).fill('2.29')
    await filters.getByRole('button', { name: 'Apply filters' }).click()
    await expect.poll(() => requests.some(request => JSON.stringify(request.sort) === JSON.stringify(['_geoPoint(48.85, 2.29):asc']))).toBe(true)
    await expect(filters).toBeHidden()
    await page.getByRole('button', { name: 'Filter' }).click()

    await filters.getByRole('tab', { name: 'Builder' }).click()
    await filters.getByRole('button', { name: 'Add condition' }).click()
    await filters.getByRole('textbox', { name: 'Value for condition 1 in group 1' }).fill('Drama')
    await filters.getByRole('button', { name: 'Add group' }).click()
    await filters.getByRole('textbox', { name: 'Value for condition 1 in group 2' }).fill('Comedy')
    await filters.getByRole('combobox', { name: 'Match groups' }).click()
    await page.getByRole('option', { name: 'Any (OR)' }).click()
    await filters.getByRole('combobox', { name: 'Geo filter' }).click()
    await page.getByRole('option', { name: 'Radius' }).click()
    await filters.getByRole('textbox', { name: 'Latitude', exact: true }).fill('45.47')
    await filters.getByRole('textbox', { name: 'Longitude', exact: true }).fill('9.18')
    await filters.getByRole('textbox', { name: 'Radius (meters)' }).fill('2000')
    await filters.getByRole('button', { name: 'Apply filters' }).click()
    await expect.poll(() => requests.at(-1)?.filter).toBe('(genre = \'Drama\' OR genre = \'Comedy\') AND _geoRadius(45.47, 9.18, 2000)')
})

test('document edit and delete actions use accessible overlays and confirmation', async ({ page }) => {
    let deleteRequests = 0
    await installMeilisearchMock(page, {
        onDeleteDocumentRequest: () => deleteRequests++,
    })
    await openDocuments(page)

    const editButton = page.getByRole('button', { name: 'Edit document' }).first()
    await editButton.click()
    await expect(page.getByRole('dialog', { name: 'Edit Document' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Edit Document' })).toBeHidden()

    await page.getByRole('button', { name: 'Delete document' }).first().click()
    const confirmation = page.getByRole('dialog', { name: 'Danger Zone' })
    await confirmation.getByRole('button', { name: 'Cancel' }).click()
    expect(deleteRequests).toBe(0)

    await page.getByRole('button', { name: 'Delete document' }).first().click()
    await confirmation.getByRole('button', { name: 'Delete' }).click()
    await expect.poll(() => deleteRequests).toBe(1)
})

test('document import and export keep file behavior', async ({ page }) => {
    let importedBody = ''
    const exportedDocuments = [{ id: 1, title: 'Exported movie' }]
    await installMeilisearchMock(page, {
        documents: exportedDocuments,
        onImportDocumentsRequest: request => { importedBody = request.postData() ?? '' },
    })
    await openDocuments(page)

    await page.getByRole('button', { name: 'Import Documents' }).click()
    const importDialog = page.getByRole('dialog', { name: 'Import Documents' })
    await importDialog.locator('input[type="file"]').setInputFiles({
        name: 'movies.json',
        mimeType: 'application/json',
        buffer: Buffer.from('[{"id":2,"title":"Imported movie"}]'),
    })
    await importDialog.getByRole('button', { name: 'Submit' }).click()
    await expect.poll(() => importedBody).toContain('Imported movie')

    await page.getByRole('button', { name: 'Export Documents' }).click()
    const exportDialog = page.getByRole('dialog', { name: 'Export Documents' })
    await exportDialog.getByRole('textbox', { name: 'Filename' }).fill('phase9-export')
    const downloadPromise = page.waitForEvent('download')
    await exportDialog.getByRole('button', { name: 'Export' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('phase9-export.json')
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    expect(Buffer.concat(chunks).toString()).toContain('Exported movie')
})

test('documents taskbar and actions remain usable at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await installMeilisearchMock(page)
    await openDocuments(page)

    await expect(page.getByRole('searchbox', { name: 'Search documents' })).toBeVisible()
    await page.getByRole('button', { name: 'Open search options' }).click()
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit document' }).first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})

test('sort control explains when no sortable attributes are configured', async ({ page }) => {
    await installMeilisearchMock(page, { sortableAttributes: [] })
    await openDocuments(page)

    const sortControl = page.getByRole('combobox', { name: 'Sort documents' })
    await expect(sortControl).toHaveText('Sort by')
    await sortControl.click()
    await expect(page.getByText('Update the index settings to enable sorting.')).toBeVisible()
})
