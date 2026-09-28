import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { expect, test } from '@playwright/test'

test('prefixed multi-instance mode disables the credentialed proxy even when configured', async ({ page }) => {
    const port = await new Promise<number>((resolve) => {
        const server = createServer().listen(0, '127.0.0.1', () => {
            const address = server.address()
            server.close(() => resolve(typeof address === 'object' && address ? address.port : 0))
        })
    })
    const app = spawn(process.execPath, ['.output/server/index.mjs'], {
        cwd: process.cwd(),
        env: {
            ...process.env,
            PORT: String(port),
            HOST: '127.0.0.1',
            NUXT_APP_BASE_URL: '/manager/',
            NUXT_MEILISEARCH_SINGLE_INSTANCE_PROXY_MODE: 'false',
            NUXT_MEILISEARCH_HOST: 'http://127.0.0.1:7700',
            NUXT_MEILISEARCH_API_KEY: 'test-secret',
        },
        stdio: 'ignore',
    })

    try {
        await expect.poll(async () => {
            try {
                return (await fetch(`http://127.0.0.1:${port}/manager/up`)).status
            } catch {
                return 0
            }
        }).toBe(200)
        const config = await fetch(`http://127.0.0.1:${port}/manager/api/config`)
        expect(await config.json()).toEqual({ singleInstanceProxyMode: false })
        const proxy = await fetch(`http://127.0.0.1:${port}/manager/api/meilisearch/indexes`)
        expect(proxy.status).toBe(403)
        const clientConfig = page.waitForResponse(response => new URL(response.url()).pathname === '/manager/api/config')
        await page.goto(`http://127.0.0.1:${port}/manager/new-instance`)
        expect((await clientConfig).status()).toBe(200)
    } finally {
        app.kill()
    }
})
