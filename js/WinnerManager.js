/**
 * WinnerManager.js - Quản lý người thắng
 * Di chuyển vịt thắng lên grass area theo grid layout
 */

import { GAME_CONFIG, LAYOUT } from './config.js';

export class WinnerManager {
    constructor() {
        this.winners = []; // Array of duck objects
        this.winnersByCheckpoint = []; // Array of arrays
        this.totalWinners = 0;
        
        // Initialize checkpoint arrays
        for (let i = 0; i < GAME_CONFIG.TOTAL_CHECKPOINTS; i++) {
            this.winnersByCheckpoint.push([]);
        }
    }

    addWinner(duck, checkpointIndex) {
        if (this.winners.some(w => w.id === duck.id)) {
            return false; // Already a winner
        }
        
        this.winners.push(duck);
        
        if (checkpointIndex >= 0 && checkpointIndex < this.winnersByCheckpoint.length) {
            this.winnersByCheckpoint[checkpointIndex].push(duck);
        }
        
        this.totalWinners++;
        
        // Calculate podium position in grass area
        const position = this.#calculatePodiumPosition(this.totalWinners - 1);
        
        // Set duck state to winning with target position
        duck.state = 'winning';
        duck.targetX = position.x;
        duck.targetY = position.y;
        duck.lerpT = 0;
        
        return true;
    }

    #calculatePodiumPosition(index) {
        const cols = GAME_CONFIG.WINNER_GRID_COLS;
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const x = GAME_CONFIG.WINNER_PODIUM_X + 100 + col * GAME_CONFIG.WINNER_SPACING_X;
        const y = GAME_CONFIG.WINNER_PODIUM_Y + 55 + row * GAME_CONFIG.WINNER_SPACING_Y;
        
        return { x, y };
    }

    getWinners() {
        return this.winners;
    }

    getWinnersByCheckpoint(checkpointIndex) {
        if (checkpointIndex < 0 || checkpointIndex >= this.winnersByCheckpoint.length) {
            return [];
        }
        return this.winnersByCheckpoint[checkpointIndex];
    }

    getTotalWinners() {
        return this.totalWinners;
    }

    isComplete() {
        return this.totalWinners >= GAME_CONFIG.TOTAL_WINNERS;
    }

    reset() {
        this.winners = [];
        this.totalWinners = 0;
        
        for (let i = 0; i < this.winnersByCheckpoint.length; i++) {
            this.winnersByCheckpoint[i] = [];
        }
    }

    drawPodiumHeader(ctx) {
        if (this.winners.length === 0) return;
        
        ctx.save();
        
        ctx.font = 'bold 25px Arial';
        ctx.fillStyle = '#e60a0aff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('CHÚC MỪNG NGƯỜI CHIẾN THẮNG:', GAME_CONFIG.WINNER_PODIUM_X + 100, GAME_CONFIG.WINNER_PODIUM_Y);
        
        ctx.restore();
    }
}
