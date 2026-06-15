import { useEffect, useRef, useCallback, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns'
import { getMessages, editMessage, deleteMessage, reactToMessage } from '../../api/messages'
import { getGroupMessages, editGroupMessage, deleteGroupMessage, reactToGroupMessage } from '../../api/groupMessages'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { useReadStore } from '../../stores/readStore'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { MessageSkeleton } from '../ui/Skeleton'
import type {
  DirectMessagePage, GroupMessagePage,
  DirectMessageResponse, GroupMessageResponse,
  UserResponse, ReplyPreview,
} from '../../types/api'

type AnyPage = DirectMessagePage | GroupMessagePage

interface Props {
  roomId: string
  type: 'dm' | 'group'
  members: UserResponse[]
  onReply: (preview: ReplyPreview) => void
}

type AnyMessage = DirectMessageResponse | GroupMessageResponse

function dateSepLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d')
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3 flex-shrink-0">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-secondary text-xs font-medium flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

export default function MessageList({ roomId, type, members, onReply }: Props) {
  const me = useAuthStore((s) => s.user!)
  const { addToast } = useToastStore()
  const seedRead = useReadStore((s) => s.seed)
  const reads = useReadStore((s) => s.reads[roomId])
  const qc = useQueryClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const prevScrollHeight = useRef(0)
  const [atBottom, setAtBottom] = useState(true)

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
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    atBottomRef.current = bottom
    setAtBottom(bottom)
    if (el.scrollTop < 60 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const scrollToBottom = () => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

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

  const reactMutation = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      type === 'dm' ? reactToMessage(id, emoji) : reactToGroupMessage(id, emoji),
    onSuccess: (updated) => {
      qc.setQueryData<{ pages: { messages: AnyMessage[]; next_cursor: string | null }[] }>(
        queryKey,
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) => (m.id === updated.id ? updated as AnyMessage : m)),
            })),
          }
        }
      )
    },
    onError: () => addToast('Failed to add reaction'),
  })

  if (isLoading) return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto"><MessageSkeleton /></div>
    </div>
  )

  return (
    <div className="flex-1 overflow-hidden relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-3 flex flex-col"
      >
        {isFetchingNextPage && (
          <div className="text-center py-2 text-secondary text-xs">Loading...</div>
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
            No messages yet. Say hello.
          </div>
        )}
        {allMessages.map((msg, i) => {
          const prev = allMessages[i - 1]
          const senderId = 'sender' in msg ? msg.sender.id : ''
          const prevSenderId = prev && 'sender' in prev ? prev.sender.id : ''
          const showName = type === 'group' && senderId !== prevSenderId && senderId !== me.id
          const showDateSep = !prev || !isSameDay(parseISO(msg.sent_at), parseISO(prev.sent_at))
          return (
            <div key={msg.id}>
              {showDateSep && <DateSeparator label={dateSepLabel(msg.sent_at)} />}
              <MessageBubble
                id={msg.id}
                content={msg.content}
                senderName={memberNames[senderId] ?? ''}
                timestamp={msg.sent_at}
                isMine={senderId === me.id}
                isDeleted={!!msg.is_deleted}
                showSenderName={showName}
                currentUserId={me.id}
                replyTo={msg.reply_to}
                edits={msg.edits}
                reactions={msg.reactions}
                onEdit={(id, content) => editMutation.mutate({ id, content })}
                onDelete={(id) => deleteMutation.mutate(id)}
                onReply={onReply}
                onReact={(id, emoji) => reactMutation.mutate({ id, emoji })}
              />
            </div>
          )
        })}
        {lastSeen && (
          <div className="text-right text-[11px] text-secondary pr-1 mt-0.5">Read</div>
        )}
        <TypingIndicator roomId={roomId} memberNames={memberNames} />
      </div>

      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center app-shadow hover:bg-[var(--accent-hover)] transition-colors"
          aria-label="Scroll to bottom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  )
}
