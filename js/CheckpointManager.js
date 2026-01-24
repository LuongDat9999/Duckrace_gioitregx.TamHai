/**
 * CheckpointManager.js - Quản lý các checkpoint
 * Checkpoint xuất hiện từ phải màn hình với animation
 */

import { GAME_CONFIG, LAYOUT } from './config.js';

export class CheckpointManager {
    constructor(canvasWidth) {
        this.canvasWidth = canvasWidth;
        this.totalCheckpoints = GAME_CONFIG.TOTAL_CHECKPOINTS;
        this.winnersPerCheckpoint = GAME_CONFIG.WINNERS_PER_CHECKPOINT;
        this.checkpoints = [];
        this.currentCheckpointIndex = 0;
        this.gameTime = 0; // Track elapsed game time
        this.totalRaceTime = GAME_CONFIG.TOTAL_RACE_TIME;
        this.initialize();
    }

    initialize() {
        this.checkpoints = [];
        this.gameTime = 0;
        const segmentWidth = this.canvasWidth / (this.totalCheckpoints + 1);
        
        // Sử dụng timing từ GAME_CONFIG
        const checkpointTimings = GAME_CONFIG.getCheckpointTimings();
        
        for (let i = 0; i < this.totalCheckpoints; i++) {
            const targetX = segmentWidth * (i + 1) + GAME_CONFIG.START_LINE_X;
            const scheduledTime = checkpointTimings[i];
            
            this.checkpoints.push({
                index: i,
                targetX: targetX,
                currentX: this.canvasWidth + GAME_CONFIG.CHECKPOINT_APPEAR_OFFSET,
                visible: false,
                animating: false,
                animationProgress: 0,
                winners: [],
                isActive: false,
                isFinal: i === this.totalCheckpoints - 1,
                scheduledTime: scheduledTime,
                slidingOut: false,
                slideOutProgress: 0
            });
        }
        
        this.currentCheckpointIndex = 0;
    }

    activateNextCheckpoint() {
        if (this.currentCheckpointIndex >= this.checkpoints.length) {
            return null;
        }
        
        const checkpoint = this.checkpoints[this.currentCheckpointIndex];
        checkpoint.visible = true;
        checkpoint.animating = true;
        checkpoint.isActive = true;
        checkpoint.animationProgress = 0;
        
        return checkpoint;
    }

    update(deltaTime) {
        // Update game time
        this.gameTime += deltaTime;
        
        // Chỉ kích hoạt checkpoint tiếp theo (currentCheckpointIndex) khi đến thời gian
        // Tránh các checkpoint cũ xuất hiện lại
        if (this.currentCheckpointIndex < this.checkpoints.length) {
            const nextCheckpoint = this.checkpoints[this.currentCheckpointIndex];
            if (!nextCheckpoint.visible && !nextCheckpoint.animating && 
                this.gameTime >= nextCheckpoint.scheduledTime) {
                nextCheckpoint.visible = true;
                nextCheckpoint.animating = true;
                nextCheckpoint.isActive = true;
                nextCheckpoint.animationProgress = 0;
            }
        }
        
        // Update animations
        for (const checkpoint of this.checkpoints) {
            // Slide in animation
            if (checkpoint.animating && !checkpoint.slidingOut) {
                checkpoint.animationProgress += deltaTime / GAME_CONFIG.CHECKPOINT_SLIDE_DURATION;
                
                if (checkpoint.animationProgress >= 1) {
                    checkpoint.animationProgress = 1;
                    checkpoint.animating = false;
                    checkpoint.currentX = checkpoint.targetX;
                } else {
                    const eased = this.#easeOutCubic(checkpoint.animationProgress);
                    const startX = this.canvasWidth + GAME_CONFIG.CHECKPOINT_APPEAR_OFFSET;
                    checkpoint.currentX = startX + (checkpoint.targetX - startX) * eased;
                }
            }
            
            // Slide out animation (từ phải sang trái khi đủ người)
            if (checkpoint.slidingOut) {
                checkpoint.slideOutProgress += deltaTime / GAME_CONFIG.CHECKPOINT_SLIDE_DURATION;
                
                if (checkpoint.slideOutProgress >= 1) {
                    checkpoint.slideOutProgress = 1;
                    checkpoint.visible = false;
                    checkpoint.slidingOut = false;
                } else {
                    const eased = this.#easeInCubic(checkpoint.slideOutProgress);
                    // Slide out về phía bên trái màn hình
                    const endX = -GAME_CONFIG.CHECKPOINT_APPEAR_OFFSET;
                    checkpoint.currentX = checkpoint.targetX + (endX - checkpoint.targetX) * eased;
                }
            }
        }
    }

    addWinner(checkpointIndex, duckId) {
        if (checkpointIndex < 0 || checkpointIndex >= this.checkpoints.length) {
            return false;
        }
        
        const checkpoint = this.checkpoints[checkpointIndex];
        
        if (checkpoint.winners.length >= this.winnersPerCheckpoint) {
            return false;
        }
        
        checkpoint.winners.push(duckId);
        
        // Nếu checkpoint đủ người, bắt đầu slide out (trừ checkpoint cuối)
        if (checkpoint.winners.length >= this.winnersPerCheckpoint) {
            // Nếu không phải checkpoint cuối, slide out
            if (!checkpoint.isFinal) {
                checkpoint.slidingOut = true;
                checkpoint.slideOutProgress = 0;
                checkpoint.isActive = false;
            }
            
            this.currentCheckpointIndex++;
            
            // Kích hoạt checkpoint tiếp theo nếu có
            if (this.currentCheckpointIndex < this.checkpoints.length) {
                this.activateNextCheckpoint();
            }
        }
        
        return true;
    }

    getCurrentCheckpoint() {
        if (this.currentCheckpointIndex >= this.checkpoints.length) {
            return null;
        }
        return this.checkpoints[this.currentCheckpointIndex];
    }

    getActiveCheckpoints() {
        return this.checkpoints.filter(cp => cp.isActive);
    }

    isAllCheckpointsComplete() {
        return this.checkpoints.every(cp => cp.winners.length >= this.winnersPerCheckpoint);
    }

    reset() {
        this.currentCheckpointIndex = 0;
        this.gameTime = 0;
        for (const checkpoint of this.checkpoints) {
            checkpoint.currentX = this.canvasWidth + GAME_CONFIG.CHECKPOINT_APPEAR_OFFSET;
            checkpoint.visible = false;
            checkpoint.animating = false;
            checkpoint.animationProgress = 0;
            checkpoint.winners = [];
            checkpoint.isActive = false;
            checkpoint.slidingOut = false;
            checkpoint.slideOutProgress = 0;
        }
    }

    draw(ctx) {
        for (const checkpoint of this.checkpoints) {
            if (!checkpoint.visible) continue;
            
            const x = checkpoint.currentX;
            const y = LAYOUT.waterYStart;
            const w = 20;
            const h = LAYOUT.waterHeight;
            
            ctx.save();
            
            // Shadow
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = -2;
            
            // Màu sắc khác nhau cho checkpoint cuối
            const primaryColor = checkpoint.isFinal ? '#FFD700' : '#ec1f1fff';
            const secondaryColor = '#fff';
            
            // Draw checkered pattern
            const square = 10;
            for (let i = 0; i < Math.ceil(h / square); i++) {
                for (let j = 0; j < 2; j++) {
                    ctx.fillStyle = (i + j) % 2 === 0 ? primaryColor : secondaryColor;
                    ctx.fillRect(x - w/2 + j * (w / 2), y + i * square, w / 2, square);
                }
            }
            
            ctx.shadowBlur = 0;
            
            // Border
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(x - w/2, y, w, h);
            
            // Label
            const labelText = checkpoint.isFinal ? 'FINAL' : `${checkpoint.index + 1}`;
            const labelBg = checkpoint.isFinal ? 'rgba(255, 215, 0, 0.9)' : 'rgba(235, 121, 7, 0.9)';
            
            ctx.fillStyle = labelBg;
            ctx.fillRect(x - 30, y - 35, 60, 28);
            ctx.strokeStyle = secondaryColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 30, y - 35, 60, 28);
            
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, x, y - 21);
            
            // Winner count
            const countText = `${checkpoint.winners.length}/${this.winnersPerCheckpoint}`;
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = primaryColor;
            ctx.fillText(countText, x, y + h + 15);
            
            ctx.restore();
        }
    }

    #easeOutCubic(t) {
        const p = 1 - t;
        return 1 - p * p * p;
    }

    #easeInCubic(t) {
        return t * t * t;
    }

    setCanvasWidth(width) {
        this.canvasWidth = width;
        this.initialize();
    }

    configure({ totalCheckpoints, winnersPerCheckpoint, totalRaceTime }) {
        if (totalCheckpoints !== undefined) {
            this.totalCheckpoints = totalCheckpoints;
        }
        if (winnersPerCheckpoint !== undefined) {
            this.winnersPerCheckpoint = winnersPerCheckpoint;
        }
        if (totalRaceTime !== undefined) {
            this.totalRaceTime = totalRaceTime;
        }
        this.initialize();
    }
}
