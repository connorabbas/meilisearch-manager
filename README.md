# Meilisearch Manager

A Nuxt-based web UI for managing Meilisearch instances.

This project is the refactored Nuxt version of the original Vue SPA project: [connorabbas/meilisearch-manager-legacy](https://github.com/connorabbas/meilisearch-manager-legacy).

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
- :pushpin: **Search Rules** to pin selected documents at fixed positions in search results 
- :test_tube: **Experimental features** toggling
- :iphone: **Responsive** layout
- :waning_crescent_moon: **Dark mode** support

## Getting Started

### Demo

Check out the live demo (hosted with GitHub pages): [https://connorabbas.github.io/meilisearch-manager/](https://connorabbas.github.io/meilisearch-manager/)

### Local Development

When running the Docker development environment behind the included Traefik route, start Nuxt with:

```bash
npm run dev:traefik
```

This listens on port 3000 and is available at `http://meilisearch-manager.localhost`. The Playwright suite uses an isolated production preview on `127.0.0.1:3100`, so it does not reuse or stop the development server.

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
- Does **not** provide authentication by itself; protect the app with external auth or private networking

**Typical deployment:** Host the app alongside your Meilisearch instance (same network/VPC, or behind the same reverse proxy) so the Nitro server can reach Meilisearch securely.

> [!CAUTION]
> **Single-Instance Proxy Mode has no built-in authentication.** The `/api/meilisearch/*` catch-all proxy injects the admin API key server-side, but the route itself accepts any request that reaches it.
>
> **You MUST deploy this behind an authentication layer in production environments** (e.g., Traefik Basic Auth, VPN, Cloudflare Access) or restrict it to a private network. Exposing the app directly to the internet without authentication is equivalent to giving public admin access to your Meilisearch instance.

### Explicit Mode Control

You can explicitly force a mode with `NUXT_MEILISEARCH_SINGLE_INSTANCE_PROXY_MODE`:

```env
NUXT_MEILISEARCH_SINGLE_INSTANCE_PROXY_MODE=true   # Force single-instance proxy mode (throws on startup if credentials missing)
NUXT_MEILISEARCH_SINGLE_INSTANCE_PROXY_MODE=false  # Force multi-instance mode (even if credentials are set)
```

If omitted (default is `'auto'`), the app auto-detects: Single-Instance Proxy Mode activates when both `NUXT_MEILISEARCH_HOST` and `NUXT_MEILISEARCH_API_KEY` are present.

### Static Deployments

For static hosting (GitHub Pages, S3, CDN), set:

```env
NUXT_PUBLIC_STATIC_DEPLOY=true
```

This skips the server configuration check entirely and boots directly into multi-instance mode. This is automatically set in the GitHub Pages workflow.

## Docker Images

Pre-built images are published to [Docker Hub](https://hub.docker.com/r/cabbas23/meilisearch-manager) for both operational modes.

See [DOCKER.md](./DOCKER.md) for image tags, Docker Compose examples, Traefik Basic Auth setup, and production security guidance.

## Tech Stack

- [Nuxt 4](https://nuxt.com/)
- [Vue 3](https://vuejs.org/) with Composition API and [TypeScript](https://www.typescriptlang.org/)
- [PrimeVue v4](https://v4.primevue.org/)
- [Pinia](https://pinia.vuejs.org/) via [`@pinia/nuxt`](https://nuxt.com/modules/pinia)
- [VueUse](https://vueuse.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [`@nuxt/fonts`](https://nuxt.com/modules/fonts)
- [Lucide Vue](https://lucide.dev/)
- [Meilisearch JavaScript/TypeScript client](https://github.com/meilisearch/meilisearch-js)
- [Zod](https://zod.dev/)
