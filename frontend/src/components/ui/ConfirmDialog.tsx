import Modal from './Modal'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  loading,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-secondary text-sm mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-secondary text-sm rounded-lg hover-bg transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-40 transition-colors ${
            danger
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-accent text-on-accent hover:bg-[var(--accent-hover)]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
