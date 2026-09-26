import ConfirmActionModal from '@/components/ConfirmActionModal.vue'

import type { ConfirmActionOptions } from '@/types'

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
