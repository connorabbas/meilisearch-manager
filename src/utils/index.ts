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