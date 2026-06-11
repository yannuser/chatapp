import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { getUserByUsername } from '../../api/users'
import { createConversation } from '../../api/conversations'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import Modal from '../ui/Modal'
import type { UserResponse } from '../../types/api'

export default function NewConversationModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('')
  const [found, setFound] = useState<UserResponse | null>(null)
  const me = useAuthStore((s) => s.user!)
  const { addToast } = useToastStore()
  const navigate = useNavigate()

  const search = useMutation({
    mutationFn: () => getUserByUsername(username.trim()),
    onSuccess: (user) => {
      if (user.id === me.id) { addToast('That\'s you!', 'info'); return }
      setFound(user)
    },
    onError: () => addToast('User not found'),
  })

  const start = useMutation({
    mutationFn: () => createConversation([me.id, found!.id]),
    onSuccess: (convo) => {
      navigate(`/conversations/${convo.id}`)
      onClose()
    },
    onError: () => addToast('Could not start conversation'),
  })

  return (
    <Modal title="New conversation" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setFound(null) }}
            placeholder="Search by username…"
            className="flex-1 bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && search.mutate()}
          />
          <button
            onClick={() => search.mutate()}
            disabled={!username.trim() || search.isPending}
            className="px-4 py-2 bg-accent text-on-accent text-sm rounded-lg font-medium disabled:opacity-40 transition-colors hover:bg-[var(--accent-hover)]"
          >
            Find
          </button>
        </div>
        {found && (
          <div className="flex items-center justify-between p-3 bg-primary rounded-lg border border-default">
            <div>
              <p className="font-medium text-primary text-sm">{found.first_name} {found.last_name}</p>
              <p className="text-secondary text-xs">@{found.username}</p>
            </div>
            <button
              onClick={() => start.mutate()}
              disabled={start.isPending}
              className="px-3 py-1.5 bg-accent text-on-accent text-xs rounded-lg font-medium disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
            >
              Start chat
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
