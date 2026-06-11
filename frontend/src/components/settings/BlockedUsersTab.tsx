import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, blockUser, unblockUser } from '../../api/settings'
import { getUserById, getUserByUsername } from '../../api/users'
import { useToastStore } from '../../stores/toastStore'
import Avatar from '../ui/Avatar'
import type { UserResponse } from '../../types/api'

function BlockedUserRow({ userId, onUnblock }: { userId: string; onUnblock: (id: string) => void }) {
  const { data: user } = useQuery<UserResponse>({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
  })

  const name = user ? `${user.first_name} ${user.last_name}` : userId

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Avatar name={name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-primary text-sm font-medium truncate">{name}</p>
        {user && <p className="text-secondary text-xs">@{user.username}</p>}
      </div>
      <button
        onClick={() => onUnblock(userId)}
        className="px-3 py-1.5 text-xs text-secondary border border-default rounded-lg hover-bg transition-colors flex-shrink-0"
      >
        Unblock
      </button>
    </div>
  )
}

export default function BlockedUsersTab() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  const [search, setSearch] = useState('')
  const [found, setFound] = useState<UserResponse | null>(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  const searchUser = useMutation({
    mutationFn: () => getUserByUsername(search.trim()),
    onSuccess: setFound,
    onError: () => addToast('User not found'),
  })

  const block = useMutation({
    mutationFn: (id: string) => blockUser(id),
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated)
      setFound(null)
      setSearch('')
      addToast('User blocked', 'success')
    },
    onError: () => addToast('Failed to block user'),
  })

  const unblock = useMutation({
    mutationFn: (id: string) => unblockUser(id),
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated)
      addToast('User unblocked', 'success')
    },
    onError: () => addToast('Failed to unblock user'),
  })

  if (isLoading || !settings) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-5 max-w-md">
      <div className="space-y-2">
        <p className="text-secondary text-xs">Block a user by username</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setFound(null) }}
            onKeyDown={(e) => e.key === 'Enter' && search.trim() && searchUser.mutate()}
            placeholder="Search username…"
            className="flex-1 bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
          />
          <button
            onClick={() => searchUser.mutate()}
            disabled={!search.trim() || searchUser.isPending}
            className="px-4 py-2 bg-accent text-on-accent text-sm rounded-lg font-medium disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
          >
            Find
          </button>
        </div>
        {found && (
          <div className="flex items-center justify-between p-3 bg-primary rounded-lg border border-default">
            <div className="flex items-center gap-2">
              <Avatar name={`${found.first_name} ${found.last_name}`} size="sm" />
              <div>
                <p className="text-primary text-sm font-medium">{found.first_name} {found.last_name}</p>
                <p className="text-secondary text-xs">@{found.username}</p>
              </div>
            </div>
            <button
              onClick={() => block.mutate(found.id)}
              disabled={block.isPending || settings.blocked_users.includes(found.id)}
              className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium disabled:opacity-40 hover:bg-red-600 transition-colors"
            >
              {settings.blocked_users.includes(found.id) ? 'Already blocked' : 'Block'}
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-default pt-4">
        <p className="text-secondary text-xs mb-2">Blocked users ({settings.blocked_users.length})</p>
        {settings.blocked_users.length === 0 ? (
          <p className="text-secondary text-sm">No blocked users</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {settings.blocked_users.map((id) => (
              <BlockedUserRow key={id} userId={id} onUnblock={(uid) => unblock.mutate(uid)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
