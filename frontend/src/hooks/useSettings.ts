import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSettings,
  muteConversation,
  unmuteConversation,
  muteGroup,
  unmuteGroup,
} from '../api/settings'
import { useToastStore } from '../stores/toastStore'
import type { SettingsResponse } from '../types/api'

/** Shared access to the current user's settings (cached under ['settings']). */
export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: getSettings })
}

/** Mute/unmute helper reused by the sidebar and chat header. */
export function useMute() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  const { data: settings } = useSettings()

  const isMuted = (id: string, isGroup: boolean) =>
    isGroup
      ? settings?.muted_groups.includes(id) ?? false
      : settings?.muted_conversations.includes(id) ?? false

  const mutation = useMutation({
    mutationFn: ({ id, isGroup, next }: { id: string; isGroup: boolean; next: boolean }) =>
      isGroup
        ? next ? muteGroup(id) : unmuteGroup(id)
        : next ? muteConversation(id) : unmuteConversation(id),
    onSuccess: (updated: SettingsResponse, { next }) => {
      qc.setQueryData(['settings'], updated)
      addToast(next ? 'Muted' : 'Unmuted', 'success')
    },
    onError: () => addToast('Could not update mute setting'),
  })

  const toggle = (id: string, isGroup: boolean) =>
    mutation.mutate({ id, isGroup, next: !isMuted(id, isGroup) })

  return { isMuted, toggle, isPending: mutation.isPending }
}
