import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getConversations } from '../../api/conversations'
import { getGroups } from '../../api/groups'
import { useAuthStore } from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'
import ConversationItem from './ConversationItem'
import Avatar from '../ui/Avatar'
import { ConversationSkeleton } from '../ui/Skeleton'
import NewConversationModal from '../modals/NewConversationModal'
import NewGroupModal from '../modals/NewGroupModal'

export default function Sidebar() {
  const [search, setSearch] = useState('')
  const [fab, setFab] = useState(false)
  const [showNewDm, setShowNewDm] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { activeConversationId, activeGroupId, lastMessages, setActiveConversation, setActiveGroup, clearUnread } = useChatStore()

  const { data: convos, isLoading: loadingConvos } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })
  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  })

  const items = useMemo(() => {
    const dmItems = (convos ?? []).map((c) => {
      const other = c.members.find((m) => m.id !== user?.id) ?? c.members[0]
      const last = lastMessages[c.id]
      return {
        id: c.id,
        name: `${other.first_name} ${other.last_name}`,
        lastMessage: last?.kind === 'dm' ? last.msg.content : undefined,
        timestamp: c.updated_at ?? c.created_at,
        isGroup: false as const,
        contactId: other.id,
      }
    })
    const groupItems = (groups ?? []).map((g) => {
      const last = lastMessages[g.id]
      return {
        id: g.id,
        name: g.title,
        lastMessage: last?.kind === 'group' ? last.msg.content : undefined,
        timestamp: g.updated_at ?? g.created_at,
        isGroup: true as const,
        contactId: g.id,
      }
    })
    return [...dmItems, ...groupItems]
      .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [convos, groups, user, lastMessages, search])

  const loading = loadingConvos || loadingGroups

  return (
    <aside
      className="w-[360px] flex-shrink-0 flex flex-col h-full bg-secondary border-r border-default"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-default">
        <Avatar name={user ? `${user.first_name} ${user.last_name}` : '?'} size="md" />
        <span className="font-semibold text-primary text-base flex-1 truncate">
          {user ? `${user.first_name} ${user.last_name}` : ''}
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-default">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-2 outline-none border border-default focus:border-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto relative">
        {loading && [...Array(6)].map((_, i) => <ConversationSkeleton key={i} />)}
        {!loading && items.length === 0 && (
          <p className="text-secondary text-sm text-center mt-8">No conversations yet</p>
        )}
        {!loading && items.map((item) => (
          <ConversationItem
            key={item.id}
            id={item.isGroup ? item.id : item.contactId}
            name={item.name}
            lastMessage={item.lastMessage}
            timestamp={item.timestamp}
            isGroup={item.isGroup}
            isActive={item.isGroup ? activeGroupId === item.id : activeConversationId === item.id}
            onClick={() => {
              clearUnread(item.id)
              if (item.isGroup) {
                setActiveGroup(item.id)
                navigate(`/groups/${item.id}`)
              } else {
                setActiveConversation(item.id)
                navigate(`/conversations/${item.id}`)
              }
            }}
          />
        ))}

        {/* FAB */}
        <div className="absolute bottom-4 right-4">
          {fab && (
            <div className="absolute bottom-12 right-0 bg-secondary rounded-xl app-shadow border border-default overflow-hidden text-sm">
              <button
                className="w-full px-4 py-3 text-left text-primary hover-bg transition-colors"
                onClick={() => { setShowNewDm(true); setFab(false) }}
              >
                New conversation
              </button>
              <button
                className="w-full px-4 py-3 text-left text-primary hover-bg transition-colors"
                onClick={() => { setShowNewGroup(true); setFab(false) }}
              >
                New group
              </button>
            </div>
          )}
          <button
            onClick={() => setFab((v) => !v)}
            className="w-12 h-12 rounded-full bg-accent hover:bg-[var(--accent-hover)] text-on-accent flex items-center justify-center app-shadow transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-3 border-t border-default flex items-center justify-end">
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full hover-bg flex items-center justify-center text-secondary hover:text-primary transition-colors"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {showNewDm && <NewConversationModal onClose={() => setShowNewDm(false)} />}
      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
    </aside>
  )
}
