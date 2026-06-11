import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, unmuteConversation, unmuteGroup } from '../../api/settings'
import { getConversations } from '../../api/conversations'
import { getGroups } from '../../api/groups'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'

export default function MutedTab() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  const me = useAuthStore((s) => s.user)

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })
  const { data: convos } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })
  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  })

  const unmuteConvo = useMutation({
    mutationFn: (id: string) => unmuteConversation(id),
    onSuccess: (updated) => { qc.setQueryData(['settings'], updated); addToast('Unmuted', 'success') },
    onError: () => addToast('Failed to unmute'),
  })
  const unmuteGrp = useMutation({
    mutationFn: (id: string) => unmuteGroup(id),
    onSuccess: (updated) => { qc.setQueryData(['settings'], updated); addToast('Unmuted', 'success') },
    onError: () => addToast('Failed to unmute'),
  })

  if (loadingSettings || !settings) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}</div>
  }

  const mutedConvos = (convos ?? []).filter((c) => settings.muted_conversations.includes(c.id))
  const mutedGroups = (groups ?? []).filter((g) => settings.muted_groups.includes(g.id))

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <p className="text-secondary text-xs mb-2">Muted conversations ({mutedConvos.length})</p>
        {mutedConvos.length === 0 ? (
          <p className="text-secondary text-sm">No muted conversations</p>
        ) : (
          <div className="space-y-1">
            {mutedConvos.map((c) => {
              const other = c.members.find((m) => m.id !== me?.id) ?? c.members[0]
              return (
                <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-default">
                  <span className="text-primary text-sm">{other.first_name} {other.last_name}</span>
                  <button
                    onClick={() => unmuteConvo.mutate(c.id)}
                    disabled={unmuteConvo.isPending}
                    className="px-3 py-1.5 text-xs text-secondary border border-default rounded-lg hover-bg transition-colors disabled:opacity-40"
                  >
                    Unmute
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-default pt-4">
        <p className="text-secondary text-xs mb-2">Muted groups ({mutedGroups.length})</p>
        {mutedGroups.length === 0 ? (
          <p className="text-secondary text-sm">No muted groups</p>
        ) : (
          <div className="space-y-1">
            {mutedGroups.map((g) => (
              <div key={g.id} className="flex items-center justify-between py-2.5 border-b border-default">
                <span className="text-primary text-sm">{g.title}</span>
                <button
                  onClick={() => unmuteGrp.mutate(g.id)}
                  disabled={unmuteGrp.isPending}
                  className="px-3 py-1.5 text-xs text-secondary border border-default rounded-lg hover-bg transition-colors disabled:opacity-40"
                >
                  Unmute
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
