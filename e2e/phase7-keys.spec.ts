import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test.beforeEach(async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
})

test('keys table paginates server-side and resets to page one on page-size change', async ({ page }) => {
    const generatedKeys = Array.from({ length: 45 }, (_, index) => ({
        uid: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        name: `Key ${index + 1}`,
        description: null,
        key: `playwright-bulk-key-${index + 1}`,
        actions: ['search'],
        indexes: ['movies'],
        expiresAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    }))

    const keyRequests: { limit?: string, offset?: string }[] = []
    await installMeilisearchMock(page, {
        keys: generatedKeys,
        getKeys: (request) => {
            const url = new URL(request.url())
            keyRequests.push({
                limit: url.searchParams.get('limit') ?? undefined,
                offset: url.searchParams.get('offset') ?? undefined,
            })
            return generatedKeys
        },
    })

    await page.goto('/keys')
    await expect(page.getByText('Showing 1 to 20 of 45 keys')).toBeVisible()
    expect(keyRequests[0]).toEqual({ limit: '20', offset: '0' })

    await page.getByRole('button', { name: 'Next Page' }).click()
    await expect(page.getByText('Showing 21 to 40 of 45 keys')).toBeVisible()
    expect(keyRequests.at(-1)).toEqual({ limit: '20', offset: '20' })

    await page.getByRole('combobox', { name: 'Rows per page' }).click()
    await page.getByRole('option', { name: '50', exact: true }).click()
    await expect(page.getByText('Showing 1 to 45 of 45 keys')).toBeVisible()
    expect(keyRequests.at(-1)).toEqual({ limit: '50', offset: '0' })
})

test('keys stay masked in the table and can only be revealed in the details slideover', async ({ page }) => {
    await page.goto('/keys')
    const keyRow = page.getByRole('row').filter({ hasText: 'Playwright key' })

    await expect(keyRow).toContainText('playwrig****et-key')
    await expect(keyRow).not.toContainText('playwright-secret-key')
    await expect(keyRow.getByRole('button', { name: 'Reveal API key' })).toHaveCount(0)

    await keyRow.getByRole('button', { name: 'Show key actions' }).click()
    await page.getByRole('menuitem', { name: 'Details' }).click()
    const slideover = page.getByRole('dialog', { name: 'Playwright key' })
    await expect(slideover).toBeVisible()
    await expect(slideover).toContainText('playwrig****et-key')

    await slideover.getByRole('button', { name: 'Reveal API key' }).click()
    await expect(slideover).toContainText('playwright-secret-key')

    await slideover.getByRole('button', { name: 'Hide API key' }).click()
    await expect(slideover).toContainText('playwrig****et-key')
    await page.keyboard.press('Escape')
    await expect(slideover).toBeHidden()
})

test('creating a key submits the exact payload and refreshes the list', async ({ page }) => {
    let createPayload: Record<string, unknown> | undefined
    await installMeilisearchMock(page, {
        onCreateKeyRequest: request => createPayload = request.postDataJSON(),
    })

    await page.goto('/keys')
    await page.getByRole('button', { name: 'New Key' }).click()
    const slideover = page.getByRole('dialog', { name: 'New API Key' })
    await expect(slideover).toBeVisible()

    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(slideover.getByText('Select at least one index or enable “All indexes”')).toBeVisible()
    await expect(createPayload).toBeUndefined()

    await slideover.getByLabel('Name').fill('CI key')
    await slideover.getByLabel('Description').fill('created by e2e')
    await slideover.getByLabel('All actions').check()
    await slideover.getByRole('button').filter({ hasText: 'select permitted indexes' }).click()
    await page.getByRole('option', { name: 'movies', exact: true }).click()
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Submit' }).click()

    await expect.poll(() => createPayload).toBeDefined()
    expect(createPayload).toEqual({
        indexes: ['movies'],
        actions: ['*'],
        name: 'CI key',
        description: 'created by e2e',
        expiresAt: null,
    })

    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('API Key Created')).toBeVisible()
    await expect(slideover).toBeHidden()
    await expect(page.getByText('Showing 1 to 4 of 4 keys')).toBeVisible()
})

test('arbitrary actions are accepted, trimmed, and deduplicated', async ({ page }) => {
    let createPayload: Record<string, unknown> | undefined
    await installMeilisearchMock(page, {
        onCreateKeyRequest: request => createPayload = request.postDataJSON(),
    })

    await page.goto('/keys')
    await page.getByRole('button', { name: 'New Key' }).click()
    const slideover = page.getByRole('dialog', { name: 'New API Key' })

    const actionsInput = slideover.getByRole('combobox', { name: /Actions/ })
    await actionsInput.fill('search')
    await page.keyboard.press('Enter')
    await actionsInput.fill('docs.write')
    await page.keyboard.press('Enter')
    await actionsInput.fill('search ')
    await actionsInput.blur()

    await slideover.getByLabel('All indexes').check()
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect.poll(() => createPayload).toBeDefined()
    expect(createPayload?.actions).toEqual(['search', 'docs.write'])
    expect(createPayload?.indexes).toEqual(['*'])
})

test('editing a key changes only the editable fields', async ({ page }) => {
    let updatePayload: Record<string, unknown> | undefined
    await installMeilisearchMock(page, {
        onUpdateKeyRequest: request => updatePayload = request.postDataJSON(),
    })

    await page.goto('/keys')
    const keyRow = page.getByRole('row').filter({ hasText: 'Playwright key' })
    await keyRow.getByRole('button', { name: 'Show key actions' }).click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()

    const slideover = page.getByRole('dialog', { name: 'Edit API Key' })
    await expect(slideover).toBeVisible()
    await expect(slideover.getByText('00000000-0000-4000-8000-000000000001')).toBeVisible()
    await expect(slideover.getByText('movies', { exact: true })).toBeVisible()

    await slideover.getByLabel('Name').fill('Renamed key')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect.poll(() => updatePayload).toBeDefined()
    expect(updatePayload).toEqual({
        name: 'Renamed key',
        description: 'Deterministic browser fixture',
    })

    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('API Key Updated')).toBeVisible()
    await expect(slideover).toBeHidden()
    await expect(page.getByRole('row').filter({ hasText: 'Renamed key' })).toBeVisible()
})

test('deleting a key requires confirmation and refreshes the list', async ({ page }) => {
    let deleteRequests = 0
    await installMeilisearchMock(page, {
        onDeleteKeyRequest: () => deleteRequests++,
    })

    await page.goto('/keys')
    const keyRow = page.getByRole('row').filter({ hasText: 'Playwright key' })
    await keyRow.getByRole('button', { name: 'Show key actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()

    const confirmation = page.getByRole('dialog', { name: 'Danger Zone' })
    await expect(confirmation).toBeVisible()
    await confirmation.getByRole('button', { name: 'Cancel' }).click()
    await expect(confirmation).toBeHidden()
    expect(deleteRequests).toBe(0)

    await keyRow.getByRole('button', { name: 'Show key actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await confirmation.getByRole('button', { name: 'Delete' }).click()

    await expect.poll(() => deleteRequests).toBe(1)
    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('API Key Deleted')).toBeVisible()
    await expect(page.getByText('Showing 1 to 2 of 2 keys')).toBeVisible()
})

test('expired keys show the expired badge in details', async ({ page }) => {
    await page.goto('/keys')
    const keyRow = page.getByRole('row').filter({ hasText: 'Playwright expired key' })
    await keyRow.getByRole('button', { name: 'Show key actions' }).click()
    await page.getByRole('menuitem', { name: 'Details' }).click()

    await expect(page.getByRole('dialog', { name: 'Playwright expired key' })).toBeVisible()
    await expect(page.getByText('Expired', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Playwright expired key' })).toBeHidden()
})

test('the create key slideover is keyboard operable and returns focus', async ({ page }) => {
    await page.goto('/keys')

    await page.getByRole('button', { name: 'New Key' }).focus()
    await page.keyboard.press('Enter')
    const slideover = page.getByRole('dialog', { name: 'New API Key' })
    await expect(slideover).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(slideover).toBeHidden()
    await expect(page.getByRole('button', { name: 'New Key' })).toBeFocused()
})

test('the keys page renders in dark mode with slideovers usable', async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
    await page.addInitScript(() => localStorage.setItem('nuxt-color-mode', 'dark'))
    await page.goto('/keys')

    await expect(page.getByRole('row').filter({ hasText: 'Playwright key' })).toBeVisible()

    await page.getByRole('button', { name: 'New Key' }).click()
    const slideover = page.getByRole('dialog', { name: 'New API Key' })
    await expect(slideover).toBeVisible()
    await expect(slideover.getByText('UID', { exact: true })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(slideover).toBeHidden()

    const html = await page.locator('html')
    await expect(html).toHaveClass(/dark/)
})

test('the keys table keeps the pinned action column usable at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/keys')

    const keyRow = page.getByRole('row').filter({ hasText: 'Playwright key' })
    await expect(keyRow).toBeVisible()
    await expect(keyRow.getByRole('button', { name: 'Show key actions' })).toBeVisible()

    const scrollContainer = page.locator('.app-scroll-container')
    await expect.poll(async () => {
        const { clientWidth, scrollWidth } = await scrollContainer.evaluate(
            element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth })
        )
        return scrollWidth <= clientWidth
    }).toBe(true)
})
