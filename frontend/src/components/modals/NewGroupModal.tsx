import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createGroup } from '../../api/groups'
import { getContacts } from '../../api/contacts'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import Modal from '../ui/Modal'

export default function NewGroupModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const me = useAuthStore((s) => s.user!)
  const { addToast } = useToastStore()
  const navigate = useNavigate()

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  })

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const create = useMutation({
    mutationFn: () =>
      createGroup({
        title: title.trim(),
        description: description.trim() || undefined,
        member_ids: [...selected, me.id],
        creator_id: me.id,
      }),
    onSuccess: (g) => { navigate(`/groups/${g.id}`); onClose() },
    onError: () => addToast('Could not create group'),
  })

  return (
    <Modal title="New group" onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Group name *"
          className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
        />
        <div>
          <p className="text-secondary text-xs mb-2">Add members</p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {(contacts?.contacts ?? []).map((c) => (
              <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover-bg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className="accent-[var(--accent)] w-4 h-4"
                />
                <span className="text-primary text-sm">{c.first_name} {c.last_name}</span>
                <span className="text-secondary text-xs">@{c.username}</span>
              </label>
            ))}
            {!contacts?.contacts.length && (
              <p className="text-secondary text-xs px-2">No contacts yet</p>
            )}
          </div>
        </div>
        <button
          onClick={() => create.mutate()}
          disabled={!title.trim() || selected.length === 0 || create.isPending}
          className="w-full py-2.5 bg-accent text-on-accent text-sm rounded-lg font-medium disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
        >
          Create group
        </button>
      </div>
    </Modal>
  )
}
