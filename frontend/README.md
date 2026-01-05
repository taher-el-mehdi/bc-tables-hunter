# 🎯 AL Objects Hunter (Frontend)

Phaser 3 + Vite frontend for single-player practice. For multiplayer matches, pair with the backend.

## Run
```bash
npm install
npm run dev
```

Backend URL is configurable via Vite env:
- `VITE_API_URL` (default `http://localhost:8080`)
- `VITE_WS_URL` (default `http://localhost:8080`)

## Structure
- src/scenes — Boot, Menu, Game, Result
- src/objects — Circle entities
- src/services — Audio/Score utils
- src/data — Business Central tables
- src/config — Game and backend config
