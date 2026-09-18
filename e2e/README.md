# End-to-end smoke tests

The smoke suite builds and previews the production application, then uses Playwright request interception as a deterministic Meilisearch fixture. It exercises the real browser application and Meilisearch JavaScript client without requiring a separately installed Meilisearch process.

Run the blocking Chromium suite:

```bash
npx playwright install chromium
npm run test:e2e
```

Run the smaller Firefox and WebKit smoke projects:

```bash
npx playwright install firefox webkit
npm run test:e2e:cross-browser
```

The fixture instance is stored under the existing `meilisearch-instances` and `meilisearch-current-id` local-storage keys. Requests use the same-origin `http://127.0.0.1:3000/__meili` host and are fulfilled by `e2e/fixtures/meilisearch.ts`.
