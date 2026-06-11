import { useTypingStore } from '../../stores/typingStore'
import { useAuthStore } from '../../stores/authStore'

interface Props {
  roomId: string
  memberNames: Record<string, string>
}

export default function TypingIndicator({ roomId, memberNames }: Props) {
  const me = useAuthStore((s) => s.user?.id)
  const typers = useTypingStore((s) => (s.typing[roomId] ?? []).filter((id) => id !== me))

  if (!typers.length) return null

  const label =
    typers.length === 1
      ? `${memberNames[typers[0]] ?? 'Someone'} is typing`
      : `${typers.length} people are typing`

  return (
    <div className="flex items-center gap-2 px-4 pb-2">
      <div className="flex gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="text-secondary text-xs">{label}</span>
    </div>
  )
}
