export interface UserResponse {
  id: string
  email: string
  first_name: string
  last_name: string
  birthdate: string
  username: string
  created_at: string
  updated_at?: string
}

export interface LastMessagePreview {
  id: string
  content: string
  sender_id: string
  sent_at: string
  is_deleted?: boolean
}

export interface ConversationResponse {
  id: string
  members: UserResponse[]
  created_at: string
  updated_at?: string
  last_message?: LastMessagePreview | null
}

export interface ConversationPage {
  conversations: ConversationResponse[]
  next_cursor: string | null
}

export interface EditEntry {
  content: string
  edited_at: string
}

export interface ReplyPreview {
  id: string
  content: string
  sender_name: string
  is_deleted?: boolean
}

export interface ReactionGroup {
  emoji: string
  user_ids: string[]
}

export interface DirectMessageResponse {
  id: string
  content: string
  sender: UserResponse
  linked_conversation: ConversationResponse
  sent_at: string
  updated_at?: string
  is_deleted?: boolean
  deleted_at?: string
  reply_to?: ReplyPreview | null
  edits?: EditEntry[]
  reactions?: ReactionGroup[]
}

export interface DirectMessagePage {
  messages: DirectMessageResponse[]
  next_cursor: string | null
  last_read?: Record<string, string> | null
}

export interface GroupResponse {
  id: string
  title: string
  description?: string
  members: UserResponse[]
  creator: UserResponse
  created_at: string
  updated_at?: string
  last_message?: LastMessagePreview | null
}

export interface GroupPage {
  groups: GroupResponse[]
  next_cursor: string | null
}

export interface GroupMessageResponse {
  id: string
  group: GroupResponse
  content: string
  sender: UserResponse
  sent_at: string
  updated_at?: string
  is_deleted?: boolean
  deleted_at?: string
  reply_to?: ReplyPreview | null
  edits?: EditEntry[]
  reactions?: ReactionGroup[]
}

export interface GroupMessagePage {
  messages: GroupMessageResponse[]
  next_cursor: string | null
}

export interface ContactResponse {
  id: string
  user: UserResponse
  contacts: UserResponse[]
  created_at: string
  updated_at?: string
}

export interface ContactPage {
  contacts: UserResponse[]
  total: number
  offset: number
  limit: number
}

export interface MessageSearchResult {
  id: string
  content: string
  sender_name: string
  sent_at: string
  room_type: 'dm' | 'group'
  room_id: string
  room_name: string
}

export interface NotificationSettings {
  enabled: boolean
  message_preview: boolean
  group_messages: boolean
  contact_requests: boolean
}

export interface PrivacySettings {
  who_can_add_me: 'everyone' | 'nobody'
  show_online_status: boolean
  read_receipts: boolean
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
}

export interface SettingsResponse {
  id: string
  language: string
  notifications: NotificationSettings
  privacy: PrivacySettings
  appearance: AppearanceSettings
  blocked_users: string[]
  muted_conversations: string[]
  muted_groups: string[]
  updated_at?: string
}

export interface TokenResponse {
  access_token: string
}

export type WsEvent =
  | ({ type: 'new_direct_message' } & DirectMessageResponse)
  | ({ type: 'updated_direct_message' } & DirectMessageResponse)
  | ({ type: 'deleted_direct_message' } & DirectMessageResponse)
  | ({ type: 'new_group_message' } & GroupMessageResponse)
  | ({ type: 'updated_group_message' } & GroupMessageResponse)
  | ({ type: 'deleted_group_message' } & GroupMessageResponse)
  | { type: 'read_receipt'; conversation_id: string; user_id: string; read_at: string }
  | { type: 'typing'; conversation_id: string; user_id: string; is_typing: boolean }
  | { type: 'typing_group'; group_id: string; user_id: string; is_typing: boolean }
  | { type: 'user_online'; user_id: string }
  | { type: 'user_offline'; user_id: string }
  | { type: 'online_contacts'; user_ids: string[] }
  | ({ type: 'group_created' } & GroupResponse)
  | ({ type: 'group_updated' } & GroupResponse)
  | { type: 'group_deleted'; group_id: string }
  | { type: 'removed_from_group'; group_id: string }
