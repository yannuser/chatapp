// Module-level so duplicates collapse no matter how many sockets/closures call in.
const notified = new Set<string>()

/** Fire a browser notification if the user has granted permission. No-op otherwise. */
export function showBrowserNotification(
  title: string,
  body: string,
  opts?: { tag?: string; dedupeKey?: string },
) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

  // Skip if we've already notified for this key (e.g. same message id).
  if (opts?.dedupeKey) {
    if (notified.has(opts.dedupeKey)) return
    notified.add(opts.dedupeKey)
    if (notified.size > 500) notified.clear()
  }

  try {
    // `tag` makes the OS replace a prior notification for the same chat instead of stacking.
    new Notification(title, { body, tag: opts?.tag })
  } catch {
    // Some contexts (e.g. insecure origins) throw even when permission is granted.
  }
}
