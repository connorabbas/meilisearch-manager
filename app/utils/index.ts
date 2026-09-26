import type { TaskStatus } from 'meilisearch'
import type { TaskStatusColor } from '@/types'
export const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
}

export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function maskedApiKey(
    key: string,
    visibleStart: number = 8,
    visibleEnd: number = 6
): string {
    if (!key || key.length <= visibleStart + visibleEnd) {
        return '******************'
    }
    const start = key.slice(0, visibleStart)
    const end = key.slice(-visibleEnd)

    return `${start}****${end}`
}

export function getTaskStatusColor(status: TaskStatus): TaskStatusColor {
    switch (status) {
    case 'succeeded':
        return 'success'
    case 'processing':
        return 'info'
    case 'enqueued':
        return 'neutral'
    case 'failed':
        return 'error'
    case 'canceled':
        return 'warning'
    default:
        return 'neutral'
    }
}

export function getRankingScoreColor(score: number): 'success' | 'warning' | 'error' | 'neutral' {
    if (score >= 0.7) return 'success'
    if (score >= 0.5) return 'warning'
    if (score > 0) return 'error'
    return 'neutral'
}

export function looksLikeAnImageUrl(value: any) {
    if ('string' !== typeof value) {
        return false
    }
    if (!value.startsWith('http')) {
        return false
    }
    let url: URL
    try {
        url = new URL(value)
    } catch {
        return false
    }
    const path = url.pathname.toLowerCase()

    const hasImageExtension =
        path.includes('.jpg') ||
        path.includes('.jpeg') ||
        path.includes('.gif') ||
        path.includes('.png') ||
        path.includes('.webp')

    const IMAGE_HOSTING_DOMAINS = [
        'i.imgur.com',
        'imgur.com',
        'i.redd.it',
        'pbs.twimg.com',
        'images.unsplash.com',
        'cdn.pixabay.com',
        'images.pexels.com',
        'storage.googleapis.com',
        'amazonaws.com',
        'cloudfront.net',
        'cdn.discordapp.com',
        'media.discordapp.net',
        'images.squarespace-cdn.com',
        'static.wixstatic.com',
        'framerusercontent.com',
        'imagedelivery.net',
        'res.cloudinary.com',
        'images.ctfassets.net'
    ]
    const isImageHost = IMAGE_HOSTING_DOMAINS.some(domain =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    )

    return hasImageExtension || isImageHost
};

export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
                resolve(event.target.result)
            } else {
                reject(new Error('Failed to read file as text.'))
            }
        }

        reader.onerror = (event) => {
            reject(event.target?.error || new Error('Failed to read file as text.'))
        }

        reader.readAsText(file)
    })
}

export function camelCaseToReadable(str: string): string {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str.charAt(0).toUpperCase())
        .trim()
}

export function isVersionAtLeast(version: string, target: string): boolean {
    const parse = (v: string) => v.replace(/^v/, '').replace(/[-+].*$/, '').split('.').map(Number)
    const vParts = parse(version)
    const tParts = parse(target)
    const maxLen = Math.max(vParts.length, tParts.length)

    for (let i = 0; i < maxLen; i++) {
        const v = vParts[i] ?? 0
        const t = tParts[i] ?? 0
        if (v > t) return true
        if (v < t) return false
    }
    return true
}

export function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
