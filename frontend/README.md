# Frontend

React 19 + TypeScript single-page application for the chat service.

## Stack

- **React 19** + **TypeScript 6**
- **Vite 8**, build tool and dev server
- **React Router 7**, client-side routing
- **TanStack React Query 5**, server state, caching, pagination
- **Zustand 5**, lightweight client state
- **Axios**, HTTP client with token refresh interceptor
- **Tailwind CSS 3**, utility-first styling
- **date-fns**, date formatting

## Project Layout

```
src/
├── api/
│   ├── client.ts        # Axios instance with auth + refresh interceptors
│   └── *.ts             # Per-resource API call functions
├── components/
│   ├── ChatPanel/       # Main message view (DM and group)
│   ├── MessageList/     # Infinite-scroll message list
│   ├── MessageBubble/   # Single message with edit/delete actions
│   ├── MessageInput/    # Text input + send button
│   ├── ChatHeader/      # Conversation/group header
│   ├── Sidebar/         # Conversation list, user search, nav
│   └── ui/              # Shared UI primitives (Toast, Skeleton, ...)
├── hooks/
│   ├── useWebSocket.ts  # WebSocket connection with auto-reconnect
│   └── ...
├── pages/
│   ├── LoginPage/
│   ├── RegisterPage/
│   └── SettingsPage/
├── stores/              # Zustand stores (auth, chat, presence, typing, read, theme, toast)
├── types/               # TypeScript interfaces
├── lib/                 # Utility functions
├── App.tsx              # Router setup, auth bootstrap
└── main.tsx             # Entry point, QueryClient config
```

## Running

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Type-check + production bundle
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

The dev server proxies `/api/*` and WebSocket upgrades to `http://localhost:8000`, so the backend must be running.

## Routing

| Route | Access | Component |
|---|---|---|
| `/login` | Guest only | `LoginPage` |
| `/register` | Guest only | `RegisterPage` |
| `/` | Authenticated | `AppShell` + `Sidebar` |
| `/conversations/:id` | Authenticated | `ChatPanel` (DM) |
| `/groups/:id` | Authenticated | `ChatPanel` (group) |
| `/settings` | Authenticated | `SettingsPage` |

Unauthenticated users are redirected to `/login`. Authenticated users hitting `/login` or `/register` are redirected home.

## Authentication Flow

1. On app mount, `App.tsx` calls `POST /auth/refresh` to obtain a new access token from the httpOnly refresh cookie.
2. The token is stored in the `authStore` Zustand store (never in `localStorage`).
3. `GET /auth/me` is called to hydrate the current user.
4. The Axios request interceptor attaches `Authorization: Bearer <token>` to every request.
5. The response interceptor catches 401 errors, queues concurrent requests, calls `/auth/refresh` once, then retries the queue.
6. If refresh fails, all queued requests are rejected and the user is redirected to `/login`.

## State Management

| Store | Holds |
|---|---|
| `authStore` | Current user, access token, auth loading state |
| `chatStore` | Active conversation/group, unread counts, last messages |
| `presenceStore` | Set of online user IDs |
| `typingStore` | Per-room typing user lists |
| `readStore` | Per-conversation read timestamps |
| `themeStore` | Theme preference: `light` / `dark` / `system` |
| `toastStore` | Active toast notifications queue |

## WebSocket

`useWebSocket` opens a connection to `/api/ws` after the user is authenticated. It handles:

- **Reconnection**: exponential backoff, up to 5 retries (max 30 s delay)
- **Cache updates**: React Query's `queryClient` is updated in-place so the UI reflects incoming events without a full refetch
- **Presence**: updates `presenceStore` on connect/disconnect events
- **Typing**: updates `typingStore`; indicators auto-clear after a timeout
- **Read receipts**: updates `readStore`; respects the peer's privacy setting
- **Group lifecycle**: handles `group_created`, `group_updated`, `group_deleted`, `removed_from_group`
- **Browser notifications**: shown for new messages when the tab is in the background; message preview is controlled by notification privacy settings

## Message Pagination

Messages are fetched with React Query's `useInfiniteQuery`, using a `before` cursor (ISO timestamp). Older pages load as the user scrolls up. WebSocket events append new messages directly into the query cache without triggering a network request.

## Settings Page

Covers: notification preferences, privacy controls (who can add you, show online status, read receipts), appearance (theme + language), blocked users, muted conversations and groups.
