# BC Tables Hunter — Monorepo

This repository now contains two packages:
- frontend — Phaser/Vite client
- backend — Express + Socket.IO server

## Quick Start
- Install dependencies per workspace:
```bash
npm install -w frontend
npm install -w backend
```

- Run dev servers (two terminals):
```bash
npm run dev -w backend
npm run dev -w frontend
```

- Open the frontend at http://localhost:5173
Backend listens on http://localhost:8080

## Frontend
See [frontend/README.md](frontend/README.md) for game details.

Backend URLs can be set via Vite env:
- VITE_API_URL (default http://localhost:8080)
- VITE_WS_URL (default http://localhost:8080)

## Backend
See [backend/README.md](backend/README.md) for API and sockets.

Environment:
- Copy [backend/.env.example](backend/.env.example) to backend/.env and adjust values.

## Notes
- CORS is enabled for the Vite dev origin.
- Persistence is optional (MongoDB). Set `PERSIST_ENABLED=true` and `MONGO_URL`.
