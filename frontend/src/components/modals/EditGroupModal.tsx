import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGroup } from '../../api/groups'
import { apiErrorDetail } from '../../lib/apiError'
import { useToastStore } from '../../stores/toastStore'
import Modal from '../ui/Modal'
import UserPicker from './UserPicker'
import Avatar from '../ui/Avatar'
import type { GroupResponse, UserResponse } from '../../types/api'

export default function EditGroupModal({
  group,
  onClose,
}: {
  group: GroupResponse
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  const [title, setTitle] = useState(group.title)
  const [description, setDescription] = useState(group.description ?? '')
  const [members, setMembers] = useState<UserResponse[]>(group.members)
  const [adding, setAdding] = useState(false)

  const save = useMutation({
    mutationFn: () =>
      updateGroup(group.id, {
        title: title.trim(),
        description: description.trim(),
        member_ids: members.map((m) => m.id),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(['group', group.id], updated)
      qc.invalidateQueries({ queryKey: ['groups'] })
      addToast('Group updated', 'success')
      onClose()
    },
    onError: (e) => addToast(apiErrorDetail(e, 'Could not update group')),
  })

  const addMember = (u: UserResponse) => {
    setMembers((prev) => (prev.some((m) => m.id === u.id) ? prev : [...prev, u]))
    setAdding(false)
  }
  const removeMember = (id: string) => {
    if (id === group.creator.id) return
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  if (adding) {
    return (
      <Modal title="Add members" onClose={() => setAdding(false)}>
        <UserPicker onPick={addMember} selectedIds={members.map((m) => m.id)} />
      </Modal>
    )
  }

  return (
    <Modal title="Manage group" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-secondary text-xs mb-1 block">Group name</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-primary text-primary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-secondary text-xs mb-1 block">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-secondary text-xs">Members ({members.length})</span>
            <button
              onClick={() => setAdding(true)}
              className="text-accent text-xs font-medium hover:underline"
            >
              + Add
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1.5">
                <Avatar name={`${m.first_name} ${m.last_name}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-sm truncate">
                    {m.first_name} {m.last_name}
                    {m.id === group.creator.id && (
                      <span className="text-secondary text-xs ml-1.5">(creator)</span>
                    )}
                  </p>
                </div>
                {m.id !== group.creator.id && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-secondary hover:text-danger text-xs px-2"
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-secondary text-sm rounded-lg hover-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!title.trim() || members.length < 2 || save.isPending}
            className="px-4 py-2 bg-accent text-on-accent text-sm rounded-lg font-medium disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
