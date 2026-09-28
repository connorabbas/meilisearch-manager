# Meilisearch Manager

An easy to use web UI for managing self-hosted Meilisearch instances. Free and open source.

## Features

- :rocket: **Multi-instance** mode for local development and testing
- :link: **Single-Instance Proxy** mode for one preconfigured Meilisearch instance
- :bar_chart: **Dashboard** with stats and version details
- :open_file_folder: **Indexes** listing, creation, inspection, primary key updates, and deletion
- :gear: **Index settings** full JSON viewer/editor
- :page_facing_up: **Documents** import & export, search (full-text, hybrid, geo), sort, filter, pagination, edit, and delete flows
- :key: **API keys** create, view, edit, copy, and delete flows
- :ballot_box_with_check: **Tasks** history with filtering, infinite scroll, and optional polling
- :hourglass: **Data backups** with dump and snapshot exports
- :dart: **Search Rules** with query, time, and filter conditions - pin, boost, demote, and hide documents with scale actions
- :test_tube: **Experimental features** toggling
- :whale2: **Docker** images
- :iphone: **Responsive** layout
- :waning_crescent_moon: **Dark mode** support

> [!IMPORTANT]
> Search Rules require **Meilisearch 1.54.0 or later** with the `dynamicSearchRules` experimental feature enabled. Older instances can still be managed, but Search Rules are unavailable due to breaking changes to their API.

## Getting Started

Search Rules require **Meilisearch 1.54.0 or later** with the `dynamicSearchRules` experimental feature enabled. Older instances can still be managed, but the Search Rules pages are unavailable. Scale weights above 1 boost, between 0 and 1 demote, and 0 hides documents (unless pinned). Scale filters require filterable attributes in the target index.

### Demo

Check out the live demo (hosted with GitHub pages): [https://connorabbas.github.io/meilisearch-manager/](https://connorabbas.github.io/meilisearch-manager/)

## Configuration

The app supports two distinct operational modes, each designed for a different use case.

### Multi-Instance Mode

Designed for **local development, testing, and exploration**.

In this mode, the app behaves as a pure client-side SPA. You can add, manage, and switch between multiple Meilisearch instances directly from the browser UI. Instance credentials (host and API key) are stored in the browser's `localStorage`.

**Characteristics:**

- Manage multiple Meilisearch instances from one dashboard
- Credentials stored in browser `localStorage` (never sent to any backend server)
- The Meilisearch JavaScript client runs directly in the browser
- Your Meilisearch instance must expose appropriate CORS headers
- Can be deployed statically (GitHub Pages, S3, CDN, etc.)

> [!NOTE]
> Credentials in `localStorage` are isolated to the browser and the app's origin. They are not transmitted to any server. This is generally safe for development and testing, but may not meet organizational security requirements for production use.

### Single-Instance Proxy Mode

Designed for deployments where the Manager should control **one preconfigured Meilisearch instance** through the app's Nitro server.

In this mode, the admin API key lives only in server-side environment variables. The browser talks to the app's `/api/meilisearch/*` endpoint, and Nitro forwards those requests to the configured Meilisearch upstream with the real credentials injected server-side.

Use a separately created Manager API key, not Meilisearch's master key.

```env
NUXT_MEILISEARCH_HOST=https://your-instance-domain.com
NUXT_MEILISEARCH_API_KEY=yourAdminApiKey
```

**Characteristics:**

- Admin API key is **server-side only** - never exposed to the client
- All requests proxied through `/api/meilisearch/*` with credentials injected by Nitro
- Instance management UI is disabled (single pre-configured instance only)
- Eliminates CORS concerns (browser talks to same-origin proxy)
- **Requires a running Nitro server (Node environment)** - cannot be used with static hosting
- Does **not** provide authentication by itself. Protect the app with external auth or private networking.

**Typical deployment:** Host the app alongside your Meilisearch instance (same network/VPC, or behind the same reverse proxy) so the Nitro server can reach Meilisearch securely.

> [!CAUTION]
> **Single-Instance Proxy Mode has no built-in authentication.** The `/api/meilisearch/*` catch-all proxy injects the admin API key server-side, but the route itself accepts any request that reaches it.
>
> **You MUST deploy this behind an authentication layer in production environments** (e.g., Traefik Basic Auth, Authentik, Authelia, Cloudflare Access) or restrict it to a private network or VPN. Exposing the app directly to the internet without authentication is equivalent to giving public admin access to your Meilisearch instance.

### Explicit Mode Control

You can explicitly force a mode with `NUXT_MEILISEARCH_SINGLE_INSTANCE_PROXY_MODE`:

```env
NUXT_MEILISEARCH_SINGLE_INSTANCE_PROXY_MODE=true   # Require credentials for proxy mode
NUXT_MEILISEARCH_SINGLE_INSTANCE_PROXY_MODE=false  # Force multi-instance mode and disable the proxy
```

If omitted (default is `'auto'`), the app auto-detects: Single-Instance Proxy Mode activates when both `NUXT_MEILISEARCH_HOST` and `NUXT_MEILISEARCH_API_KEY` are present.

If `NUXT_MEILISEARCH_SINGLE_INSTANCE_PROXY_MODE=true` but either the host or API key is missing, `/api/config` returns a configuration error.

### Static Deployments

For static hosting (GitHub Pages, S3, CDN), set this **at build time**:

```env
NUXT_PUBLIC_STATIC_DEPLOY=true
```

This skips the server configuration check entirely and boots directly into multi-instance mode. The nginx image and GitHub Pages workflow already set it during their builds.

## Docker Images

Pre-built images are published to [Docker Hub](https://hub.docker.com/r/cabbas23/meilisearch-manager) for both operational modes.

See [DOCKER.md](./DOCKER.md) for image tags, Docker Compose examples, Traefik Basic Auth setup, and production security guidance.

## Tech Stack

- [Nuxt 4](https://nuxt.com/)
- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Nuxt UI](https://ui.nuxt.com/)
- [Pinia](https://pinia.vuejs.org/)
- [VueUse](https://vueuse.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Lucide Vue](https://lucide.dev/)
- [Meilisearch JavaScript/TypeScript client](https://github.com/meilisearch/meilisearch-js)
- [Zod](https://zod.dev/)
