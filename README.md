# Meilisearch Dashboard

A modern web-based UI for managing Meilisearch instances.

> [!WARNING]
> This project is still a work in progress, development and improvements will continue in the pursuit to reach a `v1.0.0` version.

## Features

-   :rocket: **Multiple instances** management
-   :open_file_folder: **Indexes** CRUD operations, settings
-   :page_facing_up: **Documents** bulk imports, CRUD operations, search
-   :lock: **API keys** management
-   :ballot_box_with_check: **Tasks** history with filtering & sorting
-   :iphone: **Responsive** design
-   :waning_crescent_moon: **Dark Mode** toggle

### Roadmap

-   Documents - better search, facet filtering, sorting functionality
-   Backups - Ability to create snapshots and dumps
-   Indexes - field distribution graph, [index swapping](https://www.meilisearch.com/docs/learn/getting_started/indexes#swapping-indexes)
-   Hosted demo on dedicated domain/server
-   General improvements...

## Demo

You can use the hosted Meilsearch Dashboard (deployed on GitHub pages) with your search instances, given they expose appropriate CORS headers on: [https://connorabbas.github.io/meilisearch-dashboard/](https://connorabbas.github.io/meilisearch-dashboard/).

## Single Instance mode

By default, this application is configured to allow multiple instances to be saved and managed, stored using your browser's local storage.

If you only need to manage one instance and don't want to rely on browser storage to save your instance credentials, you can enable the single instance mode using the following `.env` variables:

```
VITE_MEILISEARCH_HOST=https://your-instance-domain.com
VITE_MEILISEARCH_API_KEY=yourInstanceKey
```

> [!CAUTION]
>
> **Security Warning**
>
> The relevant `.env` variables used to enable single instance mode will be complied into the source code of the application at build time. This means your admin-level API key will be exposed to the public via the bundled client-side code. For this reason, the single instance mode configuration is not recommended unless you have the ability to limit access to the hosted domain serving the dashboard (either with an authentication/authorization layer or hosted within a trusted internal network environment).

## Tech Stack

-   [Vite](https://vite.dev/) local dev server and bundler
-   [Vue 3](https://vuejs.org/) w/ Composition API + [TypeScript](https://www.typescriptlang.org/)
-   [Pinia](https://pinia.vuejs.org/) state management store
-   [VueUse](https://vueuse.org/) utilities
-   [PrimeVue](https://primevue.org/) Components
-   [Tailwind CSS](https://tailwindcss.com/) utility styles
-   [Lucide](https://lucide.dev/) icons
-   [Meilisearch client](https://github.com/meilisearch/meilisearch-js) for TypeScript
