<script setup lang="ts">
import { reactive } from 'vue';
import { useMeilisearchStore } from '@/stores/meilisearch';
import LogoLink from '@/components/LogoLink.vue';
import Container from '@/components/Container.vue';
import { Form, FormSubmitEvent } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue';
import { BookText, LayoutDashboard } from 'lucide-vue-next';

const meilisearchStore = useMeilisearchStore();
const router = useRouter();
const toast = useToast();

type NewInstanceForm = {
    name: string,
    host: string,
    apiKey: string,
};
const formValues = reactive<NewInstanceForm>({
    name: '',
    host: '',
    apiKey: '',
});

const resolver = zodResolver(
    z.object({
        name: z.string().min(1, { message: 'Please provide a name for your instance' }),
        host: z.string().min(1, { message: 'Please the host url for your instance' }).url(),
        apiKey: z.string().min(1, { message: 'Please provide a valid API key' }),
    })
);

async function submitNewInstance(event: FormSubmitEvent) {
    if (event.valid) {
        const formData = event.values as NewInstanceForm;
        try {
            await meilisearchStore.addInstance(formData);
            router.push({ name: 'dashboard' }).then(() => {
                toast.add({
                    severity: 'success',
                    summary: 'Instance Added',
                    detail: `Successfully added MeiliSearch instance: ${formData.name}`,
                    life: 5000,
                });
            });
            console.log();
        } catch (err) {
            console.error('Failed to add new Meilisearch instance...', err);
        } finally {
            //
        }
    }
}
</script>

<template>
    <Container class="min-h-svh flex flex-col justify-center items-center">
        <div class="mb-6">
            <LogoLink img-classes="h-8! lg:h-10!" />
        </div>
        <div class="w-full sm:max-w-xl">
            <Card
                pt:caption:class="space-y-2"
                pt:body:class="space-y-6"
            >
                <template #title>
                    <div class="text-center">
                        Meilisearch Dashboard
                    </div>
                </template>
                <template #subtitle>
                    <div class="text-center">
                        Add a new Meilisearch instance connection
                    </div>
                </template>
                <template #content>
                    <Form
                        v-slot="$form"
                        class="space-y-6 sm:space-y-8"
                        :initialValues="formValues"
                        :resolver
                        @submit="submitNewInstance"
                    >
                        <div class="flex flex-col gap-2">
                            <label for="name">Name</label>
                            <InputText
                                id="name"
                                name="name"
                                placeholder="name your instance"
                                type="text"
                                autocomplete="off"
                                autofocus
                                fluid
                            />
                            <Message
                                v-if="$form.name?.invalid"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ $form.name.error.message }}
                            </Message>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="host">Host URL</label>
                            <Message
                                severity="secondary"
                                size="small"
                                variant="simple"
                                class="sm:hidden"
                            >
                                Note: Your instance server might need CORS setup for this UI domain
                            </Message>
                            <InputText
                                id="host"
                                v-tooltip.bottom="{
                                    value: 'Note: Your instance server might need CORS setup for this UI domain',
                                    pt: {
                                        root: { class: 'max-w-[20rem] sm:max-w-[100%]' },
                                        text: { class: 'w-full' },
                                    },
                                }"
                                name="host"
                                placeholder="https://example.com"
                                type="text"
                                autocomplete="off"
                                fluid
                            />
                            <Message
                                v-if="$form.host?.invalid"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ $form.host.error.message }}
                            </Message>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="apiKey">API Key</label>
                            <Message
                                severity="secondary"
                                size="small"
                                variant="simple"
                                class="sm:hidden"
                            >
                                Note: Will only be saved in your browser's local storage
                            </Message>
                            <Password
                                v-tooltip.bottom="{
                                    value: `Note: Will only be saved in your browser's local storage`,
                                    pt: {
                                        root: { class: 'max-w-[20rem] sm:max-w-[100%]' },
                                        text: { class: 'w-full' },
                                    },
                                }"
                                :feedback="false"
                                inputId="apiKey"
                                name="apiKey"
                                placeholder="masterKey"
                                toggleMask
                                fluid
                            />
                            <Message
                                v-if="$form.apiKey?.invalid"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ $form.apiKey.error.message }}
                            </Message>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                label="Connect"
                                fluid
                            />
                        </div>
                    </Form>
                </template>
            </Card>
            <div class="flex justify-center items-center gap-6 mt-4">
                <RouterLink :to="{ name: 'dashboard' }">
                    <Button
                        class="p-0"
                        variant="link"
                        label="Dashboard"
                    >
                        <template #icon>
                            <LayoutDashboard />
                        </template>
                    </Button>
                </RouterLink>
                <Button
                    as="a"
                    label="Meilisearch Docs"
                    variant="link"
                    href="https://www.meilisearch.com/docs/home"
                    target="_blank"
                    rel="noopener"
                    class="no-underline"
                >
                    <template #icon>
                        <BookText />
                    </template>
                </Button>
                <!-- TODO: GitHub repo link -->
            </div>
        </div>
    </Container>
</template>