# End-to-end tests

The suite builds and previews the production application, then uses Playwright request interception as a deterministic Meilisearch fixture. It exercises the real browser application and Meilisearch JavaScript client without requiring a separately installed Meilisearch process.

## Organization

Specs are grouped by product feature, not migration phase:

- `connection.spec.ts`, `proxy-mode.spec.ts`: instance setup, validation, connection recovery, and proxy configuration.
- `dashboard.spec.ts`, `dashboard-shell.spec.ts`, `navigation.spec.ts`: statistics, responsive layout, instance switching, and routing.
- `backups.spec.ts`, `experimental-features.spec.ts`: dumps, snapshots, and experimental feature configuration.
- `indexes.spec.ts`, `index-detail.spec.ts`: index listing, creation, details, settings, and destructive operations.
- `documents.spec.ts`: document navigation, search, filters, views, editing, import, and export.
- `keys.spec.ts`, `tasks.spec.ts`: API key management and task management/polling.
- `search-rules.spec.ts`: availability gates, rule editing, conditions, and actions.
- `color-mode.spec.ts`: persisted color-mode switching.

Keep feature-specific accessibility, responsive layout, and theme checks alongside that feature. Shared fixtures live in `fixtures/`; `@cross-browser` marks the smaller Firefox and WebKit smoke subset.

Run one feature against an existing production build:

```bash
npx playwright test e2e/documents.spec.ts --project=chromium
```

## Running the suite

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

The fixture instance is stored under the existing `meilisearch-instances` and `meilisearch-current-id` local-storage keys. The suite starts an isolated preview at `http://127.0.0.1:3100`; requests use its same-origin `/__meili` host and are fulfilled by `e2e/fixtures/meilisearch.ts`.
