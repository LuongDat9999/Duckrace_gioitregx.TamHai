/**
 * Duck.js - Class Duck cho game đua vịt
 * Chứa toàn bộ logic và rendering của vịt
 */

import { GAME_CONFIG } from './config.js';

export class Duck {
    // Ảnh vịt dùng chung cho mọi instance
    static duckImage = null;
    static duckImageLoaded = false;
    static loadDuckImage() {
        if (!Duck.duckImage) {
            Duck.duckImage = new window.Image();
            Duck.duckImage.src = 'img/duck.png';
            Duck.duckImage.onload = () => { Duck.duckImageLoaded = true; };
        }
    }
    
    // Ảnh logo tiêu chuẩn
    static logoImage = null;
    static logoImageLoaded = false;
    static loadLogoImage() {
        if (!Duck.logoImage) {
            Duck.logoImage = new window.Image();
            Duck.logoImage.src = 'img/logo gioi tre_tieuchuan.png';
            Duck.logoImage.onload = () => { Duck.logoImageLoaded = true; };
        }
    }

    // Enum chiến thuật
    static STRATEGIES = {
        EARLY_LEADER: 'early-leader',
        LATE_BOOSTER: 'late-booster',
        STEADY_RUNNER: 'steady-runner',
        CHAOTIC: 'chaotic'
    };

    constructor({ id, name, x = 0, y = 0, speed = 120, minSpeed = 80, maxSpeed = 200, finishedStage = false, isWinner = false }) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.speedMin = minSpeed;
        this.speedMax = maxSpeed;
        this.baseSpeed = speed;
        this.speed = this.#clampSpeed(speed);
        this.finishedStage = finishedStage;
        this.isWinner = isWinner;
        this.radius = GAME_CONFIG.DUCK_RADIUS;
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 2 + Math.random() * 1.2;
        this.wobbleAmp = 2 + Math.random() * 2;

        this.state = 'racing'; // 'racing' | 'winning' | 'finished'
        this.targetX = x;
        this.targetY = y;
        this.lerpT = 0;
        
        // Chiến thuật ẩn của vịt với phân bố có kiểm soát
        const strategies = [
            Duck.STRATEGIES.EARLY_LEADER,
            Duck.STRATEGIES.LATE_BOOSTER,
            Duck.STRATEGIES.STEADY_RUNNER,
            Duck.STRATEGIES.CHAOTIC
        ];
        const weights = [0.25, 0.25, 0.35, 0.15];
        this.strategy = this.#selectStrategy(strategies, weights);
        
        // Các tham số riêng cho chiến thuật chaotic
        this.chaoticPhase = Math.random() * Math.PI * 2;
        this.chaoticFrequency = 2 + Math.random() * 3;
        
        // Tốc độ cơ sở riêng cho mỗi vịt
        this.personalSpeedFactor = 0.92 + Math.random() * 0.16;
        
        // Khoảng cách tới đích
        this.finishDistance = 1000;
        this.startPosition = x;
    }

    setStageSpeed(remainingDistance, stageDuration, variation = 0.12) {
        this.finishDistance = remainingDistance;
        this.startPosition = this.x;
        this.stageStartTime = 0;
        this.stageDuration = stageDuration;
    }

    update(deltaTime, trackWidth) {
        this.wobblePhase += deltaTime * this.wobbleSpeed;

        if (this.state === 'racing') {
            const totalDistance = this.finishDistance || trackWidth;
            const distanceTraveled = this.x - this.startPosition;
            const progress = Math.max(0, Math.min(1, distanceTraveled / totalDistance));
            
            const strategyMultiplier = this.#calculateStrategyMultiplier(progress);
            
            this.speed = this.baseSpeed * this.personalSpeedFactor * strategyMultiplier;
            this.speed = this.#clampSpeed(this.speed);
            
            this.x += this.speed * deltaTime;

            if (trackWidth !== undefined && this.x + this.radius >= trackWidth) {
                this.x = trackWidth - this.radius;
            }
            return;
        }

        if (this.state === 'winning') {
            this.lerpT = Math.min(1, this.lerpT + deltaTime * 2.2);
            const ease = this.#easeOutCubic(this.lerpT);
            this.x = this.x + (this.targetX - this.x) * ease;
            this.y = this.y + (this.targetY - this.y) * ease;
            if (this.lerpT >= 0.99) {
                this.state = 'finished';
                this.x = this.targetX;
                this.y = this.targetY;
                this.isWinner = true;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        const wobbleY = Math.sin(this.wobblePhase) * this.wobbleAmp;
        ctx.translate(this.x, this.y + wobbleY);

        Duck.loadDuckImage();
        const img = Duck.duckImage;
        const ready = Duck.duckImageLoaded && img && img.complete;
        
        const duckW = GAME_CONFIG.DUCK_WIDTH;
        const duckH = GAME_CONFIG.DUCK_HEIGHT;
        const drawX = -duckW / 2;
        const drawY = -duckH / 2;
        
        if (ready) {
            ctx.drawImage(img, drawX, drawY, duckW, duckH);
        } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, duckW/2, duckH/2, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffe066';
            ctx.fill();
        }

        // Vẽ số thứ tự
        const idText = this.id.toString();
        const numDigits = idText.length;
        const bgWidth = numDigits === 1 ? 16 : 14 + (numDigits - 1) * 9;
        const bgHeight = 14;
        const bgX = -duckW/4;
        const bgY = -duckH/8;
        
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(bgX, bgY, bgWidth, bgHeight, -0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
        
        ctx.save();
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#222';
        ctx.strokeText(idText, bgX, bgY);
        ctx.fillStyle = '#1976d2';
        ctx.fillText(idText, bgX, bgY);
        ctx.restore();

        ctx.restore();
    }

    #clampSpeed(value) {
        return Math.min(this.speedMax, Math.max(this.speedMin, value));
    }

    #easeOutCubic(t) {
        const p = 1 - t;
        return 1 - p * p * p;
    }

    #calculateStrategyMultiplier(progress) {
        const p = Math.max(0, Math.min(1, progress));
        
        switch (this.strategy) {
            case Duck.STRATEGIES.EARLY_LEADER:
                return this.#curveEarlyLeader(p);
            case Duck.STRATEGIES.LATE_BOOSTER:
                return this.#curveLatBooster(p);
            case Duck.STRATEGIES.STEADY_RUNNER:
                return this.#curveSteadyRunner(p);
            case Duck.STRATEGIES.CHAOTIC:
                return this.#curveChaotic(p);
            default:
                return 0.95;
        }
    }

    #curveEarlyLeader(p) {
        if (p < 0.4) {
            return 1.3 + (0.4 - p) * 0.25;
        } else if (p < 0.7) {
            const transProgress = (p - 0.4) / 0.3;
            return 1.3 - transProgress * 0.35;
        } else {
            const endProgress = (p - 0.7) / 0.3;
            return 0.95 - endProgress * 0.35;
        }
    }

    #curveLatBooster(p) {
        if (p < 0.5) {
            return 0.78 - (0.5 - p) * 0.1;
        } else if (p < 0.8) {
            const rampProgress = (p - 0.5) / 0.3;
            return 0.78 + rampProgress * 0.32;
        } else {
            const boostProgress = (p - 0.8) / 0.2;
            return 1.1 + boostProgress * 0.4;
        }
    }

    #curveSteadyRunner(p) {
        const oscillation = Math.sin(p * Math.PI * 4) * 0.08;
        return 0.98 + oscillation;
    }

    #curveChaotic(p) {
        const oscillation = Math.sin(p * Math.PI * 6 + this.id * 0.7) * 0.15;
        const trend = (Math.sin(p * Math.PI - Math.PI / 2) + 1) * 0.2;
        return 0.85 + oscillation + trend;
    }

    #selectStrategy(strategies, weights) {
        const total = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * total;
        for (let i = 0; i < strategies.length; i += 1) {
            random -= weights[i];
            if (random <= 0) return strategies[i];
        }
        return strategies[strategies.length - 1];
    }
}
