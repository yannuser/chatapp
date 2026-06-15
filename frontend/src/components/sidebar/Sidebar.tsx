import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getConversations } from '../../api/conversations'
import { getGroups } from '../../api/groups'
import { searchMessages } from '../../api/search'
import { useAuthStore } from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'
import ConversationItem from './ConversationItem'
import Avatar from '../ui/Avatar'
import { ConversationSkeleton } from '../ui/Skeleton'
import NewConversationModal from '../modals/NewConversationModal'
import NewGroupModal from '../modals/NewGroupModal'
import { format, isToday, parseISO } from 'date-fns'

function lastMessageText(
  liveContent: string | undefined,
  liveDeleted: boolean | undefined,
  previewContent: string | undefined,
  previewDeleted: boolean | undefined,
): string | undefined {
  if (liveContent !== undefined) return liveDeleted ? 'Message deleted' : liveContent
  if (previewContent !== undefined) return previewDeleted ? 'Message deleted' : previewContent
  return undefined
}

function fmtSearchTime(ts: string) {
  const d = parseISO(ts)
  return isToday(d) ? format(d, 'HH:mm') : format(d, 'MMM d')
}

export default function Sidebar() {
  const [search, setSearch] = useState('')
  const [fab, setFab] = useState(false)
  const [showNewDm, setShowNewDm] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fabRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const isRoot = location.pathname === '/'
  const user = useAuthStore((s) => s.user)
  const { activeConversationId, activeGroupId, lastMessages } = useChatStore()

  useEffect(() => {
    if (!fab) return
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFab(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [fab])

  useEffect(() => {
    if (searchMode) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearchQuery('')
    }
  }, [searchMode])

  const { data: convos, isLoading: loadingConvos } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })
  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  })

  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchMessages(debouncedQuery),
    enabled: searchMode && debouncedQuery.length >= 2,
    staleTime: 30_000,
  })

  const items = useMemo(() => {
    const dmItems = (convos?.conversations ?? []).map((c) => {
      const other = c.members.find((m) => m.id !== user?.id) ?? c.members[0]
      const live = lastMessages[c.id]
      const liveMsg = live?.kind === 'dm' ? live.msg : undefined
      return {
        id: c.id,
        name: `${other.first_name} ${other.last_name}`,
        lastMessage: lastMessageText(
          liveMsg?.content,
          liveMsg?.is_deleted,
          c.last_message?.content,
          c.last_message?.is_deleted,
        ),
        timestamp: liveMsg?.sent_at ?? c.last_message?.sent_at ?? c.updated_at ?? c.created_at,
        isGroup: false as const,
        contactId: other.id,
      }
    })
    const groupItems = (groups?.groups ?? []).map((g) => {
      const live = lastMessages[g.id]
      const liveMsg = live?.kind === 'group' ? live.msg : undefined
      return {
        id: g.id,
        name: g.title,
        lastMessage: lastMessageText(
          liveMsg?.content,
          liveMsg?.is_deleted,
          g.last_message?.content,
          g.last_message?.is_deleted,
        ),
        timestamp: liveMsg?.sent_at ?? g.last_message?.sent_at ?? g.updated_at ?? g.created_at,
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
      className={`
        flex flex-col h-full bg-secondary border-r border-default
        fixed inset-0 z-50 transition-transform duration-300
        md:relative md:inset-auto md:z-auto md:translate-x-0 md:w-[360px] md:flex-shrink-0 md:transition-none
        ${isRoot ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-default">
        {searchMode ? (
          <>
            <button
              onClick={() => setSearchMode(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover-bg text-secondary hover:text-primary transition-colors flex-shrink-0"
              aria-label="Close search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-semibold text-primary text-base flex-1">Search messages</span>
          </>
        ) : (
          <>
            <Avatar name={user ? `${user.first_name} ${user.last_name}` : '?'} size="md" />
            <span className="font-semibold text-primary text-base flex-1 truncate">
              {user ? `${user.first_name} ${user.last_name}` : ''}
            </span>
            <button
              onClick={() => setSearchMode(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover-bg text-secondary hover:text-primary transition-colors flex-shrink-0"
              title="Search messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {searchMode ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-3 py-2 border-b border-default">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in messages..."
              className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-2 outline-none border border-default focus:border-accent transition-colors"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {searchQuery.length < 2 && (
              <p className="text-secondary text-xs text-center mt-8 px-4">
                Type at least 2 characters to search
              </p>
            )}
            {searchQuery.length >= 2 && isSearching && (
              <p className="text-secondary text-xs text-center mt-8">Searching...</p>
            )}
            {searchQuery.length >= 2 && !isSearching && debouncedQuery === searchQuery && searchResults?.length === 0 && (
              <p className="text-secondary text-sm text-center mt-8 px-4">
                No results for "{searchQuery}"
              </p>
            )}
            {searchResults && searchResults.length > 0 && (
              <div className="divide-y divide-[var(--border)]">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      navigate(r.room_type === 'dm' ? `/conversations/${r.room_id}` : `/groups/${r.room_id}`)
                      setSearchMode(false)
                    }}
                    className="w-full text-left px-4 py-3 hover-bg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-primary text-sm font-medium truncate">{r.room_name}</span>
                      <span className="text-secondary text-xs flex-shrink-0 ml-2">{fmtSearchTime(r.sent_at)}</span>
                    </div>
                    <p className="text-secondary text-xs truncate">
                      <span className="text-primary/70">{r.sender_name}:</span> {r.content}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="px-3 py-2 border-b border-default">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-2 outline-none border border-default focus:border-accent transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  x
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto relative flex flex-col">
            {loading && [...Array(6)].map((_, i) => <ConversationSkeleton key={i} />)}
            {!loading && items.length === 0 && search && (
              <p className="text-secondary text-sm text-center mt-6 px-4">No results for "{search}"</p>
            )}
            {!loading && items.length === 0 && !search && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <p className="text-primary text-sm font-medium">No conversations yet</p>
                <p className="text-secondary text-xs">Use the button below to start a new conversation or group</p>
              </div>
            )}
            {!loading && items.map((item) => (
              <ConversationItem
                key={item.id}
                unreadId={item.id}
                presenceUserId={item.isGroup ? undefined : item.contactId}
                name={item.name}
                lastMessage={item.lastMessage}
                timestamp={item.timestamp}
                isGroup={item.isGroup}
                isActive={item.isGroup ? activeGroupId === item.id : activeConversationId === item.id}
                onClick={() =>
                  navigate(item.isGroup ? `/groups/${item.id}` : `/conversations/${item.id}`)
                }
              />
            ))}

            <div ref={fabRef} className="absolute bottom-4 right-4">
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
        </>
      )}

      {showNewDm && <NewConversationModal onClose={() => setShowNewDm(false)} />}
      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
    </aside>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
