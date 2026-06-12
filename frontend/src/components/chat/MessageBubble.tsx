import { useState, useRef, useEffect } from 'react'
import { format, isToday, parseISO } from 'date-fns'

interface ContextMenu {
  x: number
  y: number
}

interface Props {
  id: string
  content: string
  senderName: string
  timestamp: string
  isMine: boolean
  showSenderName: boolean
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
}

function fmtTime(ts: string) {
  const d = parseISO(ts)
  return isToday(d) ? format(d, 'HH:mm') : format(d, 'MMM d, HH:mm')
}

export default function MessageBubble({
  id, content, senderName, timestamp, isMine, showSenderName, onEdit, onDelete,
}: Props) {
  const [menu, setMenu] = useState<ContextMenu | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(content)
  const editRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menu])

  const handleContext = (e: React.MouseEvent) => {
    if (!isMine) return
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const submitEdit = () => {
    if (editValue.trim() && editValue !== content) onEdit(id, editValue.trim())
    setEditing(false)
  }

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-1 group`}>
      {showSenderName && !isMine && (
        <span className="text-xs font-medium text-secondary px-1 mb-0.5">{senderName}</span>
      )}
      <div
        onContextMenu={handleContext}
        className={`max-w-[70%] px-3 py-2 relative ${
          isMine ? 'bubble-sent bg-msg-sent text-on-accent' : 'bubble-received bg-msg-received text-primary'
        } app-shadow`}
      >
        {editing ? (
          <textarea
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit() }
              if (e.key === 'Escape') setEditing(false)
            }}
            className="bg-transparent outline-none resize-none text-sm w-full min-w-[160px]"
            rows={1}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        )}
        <span className={`text-[11px] mt-1 block text-right ${isMine ? 'text-on-accent/70' : 'text-secondary'}`}>
          {fmtTime(timestamp)}
        </span>
      </div>

      {menu && (
        <div
          className="fixed z-50 bg-secondary border border-default rounded-xl app-shadow py-1 text-sm min-w-[140px]"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-primary hover-bg"
            onClick={() => { setEditing(true); setEditValue(content); setMenu(null) }}
          >
            Edit
          </button>
          <button
            className="w-full px-4 py-2 text-left text-danger hover-bg"
            onClick={() => { onDelete(id); setMenu(null) }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
