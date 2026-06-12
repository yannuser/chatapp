import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConversation } from '../../api/conversations'
import { getGroup } from '../../api/groups'
import { sendMessage } from '../../api/messages'
import { sendGroupMessage } from '../../api/groupMessages'
import { useAuthStore } from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'
import { useToastStore } from '../../stores/toastStore'
import { useWs } from '../../hooks/useWs'
import { appendMessage } from '../../lib/messageCache'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

interface Props {
  type: 'dm' | 'group'
}

export default function ChatPanel({ type }: Props) {
  const { id } = useParams<{ id: string }>()
  const me = useAuthStore((s) => s.user!)
  const { addToast } = useToastStore()
  const { send: wsSend } = useWs()
  const qc = useQueryClient()
  const { setActiveConversation, setActiveGroup, clearUnread, setLastMessage } = useChatStore()

  useEffect(() => {
    if (!id) return
    if (type === 'dm') setActiveConversation(id)
    else setActiveGroup(id)
    clearUnread(id)
    return () => {
      if (type === 'dm') setActiveConversation(null)
      else setActiveGroup(null)
    }
  }, [type, id, setActiveConversation, setActiveGroup, clearUnread])

  const { data: conversation } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversation(id!),
    enabled: type === 'dm' && !!id,
  })
  const { data: group } = useQuery({
    queryKey: ['group', id],
    queryFn: () => getGroup(id!),
    enabled: type === 'group' && !!id,
  })

  const sendDm = useMutation({
    mutationFn: (content: string) => sendMessage(id!, content, me.id),
    onSuccess: (msg) => {
      appendMessage(qc, ['messages', id], msg)
      setLastMessage(id!, { kind: 'dm', msg })
    },
    onError: () => addToast('Failed to send message'),
  })
  const sendGm = useMutation({
    mutationFn: (content: string) => sendGroupMessage(id!, content, me.id),
    onSuccess: (msg) => {
      appendMessage(qc, ['group-messages', id], msg)
      setLastMessage(id!, { kind: 'group', msg })
    },
    onError: () => addToast('Failed to send message'),
  })

  const handleSend = (content: string) => {
    if (type === 'dm') sendDm.mutate(content)
    else sendGm.mutate(content)
  }

  const handleTyping = (isTyping: boolean) => {
    if (!id) return
    if (type === 'dm') {
      wsSend({ type: 'typing', conversation_id: id, is_typing: isTyping })
    } else {
      wsSend({ type: 'typing_group', group_id: id, is_typing: isTyping })
    }
  }

  if (!id) return null

  const members =
    type === 'dm' ? (conversation?.members ?? []) : (group?.members ?? [])

  const otherUser =
    type === 'dm' ? conversation?.members.find((m) => m.id !== me.id) : undefined

  return (
    <div className="flex flex-col h-full">
      {type === 'dm' && otherUser && <ChatHeader type="dm" user={otherUser} />}
      {type === 'group' && group && <ChatHeader type="group" group={group} />}
      <MessageList roomId={id} type={type} members={members} />
      <MessageInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  )
}
