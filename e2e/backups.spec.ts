import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance } from './fixtures/meilisearch'

test('backup actions call distinct endpoints and poll their tasks', async ({ page }) => {
    let dumpRequests = 0
    let snapshotRequests = 0
    await installMeilisearchMock(page, {
        onCreateDumpRequest: () => dumpRequests++,
        onCreateSnapshotRequest: () => snapshotRequests++,
    })
    await seedInstance(page)
    await page.goto('/backups/dumps')

    const scrollContainer = page.locator('.app-scroll-container')
    const createDump = page.getByRole('button', { name: 'Create Dump' })
    await expect(createDump).toBeVisible()
    await expect(scrollContainer.getByRole('button', { name: 'Create Dump' })).toHaveCount(0)
    await createDump.click()
    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('A new dump was successfully created')).toBeVisible()
    await expect.poll(() => dumpRequests).toBe(1)

    await page.locator('#meilisearch-manager-dashboard-panel-backups').getByRole('link', { name: 'Snapshots', exact: true }).click()
    const createSnapshot = page.getByRole('button', { name: 'Create Snapshot' })
    await expect(createDump).toHaveCount(0)
    await expect(createSnapshot).toBeVisible()
    await expect(scrollContainer.getByRole('button', { name: 'Create Snapshot' })).toHaveCount(0)
    await createSnapshot.click()
    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('A new snapshot was successfully created')).toBeVisible()
    await expect.poll(() => snapshotRequests).toBe(1)
})
