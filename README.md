# ChatApp

A real-time chat application with direct messaging and group chats, built on a FastAPI backend and React frontend.

## Architecture

```
chatapp/
├── backend/    # FastAPI + MongoDB + WebSockets
└── frontend/   # React 19 + Vite + Zustand
```

The frontend dev server proxies `/api` to `http://localhost:8000`, so the two services run independently and are joined by Vite's proxy in development.

## Features

- **Direct messaging**: one-to-one conversations with real-time delivery
- **Group chats**: named groups with multiple members, creator controls
- **Real-time updates**: WebSocket-based message delivery, typing indicators, read receipts, and online presence
- **Authentication**: JWT (RS256) with short-lived access tokens and rotating refresh tokens stored in httpOnly cookies
- **User search**: find users by name, email, or usernamecool
- **Contact list**: add/remove contacts, see who's online
- **Settings**: notification preferences, privacy controls (read receipts, online status visibility), appearance (light/dark/system theme), blocked users, muted conversations

## Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB (Atlas or local)
- Redis (optional, enables token blacklisting; set `REDIS_ENABLED=false` to skip)

## Quick Start

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r ../requirements.txt
# Copy .env.example to .env and fill in values (see backend/README.md)
uvicorn main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies API and WebSocket traffic to the backend automatically.

## Tech Stack

| Layer                     | Technology                       |
| ------------------------- | -------------------------------- |
| Backend framework         | FastAPI 0.136                    |
| Database                  | MongoDB (MongoEngine ORM)        |
| Caching / token blacklist | Redis (optional)                 |
| Auth                      | JWT RS256 (PyJWT + cryptography) |
| Password hashing          | Argon2                           |
| ASGI server               | Uvicorn                          |
| Frontend framework        | React 19 + TypeScript            |
| Build tool                | Vite 8                           |
| Routing                   | React Router 7                   |
| Server state              | TanStack React Query 5           |
| Client state              | Zustand 5                        |
| Styling                   | Tailwind CSS 3                   |
| HTTP client               | Axios                            |

## Repository Layout

```
chatapp/
├── backend/
│   ├── core/           # Config, DB connection, security utils, WebSocket manager
│   ├── models/         # MongoEngine document models
│   ├── routers/        # FastAPI route handlers
│   ├── schemas/        # Pydantic request/response schemas
│   ├── services/       # Business logic
│   └── main.py         # App entry point, middleware stack
├── frontend/
│   └── src/
│       ├── api/        # Axios client + API call functions
│       ├── components/ # React components
│       ├── hooks/      # Custom hooks (WebSocket, auth bootstrap)
│       ├── pages/      # Route-level page components
│       ├── stores/     # Zustand stores
│       └── types/      # TypeScript type definitions
└── requirements.txt
```

See `backend/README.md` and `frontend/README.md` for service-specific setup and details.
