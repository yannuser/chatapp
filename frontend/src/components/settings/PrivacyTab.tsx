import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../../api/settings'
import { useToastStore } from '../../stores/toastStore'
import Toggle from '../ui/Toggle'

export default function PrivacyTab() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  const update = useMutation({
    mutationFn: (privacy: Parameters<typeof updateSettings>[0]['privacy']) =>
      updateSettings({ privacy }),
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated)
    },
    onError: () => addToast('Failed to update privacy settings'),
  })

  if (isLoading || !settings) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}</div>
  }

  const p = settings.privacy

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <label className="text-secondary text-xs mb-1 block">Who can add me</label>
        <select
          value={p.who_can_add_me}
          onChange={(e) => update.mutate({ who_can_add_me: e.target.value as 'everyone' | 'nobody' })}
          className="w-full bg-primary text-primary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
        >
          <option value="everyone">Everyone</option>
          <option value="nobody">Nobody</option>
        </select>
      </div>

      <Toggle
        label="Show online status"
        description="Let others see when you're online"
        checked={p.show_online_status}
        onChange={(v) => update.mutate({ show_online_status: v })}
      />
      <Toggle
        label="Read receipts"
        description="Show when you've read messages"
        checked={p.read_receipts}
        onChange={(v) => update.mutate({ read_receipts: v })}
      />
    </div>
  )
}
