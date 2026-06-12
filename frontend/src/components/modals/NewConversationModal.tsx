import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getConversations, createConversation } from '../../api/conversations'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import Modal from '../ui/Modal'
import UserPicker from './UserPicker'
import type { UserResponse } from '../../types/api'

export default function NewConversationModal({ onClose }: { onClose: () => void }) {
  const me = useAuthStore((s) => s.user!)
  const { addToast } = useToastStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: convos } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })

  const start = useMutation({
    mutationFn: (user: UserResponse) => createConversation([me.id, user.id]),
    onSuccess: (convo) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/conversations/${convo.id}`)
      onClose()
    },
    onError: () => addToast('Could not start conversation'),
  })

  const handlePick = (user: UserResponse) => {
    const existing = convos?.find((c) => c.members.some((m) => m.id === user.id))
    if (existing) {
      navigate(`/conversations/${existing.id}`)
      onClose()
      return
    }
    start.mutate(user)
  }

  return (
    <Modal title="New conversation" onClose={onClose}>
      <UserPicker onPick={handlePick} disabled={start.isPending} />
    </Modal>
  )
}
