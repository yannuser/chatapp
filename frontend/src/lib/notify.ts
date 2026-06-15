const notified = new Set<string>()

export function showBrowserNotification(
  title: string,
  body: string,
  opts?: { tag?: string; dedupeKey?: string },
) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

  if (opts?.dedupeKey) {
    if (notified.has(opts.dedupeKey)) return
    notified.add(opts.dedupeKey)
    if (notified.size > 500) notified.clear()
  }

  try {
    new Notification(title, { body, tag: opts?.tag })
  } catch {
  }
}
