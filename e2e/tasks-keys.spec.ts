import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test.beforeEach(async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
})

test('tasks can be filtered and task details opened', async ({ page }) => {
    const taskRequests: string[] = []
    await page.unroute('**/__meili/**')
    await installMeilisearchMock(page, {
        onTasksRequest: request => taskRequests.push(request.url()),
    })

    await page.goto('/tasks')
    await page.getByRole('combobox', { name: 'Filter tasks by status' }).press('ArrowDown')
    await page.getByRole('option', { name: 'succeeded' }).click()
    await expect.poll(() => taskRequests.some(url => url.includes('statuses=succeeded'))).toBe(true)

    await page.getByRole('row').filter({ hasText: 'documentAdditionOrUpdate' })
        .getByRole('button', { name: 'Details' }).click()
    await expect(page.getByText('Task 101', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Task 101', { exact: true })).toBeHidden()
})

test('keys can be listed and key details opened', async ({ page }) => {
    await page.goto('/keys')
    const keyRow = page.getByRole('row').filter({ hasText: 'Playwright key' })
    await expect(keyRow).toBeVisible()
    await keyRow.getByRole('button', { name: 'Show key actions' }).click()
    await page.getByRole('menuitem', { name: 'Details' }).click()
    const keyUid = page.getByText('00000000-0000-4000-8000-000000000001', { exact: true })
    await expect(keyUid).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(keyUid).toBeHidden()
})
