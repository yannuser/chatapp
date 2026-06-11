import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../../api/settings'
import { useToastStore } from '../../stores/toastStore'
import Toggle from '../ui/Toggle'

export default function NotificationsTab() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  const update = useMutation({
    mutationFn: (notifications: Parameters<typeof updateSettings>[0]['notifications']) =>
      updateSettings({ notifications }),
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated)
    },
    onError: () => addToast('Failed to update notification settings'),
  })

  if (isLoading || !settings) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}</div>
  }

  const n = settings.notifications

  return (
    <div className="space-y-1 max-w-md">
      <Toggle
        label="Enable notifications"
        description="Receive notifications for new messages"
        checked={n.enabled}
        onChange={(v) => update.mutate({ enabled: v })}
      />
      <Toggle
        label="Message preview"
        description="Show message content in notifications"
        checked={n.message_preview}
        onChange={(v) => update.mutate({ message_preview: v })}
        disabled={!n.enabled}
      />
      <Toggle
        label="Group messages"
        description="Notify for new group messages"
        checked={n.group_messages}
        onChange={(v) => update.mutate({ group_messages: v })}
        disabled={!n.enabled}
      />
      <Toggle
        label="Contact requests"
        description="Notify when someone adds you"
        checked={n.contact_requests}
        onChange={(v) => update.mutate({ contact_requests: v })}
        disabled={!n.enabled}
      />
    </div>
  )
}
