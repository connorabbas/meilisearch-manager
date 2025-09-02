<script setup lang="ts">
import { ref } from "vue";
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import { FileText, Info, Pencil, Settings } from "lucide-vue-next";

const props = defineProps<{
    currentRouteName: string,
    indexUID: string,
}>();

const items = ref([
    { route: { name: 'index-details', params: { indexUID: props.indexUID } }, label: 'Details', icon: Info },
    { route: { name: 'index-documents', params: { indexUID: props.indexUID } }, label: 'Documents', icon: FileText },
    { route: { name: 'index-settings', params: { indexUID: props.indexUID } }, label: 'Settings', icon: Settings },
    { route: { name: 'edit-index', params: { indexUID: props.indexUID } }, label: 'Edit', icon: Pencil },

]);
</script>

<template>
    <Tabs :value="props.currentRouteName">
        <TabList :pt="{ tabList: { class: '[background:transparent]!' } }">
            <RouterLink
                v-for="tab in items"
                v-slot="{ href, navigate }"
                :key="tab.route.name"
                :to="tab.route"
                custom
            >
                <a
                    v-if="tab.route"
                    :href="href"
                    class="text-inherit no-underline"
                    @click="navigate"
                >
                    <Tab
                        :value="tab.route.name"
                        class="flex items-center gap-2"
                    >
                        <component
                            :is="tab.icon"
                            v-if="tab.icon"
                        />
                        <span>{{ tab.label }}</span>
                    </Tab>
                </a>
            </RouterLink>
        </TabList>
    </Tabs>
</template>