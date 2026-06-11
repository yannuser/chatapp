import { useToastStore } from '../../stores/toastStore'

export default function Toaster() {
  const { toasts, removeToast } = useToastStore()
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 min-w-[280px]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-on-accent text-sm font-medium app-shadow cursor-pointer ${
            t.type === 'error' ? 'bg-danger' : t.type === 'success' ? 'bg-[var(--online)]' : 'bg-accent'
          }`}
          onClick={() => removeToast(t.id)}
        >
          <span className="flex-1">{t.message}</span>
          <button className="opacity-70 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  )
}
