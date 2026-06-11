import { differenceInYears, parseISO } from 'date-fns'
import Avatar from '../ui/Avatar'
import { usePresenceStore } from '../../stores/presenceStore'
import type { UserResponse, GroupResponse } from '../../types/api'

interface DmProps {
  type: 'dm'
  user: UserResponse
}
interface GroupProps {
  type: 'group'
  group: GroupResponse
}
type Props = DmProps | GroupProps

export default function ChatHeader(props: Props) {
  const isOnline = usePresenceStore((s) =>
    props.type === 'dm' ? s.onlineUsers.has(props.user.id) : false
  )

  const name = props.type === 'dm'
    ? `${props.user.first_name} ${props.user.last_name}`
    : props.group.title

  const sub = props.type === 'dm'
    ? (isOnline ? (
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-[var(--online)]" />
          <span className="text-online">Online</span>
        </span>
      ) : (
        <span className="text-secondary text-xs">Offline</span>
      ))
    : <span className="text-secondary text-xs">{props.group.members.length} members</span>

  const age = props.type === 'dm' && props.user.birthdate
    ? differenceInYears(new Date(), parseISO(props.user.birthdate))
    : null

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-secondary border-b border-default flex-shrink-0">
      <Avatar
        name={name}
        size="md"
        online={props.type === 'dm' ? isOnline : undefined}
        group={props.type === 'group'}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-primary text-base truncate">{name}</h2>
          {age !== null && (
            <span className="text-secondary text-xs flex-shrink-0">{age} years old</span>
          )}
        </div>
        {sub}
      </div>
    </div>
  )
}
