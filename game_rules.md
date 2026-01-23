# DUCK RACE GAME SPECIFICATION

## 1. Overview
We are building a web-based 2D racing game using HTML5 Canvas and **Matter.js** physics engine.
The game involves floating objects ("Ducks") racing from the top (Start) to the bottom (Finish) of the screen.

## 2. Key Constraints
- **No Backend/Database:** Everything runs in the browser memory.
- **Performance:** Must handle up to **300 ducks** smoothly.
- **Physics:** Ducks must interact physically (bump into each other, rotate, speed up/slow down due to "water currents").

## 3. Game Logic (The Unique Selling Point)
The race is divided into multiple "Winning Batches" (Stages) based on a single Finish Line.

### Configuration Example:
- Total Players: 180
- Total Winners: 20
- Stages: 4 batches.
- Winners per Stage: 5.

### Flow:
1. All 180 ducks start falling/swimming from Top Y=0.
2. Physics forces (Gravity + Random wind + Water flow) push them down towards Bottom Y=Height.
3. When a duck crosses the Finish Line:
   - Check current **Active Stage** (e.g., Stage 1).
   - If Stage 1 has slots left (< 5 winners):
     - Mark duck as "Winner of Stage 1".
     - Remove duck from physics world (or stop it).
     - Update UI board.
   - If Stage 1 is full, automatically switch to **Stage 2**.
   - Repeat until all 4 Stages are full.
4. Remaining ducks continue floating or game ends.

## 4. Visuals
- View: Top-down 2D.
- Ducks: Represented by simple Circles (start) or Images (later).
- Water: Blue background.
- Finish Line: A horizontal line at the bottom.w