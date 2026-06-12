import type { QueryClient } from '@tanstack/react-query'

interface MessagePage<T> {
  messages: T[]
  next_cursor: string | null
}

export function appendMessage<T extends { id: string }>(
  qc: QueryClient,
  key: readonly unknown[],
  msg: T,
) {
  const old = qc.getQueryData<{ pages: MessagePage<T>[] }>(key)
  if (!old) {
    qc.invalidateQueries({ queryKey: key })
    return
  }
  if (old.pages.some((p) => p.messages.some((m) => m.id === msg.id))) return
  const pages = [...old.pages]
  pages[0] = { ...pages[0], messages: [...pages[0].messages, msg] }
  qc.setQueryData(key, { ...old, pages })
}
