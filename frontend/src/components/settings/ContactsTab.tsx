import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getContacts, addContact, removeContact } from '../../api/contacts'
import { getConversations, createConversation } from '../../api/conversations'
import { apiErrorDetail } from '../../lib/apiError'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import Avatar from '../ui/Avatar'
import UserPicker from '../modals/UserPicker'
import type { UserResponse } from '../../types/api'

export default function ContactsTab() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user!)
  const { addToast } = useToastStore()

  const { data, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
    retry: false,
  })
  const { data: convos } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })

  const startDm = useMutation({
    mutationFn: (userId: string) => createConversation([me.id, userId]),
    onSuccess: (convo) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/conversations/${convo.id}`)
    },
    onError: (e) => addToast(apiErrorDetail(e, 'Could not start conversation')),
  })

  const message = (userId: string) => {
    const existing = convos?.conversations?.find((c) => c.members.some((m) => m.id === userId))
    if (existing) {
      navigate(`/conversations/${existing.id}`)
      return
    }
    startDm.mutate(userId)
  }

  const add = useMutation({
    mutationFn: (id: string) => addContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      addToast('Contact added', 'success')
    },
    onError: (e) => addToast(apiErrorDetail(e, 'Could not add contact')),
  })

  const remove = useMutation({
    mutationFn: (id: string) => removeContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      addToast('Contact removed', 'success')
    },
    onError: (e) => addToast(apiErrorDetail(e, 'Could not remove contact')),
  })

  const contacts = data?.contacts ?? []
  const contactIds = contacts.map((c) => c.id)

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <p className="text-secondary text-xs mb-2">Add a contact</p>
        <UserPicker
          onPick={(u: UserResponse) => add.mutate(u.id)}
          selectedIds={contactIds}
          disabled={add.isPending}
        />
      </div>

      <div className="border-t border-default pt-4">
        <p className="text-secondary text-xs mb-2">Your contacts ({contacts.length})</p>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-primary text-sm font-medium mb-1">No contacts yet</p>
            <p className="text-secondary text-xs">Search for someone above to add them</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={`${c.first_name} ${c.last_name}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-sm font-medium truncate">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-secondary text-xs truncate">@{c.username}</p>
                </div>
                <button
                  onClick={() => message(c.id)}
                  disabled={startDm.isPending}
                  className="px-3 py-1.5 text-xs text-accent border border-default rounded-lg hover-bg transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  Message
                </button>
                <button
                  onClick={() => remove.mutate(c.id)}
                  disabled={remove.isPending}
                  className="px-3 py-1.5 text-xs text-secondary border border-default rounded-lg hover-bg transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
