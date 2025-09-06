<script setup lang="ts">
import { AlertCircle, AlertTriangle, ArrowLeft } from 'lucide-vue-next';
import Container from '@/components/Container.vue';
</script>

<template>
    <Container fluid>
        <main>
            <div class="h-screen flex items-center justify-center">
                <Card pt:body:class="p-4 py-6 sm:p-12">
                    <template #content>
                        <div class="text-center">
                            <section class="flex flex-col gap-6 md:gap-8 items-center justify-center text-center">
                                <h1 class="font-extrabold text-6xl">
                                    <span class="sr-only">Error</span>404
                                </h1>
                                <Message severity="warn">
                                    <template #icon>
                                        <AlertTriangle />
                                    </template>
                                    Sorry, we couldn't find this page.
                                </Message>
                                <RouterLink :to="{ name: 'dashboard' }">
                                    <Button label="Back to dashboard">
                                        <template #icon>
                                            <ArrowLeft />
                                        </template>
                                    </Button>
                                </RouterLink>
                            </section>
                        </div>
                    </template>
                </Card>
            </div>
        </main>
    </Container>
</template>