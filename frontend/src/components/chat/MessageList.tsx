import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { getMessages, editMessage, deleteMessage } from '../../api/messages'
import { getGroupMessages, editGroupMessage, deleteGroupMessage } from '../../api/groupMessages'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { useReadStore } from '../../stores/readStore'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { MessageSkeleton } from '../ui/Skeleton'
import type { DirectMessagePage, GroupMessagePage, DirectMessageResponse, GroupMessageResponse, UserResponse } from '../../types/api'

type AnyPage = DirectMessagePage | GroupMessagePage

interface Props {
  roomId: string
  type: 'dm' | 'group'
  members: UserResponse[]
}

type AnyMessage = DirectMessageResponse | GroupMessageResponse

export default function MessageList({ roomId, type, members }: Props) {
  const me = useAuthStore((s) => s.user!)
  const { addToast } = useToastStore()
  const seedRead = useReadStore((s) => s.seed)
  const reads = useReadStore((s) => s.reads[roomId])
  const containerRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const prevScrollHeight = useRef(0)

  const queryKey = type === 'dm' ? ['messages', roomId] : ['group-messages', roomId]
  const fetchFn = type === 'dm'
    ? (cursor?: string) => getMessages(roomId, cursor)
    : (cursor?: string) => getGroupMessages(roomId, cursor)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery<
    AnyPage,
    Error,
    InfiniteData<AnyPage>,
    string[],
    string | undefined
  >({
    queryKey,
    queryFn: ({ pageParam }) => fetchFn(pageParam),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!roomId,
  })

  const allMessages: AnyMessage[] = data?.pages.slice().reverse().flatMap((p) => p.messages as AnyMessage[]) ?? []
  const pagesLength = data?.pages.length ?? 0

  const memberNames: Record<string, string> = {}
  members.forEach((m) => { memberNames[m.id] = `${m.first_name} ${m.last_name}` })

  useEffect(() => {
    const el = containerRef.current
    if (!el || pagesLength !== 1) return
    el.scrollTop = el.scrollHeight
  }, [pagesLength])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !isFetchingNextPage) return
    prevScrollHeight.current = el.scrollHeight
  }, [isFetchingNextPage])

  useEffect(() => {
    const el = containerRef.current
    if (!el || isFetchingNextPage) return
    if (pagesLength > 1) {
      el.scrollTop = el.scrollHeight - prevScrollHeight.current
    }
  }, [pagesLength, isFetchingNextPage])

  const lastMsg = allMessages[allMessages.length - 1]
  useEffect(() => {
    const el = containerRef.current
    if (!el || !atBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [lastMsg?.id])

  // Seed read receipts from the loaded page (DMs only).
  useEffect(() => {
    if (type !== 'dm' || !data) return
    const page = data.pages[0]
    if (page && 'last_read' in page && page.last_read) seedRead(roomId, page.last_read)
  }, [type, roomId, data, seedRead])

  const lastIsMine = !!lastMsg && 'sender' in lastMsg && lastMsg.sender.id === me.id
  const otherId = type === 'dm' ? members.find((m) => m.id !== me.id)?.id : undefined
  const otherReadAt = otherId ? reads?.[otherId] : undefined
  const lastSeen = !!(lastIsMine && lastMsg && otherReadAt && new Date(otherReadAt) >= new Date(lastMsg.sent_at))

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (el.scrollTop < 60 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const editMutation = useMutation<
    DirectMessageResponse | GroupMessageResponse,
    Error,
    { id: string; content: string }
  >({
    mutationFn: ({ id, content }) =>
      type === 'dm' ? editMessage(id, content) : editGroupMessage(id, content),
    onError: () => addToast('Failed to edit message'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      type === 'dm' ? deleteMessage(id) : deleteGroupMessage(id),
    onError: () => addToast('Failed to delete message'),
  })

  if (isLoading) return <div className="flex-1 overflow-y-auto"><MessageSkeleton /></div>

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-3 flex flex-col"
    >
      {isFetchingNextPage && (
        <div className="text-center py-2 text-secondary text-xs">Loading…</div>
      )}
      {hasNextPage && !isFetchingNextPage && (
        <button
          onClick={() => fetchNextPage()}
          className="text-accent text-xs text-center py-2 hover:underline"
        >
          Load earlier messages
        </button>
      )}
      {allMessages.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-secondary text-sm">
          No messages yet. Say hello 👋
        </div>
      )}
      {allMessages.map((msg, i) => {
        const prev = allMessages[i - 1]
        const senderId = 'sender' in msg ? msg.sender.id : ''
        const prevSenderId = prev && 'sender' in prev ? prev.sender.id : ''
        const showName = type === 'group' && senderId !== prevSenderId && senderId !== me.id
        return (
          <MessageBubble
            key={msg.id}
            id={msg.id}
            content={msg.content}
            senderName={memberNames[senderId] ?? ''}
            timestamp={msg.sent_at}
            isMine={senderId === me.id}
            showSenderName={showName}
            onEdit={(id, content) => editMutation.mutate({ id, content })}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )
      })}
      {lastSeen && (
        <div className="text-right text-[11px] text-secondary pr-1 mt-0.5">Read</div>
      )}
      <TypingIndicator roomId={roomId} memberNames={memberNames} />
    </div>
  )
}
