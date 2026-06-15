import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import Modal from '../ui/Modal'
import type { ReplyPreview, EditEntry, ReactionGroup } from '../../types/api'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡']

interface ContextMenu { x: number; y: number }

interface Props {
  id: string
  content: string
  senderName: string
  timestamp: string
  isMine: boolean
  isDeleted?: boolean
  showSenderName: boolean
  currentUserId: string
  replyTo?: ReplyPreview | null
  edits?: EditEntry[]
  reactions?: ReactionGroup[]
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onReply: (preview: ReplyPreview) => void
  onReact: (id: string, emoji: string) => void
}

function fmtTime(ts: string) {
  return format(parseISO(ts), 'HH:mm')
}

export default function MessageBubble({
  id, content, senderName, timestamp, isMine, isDeleted, showSenderName,
  currentUserId, replyTo, edits, reactions, onEdit, onDelete, onReply, onReact,
}: Props) {
  const [menu, setMenu] = useState<ContextMenu | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(content)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menu])

  useEffect(() => {
    if (!showEmojiPicker) return
    const close = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [showEmojiPicker])

  const handleContext = (e: React.MouseEvent) => {
    if (!isMine || isDeleted) return
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const submitEdit = () => {
    if (editValue.trim() && editValue !== content) onEdit(id, editValue.trim())
    setEditing(false)
  }

  const handleReply = () => {
    onReply({ id, content: isDeleted ? '' : content, sender_name: senderName, is_deleted: !!isDeleted })
  }

  const isEdited = !!(edits && edits.length > 0)

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-1 group/msg`}>
      {showSenderName && !isMine && (
        <span className="text-xs font-medium text-secondary px-1 mb-0.5">{senderName}</span>
      )}

      <div
        onContextMenu={handleContext}
        className={`relative max-w-[70%] min-w-[4.5rem] px-3 py-2 ${
          isMine
            ? 'bubble-sent bg-msg-sent text-on-accent'
            : 'bubble-received bg-msg-received text-primary'
        } app-shadow ${isDeleted ? 'opacity-60' : ''}`}
      >
        {replyTo && (
          <div className={`mb-1.5 px-2 py-1 rounded-lg border-l-2 border-current text-xs cursor-pointer opacity-80 ${
            isMine ? 'bg-black/10' : 'bg-black/5'
          }`}>
            <p className="font-semibold truncate">{replyTo.sender_name}</p>
            <p className="truncate opacity-80">
              {replyTo.is_deleted ? 'This message was deleted' : replyTo.content}
            </p>
          </div>
        )}

        {isDeleted ? (
          <p className="text-sm italic">This message was deleted</p>
        ) : editing ? (
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

        <div className="flex items-center justify-end gap-1.5 mt-1">
          {isEdited && !isDeleted && (
            <button
              onClick={() => setShowHistory(true)}
              className={`text-[10px] hover:underline flex-shrink-0 ${isMine ? 'text-on-accent/60' : 'text-secondary'}`}
            >
              edited
            </button>
          )}
          <span className={`text-[11px] flex-shrink-0 ${isMine ? 'text-on-accent/70' : 'text-secondary'}`}>
            {fmtTime(timestamp)}
          </span>
        </div>

        <div
          className={`absolute top-0 z-10 flex gap-0.5 ${
            isMine ? 'right-full pr-1' : 'left-full pl-1'
          } ${
            isDeleted
              ? 'invisible pointer-events-none'
              : 'opacity-0 group-hover/msg:opacity-100 transition-opacity'
          }`}
        >
          <button
            onClick={handleReply}
            title="Reply"
            className="w-7 h-7 rounded-full hover-bg flex items-center justify-center text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <div ref={emojiRef} className="relative">
            <button
              onClick={() => setShowEmojiPicker((v) => !v)}
              title="React"
              className="w-7 h-7 rounded-full hover-bg flex items-center justify-center text-secondary hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <div className={`absolute bottom-8 z-50 flex gap-1 p-1.5 bg-secondary rounded-xl border border-default app-shadow ${
                isMine ? 'right-0' : 'left-0'
              }`}>
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onReact(id, emoji); setShowEmojiPicker(false) }}
                    className="text-base w-8 h-8 flex items-center justify-center hover:scale-125 transition-transform rounded-lg hover-bg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {reactions && reactions.length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-1 max-w-[70%] ${isMine ? 'justify-end' : 'justify-start'}`}>
          {reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onReact(id, r.emoji)}
              className={`text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                r.user_ids.includes(currentUserId)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-default hover-bg text-primary'
              }`}
            >
              {r.emoji} {r.user_ids.length}
            </button>
          ))}
        </div>
      )}

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

      {showHistory && edits && (
        <Modal title="Edit history" onClose={() => setShowHistory(false)}>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {[...edits].reverse().map((e, i) => (
              <div key={i} className="text-sm border border-default rounded-lg p-3">
                <p className="text-secondary text-xs mb-1">{format(parseISO(e.edited_at), 'MMM d, HH:mm')}</p>
                <p className="text-primary whitespace-pre-wrap">{e.content}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
