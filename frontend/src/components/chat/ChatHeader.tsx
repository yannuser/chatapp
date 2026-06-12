import { useState } from 'react'
import { differenceInYears, format, parseISO } from 'date-fns'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
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
  const [showInfo, setShowInfo] = useState(false)
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
      <button
        onClick={() => setShowInfo(true)}
        className="w-9 h-9 rounded-full hover-bg flex items-center justify-center text-secondary hover:text-primary transition-colors flex-shrink-0"
        title={props.type === 'dm' ? 'Contact info' : 'Group info'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {showInfo && props.type === 'dm' && (
        <UserInfoModal user={props.user} isOnline={isOnline} onClose={() => setShowInfo(false)} />
      )}
      {showInfo && props.type === 'group' && (
        <GroupInfoModal group={props.group} onClose={() => setShowInfo(false)} />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-secondary text-xs">{label}</p>
      <p className="text-primary text-sm">{value}</p>
    </div>
  )
}

function UserInfoModal({ user, isOnline, onClose }: { user: UserResponse; isOnline: boolean; onClose: () => void }) {
  const name = `${user.first_name} ${user.last_name}`
  const birthdate = user.birthdate ? parseISO(user.birthdate) : null
  return (
    <Modal title="Contact info" onClose={onClose}>
      <div className="flex items-center gap-3 mb-5">
        <Avatar name={name} size="lg" online={isOnline} />
        <div>
          <p className="font-semibold text-primary text-base">{name}</p>
          <p className="text-secondary text-xs">{isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>
      <div className="space-y-3">
        <InfoRow label="Username" value={`@${user.username}`} />
        <InfoRow label="Email" value={user.email} />
        {birthdate && (
          <InfoRow
            label="Birthdate"
            value={`${format(birthdate, 'MMMM d, yyyy')} (${differenceInYears(new Date(), birthdate)} years old)`}
          />
        )}
      </div>
    </Modal>
  )
}

function GroupInfoModal({ group, onClose }: { group: GroupResponse; onClose: () => void }) {
  const onlineUsers = usePresenceStore((s) => s.onlineUsers)
  return (
    <Modal title="Group info" onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={group.title} size="lg" group />
        <div>
          <p className="font-semibold text-primary text-base">{group.title}</p>
          <p className="text-secondary text-xs">
            Created {format(parseISO(group.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>
      {group.description && (
        <p className="text-primary text-sm mb-4">{group.description}</p>
      )}
      <p className="text-secondary text-xs font-medium mb-2">
        {group.members.length} members
      </p>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {group.members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            <Avatar
              name={`${m.first_name} ${m.last_name}`}
              size="sm"
              online={onlineUsers.has(m.id)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-primary text-sm truncate">
                {m.first_name} {m.last_name}
                {m.id === group.creator.id && (
                  <span className="text-secondary text-xs ml-1.5">(creator)</span>
                )}
              </p>
              <p className="text-secondary text-xs truncate">@{m.username}</p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
