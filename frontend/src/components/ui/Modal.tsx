import { useEffect } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}

export default function Modal({ title, onClose, children, width = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-secondary rounded-xl w-full ${width} mx-4 app-shadow`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-default">
          <h2 className="font-semibold text-primary text-base">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover-bg flex items-center justify-center text-secondary hover:text-primary transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
