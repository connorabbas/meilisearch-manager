import type { RecordAny, ResourceResults } from 'meilisearch'
import Papa from 'papaparse'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { downloadFile } from '@/utils'

const BATCH_SIZE = 1000

export function useExportDocuments() {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()

    const isExporting = ref(false)
    const error = ref<string | null>(null)

    async function getAllColumns(indexUid: string): Promise<string[]> {
        const client = meilisearchStore.getClient()
        if (!client) {
            throw new Error('Meilisearch client not connected')
        }

        const columns = new Set<string>()
        let offset = 0
        const MAX_BATCHES = 100_000

        for (let batch = 0; batch < MAX_BATCHES; batch++) {
            const response: ResourceResults<RecordAny[]> = await client
                .index(indexUid)
                .getDocuments({ limit: BATCH_SIZE, offset })

            if (!response.results?.length) {
                break
            }

            for (const doc of response.results) {
                for (const key of Object.keys(doc)) {
                    columns.add(key)
                }
            }

            if (response.results.length < BATCH_SIZE) {
                break
            }

            if (typeof response.total === 'number' && (offset + response.results.length) >= response.total) {
                break
            }

            offset += BATCH_SIZE
        }

        return Array.from(columns)
    }

    async function exportDocuments(
        indexUid: string,
        format: 'json' | 'csv',
        filename?: string,
    ) {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isExporting.value = true
        error.value = null

        try {
            const safeFilename = filename || `${indexUid}-documents`
            let totalDocs = 0
            let offset = 0
            const MAX_BATCHES = 100_000

            if (format === 'json') {
                const parts: string[] = []
                parts.push('[\n')
                let isFirstBatch = true

                for (let batch = 0; batch < MAX_BATCHES; batch++) {
                    const response: ResourceResults<RecordAny[]> = await client
                        .index(indexUid)
                        .getDocuments({ limit: BATCH_SIZE, offset })

                    if (!response.results?.length) {
                        break
                    }

                    let batchStr = JSON.stringify(response.results, null, 2)
                    // Escape literal line/paragraph separators so editors don't flag "unusual line terminators"
                    batchStr = batchStr.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

                    const lines = batchStr.split('\n')
                    lines.shift() // remove '['
                    lines.pop() // remove ']'
                    const content = lines.join('\n')

                    if (!isFirstBatch) {
                        parts.push(',\n')
                    }
                    parts.push(content)
                    isFirstBatch = false

                    totalDocs += response.results.length

                    if (response.results.length < BATCH_SIZE) {
                        break
                    }

                    if (typeof response.total === 'number' && totalDocs >= response.total) {
                        break
                    }

                    offset += BATCH_SIZE
                }

                parts.push('\n]')
                const blob = new Blob(parts, { type: 'application/json' })
                downloadFile(blob, `${safeFilename}.json`)
            } else {
                // CSV: two-pass to discover all columns without holding all docs in memory
                const columns = await getAllColumns(indexUid)
                const csvParts: string[] = []
                offset = 0

                for (let batch = 0; batch < MAX_BATCHES; batch++) {
                    const response: ResourceResults<RecordAny[]> = await client
                        .index(indexUid)
                        .getDocuments({ limit: BATCH_SIZE, offset })

                    if (!response.results?.length) {
                        break
                    }

                    const csvStr = Papa.unparse(response.results, {
                        columns,
                        header: batch === 0,
                    })
                    // Strip literal line/paragraph separators so editors don't flag "unusual line terminators"
                    const sanitizedCsv = csvStr.replace(/\u2028/g, '').replace(/\u2029/g, '')
                    csvParts.push(sanitizedCsv)

                    totalDocs += response.results.length

                    if (response.results.length < BATCH_SIZE) {
                        break
                    }

                    if (typeof response.total === 'number' && totalDocs >= response.total) {
                        break
                    }

                    offset += BATCH_SIZE
                }

                const blob = new Blob(csvParts, { type: 'text/csv;charset=utf-8;' })
                downloadFile(blob, `${safeFilename}.csv`)
            }

            toast.add({
                color: 'success',
                icon: 'i-lucide-circle-check',
                title: 'Export Complete',
                description: `${totalDocs} document${totalDocs === 1 ? '' : 's'} exported as ${format.toUpperCase()}`,
                duration: 5000,
            })
        } catch (err) {
            error.value = (err as Error).message
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Export Failed',
                description: error.value,
                duration: 7500,
            })
        } finally {
            isExporting.value = false
        }
    }

    return {
        isExporting,
        error,
        exportDocuments,
    }
}
