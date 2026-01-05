# BC Tables Hunter — Backend

Real-time multiplayer backend for matching Business Central table names to IDs.

## Architecture
- Express REST API for room management and state.
- Socket.IO for real-time multiplayer events (join/start/question/answer/score/finish).
- In-memory room/game state for fast gameplay.
- Optional MongoDB persistence (Mongoose) for global leaderboard and analytics.
- Modular services: RoomService, GameService, QuestionService, ScoreService.
- Middleware: CORS, rate limiting, validation (Zod), error handling.

## API
- POST /rooms — Create room
- POST /rooms/:code/join — Join room
- POST /rooms/:code/start — Start match
- GET /rooms/:code/state — Current game state

Socket events:
- player_joined, game_started, new_question, answer_submitted, score_updated, match_finished

## Getting Started

1. Install deps
```bash
npm install
```

2. Configure env
```bash
cp .env.example .env
# edit values as needed
```

3. Run dev
```bash
npm run dev
```

Server defaults: PORT 8080 (with automatic fallback to 3001/8081/4000/5001 if blocked), CORS from Vite at http://localhost:5173.

If the server starts on a different port (e.g. 8081), update the frontend env:
```bash
cp frontend/.env.example frontend/.env
# then edit frontend/.env to match the printed backend URL
```

## Persistence (optional)
Set `MONGO_URL` and `PERSIST_ENABLED=true` to enable saving matches, players, and stats.

## Docker (optional)
See `Dockerfile` for a minimal container build.
