import { format, isToday, parseISO } from 'date-fns'
import Avatar from '../ui/Avatar'
import { useChatStore } from '../../stores/chatStore'
import { usePresenceStore } from '../../stores/presenceStore'

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
  const unread = useChatStore((s) => s.unreadCounts[unreadId] ?? 0)
  const isOnline = usePresenceStore(
    (s) => !!presenceUserId && s.onlineUsers.has(presenceUserId)
  )

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-hover' : 'hover-bg'}`}
    >
      <Avatar name={name} size="md" online={!isGroup ? isOnline : undefined} group={isGroup} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-primary text-sm truncate">{name}</span>
          <span className="text-secondary text-xs ml-2 flex-shrink-0">{fmtTime(timestamp)}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-secondary text-xs truncate">{lastMessage ?? ''}</span>
          {unread > 0 && (
            <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-accent text-on-accent text-xs flex items-center justify-center font-semibold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
