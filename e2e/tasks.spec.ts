import { expect, test } from '@playwright/test'
import { installMeilisearchMock, seedInstance, type FixtureTask } from './fixtures/meilisearch'

function makeTasks(count: number): FixtureTask[] {
    return Array.from({ length: count }, (_, index) => ({
        uid: index + 1,
        batchUid: index + 1,
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
    }))
}

test.beforeEach(async ({ page }) => {
    await installMeilisearchMock(page)
    await seedInstance(page)
})

test('tasks filters change the task query parameters', async ({ page }) => {
    const taskRequests: string[] = []
    await page.unroute('**/__meili/**')
    await installMeilisearchMock(page, {
        onTasksRequest: request => taskRequests.push(request.url()),
    })

    await page.goto('/tasks')
    await expect(page.getByRole('row').filter({ hasText: 'documentAdditionOrUpdate' })).toBeVisible()

    const filterButton = page.getByRole('button', { name: 'Filter', exact: true })
    await filterButton.click()
    await page.getByRole('button', { name: 'Filter tasks by status' }).click()
    await page.getByRole('option', { name: 'succeeded' }).click()
    await page.keyboard.press('Escape')
    await expect.poll(() => taskRequests.some(url => url.includes('statuses=succeeded'))).toBe(true)

    await page.getByRole('button', { name: 'Filter tasks by type' }).click()
    await page.getByRole('option', { name: 'indexDeletion' }).click()
    await page.keyboard.press('Escape')
    await expect.poll(() => taskRequests.some(url => url.includes('types=indexDeletion') && url.includes('statuses=succeeded'))).toBe(true)

    await expect(filterButton.locator('..')).toContainText('2')

    await expect(page.getByText('No tasks found')).toBeVisible()

    const requestsBeforeClear = taskRequests.length
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeHidden()
    await expect(filterButton.locator('..')).not.toContainText('2')
    await expect.poll(() => taskRequests.slice(requestsBeforeClear)
        .some(url => !url.includes('statuses=') && !url.includes('types='))).toBe(true)
    await expect(page.getByRole('row').filter({ hasText: 'documentAdditionOrUpdate' })).toBeVisible()

    await filterButton.click()
    await expect(page.getByRole('button', { name: 'Filter tasks by status' })).toBeHidden()

    await page.getByRole('combobox', { name: 'Limit' }).click()
    await page.getByRole('option', { name: '20', exact: true }).click()
    await expect.poll(() => taskRequests.some(url => url.includes('limit=20'))).toBe(true)
})

test('tasks infinite loading appends cursor pages without duplicates', async ({ page }) => {
    const taskRequests: string[] = []
    await page.unroute('**/__meili/**')
    await installMeilisearchMock(page, {
        tasks: makeTasks(60),
        onTasksRequest: request => taskRequests.push(request.url()),
    })

    await page.goto('/tasks')

    await expect(page.getByRole('cell', { name: '20', exact: true })).toBeVisible()
    expect(taskRequests.every(url => !url.includes('from='))).toBe(true)

    const scrollContainer = page.locator('.tasks-table-scroll')

    await scrollContainer.evaluate(element => element.scrollTo({ top: element.scrollHeight }))
    await expect(page.getByRole('cell', { name: '40', exact: true })).toBeVisible()
    await expect.poll(() => taskRequests.some(url => url.includes('from=21'))).toBe(true)

    await scrollContainer.evaluate(element => element.scrollTo({ top: element.scrollHeight }))
    await expect(page.getByRole('cell', { name: '60', exact: true })).toBeVisible()
    await expect.poll(() => taskRequests.some(url => url.includes('from=41'))).toBe(true)

    const uidRows = page.getByRole('row').filter({ has: page.getByRole('cell', { name: '60', exact: true }) })
    await expect(uidRows).toHaveCount(1)
})

test('task details show the full task JSON and return focus on close', async ({ page }) => {
    await page.goto('/tasks')

    const viewButton = page.getByRole('button', { name: 'View' })
    await viewButton.focus()
    await page.keyboard.press('Enter')

    const slideover = page.getByRole('dialog', { name: 'Task 101' })
    await expect(slideover).toBeVisible()
    await expect(slideover.getByText('documentAdditionOrUpdate')).toBeVisible()
    await expect(slideover.getByText('PT0.001S')).toBeVisible()
    await expect(slideover.getByRole('button', { name: 'Cancel task' })).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(slideover).toBeHidden()
    await expect(viewButton).toBeFocused()
})

test('task details can cancel a processing task and update its status', async ({ page }) => {
    let cancellationRequested = false
    const canceledUids: number[][] = []
    await page.unroute('**/__meili/**')
    const processingTask: FixtureTask = {
        ...makeTasks(1)[0]!,
        status: 'processing',
        finishedAt: null,
    }
    await installMeilisearchMock(page, {
        tasks: [processingTask],
        onCancelTasksRequest: (_request, uids) => {
            cancellationRequested = true
            canceledUids.push(uids)
        },
        getTask: (_request, uid) => ({
            ...processingTask,
            uid,
            status: cancellationRequested ? 'canceled' : 'processing',
            finishedAt: cancellationRequested ? '2026-01-01T00:00:01.000Z' : null,
        }),
    })

    await page.goto('/tasks')
    await page.getByRole('button', { name: 'View' }).click()
    const slideover = page.getByRole('dialog', { name: 'Task 1' })
    const cancelButton = slideover.getByRole('button', { name: 'Cancel task' })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()

    await expect.poll(() => canceledUids).toContainEqual([1])
    await expect(slideover.getByRole('button', { name: 'Cancel task' })).toHaveCount(0)
    await expect(page.getByText('Task cancelled', { exact: true })).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(slideover).toBeHidden()
    await expect(page.getByRole('row').filter({ hasText: 'canceled' })).toBeVisible()
})

test('task details keep cancellation available when Meilisearch rejects the request', async ({ page }) => {
    await page.unroute('**/__meili/**')
    const cancelUids: number[][] = []
    const processingTask: FixtureTask = {
        ...makeTasks(1)[0]!,
        status: 'processing',
        finishedAt: null,
    }
    await installMeilisearchMock(page, {
        tasks: [processingTask],
        cancelTasksFailure: true,
        onCancelTasksRequest: (_request, uids) => cancelUids.push(uids),
        getTask: (_request, uid) => ({ ...processingTask, uid }),
    })

    await page.goto('/tasks')
    await page.getByRole('button', { name: 'View' }).click()
    const slideover = page.getByRole('dialog', { name: 'Task 1' })
    await slideover.getByRole('button', { name: 'Cancel task' }).click()

    await expect.poll(() => cancelUids).toContainEqual([1])
    await expect(slideover.getByRole('button', { name: 'Cancel task' })).toBeEnabled()
})

test('deleting tasks requires a filter and an explicit confirmation', async ({ page }) => {
    const deletedTasks: { url: string, count: number }[] = []
    const canceledTaskUids: number[][] = []
    await page.unroute('**/__meili/**')
    await installMeilisearchMock(page, {
        onDeleteTasksRequest: (request, deletedCount) => deletedTasks.push({ url: request.url(), count: deletedCount }),
        onCancelTasksRequest: (_request, uids) => canceledTaskUids.push(uids),
    })

    await page.goto('/tasks')
    await expect(page.getByRole('row').filter({ hasText: 'documentAdditionOrUpdate' })).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).click()
    const deleteTasksDialog = page.getByRole('dialog', { name: 'Delete Tasks' })
    await expect(deleteTasksDialog).toBeVisible()

    const dialogDeleteButton = deleteTasksDialog.getByRole('button', { name: 'Delete', exact: true })
    await expect(dialogDeleteButton).toBeDisabled()

    await deleteTasksDialog.getByRole('button', { name: 'Task statuses' }).click()
    await page.getByRole('option', { name: 'succeeded' }).click()
    await page.keyboard.press('Escape')
    await expect(dialogDeleteButton).toBeEnabled()

    await dialogDeleteButton.click()

    const confirmation = page.getByRole('dialog').filter({ hasText: 'Are you sure you want to delete these tasks?' })
    await expect(confirmation).toBeVisible()

    await confirmation.getByRole('button', { name: 'Cancel' }).click()
    await expect(confirmation).toBeHidden()
    await expect(deleteTasksDialog).toBeVisible()
    expect(deletedTasks).toHaveLength(0)

    await dialogDeleteButton.click()
    await expect(confirmation).toBeVisible()
    await confirmation.getByRole('button', { name: 'Delete', exact: true }).click()

    const pollingToast = page.getByRole('region', { name: 'Notifications (F8)' }).getByRole('listitem').filter({ hasText: 'Task Enqueued' })
    await expect(pollingToast.getByRole('button', { name: 'Cancel task' })).toBeVisible()
    await pollingToast.getByRole('button', { name: 'Cancel task' }).click()
    await expect.poll(() => canceledTaskUids).toContainEqual([101])

    await expect(deleteTasksDialog).toBeHidden()
    await expect.poll(() => deletedTasks).toHaveLength(1)
    expect(deletedTasks[0]?.url).toContain('statuses=succeeded')
    expect(deletedTasks[0]?.count).toBe(1)

    await expect(page.getByRole('region', { name: 'Notifications (F8)' }).getByText('Tasks matching the filter have been successfully deleted')).toBeVisible()
    await expect(page.getByText('No tasks found')).toBeVisible()
})

test('task polling timeout points to the Tasks view', async ({ page }) => {
    test.setTimeout(30_000)
    await page.unroute('**/__meili/**')
    await installMeilisearchMock(page, {
        getTask: (_request, uid) => ({
            uid,
            batchUid: 1,
            indexUid: 'movies',
            status: 'processing',
            type: 'settingsUpdate',
            canceledBy: null,
            details: {},
            error: null,
            duration: null,
            enqueuedAt: '2026-01-01T00:00:00.000Z',
            startedAt: '2026-01-01T00:00:00.000Z',
            finishedAt: null,
        }),
    })
    await page.goto('/indexes/movies/settings')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    const notifications = page.getByRole('region', { name: 'Notifications (F8)' })
    const timeoutToast = notifications.getByText('Task is still running')
    await expect(timeoutToast).toBeVisible({ timeout: 25_000 })
    await expect(notifications.getByRole('button', { name: 'Open Tasks' })).toBeVisible()
    await expect(notifications.getByText('Task did not complete after 30 attempts, please check the Tasks log')).toHaveCount(0)
    await expect(notifications.getByText('Meilisearch Settings Error')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
})

test('task cancellation failures are surfaced without stopping task polling', async ({ page }) => {
    await page.unroute('**/__meili/**')
    await installMeilisearchMock(page, { cancelTasksFailure: true })
    await page.goto('/indexes/movies/settings')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Save' }).click()

    const notifications = page.getByRole('region', { name: 'Notifications (F8)' })
    const pollingToast = notifications.getByRole('listitem').filter({ hasText: 'Task Enqueued' })
    await pollingToast.getByRole('button', { name: 'Cancel task' }).click()
    await expect(notifications.getByText('Unable to cancel task')).toBeVisible()
    await expect(notifications.getByText('The settings for index: "movies" have been successfully updated')).toBeVisible({ timeout: 10_000 })
})

test('a requested task cancellation is confirmed by the polled terminal status', async ({ page }) => {
    await page.unroute('**/__meili/**')
    let cancellationRequested = false
    await installMeilisearchMock(page, {
        onCancelTasksRequest: () => cancellationRequested = true,
        getTask: (_request, uid) => ({
            uid,
            batchUid: 1,
            indexUid: 'movies',
            status: uid === 101 ? cancellationRequested ? 'canceled' : 'processing' : 'succeeded',
            type: 'settingsUpdate',
            canceledBy: null,
            details: {},
            error: null,
            duration: null,
            enqueuedAt: '2026-01-01T00:00:00.000Z',
            startedAt: '2026-01-01T00:00:00.000Z',
            finishedAt: null,
        }),
    })
    await page.goto('/indexes/movies/settings')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Save' }).click()

    const notifications = page.getByRole('region', { name: 'Notifications (F8)' })
    const pollingToast = notifications.getByRole('listitem').filter({ hasText: 'Task Enqueued' })
    await pollingToast.getByRole('button', { name: 'Cancel task' }).click()
    await expect.poll(() => cancellationRequested).toBe(true)
    await expect(notifications.getByText('was cancelled successfully')).toBeVisible()
    await expect(notifications.getByText('Meilisearch Settings Error')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
})

test('task polling can be enabled and disabled without duplicate timers', async ({ page }) => {
    test.setTimeout(30_000)
    const taskRequests: string[] = []
    await page.unroute('**/__meili/**')
    await installMeilisearchMock(page, {
        onTasksRequest: request => taskRequests.push(request.url()),
    })

    await page.goto('/tasks')
    await expect(page.getByRole('row').filter({ hasText: 'documentAdditionOrUpdate' })).toBeVisible()

    const pollCount = () => taskRequests.length
    const countBeforeEnable = pollCount()

    await page.getByRole('switch', { name: 'Poll' }).click()
    await expect.poll(pollCount).toBeGreaterThan(countBeforeEnable)

    const countAfterImmediatePoll = pollCount()
    await expect.poll(pollCount, { timeout: 12_000 }).toBeGreaterThan(countAfterImmediatePoll)

    await page.getByRole('switch', { name: 'Poll' }).click()
    const countAfterDisable = pollCount()
    await page.waitForTimeout(1_500)
    expect(pollCount()).toBe(countAfterDisable)
})

test('task list errors are surfaced with a working retry', async ({ page }) => {
    await page.route(/\/__meili\/tasks\?/, route => route.abort())
    await page.goto('/tasks')

    const alertTitle = page.getByText('Unable to load tasks')
    await expect(alertTitle).toBeVisible()

    await page.unroute(/\/__meili\/tasks\?/)
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByRole('row').filter({ hasText: 'documentAdditionOrUpdate' })).toBeVisible()
    await expect(alertTitle).toBeHidden()
})

test('tasks show an explicit empty state', async ({ page }) => {
    await page.unroute('**/__meili/**')
    await installMeilisearchMock(page, { tasks: [] })

    await page.goto('/tasks')
    await expect(page.getByText('No tasks found')).toBeVisible()
})

test('the tasks table keeps the pinned action column usable at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/tasks')

    const table = page.locator('table').locator('..')
    await expect(page.getByRole('row').filter({ hasText: 'documentAdditionOrUpdate' })).toBeVisible()

    await table.evaluate(element => element.scrollLeft = element.scrollWidth)
    await expect(page.getByRole('button', { name: 'View' })).toBeVisible()

    expect(await page.locator('body').evaluate(body => body.scrollWidth <= body.clientWidth)).toBe(true)
    const scrollContainer = page.locator('.app-scroll-container')
    expect(await scrollContainer.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)

    await page.getByRole('button', { name: 'Filter', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Filter tasks by status' })).toBeVisible()
    expect(await page.locator('body').evaluate(body => body.scrollWidth <= body.clientWidth)).toBe(true)
})
