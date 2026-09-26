# Nuxt UI 4.11 Frontend Migration Handoff

## Purpose

This document is the source of truth for migrating Meilisearch Manager from PrimeVue 4 to Nuxt UI 4.11 for the v2 release.

It is written so a new agent session can take over any phase without relying on previous conversation history. An agent should read this entire document, inspect the current repository state, identify the first incomplete phase, and complete only a coherent, reviewable slice unless instructed otherwise.

Update the phase ledger and relevant notes in this document as work is completed. Do not mark a phase complete until its implementation and verification requirements pass.

## Primary Goal

Replace PrimeVue with Nuxt UI 4.11 and Tailwind CSS while preserving the application's current behavior. Adopt Nuxt UI's dashboard components to provide a persistent, responsive sidebar layout and a consistent updated visual system.

The UI migration is v2 step one. The following product features are explicitly deferred until after the component-library migration:

- Search-rule filter conditions from the newer Meilisearch search-rules API.
- Raw search requests.
- Facet-filtering behavior improvements.
- Other search behavior or API payload changes.

Do not combine those features with this migration, even when editing the related pages.

## Current Repository Snapshot

This snapshot describes the repository before migration work began. Always verify it against the working tree because later sessions may have changed it.

- Workspace root: `/workspace`
- Application framework: Nuxt 4, Vue 3, TypeScript
- Rendering mode: client-only SPA (`ssr: false`)
- Package manager: npm with `package-lock.json`
- Current branch at initial planning: `feature/new-frontend`
- Behavioral reference: `master` / `origin/master`
- The feature branch initially had no committed divergence from `master`.
- Current UI library: PrimeVue 4.5.4 with Aura theme
- Target UI library: Nuxt UI 4.11
- Tailwind CSS: version 4, already installed
- State: Pinia
- Validation: Zod
- Icons: `@lucide/vue`, heavily used
- Important integrations: Meilisearch JS, Chart.js, MapLibre, JSON editors, PapaParse
- Existing automated tests at initial planning: none
- Existing CI gates: ESLint and Nuxt typecheck
- OpenCode MCP servers at initial planning: Nuxt, PrimeVue, and Nuxt UI

The working tree may contain user changes. Never discard, reset, or overwrite unrelated changes. Read `git status` before editing and work around changes that are not part of this migration.

## Required Agent Workflow

Every implementation session must follow this sequence:

1. Read this document completely.
2. Run `git status --short` and inspect the current diff without reverting unrelated work.
3. Confirm which phase and slice are being attempted.
4. Inspect all files affected by that slice before editing.
5. Use the Nuxt UI skill and Nuxt UI MCP for current component APIs. Do not guess props, slots, events, or theme slot names.
6. Preserve current business logic and Meilisearch request payloads unless this document explicitly permits a change.
7. Make the smallest coherent change that leaves the application buildable.
8. Run the phase's verification commands and relevant browser checks.
9. Update this document's phase ledger and notes with completed work, verification results, and known follow-ups.
10. Summarize changed files, preserved behavior, tests run, and remaining risks in the final response.

When inspecting Nuxt UI component styling, use generated theme files under `.nuxt/ui/<component>.ts` after Nuxt preparation. Prefer semantic Nuxt UI colors and component variants over one-off slot overrides.

## Non-Negotiable Constraints

- Do not wipe and rebuild all pages at once.
- Do not remove PrimeVue before all dependent pages and services have migrated.
- PrimeVue and Nuxt UI may coexist temporarily.
- Do not rewrite Meilisearch domain composables merely because their templates are changing.
- Do not change endpoint selection, request payloads, task polling, pagination semantics, stored keys, redirects, or error behavior without an explicit task.
- Do not add compatibility layers for hypothetical consumers.
- Do not build a generic abstraction until at least two real migrated use cases demonstrate it is useful.
- Do not introduce the deferred v2 search features during this migration.
- Do not use raw Tailwind palette colors for normal Nuxt UI application theming. Use semantic classes such as `text-muted`, `bg-elevated`, and `border-default`.
- Keep the root wrapped in `UApp` after Nuxt UI is introduced.
- Preserve desktop and mobile behavior.
- Preserve light, dark, and system color-mode behavior unless a phase deliberately replaces the implementation with Nuxt UI's equivalent.
- Icon-only controls must have accessible names. A tooltip alone is not an accessible name.
- Use `UModal` for destructive confirmation and focused forms, `USlideover` for detail/edit panels, `UPopover` for contextual content, and `UTooltip` only for non-interactive hints.
- Keep one clear solid primary action per view where practical.

## Target UI Architecture

The authenticated application shell should converge on this structure:

```text
UApp
└── NuxtLayout: app
    └── UDashboardGroup
        ├── UDashboardSidebar
        │   ├── header: logo / application identity
        │   ├── default: UNavigationMenu
        │   └── footer: instance and color-mode controls
        └── NuxtPage
            └── UDashboardPanel
                ├── header: UDashboardNavbar
                ├── optional UDashboardToolbar
                └── body: page content, usually within UContainer
```

Recommended shell behavior:

- Collapsible and resizable sidebar on desktop.
- `mode="drawer"` on mobile.
- Stable dashboard storage key, such as `meilisearch-manager-dashboard`.
- `UNavigationMenu` receives the sidebar's collapsed state.
- Instance controls live in the sidebar footer.
- Page actions live in `UDashboardNavbar` or `UDashboardToolbar`.
- Route-based views continue to use URLs rather than local tabs.

## Component Mapping

| PrimeVue/current pattern | Nuxt UI target |
|---|---|
| Menubar / PanelMenu | `UDashboardSidebar` + `UNavigationMenu` |
| Page title section | `UDashboardNavbar` |
| Page filter/action row | `UDashboardToolbar` |
| DataTable / Column | `UTable` with typed `TableColumn<T>[]` |
| Paginator | `UPagination` plus explicit page-size `USelect` |
| Dialog | `UModal` |
| Drawer used for edit/details | `USlideover` (rename the component `*Drawer.vue` → `*Slideover.vue`) |
| Mobile navigation drawer | `UDashboardSidebar mode="drawer"` |
| ConfirmDialog / ConfirmPopup | Shared programmatic confirmation `UModal` via `useOverlay()` |
| Toast service | Nuxt UI `useToast()` |
| Message | `UAlert` |
| Card | `UCard`, only when a bordered container is useful |
| Tag | `UBadge` |
| PrimeVue Form | `UForm` + `UFormField` + existing Zod schema |
| InputText / Password | `UInput` |
| Textarea | `UTextarea` |
| InputNumber | `UInputNumber` |
| Select | `USelect` |
| MultiSelect / searchable selection | `USelectMenu` |
| AutoComplete / free entry selection | `UInputMenu` |
| ToggleSwitch | `USwitch` |
| Checkbox | `UCheckbox` |
| Slider | `USlider` |
| DatePicker | `UInputDate` / `UInputTime` as appropriate |
| FileUpload | `UFileUpload` |
| Tabs for same-page state | `UTabs` |
| Route tabs | Route-based `UNavigationMenu` |
| Menu / action popup | `UDropdownMenu` |
| Popover | `UPopover` |
| Tooltip directive | `UTooltip` |
| Skeleton | `USkeleton` |
| ProgressSpinner | Button loading state or `UProgress` |
| MeterGroup | `UProgressGroup` |

### Component naming convention

Component file names follow the Nuxt UI target component, not the PrimeVue origin. When a PrimeVue `Drawer` component is migrated to `USlideover`, rename the component file and every reference from `*Drawer.vue` to `*Slideover.vue` in the same change (applied first to the Phase 7 key slideovers). Keep `*Modal.vue` names for `UModal` migrations. Rename the page-local open-state refs (for example `keyDetailsSlideoverOpen`) for coherence, and record the rename in the phase's handoff notes.

## Reuse Inventory

### Preserve essentially as-is

- `app/components/Container.vue`, if still useful after dashboard adoption
- `app/components/ThemedJsonEditor.vue`
- `app/components/ThemedJsonViewer.vue`
- `app/composables/useAppColorMode.ts`, until deliberately replaced
- Meilisearch server routes and proxy behavior
- Public logo and MapLibre style assets
- Most formatting and data utilities

### Preserve logic, replace presentation

- `app/components/meilisearch/DocumentsGeoMap.vue`
- `app/components/meilisearch/FieldDistributionChart.vue`
- `app/components/meilisearch/FilterDocumentsDrawer.vue`
- `app/components/meilisearch/ImportDocumentsDrawer.vue`
- `app/components/meilisearch/SearchRuleForm.vue`
- `app/components/meilisearch/SearchRuleConditionModal.vue`
- `app/components/meilisearch/SearchRuleActionModal.vue`
- Key, task, document, and index edit/detail overlays

### Remove after replacement

- `app/components/router-link-menus/Menu.vue`
- `app/components/router-link-menus/Menubar.vue`
- `app/components/router-link-menus/PanelMenu.vue`
- `app/components/router-link-menus/Breadcrumb.vue`
- `app/components/PopupMenuButton.vue`
- `app/components/AppToast.vue`
- `app/theme/theme-preset.ts`
- `app/theme/global-pt.ts`
- Prime-only types and utilities
- `app/components/meilisearch/DocumentHitCard.vue`, if a final usage search confirms it remains unused

## Table Migration Rules

`UTable` is built on TanStack Table. PrimeVue `Column` templates do not translate directly.

- Define columns as typed `TableColumn<T>[]` values.
- Use explicit IDs for action and computed columns.
- Prefer named `#<column-id>-cell` slots for complex cells.
- Use `row.original` for the original record.
- Keep server pagination in existing application composables.
- Use `UPagination` separately from `UTable`.
- `UPagination` uses one-based pages, matching the application's existing `currentPage` convention.
- TanStack internal `pageIndex` is zero-based if its pagination state is used. Do not mix the two without explicit conversion.
- Do not add `getPaginationRowModel()` to remotely paginated tables unless client pagination is actually desired.
- Configure manual server sorting/filtering before binding controlled state, or the current server page may be sorted/filtered again locally.
- Use stable `getRowId` values for selection across remote pages or refreshed data.
- Set explicit widths before pinning action columns.
- Treat page-size changes as page reset to page 1.
- Preserve page clamping when the total shrinks.
- Preserve the existing 20/50/100 options unless a page currently uses another set.
- Tables need explicit loading, empty, and error presentation.

Do not create a universal table wrapper in the first table migration. Establish patterns in the index list, then extract only genuinely repeated behavior.

## Feedback and Confirmation Architecture

PrimeVue currently leaks into the Pinia store and Meilisearch composables through `useToast()` and `useConfirm()`.

Use Nuxt UI's feedback service directly and introduce one application-owned confirmation interface before migrating complex pages:

- Nuxt UI `useToast()` is available through the root `UApp`; stores and composables call it directly with semantic colors.
- `useConfirmAction()` opens a shared confirmation modal through Nuxt UI `useOverlay()` and resolves a promise or callback.

The confirmation wrapper should remain small and must not recreate PrimeVue's confirmation API. Do not wrap Nuxt UI `useToast()` without a demonstrated application-specific need.

Map notification concepts consistently:

| Intent | Nuxt UI color |
|---|---|
| Success | `success` |
| Failure | `error` |
| Warning | `warning` |
| Informational | `info` |

Persistent information requiring action belongs in `UAlert`, not a toast.

## Testing Strategy

Playwright MCP is for agent-assisted browser exploration. It does not replace committed Playwright tests.

The migration should add both:

- `@playwright/test` and committed tests for CI/repeatability.
- Playwright MCP in `opencode.json` for implementation-time browser inspection.

Recommended OpenCode configuration:

```json
"playwright": {
    "type": "local",
    "command": ["npx", "-y", "@playwright/mcp"],
    "enabled": true
}
```

OpenCode must be restarted after changing `opencode.json` because configuration is not hot-reloaded.

Use a hybrid test strategy:

- A seeded real Meilisearch instance for primary happy paths and payload fidelity.
- Playwright request interception for old-version gating, disabled experimental features, errors, timeouts, and race conditions.
- Accessible roles and names as selectors by default.
- Add `data-testid` only when there is no stable user-facing selector.
- Chromium as the blocking browser.
- Firefox and WebKit for a smaller smoke suite.
- Representative viewports: 375x812, 768x1024, and 1440x900.
- Light and dark visual coverage.

Current screenshots should be reference material for content and behavior, not strict visual baselines. Approve new screenshot baselines after each Nuxt UI view is reviewed.

## Phase Ledger

Update statuses as the migration proceeds. Use `[ ]` for not started, `[~]` for in progress, and `[x]` for complete.

- [x] Phase 0: Characterization tests and migration harness
- [x] Phase 1: Nuxt UI foundation and design system
- [x] Phase 2: Feedback, confirmation, and pagination decoupling
- [x] Phase 3: Dashboard application shell
- [x] Phase 4: Connection and low-complexity pages
- [x] Phase 5: Index list and canonical table pattern
- [x] Phase 6: Index detail, stats, settings, and danger zone
- [x] Phase 7: API keys
- [x] Phase 8: Tasks
- [x] Phase 9A: Documents core search and views
- [x] Phase 9B: Documents filters, geo, hybrid, import, and export
- [x] Phase 10: Search rules
- [~] Phase 11: PrimeVue removal and final hardening

## TODO:
- [x] Task polling timeout guidance, 3-second initial toast delay, and per-task cancellation action.
- [x] Replace fixed corner-radius classes with the Nuxt UI `--ui-radius` token; retain `rounded-full` for circular controls and indicators.
- [x] Normalize fractional/odd flex gaps to even spacing utilities where the layout permits.
- [x] Rename `AppTablePagination` to `AppPagination` and update all consumers.
- [x] Try an alternate table View-link treatment; index list now uses `subtle`.
- [x] Separate hybrid-search enabled state from configuration; configure/reopen without toggling off.
- [x] Make dashboard navbar Refresh controls icon-only ghost buttons with accessible names.
- [x] Move named application-owned types into `app/types/index.d.ts`.
- [x] Keep invalid settings JSON in an editable draft, show a syntax error, block save, and preserve the full parsed settings payload on valid save.
- [x] Treat canceled tasks as a non-success result in all mutation callers; only run success callbacks, navigation, modal close/import events, and list refreshes after a succeeded task.
- [x] Use a soft `View` button for task rows, matching the index table action treatment.


### Follow-up completion notes (2026-09-25)

- Task polling now waits three seconds before its first status check, offers a `Cancel task` toast action bound to that invocation's task UID, and continues polling until the server reports a terminal status. A cancellation request is a warning toast; confirmed cancellation is an informational toast and does not enter the generic error handling path. Cancellation request failures surface a separate error toast. Exhausting the polling attempts adds a warning toast with an `Open Tasks` action and resolves as an unknown/incomplete outcome, avoiding a duplicate generic error toast. The delay applies only to client-side status polling: cancellation requests are sent immediately on click, and Meilisearch processes cancellation as a separate task (so a target may finish before cancellation is applied). E2E covers request UID, cancellation failure, terminal cancellation, and timeout guidance.
- Task mutation consumers now gate success-only follow-up work on `status === 'succeeded'`. Task deletion returns its polled task result rather than its initial enqueued response, so a canceled deletion does not trigger the list refresh path as if it succeeded. Canceled create-index, import/update document, settings, primary-key, search-rule, and destructive-operation flows do not emit completion events, navigate away, or run success callbacks.
- Task rows now use a neutral soft `View` button with a trailing arrow, matching the index table's view action while preserving opening the task details slideover and keyboard focus return.
- Settings editing now keeps text in a separate string draft. Invalid JSON remains visible/editable, displays inline feedback, and disables Save; Cancel restores the server baseline. Valid JSON is parsed and sent as the full settings payload. Added regression coverage for malformed input and recovery/cancel behavior.
- Hybrid search has an `Enabled` switch in its modal. Applying configuration commits enablement, embedder, and semantic ratio; reopening retains configuration; cancel leaves the current search unchanged; disabled search omits the hybrid request parameter. Desktop/mobile controls open configuration without toggling it.
- Renamed the shared pagination component and updated all five consumers. Navbar refreshes are icon-only ghost controls with `aria-label="Refresh"`. The index table View action uses the subtle variant.
- Replaced fixed rounded-corner utilities with `rounded-[var(--ui-radius)]`; retained fully circular status indicators, map markers, and floating controls. Normalized fractional/odd flex gaps to even increments where used.
- Moved named application-owned type declarations from stores, composables, utilities, page scripts, and component scripts to `app/types/index.d.ts`.
- Restored the index-management route to `/edit` and updated the Phase 6 primary-key E2E test accordingly.
- Verification for the follow-up: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `git diff --check`, and the complete Chromium suite passed (66 tests). Playwright used port 3101 because port 3100 was already occupied. This completes the TODO list; Phase 11 remains in progress for its separate cross-browser, accessibility, visual, deployment, and final-definition-of-done checks.

## Phase 0: Characterization Tests and Migration Harness

### Objective

Create a safety net around current behavior before replacing shared UI infrastructure.

### Tasks

1. Add `@playwright/test` as a development dependency.
2. Add Playwright configuration, scripts, and a focused E2E directory.
3. Configure a web server suitable for local tests.
4. Document or automate a deterministic Meilisearch fixture.
5. Add Playwright MCP to `opencode.json` if it is not present.
6. Add baseline smoke tests that rely on user-visible behavior rather than PrimeVue DOM classes.
7. Add build to PR CI if practical in this phase.
8. Ensure test artifacts such as traces and screenshots are ignored appropriately.

### Minimum smoke coverage

- No configured instance redirects to `/new-instance`.
- A valid instance can be added and selected.
- Every top-level route can be reached from navigation.
- Index list loads and an index can be opened.
- Documents can be searched and paginated.
- Tasks can be filtered and task details opened.
- Keys can be listed and key details opened.
- Search-rules availability is gated correctly.
- Color mode can be changed.
- Representative modal/drawer interactions can be opened and closed with the keyboard.

### Acceptance criteria

- Tests can run from a documented npm command.
- Tests do not depend on PrimeVue class names.
- Fixture setup is repeatable.
- Chromium smoke tests pass against the existing UI.
- OpenCode configuration remains schema-valid.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

Record fixture credentials, startup commands, and any intentionally deferred coverage here.

- Completed 2026-09-17. Playwright is configured in `playwright.config.ts`; `npm run test:e2e` builds the production application, starts an isolated `nuxt preview` on `127.0.0.1:3100`, and runs the blocking Chromium project. Use `npm run dev:traefik` for the development server exposed through Traefik at `http://meilisearch-manager.localhost` on port 3000.
- The deterministic fixture lives in `e2e/fixtures/meilisearch.ts` and intercepts the real Meilisearch JavaScript client's requests. It requires no external Meilisearch process. Its instance is `Playwright Instance` at `http://127.0.0.1:3000/__meili` with API key `playwright-key`; values are test-only and never leave the intercepted browser context.
- Committed smoke coverage includes empty-instance redirect, connection setup and persistence, every top-level navigation route, index opening, document search and pagination payloads, task filtering/details, key details, supported and unsupported search-rule gates, color mode, and keyboard dismissal of a modal and drawer.
- Firefox and WebKit projects run only tests tagged `@cross-browser` through `npm run test:e2e:cross-browser`. Browser binaries were not installed or run in this session; Chromium remains the Phase 0 blocking browser as specified.
- CI now runs non-mutating ESLint, typecheck, production build, installs Chromium with system dependencies, and runs the Chromium smoke suite.
- Playwright artifacts are ignored. The Playwright MCP entry was added to `opencode.json` and validated with `opencode debug config`; restart OpenCode before expecting the new MCP server in an existing session.
- Verification passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `npm run test:e2e` (10 passed), and `opencode debug config`.

## Phase 1: Nuxt UI Foundation and Design System

### Objective

Install Nuxt UI 4.11 alongside PrimeVue and establish the root providers and theme without migrating complex pages.

### Tasks

1. Install and pin Nuxt UI 4.11.
2. Install the local Lucide Iconify collection for reliable icon loading.
3. Register `@nuxt/ui` in `nuxt.config.ts`.
4. Review duplicate `@nuxt/fonts` and color-mode registration because Nuxt UI auto-registers integrations unless disabled.
5. Update `app/assets/css/main.css` to import `@nuxt/ui` after Tailwind.
6. Wrap the application in `UApp`.
7. Add `app.config.ts` for brand colors, neutral palette, and global icon defaults.
8. Retain the Meilisearch purple palette as the primary brand palette.
9. Introduce Nuxt UI semantic page/background/text/border tokens.
10. Keep Prime theme configuration temporarily for unmigrated pages.
11. Ensure JSON editor and MapLibre global styles still load.

Suggested installation command, after verifying the requested package version exists and peer dependencies are compatible:

```bash
npm install @nuxt/ui@4.11.0 @iconify-json/lucide
```

### Design-system rules

- Use `primary` for brand and primary actions.
- Use `neutral` for navigation, chrome, and secondary actions.
- Use `success`, `warning`, `error`, and `info` by meaning.
- Use semantic utilities such as `text-default`, `text-muted`, `bg-default`, `bg-elevated`, `border-default`, and `border-muted`.
- Avoid copying the Aura theme. Preserve brand identity, not implementation details.
- Prefer component variants and global defaults over widespread `ui` slot overrides.

### Acceptance criteria

- Nuxt UI and PrimeVue can render in the same application during migration.
- `UApp` wraps the active application tree.
- A Nuxt UI button, alert, modal, toast, and icon can be exercised without runtime errors.
- Existing PrimeVue pages continue to function.
- Light and dark modes remain usable.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
NUXT_PUBLIC_STATIC_DEPLOY=true npm run generate
```

### Handoff notes

- Completed 2026-09-17. Added exact `@nuxt/ui` 4.11.0, local `@iconify-json/lucide`, and Tailwind CSS 4.3.3 dependencies while retaining PrimeVue for unmigrated views.
- Registered `@nuxt/ui`, removed the duplicate manual Tailwind Vite plugin, and disabled Nuxt UI's automatic font and color-mode integrations. The existing explicit `@nuxt/fonts` module and VueUse `.dark` controller remain authoritative.
- PrimeVue's auto-imported `useToast` is excluded to avoid colliding with Nuxt UI's composable; existing PrimeVue toast imports, toast renderer, confirmation provider, Aura-derived theme, global pass-through configuration, and `tailwindcss-primeui` remain in place.
- `UApp` now wraps the active application tree. Nuxt UI's toast, tooltip, icon, and overlay providers are mounted without replacing current PrimeVue feedback behavior.
- `app/app.config.ts` assigns the existing `meili` purple palette to `primary`, uses `slate` as the neutral palette, defines semantic status colors, and pins global Lucide icon defaults. The body and loading indicator now use Nuxt UI semantic tokens.
- Global MapLibre, JSON viewer, and dark JSON editor styles remain loaded. Existing PrimeVue routes passed the Chromium characterization suite in light mode, and the color-mode test switched the application to dark mode successfully.
- Verification passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `NUXT_PUBLIC_STATIC_DEPLOY=true npm run generate`, and `npm run test:e2e` (10 passed).
- `npm audit --omit=dev` reports 10 transitive advisories, including the existing unfixable critical `nuxt-maplibre`/`maplibre-gl` chain. Dependency remediation was not mixed into this UI foundation phase.

## Phase 2: Feedback, Confirmation, and Pagination Decoupling

### Objective

Remove PrimeVue service and event-type dependencies from stores and domain composables before migrating page templates.

### Primary files

- `app/stores/meilisearch.ts`
- `app/composables/usePagination.ts`
- `app/composables/meilisearch/*.ts`
- Shared confirmation modal and composable created in this phase

### Tasks

1. Replace PrimeVue toast calls with Nuxt UI `useToast()` directly.
2. Implement one reusable destructive confirmation modal.
3. Implement `useConfirmAction()` with Nuxt UI `useOverlay()`.
4. Replace PrimeVue toast imports in stores and Meilisearch composables.
5. Replace PrimeVue confirmation calls without changing when actions run.
6. Replace PrimeVue pagination event types with an application-owned event or direct `page`/`pageSize` methods.
7. Preserve current page reset, offset calculation, scrolling, and total-clamping behavior.
8. Add targeted tests for confirmation and pagination logic where practical.

### Behavioral requirements

- Confirmation cancellation must not invoke the action.
- Confirmation acceptance must support asynchronous callbacks.
- Destructive confirmations must be clearly styled as errors.
- Existing success/error text should remain recognizable.
- Existing toast durations may be normalized, but important error messages must remain visible long enough to read.
- Domain composables must no longer import PrimeVue services when this phase completes.

### Acceptance criteria

- No file under `app/composables/meilisearch/` imports PrimeVue.
- `app/stores/meilisearch.ts` does not import PrimeVue.
- `usePagination.ts` does not expose PrimeVue types.
- Current destructive actions still require confirmation.
- Current task polling and post-action refresh callbacks remain unchanged.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

- Implementation completed 2026-09-18. Stores and domain composables use Nuxt UI `useToast()` directly with semantic colors and matching Lucide icons, readable durations, and native ID-based removal for task-polling notifications. Pending tasks use a reduced-motion-safe spinning loader because the toast progress API only represents remaining duration and cannot be indeterminate. No application toast wrapper is needed because the root `UApp` provides the toast infrastructure.
- Added a reusable destructive `ConfirmActionModal.vue` and promise-based `useConfirmAction()` using Nuxt UI `useOverlay()`. The modal uses `defineModel<boolean>('open')` bound directly to `UModal`'s `v-model:open`; dismissals resolve once as cancellation. Instance, index, document, key, and dynamic search-rule confirmations invoke their existing asynchronous actions only after acceptance.
- Removed PrimeVue service imports from `app/stores/meilisearch.ts` and every file under `app/composables/meilisearch/`. Existing notification text, task polling, refresh callbacks, and post-action navigation remain intact.
- Replaced PrimeVue pagination event types with the application-owned `PaginationEvent`. `paginate()` accepts one-based pages for future `UPagination` migrations, while `handlePageEvent()` preserves the current PrimeVue zero-based adapter, page-size reset to page 1, offset calculation, post-fetch scrolling, and total clamping.
- Added Playwright coverage for destructive confirmation cancellation and accepted asynchronous index deletion, including task polling and post-delete navigation. Extended the deterministic fixture only with the required delete-index and task-status responses.
- Verification passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `npm run test:e2e` (11 passed), and `git diff --check`. Source audits found no PrimeVue imports in the Phase 2 domain/store/pagination targets.
- The development Docker target installs lockfile-pinned Playwright Chromium and its Debian system dependencies, so the unprivileged `node` user can run the Chromium suite without missing-library errors. No implementation tasks are known to remain.

## Phase 3: Dashboard Application Shell

### Objective

Replace the PrimeVue top navigation and mobile drawer with the Nuxt UI dashboard layout.

### Primary files

- `app/layouts/app.vue`
- `app/app.vue`
- `app/composables/useAppLayout.ts`
- `app/types/index.d.ts`
- `app/components/LogoLink.vue`
- Color-mode controls
- Instance switching/removal UI
- Prime-specific router menu wrappers

### Tasks

1. Build `UDashboardGroup` and `UDashboardSidebar` in the app layout.
2. Use `UNavigationMenu` for all primary routes.
3. Convert navigation item types to Nuxt UI's `NavigationMenuItem` or an application-owned domain type.
4. Use Iconify Lucide names where practical.
5. Put instance selection and color-mode controls in the sidebar footer.
6. Support single-instance and multi-instance modes.
7. Use the dashboard sidebar's mobile mode rather than a separate Prime drawer.
8. Preserve dynamic index breadcrumbs.
9. Establish a reusable page panel/navbar pattern.
10. Remove old router-menu wrappers only after no migrated layout path uses them.
11. Remove manual mobile width watchers when Nuxt UI provides the behavior.
12. Re-evaluate scroll-to-top against the panel scroll container.

### Required navigation

- Dashboard
- Indexes
- Tasks
- Keys
- Backups
- Search Rules
- Experimental Features

### Acceptance criteria

- Sidebar is responsive, collapsible, and keyboard accessible.
- Mobile navigation opens and closes correctly and closes after route navigation.
- Active state works for nested index and search-rule routes.
- Current instance name is visible where appropriate.
- Add, switch, and remove instance actions remain available only in multi-instance mode.
- Color mode works in both application modes.
- Breadcrumbs remain correct for index stats, documents, settings, and edit routes.
- Every top-level route remains reachable.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

Perform browser checks at 375, 768, and 1440 pixel widths in light and dark modes.

### Handoff notes

- Completed 2026-09-18. The app layout now uses `UDashboardGroup`, a local-persisted, resizable `UDashboardSidebar`, `UNavigationMenu`, `UDashboardPanel`, `UDashboardNavbar`, and `UBreadcrumb`. The dashboard owns scrolling through `#app-scroll-container`, and pagination/task infinite scrolling use that container when it exists.
- Navigation uses Nuxt UI menu types and Iconify Lucide icons. Explicit active state keeps Indexes and Search Rules highlighted on nested routes. The sidebar supports responsive drawer behavior without manual width watchers and includes instance actions in multi-instance mode only.
- Instance switching uses `UDropdownMenu` and `UModal`/`USelect`; the new fixture also intercepts proxy-mode `/api/meilisearch/**` calls. The shell remains available in proxy mode without instance-management controls.
- Nuxt UI automatic color mode is authoritative: legacy VueUse controller/plugins and Prime color-mode controls were removed, `ui.colorMode: false` was removed, `UColorModeSelect` is used in the sidebar footer, and JSON/map/chart consumers use Nuxt `useColorMode()`.
- PrimeVue remains intentionally mounted for unmigrated routes, including `AppToast`, `ConfirmDialog`, `router-link-menus/Menu.vue`, and shared Prime menu types. Removed router wrappers were only used by the replaced shell.
- Added dashboard E2E coverage for 375px keyboard navigation, 768px dark-mode panel scrolling/no horizontal overflow, 1440px nested active state and breadcrumbs, multi-instance switching, and proxy-mode behavior. Verification passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `npm run test:e2e` (16 passed), and `git diff --check`.

## Phase 4: Connection and Low-Complexity Pages

### Objective

Establish canonical Nuxt UI patterns for forms, cards, tabs, alerts, switches, skeletons, and simple page actions.

### Page order

1. `/connection-error`
2. `/new-instance`
3. `/dashboard`
4. `/backups`
5. `/experimental-features`

### Tasks

1. Convert pages to `UDashboardPanel` where they use the app layout.
2. Use `UDashboardNavbar` for titles and primary page actions.
3. Use `UDashboardToolbar` only when there are genuine filters or secondary controls.
4. Port the new-instance form to `UForm`, `UFormField`, and the existing Zod schema.
5. Port dashboard statistics to semantic Nuxt UI presentation.
6. Port backups to `UTabs` and `UCard` or simpler sections.
7. Port experimental feature controls to `USwitch`.
8. Ensure loading, empty, and error states are explicit.
9. Remove Prime references from each page and its migrated child components.

### Behavioral requirements

- New instance requires name, host, and API key.
- Duplicate hosts remain rejected.
- Host health check runs before persistence.
- Credentials and selected instance use the existing local-storage keys.
- Successful setup routes to `/dashboard`.
- Proxy mode continues to bypass instance setup.
- Dashboard refetches when the current instance changes.
- Dump and snapshot actions preserve task polling.
- Experimental features submit every returned feature key.

### Acceptance criteria

- No PrimeVue references remain in these pages or their migrated children.
- Form validation is visible and focuses or scrolls to the first invalid field when appropriate.
- Dashboard is usable from mobile through desktop.
- Backups and experimental features preserve API payloads.
- Playwright covers connection setup and representative actions.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

- Completed 2026-09-19. Connection error, new-instance setup, dashboard, backups, and experimental-feature pages now use Nuxt UI components with no PrimeVue references in the migrated pages.
- Phase 4 routes own their `UDashboardPanel` through `AppDashboardPanel`. Breadcrumbs intentionally provide navbar identity instead of duplicate page titles, and page bodies own native scrolling so the scrollbar remains flush with the panel edge. Legacy routes retain the layout-owned panel until migrated.
- New-instance setup uses `UForm`, `UFormField`, the existing Zod schema, first-invalid-field focus, and the existing persistence and health-check flow. Proxy-mode bypass and duplicate-host rejection remain covered.
- Dashboard statistics use stock subtle `UPageCard` components in `UPageGrid`. Backups use `UTabs` and preserve distinct dump/snapshot task polling; experimental features use `USwitch` and continue submitting every returned feature key.
- The backups nested route is the canonical child-action pattern: its parent route owns `AppDashboardPanel`, route navigation, and the generic `#sub-page-actions` navbar outlet. Each child teleports its stateful primary action into that outlet, so action controls remain outside the scroll body and are replaced on sub-route navigation. Reuse this pattern for later nested route families rather than adding a sub-layout.
- External documentation links use Nuxt UI's NavigationMenu external-link treatment: `i-lucide-arrow-up-right` at `size-3 text-dimmed`.
- Added Phase 4 fixture support and Playwright coverage for setup validation, duplicate hosts, connection retry, proxy mode, dashboard refresh, backup endpoints/task polling, experimental-feature payloads, responsive sidebar behavior, and flush panel scrolling.
- Verification passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `npm run test:e2e` (23 passed), and `git diff --check`.

## Phase 5: Index List and Canonical Table Pattern

### Objective

Create the reference implementation for server-backed Nuxt UI tables and pagination.

### Primary files

- `app/pages/indexes/index.vue`
- `app/components/meilisearch/CreateIndexModal.vue`
- `app/composables/meilisearch/useIndexes.ts`
- `app/composables/usePagination.ts`
- Shared refresh, empty-state, and pagination controls as needed

### Tasks

1. Replace Prime DataTable with typed `UTable` columns.
2. Keep remote pagination outside the table.
3. Add `UPagination` and page-size selection.
4. Preserve loading, empty, and total-report states.
5. Port create-index UI to `UModal` and Nuxt UI form controls.
6. Use a dedicated action column with an explicit ID.
7. Preserve document-count enrichment from instance stats.
8. Verify scrolling and page reset after changing page size.
9. Document the resulting table pattern in code only where it is not self-explanatory.

### Behavioral requirements

- Page sizes remain 20, 50, and 100.
- UID, primary key, document count, created date, and updated date remain visible.
- Primary key displays a semantic badge or a clear “Not set” state.
- Creating an index supports an optional primary key.
- Enqueued create task is polled before refreshing the list.
- Current page clamps when the total shrinks.

### Acceptance criteria

- Index table does not client-paginate the already paginated response.
- Pagination request offsets match the old implementation.
- The action column remains usable on narrow screens.
- No PrimeVue dependency remains in the migrated files.
- This page serves as the reference for later keys and search-rules tables.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

- Completed 2026-09-19. The indexes route now owns an `AppDashboardPanel` and implements the canonical remote-table pattern with typed `TableColumn<IndexRow>[]`, stable UID row IDs, a fixed-width right-pinned action column, external `UPagination`, and an explicit 20/50/100 `USelect` page-size control. `UTable` only renders the server response; it has no client pagination configuration.
- `AppTablePagination` now provides the reusable Nuxt UI footer layout: a labelled page-size `USelect` in a `UFieldGroup` and an externally controlled `UPagination`. Pages keep remote-fetch callbacks local, while `usePagination()` derives the normalized total and result summary from an optional total getter.
- Index loading, empty, error, and total-report states are explicit. Document counts continue to be enriched from instance statistics, primary keys use semantic badges with a `Not set` state, and pagination preserves offset calculation, page-size reset, panel scrolling, and total-shrink clamping.
- `AppDashboardPanel` constrains its body as the sole vertical scroll viewport. The index card does not shrink, `UTable` retains only local horizontal overflow, and pagination returns the dashboard body to its top after a remote page change.
- `CreateIndexModal.vue` now uses `UModal`, `UForm`, `UFormField`, and `UInput` with Zod UID validation, returned focus for invalid fields, visible server errors, and programmatic form submission from the modal footer. Empty primary keys are omitted from the create request; the modal closes as soon as the create task is enqueued, while the list/statistics refresh only after the task completes.
- `useIndexes()` now exposes the one-based `paginate()` interface used by Nuxt UI controls. The PrimeVue `handlePageEvent()` adapter and legacy first-record index remain available in `usePagination()` for future unmigrated pages, but are no longer exposed by the index composable.
- The deterministic fixture now supports indexed datasets, query-based index pagination, dynamic total changes, and stateful index creation. Added Phase 5 Playwright coverage for offsets, page-size reset, total clamping, optional-primary-key payloads, task-polled creation, validation focus, and a 375px pinned action/no-overflow check.
- Corrected stale E2E routes introduced by the Phase 4 backup route split: navigation now targets `/backups/dumps`, and the backup smoke test targets the distinct dumps and snapshots routes.
- Verification passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `npm run test:e2e` (28 passed), and `git diff --check`.

## Phase 6: Index Detail, Stats, Settings, and Danger Zone

### Objective

Migrate the nested index shell and all index pages except documents.

### Page order

1. `app/pages/indexes/[uid].vue`
2. `app/components/meilisearch/IndexTabMenu.vue`
3. `app/pages/indexes/[uid]/index.vue`
4. `app/components/meilisearch/FieldDistributionChart.vue`
5. `app/pages/indexes/[uid]/settings.vue`
6. `app/pages/indexes/[uid]/edit.vue`
7. Primary-key and danger-zone child components

### Tasks

1. Convert route tabs to Nuxt UI route navigation.
2. Preserve shareable URLs for Stats, Documents, Settings, and Edit.
3. Replace Prime's Chart wrapper while retaining Chart.js data and options.
4. Keep the JSON editor and viewer components.
5. Port settings controls, warning alert, and save/cancel actions.
6. Port primary-key editing.
7. Port delete-all-documents and delete-index confirmations.
8. Preserve task polling and navigation after deletion.

### Behavioral requirements

- Settings initially display read-only.
- Edit enables the JSON editor.
- Cancel restores the original settings.
- Invalid JSON cannot be submitted.
- Save sends the full settings payload and waits for the task.
- Primary-key constraints remain unchanged.
- Index deletion returns to the dashboard.
- Delete-all-documents remains distinct from deleting the index.

### Acceptance criteria

- Chart renders in light and dark modes.
- JSON editor theme follows color mode.
- Route tabs are keyboard accessible and preserve active state.
- Destructive operations use the shared confirmation pattern.
- No PrimeVue reference remains in this phase's files.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

- Do not modify index sub-pages while completing the backups pattern. When Phase 6 begins, make `app/pages/indexes/[uid].vue` the nested shell with the same `#sub-page-actions` action outlet, dashboard toolbar route navigation, and child-owned teleported actions.
- Completed 2026-09-19. The index family now owns `AppDashboardPanel`, dynamic index breadcrumbs, a `UDashboardToolbar`, and typed `UNavigationMenu` route navigation for Stats, Documents, Settings, and Edit. The Documents page remains otherwise unmigrated for Phase 9, with only its navbar action teleport moved to the shared `#sub-page-actions` outlet.
- Stats uses Nuxt UI alerts, skeletons, page cards, and a direct navbar refresh button. `FieldDistributionChart.vue` now manages a Chart.js doughnut canvas lifecycle directly, rebuilding safely for data and color-mode changes and providing an accessible empty/chart state.
- Settings remains read-only initially, keeps the existing themed JSON editor, and moves Edit/Cancel/Save to the navbar outlet. It now refreshes on UID changes, maintains a cloned server baseline for cancellation, waits for settings task polling before returning to read-only mode, and preserves the full settings payload unchanged.
- The Edit page owns its card layouts: the primary-key form is in the card body with its task-aware submit action in the card footer, while the danger warning is in the delete-card body and its destructive actions are in the footer. Primary-key updates retain the exact `{ primaryKey }` payload; delete-all-documents and delete-index retain their distinct confirmations, endpoints, task polling, and post-delete navigation. The obsolete `DeleteIndexDataDangerZone.vue` wrapper was removed.
- Extended the deterministic fixture with stateful index settings and primary-key updates plus delete-all-documents support. Added `e2e/phase6-index-detail.spec.ts` for nested navigation/chart coverage, full settings payload/task coverage, and primary-key/delete-all behavior.
- Verification passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `npm run test:e2e` (31 passed), and `git diff --check`. Source audits found no PrimeVue references in Phase 6 files; PrimeVue remains intentionally in the deferred Documents page.

## Phase 7: API Keys

### Objective

Migrate the keys table and create, edit, and detail overlays.

### Primary files

- `app/pages/keys.vue`
- `app/components/meilisearch/CreateKeyDrawer.vue`
- `app/components/meilisearch/EditKeyDrawer.vue`
- `app/components/meilisearch/KeyDetailsDrawer.vue`
- `app/composables/meilisearch/useKeys.ts`

### Tasks

1. Apply the canonical remote table pattern.
2. Use `USlideover` for create, edit, and details.
3. Use `UDropdownMenu` for row actions.
4. Preserve key masking, reveal, and copy behavior.
5. Add accessible names to icon-only controls.
6. Correct stale label `for`/input `id` mismatches while porting.
7. Preserve wildcard index/action normalization.
8. Preserve immutable fields in edit mode.
9. Use shared destructive confirmation for deletion.
10. Correct the page title from `Tasks` to `Keys` if still present, and note this as an intentional defect fix.

### Behavioral requirements

- Pagination remains server-backed.
- Keys are masked by default.
- Copy provides success feedback.
- Create supports optional UID, name, description, expiry, indexes, and actions.
- “All indexes” and “all actions” continue to map to `['*']`.
- Arbitrary action strings remain accepted and deduplicated.
- Edit changes only fields supported by the server.
- Expired status and timestamps remain visible in details.

### Acceptance criteria

- All key flows work by keyboard.
- Focus returns to the initiating control after closing an overlay.
- API payloads match baseline behavior.
- No PrimeVue dependency remains in the migrated files.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

- Completed 2026-09-20. The keys page now follows the Phase 5 canonical remote-table pattern: `AppDashboardPanel`, typed `TableColumn<Key>[]` with stable UID row IDs, right-pinned fixed-width row-action column (`id: 'actions'`, 80px, icon-only `UDropdownMenu` trigger with the accessible name "Show key actions"), external `AppTablePagination`, and explicit loading/empty/error states with retry.
- This is the first `USlideover` family; Phase 8 (task details) should reuse it. During review the components were renamed to the Nuxt UI target naming (`CreateKeySlideover.vue`, `EditKeySlideover.vue`, `KeyDetailsSlideover.vue`), establishing the `*Drawer.vue` → `*Slideover.vue` convention documented under Component mapping. All three slideovers use `v-model:open`, `sm:max-w-2xl` content width (matching the old 40rem drawers), footer Cancel/Submit buttons, and the key details/edit slideovers stay mounted behind the page's `v-if="currentKey"` + 250ms cleanup watchers.
- Reveal moved out of the table by review decision: table rows show only the masked key plus copy; masked/reveal (eye/eye-off `UButton` with aria-label) exists only in the key details slideover. Not yet a shared component.
- `useKeys()` now exposes the one-based `paginate()` interface with a total getter and `paginationSummary`; `handlePageEvent()`/`firstDatasetIndex` are no longer exposed (only the keys page consumed them). Fetch/create/update/delete payloads and the `confirmDeleteKey()` flow are unchanged.
- Intentional fixes recorded per the document: page meta title corrected from `Tasks` to `Keys`; "THe API Key" delete-toast typo fixed; the details-drawer expired badge now normalizes dates with `new Date()` because the Meilisearch client returns key dates as ISO strings at runtime (the old `expiresAt < today` Date/string comparison never triggered); create/edit forms show visible Zod validation (indexes ≥ 1, actions ≥ 1) and server errors in a `UAlert` (old code swallowed them).
- Component-API findings that future phases must respect: (1) `UFormField` injects a single id to all child controls, so a second form control (e.g. `UCheckbox`) inside the same field collides with the first — keep checkboxes outside the `UFormField`; (2) submit buttons with `form="id"` attributes outside the form element do not trigger `UForm` submission through overlay portals — use the `CreateIndexModal` pattern (`form.value?.submit()` on click); (3) `UInputMenu` multiple mode does not propagate typed text through `v-model:search-term` — free-entry commit must read `event.target.value` from `keydown.enter.prevent`/`blur` (implemented in `CreateKeyDrawer.vue`; typed text remains visible in the input after committing a chip, which is deduplicated and harmless); (4) `USelectMenu` trigger has no useful accessible name without an associated label, and `UInputDate` uses `@internationalized/date` values (`fromDate`/`toDate()`/`today`/`toCalendarDateTime` from the transitive dependency).
- Expiry uses a single `UInputDate` with `granularity="minute"` + 12-hour cycle, min value today, and a `Clear` button; the previous "tomorrow midnight" default display is replicated via `default-value` while the payload stays `null` unless picked. Key create/update/delete are synchronous REST operations in Meilisearch, so no task polling applies.
- Fixture now holds three default keys (normal, `['*']` wildcard admin, expired) with stateful GET pagination, `POST /keys`, `PATCH /keys/:keyOrUid` (matched by uid or key string), and `DELETE /keys/:keyOrUid` (204); keys are deep-cloned per test to avoid cross-test mutation. `e2e/phase7-keys.spec.ts` covers pagination offsets/page-size reset, table masking with details-only reveal, create payload fidelity (empty uid omitted, actions trimmed/deduped, `['*']` mapping), edit limited to name/description, delete confirmation cancel/accept, expired badge, keyboard focus return, mobile pinned column, and dark-mode rendering. `navigation.spec.ts` now asserts `/keys` via breadcrumb with heading `Keys`.
- Verification passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `npm run test:e2e` (41 passed), and `git diff --check`. PrimeVue source audit over the five migrated files returned no matches. Playwright-MCP visual inspection was unavailable in this environment (Chrome channel not installable without root); browser checks relied on the committed Chromium suite including 375px and dark-mode cases.

## Phase 8: Tasks

### Objective

Migrate task filtering, infinite loading, polling, details, and deletion.

### Primary files

- `app/pages/tasks.vue`
- `app/components/meilisearch/TaskDetailsSlideover.vue` (rename of `TaskDetailsDrawer.vue` during this phase)
- `app/components/meilisearch/DeleteTasksModal.vue`
- `app/composables/meilisearch/useTasks.ts`

### Tasks

1. Port filters to a dashboard toolbar using appropriate Nuxt UI selects.
2. Port the table without changing cursor-based infinite loading.
3. Port details to `USlideover`.
4. Port delete filters and confirmation to Nuxt UI.
5. Preserve five-second polling and the persisted polling preference.
6. Preserve stale-response protection and duplicate suppression.
7. Keep limits 20, 50, 100, and 500.
8. Provide explicit loading, loading-more, empty, and error states.

### Behavioral requirements

- Filter by status, type, and index.
- Infinite loading uses the server cursor and does not duplicate tasks.
- Polling preference remains in `meilisearch-tasks-polling-enabled`.
- Task details display the complete task JSON.
- Deletion requires at least one filter and explicit confirmation.
- Mutation task polling handles succeeded, failed, canceled, timed out, and unknown states.
- Older concurrent list responses must not replace newer filter results.

### Acceptance criteria

- Table scrolling and infinite loading work in the dashboard panel's scroll model.
- Polling can be enabled and disabled without duplicate timers.
- Destructive actions cannot run without filters.
- No PrimeVue dependency remains in migrated files.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

- Completed 2026-09-20. The tasks page follows the Phase 5/7 canonical patterns: `AppDashboardPanel`, a `UDashboardToolbar` (wrapping via `:ui="{ root/left/right: 'flex-wrap' }"` for narrow screens) holding three `USelectMenu multiple` filters with `aria-label`s plus the 20/50/100/500 limit `UFieldGroup`/`USelect` and the shared `PollToggle` bound to `meilisearch-tasks-polling-enabled`, typed `TableColumn<Task>[]` with a right-pinned 96px actions column, a labeled "Details" `UButton` per row (no dropdown needed for a single action), and explicit error (`UAlert` + Retry), loading skeleton, empty ("No tasks found"), appending-spinner, and "Scroll to load more tasks" states.
- `TaskDetailsDrawer.vue` was renamed to `TaskDetailsSlideover.vue` per the naming convention (`v-model:visible` → `v-model:open`, `USlideover`, `sm:max-w-4xl` ≈ the old 60rem drawer) and keeps the read-only `ThemedJsonEditor` (text mode) body. The page's open-state ref is now `taskDetailsSlideoverOpen`; the 250ms delayed `currentTask` cleanup and `v-if` + `Teleport to="body"` mount pattern match the keys slideovers.
- `DeleteTasksModal.vue` uses `UModal` with content in `#body` (the UModal default slot is the trigger — putting content there renders it un-chromed in the page flow, intercepting clicks; this was caught by E2E), the shared `useConfirmAction()` as a nested confirmation modal above the filter modal, `canSubmit` requiring at least one filter, and filters written into the shared `deleteTasksQuery` only after confirmation acceptance. The three `USelectMenu` triggers need explicit `aria-label`s because `UFormField` labels do not name SelectMenu triggers (they fall back to the default "Show popup" aria-label, unlike `UInputMenu` inputs).
- `useTasks.ts` required no changes; polling, stale-response protection, duplicate suppression, cursor appends, and delete task polling were preserved verbatim. The page's `useInfiniteScroll` target is now `.app-scroll-container` (legacy selector fallback dropped).
- Intentional deviations: (1) `UTable :loading` uses `isFetchingTasks` only — `isPollingLatest` no longer blanks the table on every 5-second poll; activity remains visible via the PollToggle indicator; (2) filters moved from the DataTable filter row to `UDashboardToolbar`; (3) details slideover width 60rem → 56rem; (4) `e2e/tasks-keys.spec.ts` deleted (its keys case is covered by `phase7-keys.spec.ts`, its tasks case by the new Phase 8 spec); (5) `navigation.spec.ts` now checks `/tasks` identity via breadcrumb like the other migrated routes (no more page heading).
- `getStatusSeverity` was replaced by `getTaskStatusColor` in `app/utils/index.ts` (Prime severity names → Nuxt UI semantic colors; `getRankingScoreSeverity` retained for Phase 9). The Prime-only `RefreshButton.vue` had no remaining users and was removed. `PageTitleSection`/`NotFoundMessage` remain for search-rules/documents.
- Component-API findings for future phases: (1) meilisearch `TasksOrBatchesQuery`/`DeleteOrCancelTasksQuery` filter fields are `OptionStarOrList<T[]>` (they accept `'*'` and nested arrays) and do not type-fit `USelectMenu`'s plain-array model — bind selects to plain `ref<T[]>`s and build the typed query at fetch/submit time (implemented in `tasks.vue` and `DeleteTasksModal.vue`); (2) `USelectMenu` renders its trigger as `role="button"` while `USelect` renders `role="combobox"`; (3) SelectMenu popups portal to `<body>`, so option lookups must not be scoped to the dialog; (4) `UAlert` has no `role="alert"` — assert by visible text; (5) `USelect` numeric values are read back through `@update:model-value` with `Number($event)` (AppTablePagination pattern).
- Fixture: `installMeilisearchMock` now holds a stateful `tasks` dataset (default `[task]` unchanged) with comma-or-repeated `statuses`/`types`/`indexUids` query filtering, `limit`, an inclusive `from` cursor (`next` = first task of the next page, per Meilisearch semantics), and `DELETE /tasks` removing matching tasks and reporting through `onDeleteTasksRequest(request, deletedCount)`. New options: `tasks`, `getTasks`, `onDeleteTasksRequest`.
- `e2e/phase8-tasks.spec.ts` covers filter query params (statuses/types/indexUids/limit), cursor pagination without duplicates (60-task dataset, `from=51`, single row per uid), details slideover JSON/Escape/focus-return, delete flow (disabled until filtered, cancel preserves, accept sends `DELETE /tasks?statuses=…` + deleted-count + success toast + refreshed empty list), polling enable/immediate-poll/interval-tick/disable without duplicate timers, error alert + retry recovery, explicit empty state, and 375px pinned-action/no-overflow checks.
- Verification passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `npm run test:e2e` (47 passed), and `git diff --check`. PrimeVue source audit over the migrated files returned no matches. Playwright-MCP visual inspection remains unavailable in this environment (per the Phase 7 note); browser checks relied on the committed Chromium suite including 375px cases.
- Post-review refinements: filters/limit/polling moved from `UDashboardToolbar` into the tasks `UCard` `#header` (a single wrapping row, limit + `PollToggle` right-aligned via `ms-auto`, wrapping under the filters on narrow screens), and the table adopted the official sticky-header pattern: `UTable sticky` with table-owned vertical scrolling (`:ui="{ root: 'h-full tasks-table-scroll' }"`, card `flex min-h-0 flex-1 flex-col`), so the navbar/toolbar stay fixed and the column header sticks while rows scroll and infinitely load inside the table region. The infinite-scroll target is now `.tasks-table-scroll` (the table root) instead of `.app-scroll-container`; the panel body no longer scrolls on this page, so the floating scroll-to-top button does not appear there. E2E scroll targets updated accordingly.
- The three task filters moved into a shared `AppFiltersPopover.vue` (`UPopover` chrome mirroring `AppPageActions`, stacked labeled `USelectMenu` fields, `w-72` with a `max-w-[calc(100vw-2rem)]` mobile guard). The trigger is a neutral-outline Filter button whose active-filter count renders via `UChip` (`size="3xl"` + `:ui="{ base: 'h-5 min-w-5 px-1.5 text-xs' }"` — stock chip sizes are notification dots, max 12px, too small for a count). The popover footer shows a full-width neutral-soft "Clear filters" button (with `USeparator`) only when `count > 0`; the component emits `clear`, the page resets the filter refs, and clearing intentionally leaves the popover open. Component-API notes: popover Escape after interacting with a nested `USelectMenu` proved unreliable in Chromium (focus returns to the select trigger) — the E2E suite closes the popover by toggling the trigger instead; outside-click dismissal works. This component is the intended second consumer for Phase 10 search-rules filters.

## Phase 9A: Documents Core Search and Views

### Objective

Migrate the main documents page shell, basic search, pagination, and JSON/table views without changing search semantics.

### Primary files

- `app/pages/indexes/[uid]/documents.vue`
- `app/composables/meilisearch/useSearch.ts`
- `app/components/meilisearch/DocumentHitJsonRow.vue`
- Shared document display/action controls

### Tasks

1. Port the page to dashboard navbar and toolbar patterns.
2. Preserve the 300 ms debounced text search.
3. Preserve Enter-to-search.
4. Preserve server pagination and 20/50/100 page sizes.
5. Port JSON and table result views.
6. Port field-detail popovers and image previews.
7. Port ranking-score and ranking-detail toggles without changing request parameters.
8. Port edit and delete actions that are required by these views, or explicitly coordinate them with Phase 9B.
9. Add accessible labels to every icon-only result action.

### Behavioral requirements

- Initial search and index/settings/stat loading remain intact.
- Search resets pagination as before.
- JSON and table views display equivalent data.
- Delete is available only when the index has a primary key.
- Ranking options produce the same Meilisearch search parameters.
- Empty and malformed fields do not break table rendering.

### Acceptance criteria

- Core document browsing works before advanced controls are migrated.
- Search requests match the baseline.
- Large and nested JSON documents remain usable.
- No migrated document component depends on PrimeVue.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

- Completed 2026-09-23. The documents route now uses one shared `UDashboardToolbar`, teleported into the index panel's new `#sub-page-toolbar` header outlet below the index route navigation. Search, estimated hits, standard sort, filter state, hybrid/ranking toggles, and the JSON/Card, Table, and conditional Geo view selector remain mounted while result presentations change. The toolbar wraps at narrow widths and every icon-only toggle/action has an accessible name and pressed state.
- `useSearch()` now exposes the canonical one-based `paginate()` interface and `paginationSummary`; its 300 ms debounce, Enter search, page-size reset, and total clamping remain intact. JSON/Card, Table, and Geo share one result set and one `AppTablePagination` pattern with 20/50/100 sizes. View changes do not issue search requests.
- Post-review pagination update (2026-09-23): document search retains the `master` branch's `offset`/`limit` request semantics, and pagination state remains local to each view. Document search fetches the index's `pagination.maxTotalHits` setting (falling back to Meilisearch's default of 1000), caps its reachable total with `min(estimatedTotalHits, maxTotalHits)`, and clamps the current page before issuing an out-of-range search. The request limit is also capped by `maxTotalHits` when it is smaller than the selected page size. Indexes, keys, and dynamic search rules retain their local reactive pagination.
- JSON hits now use Nuxt UI cards, progress, image popovers, tooltips, and accessible actions. The server-backed table uses typed dynamic `TableColumn<RecordAny>[]`, primary/ranking and action pinning, stable primary-key row IDs when available, field and image `UPopover`s, semantic ranking badges, and a `UDropdownMenu` action column. It performs no client pagination or sorting. Loading, empty, search-error/retry, and pagination states are explicit.
- Edit/delete behavior is available from JSON and table views; delete remains hidden without a primary key and still uses the shared destructive confirmation plus task polling. The unused `DocumentHitCard.vue` was removed after a final usage search.

## Phase 9B: Documents Filters, Geo, Hybrid, Import, and Export

### Objective

Complete the document-management feature without implementing future search improvements.

### Primary files

- `app/components/meilisearch/FilterDocumentsSlideover.vue` (rename of `FilterDocumentsDrawer.vue` during this phase)
- `app/components/meilisearch/HybridSearchModal.vue`
- `app/components/meilisearch/DocumentsGeoMap.vue`
- `app/components/meilisearch/EditDocumentSlideover.vue` (rename of `EditDocumentDrawer.vue` during this phase)
- `app/components/meilisearch/ImportDocumentsSlideover.vue` (rename of `ImportDocumentsDrawer.vue` during this phase)
- `app/components/meilisearch/ExportDocumentsModal.vue`
- `app/composables/meilisearch/useDocuments.ts`
- `app/composables/meilisearch/useExportDocuments.ts`
- `app/composables/meilisearch/useFacetSearch.ts`

### Tasks

1. Port the current filter drawer UI while preserving its expression-building logic.
2. Port standard sorting from sortable attributes.
3. Preserve current facet selection and escaping semantics.
4. Port geo controls, map markers, map popovers, and geo sorting.
5. Port hybrid search modal and embedder selection.
6. Port edit document slideover and deletion.
7. Port JSON/CSV file upload and manual JSON entry.
8. Port JSON/CSV export modal and browser download behavior.
9. Verify light/dark MapLibre style switching.
10. Do not implement raw search or revised facets in this phase.

### Behavioral requirements

- Facet values are ORed within a facet and ANDed between facets.
- Apostrophes remain escaped.
- Geo radius, bounding box, polygon filters, and geo sorting remain available.
- Geo tab appears only when supported data exists.
- `_geo` and GeoJSON points remain supported.
- Hybrid controls appear only when embedders exist.
- Import supports add-or-replace and add-or-update.
- Import supports JSON, CSV, and manual JSON.
- The 100 MB upload limit remains.
- Export uses 1,000-document batches.
- CSV export discovers all columns before writing output.
- Exported filename and extension remain correct.

### Acceptance criteria

- Every existing document-management operation remains functional.
- Map controls work at desktop and mobile sizes.
- Upload controls have clear progress/error/disabled states.
- Downloads are covered by a Playwright assertion on filename and content.
- No PrimeVue dependency remains in document files.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

- Completed 2026-09-23. `FilterDocumentsDrawer.vue`, `EditDocumentDrawer.vue`, and `ImportDocumentsDrawer.vue` were renamed to `FilterDocumentsSlideover.vue`, `EditDocumentSlideover.vue`, and `ImportDocumentsSlideover.vue`; all now use `USlideover` with `v-model:open`. Hybrid and export use `UModal`, file upload uses `UFileUpload`, and every migrated form/control uses Nuxt UI semantic components.
- Filter expression logic was preserved: selected values are ORed within each facet, facets are ANDed together, apostrophes are escaped, and radius/bounding-box/polygon geo filters plus nearest/farthest geo sorting retain their existing Meilisearch expressions. Geo controls remain available only in Geo view and only produce expressions when `_geo` settings support them.
- `DocumentsGeoMap.vue` retains `_geo` and GeoJSON Point parsing, center/bounds behavior, navigation controls, and light/dark MapLibre styles. Marker details now use keyboard-accessible `UPopover` triggers with responsive JSON content. Geo remains conditional on `_geo`/`_geojson` field distribution.
- Hybrid search retains embedder availability gating, composite embedder labeling, semantic ratio, cancel behavior, and the exact `{ embedder, semanticRatio }` request. Import retains add-or-replace/add-or-update, JSON/CSV/manual input, task polling, errors, and the 100 MB limit. Export retains 1,000-document batches, two-pass CSV column discovery, custom/default filenames, and browser download behavior.
- The deterministic fixture now supports configurable document/settings/stats data, ranking responses, facet search, stateful single-document deletion, import endpoints, and batched document reads. `e2e/phase9-documents.spec.ts` covers the shared taskbar, debounce and payloads, request-free view switching, table/ranking/sort/pagination behavior, facet escaping, geo filter/sort expressions, hybrid parameters, marker rendering, edit/delete overlays, import body, export filename/content, and 375px no-overflow behavior. The original document characterization test was updated for the accessible search name and current `/edit` route.
- Verification before the subsequent visual and finite-pagination review fixes passed: `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, focused Phase 9 Chromium tests, and `git diff --check`. The latest review changes intentionally remain unverified until the requested final test pass. The most recent complete Chromium run passed 51 of 52 tests; its sole failure was the pre-existing Phase 6 primary-key test failing to find its input. No PrimeVue references remain in the documents page or its migrated document components.

## Phase 10: Search Rules

### Objective

Migrate search-rule gating, list, conditions, actions, and create/edit forms while preserving the currently supported API model.

### Primary files

- `app/pages/search-rules/index.vue`
- `app/pages/search-rules/create.vue`
- `app/pages/search-rules/[uid]/edit.vue`
- `app/components/search-rules/SearchRulesFeatureUnavailableCard.vue`
- `app/components/meilisearch/SearchRuleForm.vue`
- `app/components/meilisearch/SearchRuleConditionModal.vue`
- `app/components/meilisearch/SearchRuleActionModal.vue`
- `app/composables/meilisearch/useDynamicSearchRules.ts`
- `app/types/index.d.ts`
- `e2e/fixtures/meilisearch.ts`
- `e2e/phase10-search-rules.spec.ts`

### Page order

1. Unsupported/disabled feature state
2. List, search, active filter, sorting, and pagination
3. Delete action
4. Shared form shell
5. Condition modal
6. Action modal
7. Create route
8. Edit route

### Behavioral requirements

- Feature requires Meilisearch version 1.41.0 or newer.
- `dynamicSearchRules` must be enabled.
- Unavailable state must not call list APIs.
- List supports UID search, active/inactive filter, priority sorting, and pagination.
- Save requires a nonempty UID, at least one condition, and at least one action.
- Existing conditions remain query-empty, query-contains-term, and time ranges.
- One-sided time windows remain valid.
- Empty or inverted time ranges remain invalid.
- Existing actions remain pin, index selection, document ID, and zero-based position.
- UID remains disabled during edit.
- Delete remains confirmed.

### Explicit exclusion

Do not add the newer filter-based search-rule condition in this phase. That is the next product feature after UI migration.

### Acceptance criteria

- Feature gating works for old versions, disabled flag, and enabled support.
- Create/edit payloads match the current dynamic-search-rules API.
- Nested modal focus and keyboard behavior work.
- Search-rule tables and forms contain no PrimeVue dependency.
- Playwright covers gating and one complete create/edit/delete journey.

### Verification

```bash
npx eslint . --max-warnings=0
npm run typecheck
npm run build
npm run test:e2e
```

### Handoff notes

- Completed 2026-09-24 and finalized 2026-09-25. Search-rule feature gating, list, create/edit routes, shared form, condition modal, and pin-action modal now use Nuxt UI components and contain no PrimeVue dependency. Breadcrumbs remain the page-title source; create/edit use subtle cards, `UTextarea` for Description, and `AppDashboardPanel` actions for Cancel/Save.
- The list follows the established `UTable`/`AppTablePagination`/`AppFiltersPopover` pattern. UID search is debounced and server-backed. The card header contains UID and non-searchable status filters, with Active/Inactive rendered using the same badges as the table. The dashboard actions include Refresh and New Rule. API `precedence` is normalized to the Priority column, object-shaped conditions are counted correctly, and local Priority sorting cycles unsorted → ascending → descending → unsorted.
- The Meilisearch JavaScript SDK is pinned to `0.62.0`, whose native search-rule types match the supported server API. The form now uses SDK-backed `precedence`, object-shaped `SearchRuleConditions`, `words`, `SearchRuleAction[]`, and `SearchRuleUpdatePayload` directly. The temporary hand-written API payload type and `app/utils/search-rules.ts` compatibility adapter were removed; application-owned form/view types live in `app/types/index.d.ts`.
- Query-empty, query-contains, and one-sided or bounded time conditions remain supported. Time inputs use native `datetime-local` through `UInput` and convert local entry to ISO strings on save. The newer filter-based condition remains explicitly deferred.
- Pin actions use one free-entry autocomplete `UInputMenu` for document search or exact ID entry. Search results include document snippets; selecting a result or pressing Enter for an exact ID displays a JSON preview without search-triggered error toasts. Editing an existing action loads its saved document into the preview automatically, and missing documents are reported inline. Stale preview responses are ignored after the modal closes or its index/ID changes.
- Search-rule mutations use the SDK's native task-backed return type. The composable follows the existing task polling/toast pattern and redirects only after completion, so the list fetch after navigation reflects the saved rule. The SDK's new `dsrUpdate` and `dsrClear` task types are also available in task filters.
- The stateful Playwright fixture supports dynamic-search-rule list, read, update, and delete endpoints. `e2e/phase10-search-rules.spec.ts` covers create/edit/delete payload fidelity, inactive filtering, precedence display, the three-state Priority sort, autocomplete preview behavior, and automatic existing-document preview. The existing navigation suite covers version and experimental-feature gating.
- Verification passed with ESLint, `npm run typecheck`, `npm run build`, and the focused Chromium Phase 10 suite (5 tests). Phase 11 remains responsible for dependency/configuration removal and the final all-source PrimeVue audit.

## Phase 11: PrimeVue Removal and Final Hardening

### Objective

Remove every PrimeVue dependency, configuration file, API assumption, CSS token, and stale wrapper after all routes use Nuxt UI.

### Dependency removal

Remove these packages if still present:

- `primevue`
- `@primevue/nuxt-module`
- `@primevue/forms`
- `@primeuix/themes`
- `tailwindcss-primeui`

Regenerate `package-lock.json` through npm after dependency removal.

### File and configuration removal

- Remove PrimeVue module/configuration from `nuxt.config.ts`.
- Remove `tailwindcss-primeui` from CSS.
- Delete `app/theme/theme-preset.ts`.
- Delete `app/theme/global-pt.ts`.
- Delete Prime menu wrappers and `AppToast.vue` after final usage searches.
- Remove Prime-only types from `app/types/index.d.ts`.
- Remove `ptViewMerge` or equivalent Prime-only utilities.
- Remove PrimeVue MCP from `opencode.json` after it is no longer needed as migration reference.
- Keep Nuxt UI and Playwright MCP entries.

### Source audit patterns

Search the application and configuration for all of the following:

```text
primevue
@primevue
@primeuix
tailwindcss-primeui
v-tooltip
pt:
ptOptions
--p-
bg-surface-
border-surface-
text-muted-color
rounded-border
severity=
asChild
ConfirmDialog
ConfirmPopup
DataTable
<Column
```

Each match must either be removed or documented as a false positive unrelated to PrimeVue. Package-lock matches must disappear after dependency removal.

### Final accessibility pass

- Verify accessible names for every icon-only button.
- Verify labels are associated with controls.
- Verify modal and slideover focus trapping and focus return.
- Verify Escape behavior and non-dismissible destructive workflows.
- Verify keyboard operation of navigation, dropdowns, tabs, tables, and pagination.
- Run automated axe checks on every major route and representative overlay.
- Check readable contrast in light and dark modes.

### Final deployment pass

- Build the standard Node/Nitro application.
- Generate the static multi-instance application.
- Build the GitHub Pages preset with a base path.
- Smoke test Node proxy mode without exposing the API key to the browser.
- Smoke test static multi-instance mode and local-storage persistence.
- Verify `/up`, `/api/config`, and `/api/meilisearch/*` behavior where applicable.

### Acceptance criteria

- The final definition of done below is fully satisfied.
- All tests and builds pass from a clean dependency install.
- No PrimeVue package or source dependency remains.
- All phase ledger entries are complete.

### Verification

```bash
npm ci
npx eslint . --max-warnings=0
npm run typecheck
npm run build
NUXT_PUBLIC_STATIC_DEPLOY=true npm run generate
npx nuxt build --preset github_pages
npm run test:e2e
```

Run any unit, accessibility, and visual test scripts added during earlier phases as well.

### Handoff notes

- PrimeVue runtime integration and application references were removed from the active app in the current Phase 11 slice. Removed packages: `primevue`, `@primevue/nuxt-module`, `@primevue/forms`, `@primeuix/themes`, `tailwindcss-primeui`, and the Prime-only `tailwind-merge` utility. `package-lock.json` was regenerated and a clean `npm ci` completed successfully.
- Removed the Prime module/configuration, theme preset and global pass-through config, root Prime toast/confirmation providers, stale Prime menu wrapper, unused Prime message/error and page-title/not-found helpers, Prime-derived global types/helper, Prime CSS import/utilities, and the Prime MCP entry. Removed the obsolete Prime component-library link from the README. Nuxt UI and Playwright MCP entries remain; `UApp`, Nuxt UI theme palettes, JSON styles, MapLibre styles, and app behavior remain.
- Source audit of `app/` found no matches for the Phase 11 PrimeVue/import/API/CSS patterns. `package.json` and `package-lock.json` contain no PrimeVue packages. Historical phase context in this migration handoff remains as migration documentation and is not included in the application bundle.
- Verification passed: `npm ci`, `npx eslint . --max-warnings=0`, `npm run typecheck`, `npm run build`, `NUXT_PUBLIC_STATIC_DEPLOY=true npm run generate`, and `npx nuxt build --preset github_pages`. Chromium E2E: 60 passed, 1 failed; the only failure is the previously reported Phase 6 primary-key test failing to find the `Primary Key` input (`e2e/phase6-index-detail.spec.ts:80`), unrelated to PrimeVue removal. Playwright ran with a temporary port 3101 because the configured 3100 endpoint was occupied; `playwright.config.ts` was restored afterward.
- Follow-up dashboard-shell cleanup: removed the `dashboardPanel` route-meta switch and the layout-owned fallback `UDashboardPanel`; all app-layout pages render or inherit their own `AppDashboardPanel`. Removed the fallback scroll container, layout scroll-to-top listener/button, and the `.legacy-app-scroll-container` pagination selector. Removed the unused pagination `firstDatasetIndex` and `handlePageEvent` adapter and their search-rules composable exports. `/backups` now uses the app layout and redirects to `/backups/dumps`; the navigation E2E test verifies the redirect and breadcrumb.
- Follow-up verification: ESLint, typecheck, and Node build passed. Targeted Chromium navigation tests passed (2/2), including `/backups` direct entry. The complete Chromium run passed 60/62; it hit the known Phase 6 primary-key failure plus one intermittent Phase 10 create-rule preview assertion. The Phase 10 test passed on isolated rerun. Cross-browser execution remains blocked because Firefox and WebKit Playwright binaries are not installed. `playwright.config.ts` was restored to port 3100 after the run.
- Phase 11 remains in progress. Remaining definition-of-done checks include resolving/revalidating the known Phase 6 failure, cross-browser smoke tests, automated accessibility checks and visual review, and runtime proxy/static deployment smoke tests. The separate `TODO` list under this handoff was not implemented in this slice.

## Functional Regression Checklist

Use this checklist throughout the migration, not only at the end.

### Connection and application modes

- Multi-instance mode stores instances in `meilisearch-instances`.
- Selected instance remains in `meilisearch-current-id`.
- Duplicate hosts are rejected.
- Connections are health-checked.
- Switching instances resets the client and refreshes dependent data.
- Removing the last instance routes to `/new-instance`.
- Connection failure routes to `/connection-error` in multi-instance mode.
- Single-instance proxy mode hides instance-management UI.
- Proxy mode redirects setup/error pages to the dashboard as currently implemented.
- API keys remain server-side in proxy mode.

### Indexes

- List pagination and page sizes remain correct.
- Create index supports optional primary key and polls the task.
- Stats, settings, documents, and edit routes remain shareable.
- Primary-key updates preserve constraints and polling.
- Delete-all-documents and delete-index are separate confirmed actions.
- Deleting an index navigates away safely.

### Documents

- Debounced and Enter-triggered search work.
- JSON, table, and Geo views remain available under the same conditions.
- Sort, facet, geo, hybrid, ranking, edit, delete, import, and export parameters match baseline behavior.
- Import modes, formats, and limits remain intact.
- Export batching and CSV schema discovery remain intact.
- Map marker and bounds behavior remain intact.

### Tasks

- Cursor loading does not duplicate rows.
- Filters change request parameters correctly.
- Polling interval and persisted preference remain intact.
- Details show full JSON.
- Deletion cannot run unfiltered.
- Stale responses do not replace newer results.

### Keys

- Mask, reveal, and clipboard flows work.
- Wildcard indexes/actions remain `['*']`.
- Arbitrary actions remain normalized and deduplicated.
- Immutable fields remain immutable during edit.
- Expired status remains accurate.

### Backups and experimental features

- Dumps and snapshots call distinct operations and poll tasks.
- Dynamic experimental feature keys all render and submit.

### Search rules

- Version and feature-flag gating remain intact.
- Disabled/unsupported states avoid invalid API calls.
- Existing list filters and sorting remain intact.
- Existing conditions and actions serialize identically.
- UID remains immutable while editing.

## Per-Page Definition of Done

A page is migrated only when all of these statements are true:

- The page and its migrated child components contain no PrimeVue imports, components, directives, types, pass-through props, or CSS variables.
- API calls and payloads match current behavior.
- Loading, empty, success, failure, and disabled states are represented.
- Forms expose visible validation errors.
- Modal and slideover focus behavior is correct.
- Icon-only controls have accessible names.
- Desktop, tablet, and mobile layouts are usable.
- Light and dark modes are legible.
- Relevant Playwright coverage passes.
- ESLint, typecheck, and production build pass.

## Final Definition of Done

### Dependencies and source

- No PrimeVue package exists in `package.json` or `package-lock.json`.
- `@primevue/nuxt-module` is absent from `nuxt.config.ts`.
- `tailwindcss-primeui` is not imported.
- No source import contains `primevue`, `@primevue`, or `@primeuix`.
- No Prime component tags or directives remain.
- No Prime pass-through props remain.
- No `--p-*` variables or Prime semantic utilities remain.
- Prime theme and pass-through files are deleted.
- Prime-specific wrappers, types, and utilities are deleted.
- PrimeVue MCP configuration is removed.

### Nuxt UI architecture

- `UApp` wraps the application.
- The authenticated shell uses Nuxt UI dashboard components.
- Navigation uses `UNavigationMenu`.
- The theme uses semantic colors and `app.config.ts`.
- Forms use `UForm` and `UFormField`.
- Notifications use Nuxt UI toast infrastructure.
- Confirmations and overlays use Nuxt UI modal/slideover infrastructure.
- Tables use typed `UTable` columns.
- Lucide icons render consistently.

### Functional parity

- Every existing route remains available.
- Multi-instance and single-instance proxy modes work.
- Index, document, task, key, backup, experimental-feature, and search-rule operations behave as before.
- Polling, pagination, filtering, import, export, map, JSON editing, and feature gating remain intact.
- Static and Node proxy deployments work.

### Quality

- Non-mutating ESLint passes.
- Nuxt typecheck passes.
- Production build passes.
- Static generation passes.
- Chromium E2E suite passes.
- Firefox and WebKit smoke tests pass.
- Major routes pass automated accessibility checks.
- Approved desktop/mobile and light/dark screenshots exist.
- A final repository-wide PrimeVue search returns no application or configuration references.

## Standard Verification Commands

Use the scripts available in the current phase. Add missing scripts as the test harness matures.

```bash
npm ci
npx eslint . --max-warnings=0
npm run typecheck
npm run build
NUXT_PUBLIC_STATIC_DEPLOY=true npm run generate
npx nuxt build --preset github_pages
npm run test:e2e
```

Do not use `npm run lint` as a verification-only command while it is defined as `eslint . --fix`, because it mutates files. Use `npx eslint . --max-warnings=0` instead.

## Recommended Iteration Boundaries

Prefer one of these as a single agent-session deliverable:

- Test harness and one smoke-test group.
- Nuxt UI installation and root theme.
- Feedback/confirmation decoupling.
- Dashboard shell.
- One simple page family.
- One server-backed table and its modal.
- One nested index page family.
- Keys feature.
- Tasks feature.
- One documents sub-phase.
- Search-rules list or form family.
- Final dependency removal and audit.

If a phase proves too large, complete a vertical slice that leaves all routes buildable, update the ledger to `[~]`, and record exactly what remains in that phase's handoff notes.

## Decisions Requiring Explicit Approval

Do not silently make these changes during the UI migration:

- Changing Meilisearch request or response models.
- Adding raw search.
- Adding filter-based search-rule conditions.
- Changing facet AND/OR semantics.
- Replacing task infinite scroll with pagination.
- Removing support for either deployment mode.
- Changing local-storage keys.
- Changing route URLs.
- Removing a current capability because Nuxt UI lacks a direct equivalent.
- Large redesigns of document workflows beyond adapting them to the dashboard layout.

## Known Initial Risks

- There was no automated test suite before migration planning.
- PrimeVue toast and confirmation APIs were imported throughout the data layer.
- PrimeVue generated many components through auto-imports, so import searches alone are insufficient.
- CSS uses Prime-specific semantic utilities and variables.
- `UTable` requires explicit TypeScript column definitions and does not recreate Prime DataTable controls automatically.
- Documents is the highest-risk page and coordinates several composables and feature components.
- Search-rule forms use nested dialogs, editable tables, date/time input, and lookup behavior.
- Two deployment modes require separate coverage.
- GitHub Pages base-path behavior needs explicit testing.
- Several icon-only controls initially relied on tooltips rather than accessible labels.
- Existing page defects must be distinguished from migration regressions.

## Session Completion Template

At the end of each agent session, update the applicable handoff notes and report:

```text
Phase/slice completed:
Files changed:
Behavior preserved:
Intentional behavior changes:
Verification run and results:
Browser/viewports checked:
Known risks or remaining tasks:
Next recommended slice:
```

This document remains authoritative until the PrimeVue removal phase and final definition of done are complete.
