import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getContacts } from '../../api/contacts'
import { searchUsers } from '../../api/users'
import { useAuthStore } from '../../stores/authStore'
import { useDebounce } from '../../hooks/useDebounce'
import Avatar from '../ui/Avatar'
import type { UserResponse } from '../../types/api'

interface Props {
  onPick: (user: UserResponse) => void
  selectedIds?: string[]
  disabled?: boolean
}

export default function UserPicker({ onPick, selectedIds, disabled }: Props) {
  const me = useAuthStore((s) => s.user!)
  const [query, setQuery] = useState('')
  const term = useDebounce(query.trim().toLowerCase(), 300)

  const { data: contactList } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  })
  const { data: results } = useQuery({
    queryKey: ['user-search', term],
    queryFn: () => searchUsers(term),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
  })

  const contacts = contactList?.contacts ?? []
  const users = (
    term
      ? results ??
        contacts.filter(
          (u) => u.username.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
        )
      : contacts
  ).filter((u) => u.id !== me.id)

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username or email…"
        autoFocus
        className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
      />
      <div className="h-64 overflow-y-auto space-y-1">
        {users.map((u) => {
          const selected = selectedIds?.includes(u.id) ?? false
          return (
            <button
              key={u.id}
              onClick={() => onPick(u)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 p-2 rounded-lg hover-bg transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed ${selected ? 'bg-accent-subtle' : ''}`}
            >
              <Avatar name={`${u.first_name} ${u.last_name}`} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-primary text-sm truncate">
                  {u.first_name} {u.last_name}
                  <span className="text-secondary text-xs ml-1.5">@{u.username}</span>
                </p>
                <p className="text-secondary text-xs truncate">{u.email}</p>
              </div>
              {selectedIds && (
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs ${
                    selected
                      ? 'bg-accent border-transparent text-on-accent'
                      : 'border-[var(--text-secondary)] text-transparent'
                  }`}
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
