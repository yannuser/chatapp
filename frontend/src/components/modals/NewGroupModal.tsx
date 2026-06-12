import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGroup } from '../../api/groups'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import Modal from '../ui/Modal'
import UserPicker from './UserPicker'
import type { UserResponse } from '../../types/api'

export default function NewGroupModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'members' | 'details'>('members')
  const [selected, setSelected] = useState<UserResponse[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const me = useAuthStore((s) => s.user!)
  const { addToast } = useToastStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const toggle = (user: UserResponse) =>
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    )

  const create = useMutation({
    mutationFn: () =>
      createGroup({
        title: title.trim(),
        description: description.trim() || undefined,
        member_ids: [...selected.map((u) => u.id), me.id],
        creator_id: me.id,
      }),
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      navigate(`/groups/${g.id}`)
      onClose()
    },
    onError: () => addToast('Could not create group'),
  })

  if (step === 'members') {
    return (
      <Modal title="New group - add members" onClose={onClose}>
        <div className="space-y-3">
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="flex items-center gap-1.5 bg-accent-subtle text-primary text-xs rounded-full pl-2.5 pr-1.5 py-1"
                >
                  {u.first_name} {u.last_name}
                  <button
                    onClick={() => toggle(u)}
                    className="text-secondary hover:text-primary"
                    title="Remove"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <UserPicker onPick={toggle} selectedIds={selected.map((u) => u.id)} />
          <button
            onClick={() => setStep('details')}
            disabled={selected.length === 0}
            className="w-full py-2.5 bg-accent text-on-accent text-sm rounded-lg font-medium disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
          >
            Next
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="New group - details" onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Group name *"
          autoFocus
          className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
        />
        <p className="text-secondary text-xs">
          {selected.length + 1} members: you,{' '}
          {selected.map((u) => `${u.first_name} ${u.last_name}`).join(', ')}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setStep('members')}
            className="flex-1 py-2.5 bg-primary text-primary text-sm rounded-lg font-medium border border-default hover-bg transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!title.trim() || create.isPending}
            className="flex-1 py-2.5 bg-accent text-on-accent text-sm rounded-lg font-medium disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
          >
            Create group
          </button>
        </div>
      </div>
    </Modal>
  )
}
