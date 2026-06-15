# Backend

FastAPI service providing REST endpoints and a WebSocket gateway for the chat application.

## Stack

- **FastAPI** 0.136, async Python web framework
- **MongoEngine** 0.29, MongoDB ODM
- **PyJWT** + **cryptography**, RS256 JWT authentication
- **Argon2**, password hashing
- **Redis** (optional), token blacklisting via JTI TTL keys
- **slowapi**, per-endpoint rate limiting
- **Uvicorn**, ASGI server

## Project Layout

```
backend/
├── core/
│   ├── config.py       # Pydantic settings loaded from .env
│   ├── database.py     # MongoDB connection
│   ├── security.py     # Token creation, verification, password hashing
│   └── websocket.py    # WebSocket connection manager (per-user routing)
├── models/             # MongoEngine document classes
├── routers/            # One file per resource (auth, users, conversations, ...)
├── schemas/            # Pydantic request/response models
├── services/           # Business logic called by routers
└── main.py             # App factory, middleware stack, lifespan
```

## Environment Variables

Copy `.env.example` to `.env` (or create `.env` manually) and set:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `MONGO_DB` | Database name |
| `JWT_PRIVATE_KEY` | RSA private key (PEM, RS256) |
| `JWT_PUBLIC_KEY` | RSA public key (PEM, RS256) |
| `JWT_ALGORITHM` | `RS256` |
| `JWT_ISSUER` | Token issuer claim (`chatapp-api`) |
| `JWT_AUDIENCE` | Token audience claim (`chatapp-client`) |
| `JWT_KEY_ID` | `kid` header value |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime (default `15`) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime (default `7`) |
| `SESSION_SECRET_KEY` | Secret for Starlette session middleware |
| `REDIS_ENABLED` | `true` / `false`; enables token blacklisting |
| `REDIS_HOST` | Redis host (required if enabled) |
| `REDIS_PORT` | Redis port (default `6379`) |

## Running

```bash
# From the repo root
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cd backend
uvicorn main:app --reload --port 8000
```

Interactive API docs are available at `http://localhost:8000/docs`.

## API Endpoints

All routes are prefixed with `/api` when accessed through the frontend proxy.

### Auth (/auth)

| Method | Path | Description | Rate limit |
|---|---|---|---|
| POST | `/auth/login` | Login with email/username + password; sets httpOnly cookies | 5/min |
| POST | `/auth/refresh` | Issue new access token from refresh cookie | 30/min |
| POST | `/auth/logout` | Blacklist tokens, clear cookies | none |
| GET | `/auth/me` | Get authenticated user's profile | none |

### Users (/users)

| Method | Path | Description |
|---|---|---|
| POST | `/users/` | Register a new user (3/min) |
| GET | `/users/search?q=` | Search by name, email, or username |
| GET | `/users/{user_id}` | Get user by ID |
| GET | `/users/email/{email}` | Get user by email |
| GET | `/users/username/{username}` | Get user by username |
| PUT | `/users/{user_id}` | Update own profile |
| DELETE | `/users/{user_id}` | Delete own account |

### Conversations (/conversations)

| Method | Path | Description |
|---|---|---|
| GET | `/conversations/` | List current user's conversations |
| POST | `/conversations/` | Create a DM conversation |
| GET | `/conversations/{id}` | Get conversation details |
| DELETE | `/conversations/{id}` | Delete a conversation |

### Direct Messages (/direct-messages)

| Method | Path | Description |
|---|---|---|
| GET | `/direct-messages/?conversation_id=&before=&limit=` | Paginated messages (cursor-based, max 100) |
| POST | `/direct-messages/` | Send a message (30/min) |
| PUT | `/direct-messages/{id}` | Edit own message |
| DELETE | `/direct-messages/{id}` | Delete own message |

### Groups (/groups)

| Method | Path | Description |
|---|---|---|
| GET | `/groups/` | List current user's groups |
| POST | `/groups/` | Create a group (min 2 members) |
| GET | `/groups/{id}` | Get group details |
| PUT | `/groups/{id}` | Update group (creator only) |
| POST | `/groups/{id}/leave` | Leave group |
| DELETE | `/groups/{id}` | Delete group (creator only) |

### Group Messages (/group-messages)

| Method | Path | Description |
|---|---|---|
| GET | `/group-messages/?group_id=&before=&limit=` | Paginated group messages |
| POST | `/group-messages/` | Send a group message (30/min) |
| PUT | `/group-messages/{id}` | Edit own message |
| DELETE | `/group-messages/{id}` | Delete own message |

### Contacts (/contacts)

| Method | Path | Description |
|---|---|---|
| GET | `/contacts/` | List contacts |
| POST | `/contacts/add/{user_id}` | Add a contact |
| DELETE | `/contacts/{user_id}` | Remove a contact |

### Settings (/settings)

| Method | Path | Description |
|---|---|---|
| GET | `/settings/` | Get user settings |
| PUT | `/settings/` | Update settings |

### WebSocket (/ws)

Single persistent connection per user, authenticated via JWT cookie on upgrade.

**Inbound events (client to server):**

| Event | Payload | Description |
|---|---|---|
| `typing_dm` | `conversation_id`, `is_typing` | Typing status in a DM |
| `typing_group` | `group_id`, `is_typing` | Typing status in a group |
| `read_dm` | `conversation_id` | Mark DM as read |
| `read_group` | `group_id` | Mark group as read |

**Outbound events (server to client):**

| Event | Description |
|---|---|
| `new_direct_message` | New DM received |
| `updated_direct_message` | DM edited |
| `deleted_direct_message` | DM deleted |
| `new_group_message` | New group message |
| `updated_group_message` | Group message edited |
| `deleted_group_message` | Group message deleted |
| `dm_read` | Read receipt for a DM conversation |
| `group_read` | Read receipt for a group |
| `typing_dm` | Peer is typing in a DM |
| `typing_group` | Someone is typing in a group |
| `presence` | User came online / went offline |
| `online_contacts` | List of currently online contacts (sent on connect) |
| `group_created` | Added to a new group |
| `group_updated` | Group metadata changed |
| `group_deleted` | Group was deleted |
| `removed_from_group` | Current user was removed from a group |

## Data Models

| Model | Key fields |
|---|---|
| `User` | email, username, first_name, last_name, password (hashed), birthdate, failed_login_attempts, locked_until |
| `Conversation` | members (exactly 2), last_read (user to datetime map) |
| `DirectMessage` | content (max 3000 chars), sender, linked_conversation, sent_at, updated_at |
| `Group` | title, description (max 5000 chars), members, creator |
| `GroupMessage` | content (max 3000 chars), sender, group, sent_at, updated_at |
| `Contact` | user, contacts list |
| `Settings` | language, notifications, privacy, appearance, blocked_users, muted_conversations, muted_groups |

## Security

- **JWT RS256**: asymmetric keys; access token valid 15 min, refresh token 7 days
- **JTI blacklisting**: logout invalidates tokens immediately (Redis TTL keyed on JTI)
- **Account lockout**: 5 failed login attempts locks the account for 15 minutes
- **Argon2** password hashing
- **httpOnly cookies**: refresh token never exposed to JavaScript
- **Rate limiting**: login 5/min, registration 3/min, messages 30/min
- **Request size limit**: 5 MB max body
- **Request timeout**: 30 s

## Middleware Stack

Applied in order (outermost first): GZip, CORS, Session, ErrorHandler, RequestId, Logging, Timeout, SecurityHeaders, MaintenanceMode, UserContext, RequestSizeLimiter, TrustedHost.
