import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, isToday, parseISO } from 'date-fns'
import Avatar from '../ui/Avatar'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useChatStore } from '../../stores/chatStore'
import { usePresenceStore } from '../../stores/presenceStore'
import { useMute } from '../../hooks/useSettings'
import { deleteConversation } from '../../api/conversations'
import { useToastStore } from '../../stores/toastStore'

interface Props {
  unreadId: string
  presenceUserId?: string
  name: string
  lastMessage?: string
  timestamp?: string
  isGroup: boolean
  isActive: boolean
  onClick: () => void
}

function fmtTime(ts?: string) {
  if (!ts) return ''
  const d = parseISO(ts)
  return isToday(d) ? format(d, 'HH:mm') : format(d, 'MMM d')
}

export default function ConversationItem({
  unreadId, presenceUserId, name, lastMessage, timestamp, isGroup, isActive, onClick,
}: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  const { isMuted, toggle: toggleMute } = useMute()
  const unread = useChatStore((s) => s.unreadCounts[unreadId] ?? 0)
  const isOnline = usePresenceStore(
    (s) => !!presenceUserId && s.onlineUsers.has(presenceUserId)
  )
  const [menu, setMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const muted = isMuted(unreadId, isGroup)

  useEffect(() => {
    if (!menu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menu])

  const del = useMutation({
    mutationFn: () => deleteConversation(unreadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      addToast('Conversation deleted', 'success')
      setConfirmDelete(false)
      if (isActive) navigate('/')
    },
    onError: () => addToast('Could not delete conversation'),
  })

  return (
    <div className={`relative group ${isActive ? 'bg-hover' : 'hover-bg'}`}>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <Avatar name={name} size="md" online={!isGroup ? isOnline : undefined} group={isGroup} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary text-sm truncate flex items-center gap-1">
              {name}
              {muted && (
                <svg className="w-3.5 h-3.5 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Muted">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.9 17.9 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5M3 3l18 18" />
                </svg>
              )}
            </span>
            <span className="text-secondary text-xs ml-2 flex-shrink-0 group-hover:opacity-0 transition-opacity">{fmtTime(timestamp)}</span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-secondary text-xs truncate">{lastMessage ?? ''}</span>
            {unread > 0 && (
              <span className={`ml-2 flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold ${muted ? 'bg-secondary text-secondary' : 'bg-accent text-on-accent'}`}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
        </div>
      </button>

      <div ref={menuRef} className="absolute top-2.5 right-3">
        <button
          onClick={() => setMenu((v) => !v)}
          className={`w-7 h-7 rounded-full hover-bg flex items-center justify-center text-secondary hover:text-primary transition-opacity ${menu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          title="More"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 7a2 2 0 110-4 2 2 0 010 4zm0 7a2 2 0 110-4 2 2 0 010 4zm0 7a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {menu && (
          <div className="absolute right-0 top-8 z-30 bg-secondary border border-default rounded-xl app-shadow py-1 text-sm min-w-[170px]">
            <button
              className="w-full px-4 py-2 text-left text-primary hover-bg"
              onClick={() => { toggleMute(unreadId, isGroup); setMenu(false) }}
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
            {!isGroup && (
              <button
                className="w-full px-4 py-2 text-left text-danger hover-bg"
                onClick={() => { setConfirmDelete(true); setMenu(false) }}
              >
                Delete conversation
              </button>
            )}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete conversation"
          message={`Delete your conversation with ${name}? This removes it for everyone.`}
          confirmLabel="Delete"
          danger
          loading={del.isPending}
          onConfirm={() => del.mutate()}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
