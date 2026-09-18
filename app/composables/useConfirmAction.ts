import ConfirmActionModal from '@/components/ConfirmActionModal.vue'

export interface ConfirmActionOptions {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

export function useConfirmAction() {
    const overlay = useOverlay()
    const confirmation = overlay.create(ConfirmActionModal)

    async function confirmAction(
        options: ConfirmActionOptions,
        onConfirm?: () => void | Promise<void>,
    ): Promise<boolean> {
        const instance = confirmation.open(options)
        const confirmed = await instance.result

        if (!confirmed) {
            return false
        }

        await onConfirm?.()
        return true
    }

    return { confirmAction }
}
