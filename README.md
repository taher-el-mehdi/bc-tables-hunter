# AL Objects Hunter

A web-based educational game to help Microsoft Dynamics 365 Business Central developers memorize tables and IDs.

## 🎮 How to Play

**Quick overview**

- **Objective**: Match floating **Table Name** circles (Blue) with their corresponding **Table ID** circles (Red). Each pair represents the same table from `src/data/tables.json`.

**Controls**

- **Click / Tap** a circle to select it. Selecting a Table Name will show "Select the ID!" and selecting an ID will show "Select the Table Name!".
- Click the matching counterpart to attempt a match.
- Click the same circle again to deselect it.
- Clicking two circles of the same type (two Table Names or two IDs) is ignored.

**Scoring**

- **Base points**: 10 points per correct match.
- **Speed bonus**: +10 points if you match within **1.5s**, or +5 points if within **3.0s** (measured from your first selection).
- **Streak multiplier**: 1.5× multiplier when streak ≥ 3; 2.0× when streak ≥ 5.
- **Wrong match**: streak resets to 0 (no point penalty).

**UI elements**

- `Score` — current score (top-left).
- `Matched` / `Remaining` — how many tables you've matched and how many are left.
- `Messages` — short feedback at the bottom (e.g., "Matched!", "Wrong Match!").

**Tips & notes**

- Aim to match quickly (under **1.5s**) to get the highest speed bonus.
- Build a streak of correct matches to increase your multiplier (up to **2×** at 5 correct in a row).
- Circles move and bounce inside the game area — time your selection to avoid collisions.

**Game flow**

- Pairs spawn periodically (see `src/config/gameConfig.ts`) until all tables from `src/data/tables.json` have been matched.
- When all pairs are matched, no more spawns will occur and your final score is displayed in the UI.



## 🚀 How to Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```

3.  Open the browser at the provided local URL (usually `http://localhost:5173`).

## 🛠 Project Structure

*   `src/scenes/`: Phaser scenes (Boot, Menu, Game).
*   `src/objects/`: Game entities (Circles).
*   `src/services/`: Game logic (ScoreService).
*   `src/data/`: Game data (tables.json).
*   `src/config/`: Configuration files.

## 📝 How to Extend

### Adding New Tables
Edit `src/data/tables.json` and add a new entry:

```json
{
  "name": "My New Table",
  "id": 50000,
  "category": "Custom",
  "difficulty": 1
}
```

### Adding New Levels or Features
*   **Levels**: Create a new Scene (e.g., `Level2Scene.ts`) and add logic in `ScoreService` to handle progression.
*   **Multiplayer**: The `ScoreService` is designed to be decoupled. You can move the validation logic to a Node.js backend and communicate via WebSockets.

## 👨‍💻 Tech Stack

*   Phaser 3
*   TypeScript
*   Vite
