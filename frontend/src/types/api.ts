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

export interface ConversationResponse {
  id: string
  members: UserResponse[]
  created_at: string
  updated_at?: string
}

export interface DirectMessageResponse {
  id: string
  content: string
  sender: UserResponse
  linked_conversation: ConversationResponse
  sent_at: string
  updated_at?: string
}

export interface DirectMessagePage {
  messages: DirectMessageResponse[]
  next_cursor: string | null
}

export interface GroupResponse {
  id: string
  title: string
  description?: string
  members: UserResponse[]
  creator: UserResponse
  created_at: string
  updated_at?: string
}

export interface GroupMessageResponse {
  id: string
  group: GroupResponse
  content: string
  sender: UserResponse
  sent_at: string
  updated_at?: string
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

// WebSocket event payloads
export type WsEvent =
  | ({ type: 'new_direct_message' } & DirectMessageResponse)
  | ({ type: 'updated_direct_message' } & DirectMessageResponse)
  | { type: 'deleted_direct_message'; id: string; conversation_id: string }
  | ({ type: 'new_group_message' } & GroupMessageResponse)
  | ({ type: 'updated_group_message' } & GroupMessageResponse)
  | { type: 'deleted_group_message'; id: string; group_id: string }
  | { type: 'typing'; conversation_id: string; user_id: string; is_typing: boolean }
  | { type: 'typing_group'; group_id: string; user_id: string; is_typing: boolean }
  | { type: 'user_online'; user_id: string }
  | { type: 'user_offline'; user_id: string }
  | ({ type: 'group_created' } & GroupResponse)
  | ({ type: 'group_updated' } & GroupResponse)
  | { type: 'group_deleted'; group_id: string }
  | { type: 'removed_from_group'; group_id: string }
