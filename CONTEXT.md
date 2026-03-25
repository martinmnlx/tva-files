## 1. Project Overview

TVA Files is a Marvel Cinematic Universe timeline tracker and watch list app, built for fans and those who want to get into the MCU.

Status: MVP

## 2. Goals

User Interface

- Resembles the TVA screens seen in the Loki series
- Retro futuristic aesthetic
- Responsive layout for desktop and mobile
- Accessibility baseline: keyboard navigation, visible focus states, sufficient contrast
- Distinctive typography and color system, consistent across all pages

Timeline Page

- Shows all released films, series, and specials from the MCU
- Releases will be presented as TVA case files.
- Each release will have its title, poster, release date, brief description, main characters, IMDB rating
- Users may sort by chronological order or release date
- Users may filter by phase, type, or character
- Users may mark releases as "watched"
- Shows a progress meter of the releases watched
- Search by title and character name
- Quick view details panel for each release without leaving timeline context
- Watched/unwatched visual badges on each case file card
- Persist filter and sort preferences per user account

Account and Sync

- Email/password sign-in and sign-out
- Cross-device sync for watched progress through user accounts
- Guest mode supported for read-only browsing before sign-in

Data and Reliability

- Seeded MCU data set for MVP with manual admin updates when needed
- Graceful fallback UI when ratings or poster images are missing
- Loading, empty, and error states for all timeline data requests

Non-Goals (MVP)

- Social features (comments, follows, sharing)
- Community ratings or reviews
- Native mobile app
- Offline-first sync conflict resolution

## 3. Tech Stack

Frontend: React, TypeScript, TailwindCSS, Vite
Routing/UI State: React Router, Zustand
Server State/Cache: TanStack Query
Backend: Node.js, Express.js
Database/Auth: Supabase
Hosting: Vercel (client), Render (API), Supabase (Postgres/Auth)

## 4. Repository Structure

@/client : Frontend
@/server : Backend

## 5. Core Data Model

Primary design:

- PostgreSQL in Supabase
- UUID primary keys for all app tables
- UTC timestamps for created_at and updated_at
- User-owned rows protected with Row Level Security

Tables:

1. releases

- id (uuid, pk)
- title (text, required)
- slug (text, unique, required)
- type (text, required: film | series | special)
- phase (int, nullable)
- release_date (date, required)
- chronology_date (date, required)
- overview (text, nullable)
- poster_url (text, nullable)
- imdb_rating (numeric(3,1), nullable)
- status (text, default: released)
- created_at (timestamptz)
- updated_at (timestamptz)

2. characters

- id (uuid, pk)
- name (text, required)
- slug (text, unique, required)
- image_url (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

3. release_characters (many-to-many join)

- release_id (uuid, fk -> releases.id)
- character_id (uuid, fk -> characters.id)
- is_primary (boolean, default: false)
- Composite primary key: (release_id, character_id)

4. user_watched

- user_id (uuid, fk -> auth.users.id)
- release_id (uuid, fk -> releases.id)
- watched (boolean, default: true)
- watched_at (timestamptz, nullable)
- Composite primary key: (user_id, release_id)

5. user_preferences

- user_id (uuid, pk, fk -> auth.users.id)
- sort_mode (text, default: chronological)
- filter_phase (int, nullable)
- filter_type (text, nullable)
- filter_character_id (uuid, nullable)
- show_watched_only (boolean, default: false)
- created_at (timestamptz)
- updated_at (timestamptz)

Optional table:

6. media_assets

- id (uuid, pk)
- owner_user_id (uuid, fk -> auth.users.id, nullable)
- bucket (text, required)
- path (text, required)
- mime_type (text, nullable)
- size_bytes (bigint, nullable)
- created_at (timestamptz)

Relationship summary:

- One release has many release_characters rows
- One character has many release_characters rows
- One user has many user_watched rows
- One user has one user_preferences row

Key constraints and indexes:

- Unique: releases.slug, characters.slug
- Check: releases.type in (film, series, special)
- Index: releases.release_date
- Index: releases.chronology_date, releases.chronology_sequence
- Index: releases.phase
- Index: release_characters.character_id
- Index: user_watched.user_id

RLS policy intent:

- Public read for releases, characters, release_characters
- Authenticated users can read and upsert only their own user_watched and user_preferences rows

## 6. API Contracts

Base URL:

- /api/v1

Conventions:

- JSON request/response payloads
- UTC timestamps in ISO 8601 format
- Cursor-based pagination for list endpoints
- Error response format:
  - { error: { code, message, details? } }

Public endpoints (no auth required):

1. GET /releases

- Purpose: List MCU releases with sorting, filtering, search, and pagination
- Query params:
  - sort: chronology | release_date
  - order: asc | desc
  - phase: integer
  - type: film | series | special
  - character: character slug
  - watched: true | false (only honored when authenticated)
  - q: text search across title and character names
  - limit: integer (default 20, max 100)
  - cursor: opaque string
- Response:
  - items: release summaries
  - nextCursor: string | null

2. GET /releases/:slug

- Purpose: Get one release with full details and related characters
- Response includes:
  - release fields
  - characters[]
  - watched (boolean) when authenticated

3. GET /characters

- Purpose: List all characters used by filters and release relationships

Authenticated endpoints:

4. PUT /me/watched/:releaseId

- Purpose: Set watched status for a release
- Body:
  - watched: boolean
- Behavior:
  - upsert into user_watched for (user_id, release_id)
  - set watched_at when watched=true

5. GET /me/watched

- Purpose: Return watched release ids for current user

6. GET /me/preferences

- Purpose: Read user timeline preferences

7. PUT /me/preferences

- Purpose: Update sort/filter preferences
- Body (partial update supported):
  - sort_mode
  - filter_phase
  - filter_type
  - filter_character_id
  - show_watched_only

8. GET /me/progress

- Purpose: Get progress metrics for UI meter
- Response:
  - total_releases
  - watched_count
  - percent_complete

Optional storage endpoint:

9. POST /me/uploads/avatar-url

- Purpose: Generate signed upload URL for avatar upload to Supabase Storage

Status codes:

- 200 OK, 201 Created, 204 No Content
- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity

Versioning policy:

- Breaking API changes require a new version prefix (for example /api/v2)

## 7. Auth and Sync Rules

Authentication:

- Supabase Auth is the identity source of truth
- Supported methods for MVP: email/password
- API accepts bearer tokens from Supabase sessions

Authorization:

- Public read access for releases, characters, and release_characters
- User-owned tables (user_watched, user_preferences, media_assets owner rows) require auth
- Access rule for user-owned data: row.user_id must equal auth.uid()

Cross-device sync behavior:

- Watched state is persisted server-side in user_watched
- Preferences are persisted server-side in user_preferences
- After sign-in, client hydrates watched state and preferences before rendering final timeline state
- Updates are optimistic in UI, then confirmed by API response

Guest mode:

- Guests can browse releases and use local filters
- Guest watched state may be stored locally in browser storage
- On account sign-in, local watched state is merged into server state once, then cleared locally

Conflict and consistency rules:

- Last write wins for watched toggles and preference updates
- Server timestamps are canonical for audit fields
- If sync fails, UI shows retry state and keeps last known local change queued

Security rules:

- Never trust client-sent user_id; derive identity from auth token only
- RLS must be enabled on all user-owned tables
- Storage object paths should be namespaced by user id (for example user_id/filename)

## 8. Run and Deploy

## 9. Guardrails

## 10. Open Questions
