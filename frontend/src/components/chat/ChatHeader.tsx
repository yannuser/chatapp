import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { differenceInYears, format, parseISO } from 'date-fns'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import EditGroupModal from '../modals/EditGroupModal'
import { usePresenceStore } from '../../stores/presenceStore'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { useMute, useSettings } from '../../hooks/useSettings'
import { getContacts, addContact, removeContact } from '../../api/contacts'
import { blockUser, unblockUser } from '../../api/settings'
import { deleteConversation } from '../../api/conversations'
import { deleteGroup, leaveGroup } from '../../api/groups'
import { apiErrorDetail } from '../../lib/apiError'
import type { UserResponse, GroupResponse } from '../../types/api'

interface DmProps {
  type: 'dm'
  user: UserResponse
  conversationId: string
}
interface GroupProps {
  type: 'group'
  group: GroupResponse
}
type Props = DmProps | GroupProps

export default function ChatHeader(props: Props) {
  const me = useAuthStore((s) => s.user!)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  const { isMuted, toggle: toggleMute } = useMute()
  const { data: settings } = useSettings()

  const [showInfo, setShowInfo] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isDm = props.type === 'dm'
  const dmUser = props.type === 'dm' ? props.user : undefined
  const roomId = props.type === 'dm' ? props.conversationId : props.group.id
  const muted = isMuted(roomId, !isDm)
  const isCreator = props.type === 'group' && props.group.creator.id === me.id
  const isBlocked = !!dmUser && (settings?.blocked_users.includes(dmUser.id) ?? false)

  const isOnline = usePresenceStore((s) =>
    props.type === 'dm' ? s.onlineUsers.has(props.user.id) : false
  )

  const { data: contactList } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
    retry: false,
    enabled: isDm,
  })
  const isContact = !!dmUser && (contactList?.contacts.some((c) => c.id === dmUser.id) ?? false)

  useEffect(() => {
    if (!menu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menu])

  const contactMut = useMutation({
    mutationFn: () => (isContact ? removeContact(dmUser!.id) : addContact(dmUser!.id)),
    onSuccess: (updated) => {
      qc.setQueryData(['contacts'], updated)
      addToast(isContact ? 'Contact removed' : 'Contact added', 'success')
    },
    onError: (e) => addToast(apiErrorDetail(e, 'Could not update contacts')),
  })

  const blockMut = useMutation({
    mutationFn: () => (isBlocked ? unblockUser(dmUser!.id) : blockUser(dmUser!.id)),
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated)
      addToast(isBlocked ? 'User unblocked' : 'User blocked', 'success')
    },
    onError: (e) => addToast(apiErrorDetail(e, 'Could not update block list')),
  })

  const del = useMutation({
    mutationFn: () => (isDm ? deleteConversation(roomId) : deleteGroup(roomId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: isDm ? ['conversations'] : ['groups'] })
      addToast(isDm ? 'Conversation deleted' : 'Group deleted', 'success')
      setConfirmDelete(false)
      navigate('/')
    },
    onError: (e) => addToast(apiErrorDetail(e, 'Could not delete')),
  })

  const leave = useMutation({
    mutationFn: () => leaveGroup(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      addToast('Left group', 'success')
      setConfirmLeave(false)
      navigate('/')
    },
    onError: (e) => addToast(apiErrorDetail(e, 'Could not leave group')),
  })

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

  const menuItem = 'w-full px-4 py-2.5 text-left hover-bg'

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
          {muted && (
            <svg className="w-4 h-4 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Muted">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.9 17.9 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5M3 3l18 18" />
            </svg>
          )}
          {age !== null && (
            <span className="text-secondary text-xs flex-shrink-0">{age} years old</span>
          )}
        </div>
        {sub}
      </div>

      <div ref={menuRef} className="relative flex-shrink-0">
        <button
          onClick={() => setMenu((v) => !v)}
          className="w-9 h-9 rounded-full hover-bg flex items-center justify-center text-secondary hover:text-primary transition-colors"
          title="Options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 7a2 2 0 110-4 2 2 0 010 4zm0 7a2 2 0 110-4 2 2 0 010 4zm0 7a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {menu && (
          <div className="absolute right-0 top-11 z-30 bg-secondary border border-default rounded-xl app-shadow py-1 text-sm min-w-[200px]">
            <button className={`${menuItem} text-primary`} onClick={() => { setShowInfo(true); setMenu(false) }}>
              {isDm ? 'Contact info' : 'Group info'}
            </button>
            <button className={`${menuItem} text-primary`} onClick={() => { toggleMute(roomId, !isDm); setMenu(false) }}>
              {muted ? 'Unmute' : 'Mute'}
            </button>

            {isDm && (
              <>
                <button className={`${menuItem} text-primary`} onClick={() => { contactMut.mutate(); setMenu(false) }}>
                  {isContact ? 'Remove from contacts' : 'Add to contacts'}
                </button>
                <button className={`${menuItem} text-danger`} onClick={() => { blockMut.mutate(); setMenu(false) }}>
                  {isBlocked ? 'Unblock user' : 'Block user'}
                </button>
              </>
            )}

            {isCreator && (
              <button className={`${menuItem} text-primary`} onClick={() => { setShowEdit(true); setMenu(false) }}>
                Manage group
              </button>
            )}

            {(isDm || isCreator) && (
              <button className={`${menuItem} text-danger`} onClick={() => { setConfirmDelete(true); setMenu(false) }}>
                {isDm ? 'Delete conversation' : 'Delete group'}
              </button>
            )}

            {props.type === 'group' && !isCreator && (
              <button className={`${menuItem} text-danger`} onClick={() => { setConfirmLeave(true); setMenu(false) }}>
                Leave group
              </button>
            )}
          </div>
        )}
      </div>

      {showInfo && props.type === 'dm' && (
        <UserInfoModal user={props.user} isOnline={isOnline} onClose={() => setShowInfo(false)} />
      )}
      {showInfo && props.type === 'group' && (
        <GroupInfoModal group={props.group} onClose={() => setShowInfo(false)} />
      )}
      {showEdit && props.type === 'group' && (
        <EditGroupModal group={props.group} onClose={() => setShowEdit(false)} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={isDm ? 'Delete conversation' : 'Delete group'}
          message={
            isDm
              ? `Delete your conversation with ${name}? This removes it for everyone.`
              : `Delete "${name}"? This permanently removes the group and its messages for all members.`
          }
          confirmLabel="Delete"
          danger
          loading={del.isPending}
          onConfirm={() => del.mutate()}
          onClose={() => setConfirmDelete(false)}
        />
      )}
      {confirmLeave && props.type === 'group' && (
        <ConfirmDialog
          title="Leave group"
          message={`Leave "${name}"? You'll stop receiving its messages.`}
          confirmLabel="Leave"
          danger
          loading={leave.isPending}
          onConfirm={() => leave.mutate()}
          onClose={() => setConfirmLeave(false)}
        />
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
