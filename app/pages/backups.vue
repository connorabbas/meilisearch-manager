<script setup lang="ts">
import { useDumps } from '@/composables/meilisearch/useDumps'
import { useSnapshots } from '@/composables/meilisearch/useSnapshots'
import PageTitleSection from '@/components/PageTitleSection.vue'
import { Plus } from '@lucide/vue'

definePageMeta({
    layout: 'app',
    title: 'Backups',
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Backups' }]
})

const currentTab = ref('dumps')
const dumpsDocsUrl = 'https://www.meilisearch.com/docs/resources/self_hosting/data_backup/dumps'
const snapshotsDocsUrl = 'https://www.meilisearch.com/docs/resources/self_hosting/data_backup/snapshots'

const { isLoadingTask, createDump } = useDumps()
const { isLoadingTask: isLoadingSnapshotTask, createSnapshot } = useSnapshots()
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <PageTitleSection>
            <template #title>
                Backups
            </template>
        </PageTitleSection>

        <Tabs
            v-model:value="currentTab"
            lazy
        >
            <TabList class="[background:transparent]!">
                <Tab value="dumps">
                    Dumps
                </Tab>
                <Tab value="snapshots">
                    Snapshots
                </Tab>
            </TabList>
            <TabPanels class="[background:transparent]! p-0 pt-4 sm:pt-8">
                <TabPanel
                    value="dumps"
                    class="p-0"
                >
                    <Card>
                        <template #title>
                            Export a dump
                        </template>
                        <template #subtitle>
                            Dumps are portable backups best suited for migrating data between Meilisearch
                            versions.
                        </template>
                        <template #content>
                            <div class="pt-4 flex flex-wrap items-center gap-4">
                                <Button
                                    label="Create Dump"
                                    :loading="isLoadingTask"
                                    @click="createDump()"
                                >
                                    <template #icon>
                                        <Plus />
                                    </template>
                                </Button>

                                <Button
                                    as="a"
                                    label="Read dumps docs"
                                    variant="link"
                                    :href="dumpsDocsUrl"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="no-underline rounded-none!"
                                />
                            </div>
                        </template>
                    </Card>
                </TabPanel>

                <TabPanel
                    value="snapshots"
                    class="p-0"
                >
                    <Card>
                        <template #title>
                            Export a snapshot
                        </template>
                        <template #subtitle>
                            Snapshots are exact database copies intended for fast recovery on the same Meilisearch
                            version.
                        </template>
                        <template #content>
                            <div class="pt-4 flex flex-wrap items-center gap-4">
                                <Button
                                    label="Create Snapshot"
                                    :loading="isLoadingSnapshotTask"
                                    @click="createSnapshot()"
                                >
                                    <template #icon>
                                        <Plus />
                                    </template>
                                </Button>

                                <Button
                                    as="a"
                                    label="Read snapshots docs"
                                    variant="link"
                                    :href="snapshotsDocsUrl"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="no-underline rounded-none!"
                                />
                            </div>
                        </template>
                    </Card>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>
