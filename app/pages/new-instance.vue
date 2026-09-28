<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import Container from '@/components/Container.vue'
import LogoLink from '@/components/LogoLink.vue'
import { useMeilisearchStore } from '@/stores/meilisearch'
import type { NewInstanceForm } from '@/types'

definePageMeta({
    title: 'Add Instance',
})

const schema = z.object({
    name: z.string().min(1, { message: 'Please provide a name for your instance' }),
    host: z.string().min(1, { message: 'Please provide a host url/ip for your instance' }),
    apiKey: z.string().min(1, { message: 'Please provide a valid API key' }),
})

const meilisearchStore = useMeilisearchStore()
const toast = useToast()
const form = useTemplateRef('form')
const isSubmitting = ref(false)
const showApiKey = ref(false)
const submitError = ref<string | null>(null)
const formState = reactive<NewInstanceForm>({
    name: '',
    host: '',
    apiKey: '',
})

async function submitNewInstance(event: FormSubmitEvent<NewInstanceForm>) {
    if (isSubmitting.value) return

    isSubmitting.value = true
    submitError.value = null

    try {
        await meilisearchStore.addInstance(event.data)
        await navigateTo('/dashboard')
        toast.add({
            color: 'success',
            icon: 'i-lucide-circle-check',
            title: 'Instance Added',
            description: `Successfully added MeiliSearch instance: ${event.data.name}`,
            duration: 5000,
        })
    } catch (error) {
        submitError.value = (error as Error).message
    } finally {
        isSubmitting.value = false
    }
}

function focusFirstInvalidField(event: FormErrorEvent) {
    const firstErrorName = event.errors[0]?.name
    if (!firstErrorName) return

    setTimeout(() => {
        const element = document.querySelector<HTMLElement>(`[name="${CSS.escape(firstErrorName)}"]`)
        element?.focus()
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 0)
}
</script>

<template>
    <Container class="flex min-h-svh flex-col items-center justify-center py-8">
        <div class="mb-6">
            <LogoLink img-classes="h-8! lg:h-10!" />
        </div>

        <div class="w-full sm:max-w-xl">
            <UCard
                title="Meilisearch Manager"
                variant="subtle"
                description="Add a new Meilisearch instance connection"
                :ui="{ header: 'text-center' }"
            >
                <UForm
                    ref="form"
                    :schema="schema"
                    :state="formState"
                    :loading-auto="false"
                    novalidate
                    class="space-y-6"
                    @submit="submitNewInstance"
                    @error="focusFirstInvalidField"
                >
                    <UAlert
                        v-if="submitError"
                        color="error"
                        variant="subtle"
                        icon="i-lucide-circle-x"
                        title="Unable to add instance"
                        :description="submitError"
                    />

                    <UFormField
                        name="name"
                        label="Name"
                        required
                    >
                        <UInput
                            v-model="formState.name"
                            placeholder="Name your instance"
                            autocomplete="off"
                            autofocus
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField
                        name="host"
                        label="Host URL"
                        description="Your instance server may require CORS access for this UI domain."
                        required
                    >
                        <UInput
                            v-model="formState.host"
                            type="url"
                            placeholder="https://example.com"
                            autocomplete="off"
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField
                        name="apiKey"
                        label="API Key"
                        description="Saved only in your browser's local storage."
                        required
                    >
                        <UInput
                            v-model="formState.apiKey"
                            :type="showApiKey ? 'text' : 'password'"
                            placeholder="masterKey"
                            autocomplete="off"
                            class="w-full"
                        >
                            <template #trailing>
                                <UButton
                                    :aria-label="showApiKey ? 'Hide credential' : 'Show credential'"
                                    :icon="showApiKey ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                                    color="neutral"
                                    variant="link"
                                    size="sm"
                                    @click="showApiKey = !showApiKey"
                                />
                            </template>
                        </UInput>
                    </UFormField>

                    <UButton
                        type="submit"
                        label="Connect"
                        icon="i-lucide-plug"
                        :loading="isSubmitting"
                        :disabled="isSubmitting"
                        block
                        @click.prevent="form?.submit()"
                    />
                </UForm>
            </UCard>

            <nav
                aria-label="Resources"
                class="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4"
            >
                <UButton
                    to="/dashboard"
                    label="Dashboard"
                    icon="i-lucide-layout-dashboard"
                    color="neutral"
                    variant="link"
                />
                <AppExternalLink
                    href="https://www.meilisearch.com/docs/home"
                    label="Docs"
                />
                <AppExternalLink
                    href="https://github.com/connorabbas/meilisearch-manager"
                    label="Repository"
                />
            </nav>
        </div>
    </Container>
</template>
