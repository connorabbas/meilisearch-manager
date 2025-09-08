import { twMerge } from 'tailwind-merge';
import { mergeProps } from 'vue';

export const ptViewMerge = (
    globalPTProps = {} as any,
    selfPTProps = {} as any,
    datasets: any
) => {
    const { class: globalClass, ...globalRest } = globalPTProps;
    const { class: selfClass, ...selfRest } = selfPTProps;

    return mergeProps(
        { class: twMerge(globalClass, selfClass) },
        globalRest,
        selfRest,
        datasets
    );
};

export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function maskedApiKey(
    key: string,
    visibleStart: number = 8,
    visibleEnd: number = 6
): string {
    if (!key || key.length <= visibleStart + visibleEnd) {
        return '******************';
    }
    const start = key.slice(0, visibleStart);
    const end = key.slice(-visibleEnd);

    return `${start}****${end}`;
}

export function getStatusSeverity(status: string) {
    switch (status) {
    case 'succeeded':
        return 'success';
    case 'processing':
        return 'info';
    case 'enqueued':
        return 'secondary';
    case 'failed':
        return 'danger';
    case 'canceled':
        return 'warn';
    default:
        return 'secondary';
    }
}

export const looksLikeAnImageUrl = (value: any) => {
    if ('string' !== typeof value) {
        return false;
    }
    if (!value.startsWith('http')) {
        return false;
    }
    const url = new URL(value);
    const path = url.pathname.toLowerCase();
    return (
        path.endsWith('.jpg') ||
        path.endsWith('.jpeg') ||
        path.endsWith('.gif') ||
        path.endsWith('.png') ||
        path.endsWith('.webp')
    );
};