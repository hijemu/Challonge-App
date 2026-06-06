# Challonge Connect multi-organizer patch

This patch changes the app from "Joboy's single Challonge API key" to "each organizer connects their own Challonge account".

## What changed

- Users register/login inside your app.
- Each logged-in organizer connects their own Challonge account.
- Tournament list now shows only the logged-in organizer's Challonge tournaments.
- Score edits use that organizer's stored Challonge token/key on the backend.
- The mobile app never sees Challonge API keys/tokens.

## Files included

Copy these into your project root and overwrite when asked:

```txt
server/index.cjs
server/data/db.json
src/api/challonge.ts
src/context/AuthContext.tsx
src/pages/Login.tsx
src/pages/ConnectChallonge.tsx
src/pages/Tournaments.tsx
src/pages/TournamentDetail.tsx
src/components/MatchCard.tsx
src/App.tsx
src/main.tsx
.env.example
```

## Install backend dependencies

From project root:

```bash
npm install axios cors dotenv express bcryptjs jsonwebtoken
```

## Setup env

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

For OAuth production testing, create an app in Challonge Connect Developer Portal and fill:

```env
CHALLONGE_CLIENT_ID=
CHALLONGE_CLIENT_SECRET=
CHALLONGE_REDIRECT_URI=http://localhost:3001/challonge/callback
```

Make sure the same redirect URI is registered in Challonge Connect.

For local frontend:

```env
APP_URL=http://localhost:5173
API_URL=http://localhost:3001
```

## Run

Terminal 1:

```bash
node server/index.cjs
```

Terminal 2:

```bash
npm run dev
```

Open the app, register/login, then go to `Connect / Manage Challonge`.

## Testing before OAuth is ready

The Connect page has a temporary "Testing fallback" field for a Challonge API v1 key. This lets an organizer test their own tournaments while your OAuth app is not ready yet.

This is not the final production flow. Production should use the `Connect with Challonge` OAuth button.

## Important security notes

- Do not commit `.env`.
- Do not commit `server/data/db.json` in production because it contains tokens/keys.
- Use PostgreSQL/MySQL later. JSON DB is only for local testing.
- Use HTTPS before real mobile testing.

## How the new flow works

```txt
Organizer logs into your app
↓
Organizer connects Challonge
↓
Backend stores their Challonge token/key
↓
Organizer opens My Tournaments
↓
Backend fetches tournaments using that organizer's connection
↓
Score edits update that organizer's own Challonge tournaments
```
