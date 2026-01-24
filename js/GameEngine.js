/**
 * GameEngine.js - Logic chính game
 * Tích hợp tất cả các component và quản lý game loop
 */

import { GAME_CONFIG, LAYOUT } from './config.js';
import { Duck } from './Duck.js';
import { ScrollingWaterBackground, WaveLayers } from './WaveLayers.js';
import { GameState } from './GameState.js';
import { CheckpointManager } from './CheckpointManager.js';
import { WinnerManager } from './WinnerManager.js';
import { UIRenderer } from './UIRenderer.js';
import { AudioManager } from './AudioManager.js';

export class GameEngine {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Components
        this.gameState = new GameState();
        this.checkpointManager = new CheckpointManager(canvas.clientWidth);
        this.winnerManager = new WinnerManager();
        this.uiRenderer = new UIRenderer(canvas, ctx);
        this.waterBackground = new ScrollingWaterBackground('img/wave.png');
        this.waveLayers = new WaveLayers('img/wave.png');
        this.audioManager = new AudioManager();
        
        // Ducks
        this.ducks = [];
        
        // Animation
        this.running = false;
        this.lastTime = 0;
        this._loop = this.loop.bind(this);
        
        // Audio
        this.quackPlayer = this.#createQuackPlayer();
        
        // Slow motion
        this.slowMoTimer = 0;
        
        // UI state
        this.startButtonHovered = false;
        this.startButtonBounds = null;
        this.showWinnersModal = false;
        this.modalButtonBounds = null;
        
        // Setup event listeners
        this.#setupEventListeners();
    }

    #createQuackPlayer() {
        let audioCtx = null;
        return {
            play: () => {
                try {
                    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const ctx = audioCtx;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    const now = ctx.currentTime;
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(440 + Math.random() * 120, now);
                    gain.gain.setValueAtTime(0.0001, now);
                    gain.gain.exponentialRampToValueAtTime(0.4, now + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
                    osc.connect(gain).connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.3);
                } catch (e) {
                    // Silent fail
                }
            }
        };
    }

    #setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.#handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.#handleCanvasMouseMove(e));
    }

    #handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check modal close button
        if (this.showWinnersModal && this.modalButtonBounds) {
            const bounds = this.modalButtonBounds;
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                this.showWinnersModal = false;
                this.reset();
                return;
            }
        }
    }

    #handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check modal button hover
        if (this.showWinnersModal && this.modalButtonBounds) {
            const bounds = this.modalButtonBounds;
            const isHovered = x >= bounds.x && x <= bounds.x + bounds.width &&
                             y >= bounds.y && y <= bounds.y + bounds.height;
            this.canvas.style.cursor = isHovered ? 'pointer' : 'default';
            return;
        }
        
        this.canvas.style.cursor = 'default';
    }

    initDucks(count = GAME_CONFIG.TOTAL_DUCKS) {
        this.ducks = [];
        const lanes = this.#buildLanePositions(count);
        this.#shuffle(lanes);

        // Tạo mảng thứ tự vịt và shuffle để phân bố tốc độ ngẫu nhiên
        const duckIndices = Array.from({ length: count }, (_, i) => i);
        this.#shuffle(duckIndices);

        // Tính khoảng cách đua và tốc độ tối ưu
        const raceDistance = LAYOUT.finishLineX - LAYOUT.startLineX;
        const speeds = GAME_CONFIG.calculateOptimalSpeed(raceDistance);

        for (let i = 0; i < count; i++) {
            // Phân bố tốc độ: 20 vịt nhanh nhất, 40% trung bình, còn lại chậm
            // Dùng thứ tự đã shuffle để random công bằng
            let speed;
            const shuffledIndex = duckIndices[i];
            
            if (shuffledIndex < 20) {
                // Top 20: winner speed với variation nhỏ
                speed = speeds.winnerSpeed * (0.95 + Math.random() * 0.10);
            } else if (shuffledIndex < count * 0.4) {
                // 40% tiếp theo: average speed
                speed = speeds.averageSpeed * (0.90 + Math.random() * 0.20);
            } else {
                // Còn lại: slow speed
                speed = speeds.slowSpeed * (0.85 + Math.random() * 0.30);
            }
            
            this.ducks.push(new Duck({
                id: i + 1,
                name: `Vịt ${i + 1}`,
                x: LAYOUT.startLineX,
                y: lanes[i],
                speed: speed,
                minSpeed: speeds.slowSpeed * 0.7,
                maxSpeed: speeds.winnerSpeed * 1.2
            }));
        }
    }

    #buildLanePositions(count) {
        const lanePadding = 16;
        const usableHeight = Math.max(LAYOUT.waterHeight - lanePadding * 2, 40);
        const gap = usableHeight / (count + 1);
        const top = LAYOUT.waterYStart + (LAYOUT.waterHeight - usableHeight) / 2;
        const lanes = new Array(count);
        for (let i = 0; i < count; i++) {
            lanes[i] = top + gap * (i + 1);
        }
        return lanes;
    }

    #shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    start() {
        if (!this.gameState.isIdle()) return;
        
        this.gameState.startCountdown();
        this.running = true;
        this.waterBackground.reset();
        this.waveLayers.reset();
        this.lastTime = performance.now();
        
        // Play countdown sound
        this.audioManager.playCountdown();
        
        requestAnimationFrame(this._loop);
    }

    stop() {
        this.running = false;
    }

    reset() {
        this.stop();
        this.gameState.reset();
        this.checkpointManager.reset();
        this.winnerManager.reset();
        this.slowMoTimer = 0;
        this.showWinnersModal = false;
        this.modalButtonBounds = null;
        this.audioManager.stopAll();
        
        // Reset ducks
        const lanes = this.#buildLanePositions(this.ducks.length);
        this.#shuffle(lanes);
        
        for (let i = 0; i < this.ducks.length; i++) {
            const duck = this.ducks[i];
            duck.x = LAYOUT.startLineX;
            duck.y = lanes[i];
            duck.state = 'racing';
            duck.isWinner = false;
            duck.finishedStage = false;
            duck.targetX = duck.x;
            duck.targetY = duck.y;
            duck.speed = GAME_CONFIG.MIN_SPEED + Math.random() * (GAME_CONFIG.MAX_SPEED - GAME_CONFIG.MIN_SPEED);
        }
        
        this.render();
    }

    loop(timestamp) {
        if (!this.running) return;
        
        let delta = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        // Handle countdown
        if (this.gameState.isCountdown()) {
            const wasCountingDown = true;
            this.gameState.updateCountdown(delta);
            
            // Nếu countdown vừa kết thúc, play nhạc nền
            if (!this.gameState.isCountdown() && wasCountingDown) {
                this.audioManager.playBackgroundMusic();
            }
            
            this.render();
            requestAnimationFrame(this._loop);
            return;
        }

        // Apply slow motion (but keep original delta for timer)
        let animationDelta = delta;
        if (this.slowMoTimer > 0) {
            animationDelta = delta * GAME_CONFIG.SLOW_MO_FACTOR;
            this.slowMoTimer = Math.max(0, this.slowMoTimer - delta);
        }

        this.update(delta, animationDelta);
        this.render();

        requestAnimationFrame(this._loop);
    }

    update(realDelta, animationDelta = null) {
        const delta = animationDelta || realDelta;
        
        // Update timers with real delta (không bị slow motion)
        const raceFinished = this.gameState.updateRaceTimer(realDelta);
        
        if (raceFinished) {
            this.#onGameFinished();
            return;
        }

        // Update animations
        this.waterBackground.update(delta);
        this.waveLayers.update(delta);
        this.checkpointManager.update(delta);

        // Update ducks
        for (const duck of this.ducks) {
            duck.update(delta, LAYOUT.canvasWidth);
        }

        // Check for checkpoint winners
        const currentCheckpoint = this.checkpointManager.getCurrentCheckpoint();
        
        if (currentCheckpoint && currentCheckpoint.visible) {
            for (const duck of this.ducks) {
                if (duck.state !== 'racing') continue;
                if (duck.isWinner) continue;
                
                const duckFront = duck.x + duck.radius;
                
                if (duckFront >= currentCheckpoint.currentX) {
                    const added = this.checkpointManager.addWinner(currentCheckpoint.index, duck.id);
                    
                    if (added) {
                        this.winnerManager.addWinner(duck, currentCheckpoint.index);
                        this.slowMoTimer = GAME_CONFIG.SLOW_MO_DURATION;
                        
                        // Play hit target sound
                        this.audioManager.playHitTarget();
                        
                        // Check if all checkpoints complete
                        if (this.checkpointManager.isAllCheckpointsComplete()) {
                            this.#onGameFinished();
                        }
                    }
                }
            }
        }
    }

    #onGameFinished() {
        this.gameState.finish();
        this.stop();
        
        // Stop background music
        this.audioManager.stopBackgroundMusic();
        
        // Show winners modal on canvas
        setTimeout(() => {
            this.showWinnersModal = true;
            this.audioManager.playClap();
            this.render();
        }, 1000);
    }

    render() {
        this.ctx.clearRect(0, 0, LAYOUT.canvasWidth, LAYOUT.canvasHeight);

        // Draw background layers
        this.uiRenderer.drawGrassArea();
        this.uiRenderer.drawWaterArea(this.waterBackground);
        this.waveLayers.draw(this.ctx, LAYOUT.canvasWidth, LAYOUT.waterYStart, LAYOUT.waterHeight);
        
        // Draw lines
        this.uiRenderer.drawStartLine();
        
        // Draw checkpoints
        this.checkpointManager.draw(this.ctx);
        
        // Draw logo
        this.uiRenderer.drawLogo();

        // Draw ducks
        for (const duck of this.ducks) {
            duck.draw(this.ctx);
        }

        // Draw timer
        if (this.gameState.isRacing()) {
            const timeStr = this.gameState.getFormattedTime();
            const isLowTime = this.gameState.raceTimer <= 10;
            this.uiRenderer.drawTimer(timeStr, isLowTime);
        }

        // Draw winner podium header
        this.winnerManager.drawPodiumHeader(this.ctx);

        // Draw countdown overlay
        if (this.gameState.isCountdown()) {
            const number = this.gameState.getCountdownNumber();
            this.uiRenderer.drawCountdown(number);
        }
        
        // Draw winners modal
        if (this.showWinnersModal) {
            this.modalButtonBounds = this.uiRenderer.drawWinnersModal(this.winnerManager.getWinners());
        }
    }

    resize(width, height, scale) {
        LAYOUT.update(width, height);
        this.checkpointManager.setCanvasWidth(width);
        
        // Redistribute duck lanes để trải dài toàn bộ sông
        if (this.ducks.length > 0) {
            // Sort ducks theo Y position hiện tại để giữ nguyên thứ tự tương đối
            const sortedDucks = [...this.ducks].sort((a, b) => a.y - b.y);
            const lanes = this.#buildLanePositions(this.ducks.length);
            
            // Gán lại Y theo thứ tự từ trên xuống dưới
            for (let i = 0; i < sortedDucks.length; i++) {
                sortedDucks[i].y = lanes[i];
                
                // Nếu vịt đang winning, cập nhật target Y
                if (sortedDucks[i].state === 'winning') {
                    const podiumPos = this.winnerManager.calculatePodiumPosition(
                        this.winnerManager.getWinners().findIndex(w => w.id === sortedDucks[i].id)
                    );
                    if (podiumPos) {
                        sortedDucks[i].targetY = podiumPos.y;
                    }
                }
            }
        }
        
        if (!this.running) {
            this.render();
        }
    }

    configure({ totalDucks, totalCheckpoints, winnersPerCheckpoint, totalRaceTime }) {
        if (totalDucks !== undefined) {
            GAME_CONFIG.TOTAL_DUCKS = totalDucks;
        }
        if (totalCheckpoints !== undefined) {
            GAME_CONFIG.TOTAL_CHECKPOINTS = totalCheckpoints;
        }
        if (winnersPerCheckpoint !== undefined) {
            GAME_CONFIG.WINNERS_PER_CHECKPOINT = winnersPerCheckpoint;
        }
        if (totalRaceTime !== undefined) {
            GAME_CONFIG.TOTAL_RACE_TIME = totalRaceTime;
            this.gameState.setTotalRaceTime(totalRaceTime);
        }
        
        this.checkpointManager.configure({
            totalCheckpoints: GAME_CONFIG.TOTAL_CHECKPOINTS,
            winnersPerCheckpoint: GAME_CONFIG.WINNERS_PER_CHECKPOINT,
            totalRaceTime: GAME_CONFIG.TOTAL_RACE_TIME
        });
    }
}
