/**
 * GameState.js - Quản lý trạng thái game
 * Quản lý countdown, racing, finished và timer
 */

import { GAME_CONFIG } from './config.js';

export class GameState {
    constructor() {
        this.state = 'idle'; // 'idle' | 'countdown' | 'racing' | 'finished'
        this.paused = false; // Trạng thái pause
        this.countdownTimer = GAME_CONFIG.COUNTDOWN_DURATION;
        this.raceTimer = GAME_CONFIG.TOTAL_RACE_TIME;
        this.totalRaceTime = GAME_CONFIG.TOTAL_RACE_TIME;
    }

    isIdle() {
        return this.state === 'idle';
    }

    isCountdown() {
        return this.state === 'countdown';
    }

    isRacing() {
        return this.state === 'racing';
    }

    isFinished() {
        return this.state === 'finished';
    }

    isPaused() {
        return this.paused;
    }

    pause() {
        if (this.state === 'racing' && !this.paused) {
            this.paused = true;
        }
    }

    resume() {
        if (this.paused) {
            this.paused = false;
        }
    }

    togglePause() {
        if (this.state === 'racing') {
            this.paused = !this.paused;
        }
    }

    startCountdown() {
        this.state = 'countdown';
        this.countdownTimer = GAME_CONFIG.COUNTDOWN_DURATION;
        this.raceTimer = this.totalRaceTime;
    }

    startRacing() {
        this.state = 'racing';
        this.countdownTimer = 0;
    }

    finish() {
        this.state = 'finished';
    }

    reset() {
        this.state = 'idle';
        this.paused = false;
        this.countdownTimer = GAME_CONFIG.COUNTDOWN_DURATION;
        this.raceTimer = this.totalRaceTime;
    }

    updateCountdown(deltaTime) {
        if (this.state !== 'countdown') return false;
        
        this.countdownTimer -= deltaTime;
        
        if (this.countdownTimer <= 0) {
            this.startRacing();
            return true; // Countdown finished
        }
        
        return false;
    }

    updateRaceTimer(deltaTime) {
        if (this.state !== 'racing') return false;
        
        this.raceTimer = Math.max(0, this.raceTimer - deltaTime);
        
        if (this.raceTimer <= 0) {
            this.finish();
            return true; // Race finished
        }
        
        return false;
    }

    getCountdownNumber() {
        return Math.ceil(this.countdownTimer);
    }

    getFormattedTime() {
        const totalSeconds = Math.ceil(this.raceTimer);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    setTotalRaceTime(time) {
        this.totalRaceTime = time;
        this.raceTimer = time;
    }
}
