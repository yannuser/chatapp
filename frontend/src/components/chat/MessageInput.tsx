import { useState, useRef, useCallback, useEffect } from 'react'
import type { ReplyPreview } from '../../types/api'

interface Props {
  onSend: (content: string) => void
  onTyping: (isTyping: boolean) => void
  replyingTo?: ReplyPreview | null
  onCancelReply?: () => void
  disabled?: boolean
}

export default function MessageInput({ onSend, onTyping, replyingTo, onCancelReply, disabled }: Props) {
  const [value, setValue] = useState('')
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus()
  }, [replyingTo])

  const emitTyping = useCallback((typing: boolean) => {
    if (isTypingRef.current !== typing) {
      isTypingRef.current = typing
      onTyping(typing)
    }
  }, [onTyping])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    emitTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => emitTyping(false), 2000)
  }

  const send = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    emitTyping(false)
    if (typingTimer.current) clearTimeout(typingTimer.current)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    if (e.key === 'Escape' && replyingTo) onCancelReply?.()
  }

  return (
    <div className="bg-secondary border-t border-default flex-shrink-0">
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-default">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-accent">Replying to {replyingTo.sender_name}</p>
            <p className="text-xs text-secondary truncate">
              {replyingTo.is_deleted ? 'This message was deleted' : replyingTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="w-6 h-6 rounded-full hover-bg flex items-center justify-center text-secondary hover:text-primary flex-shrink-0"
            aria-label="Cancel reply"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex items-end gap-2 px-4 py-3">
        <textarea
          ref={textareaRef}
          className="auto-resize flex-1 bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-2.5 outline-none border border-default focus:border-accent transition-colors"
          placeholder="Type a message"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKey}
          rows={1}
          disabled={disabled}
        />
        <button
          onClick={send}
          disabled={!value.trim() || disabled}
          className="w-10 h-10 rounded-full bg-accent hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-on-accent flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
