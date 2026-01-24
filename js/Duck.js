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
        // Tăng LATE_BOOSTER để kịch tính hơn, giảm EARLY_LEADER
        const strategies = [
            Duck.STRATEGIES.EARLY_LEADER,
            Duck.STRATEGIES.LATE_BOOSTER,
            Duck.STRATEGIES.STEADY_RUNNER,
            Duck.STRATEGIES.CHAOTIC
        ];
        const weights = [0.15, 0.40, 0.30, 0.15];
        this.strategy = this.#selectStrategy(strategies, weights);
        
        // Các tham số riêng cho chiến thuật chaotic
        this.chaoticPhase = Math.random() * Math.PI * 2;
        this.chaoticFrequency = 2 + Math.random() * 3;
        
        // Tốc độ cơ sở riêng cho mỗi vịt (tăng biên độ để đa dạng hơn)
        this.personalSpeedFactor = 0.88 + Math.random() * 0.24;
        
        // Yếu tố may mắn và micro-events
        this.luckFactor = 0.97 + Math.random() * 0.06; // 0.97-1.03
        this.nextMicroBurstTime = Math.random() * 5; // thời gian đến micro-event đầu tiên
        this.microBurstActive = false;
        this.microBurstDuration = 0;
        this.microBurstMultiplier = 1.0;
        
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
            
            // Micro-burst events (bứt tốc/chậm lại ngẫu nhiên)
            this.nextMicroBurstTime -= deltaTime;
            if (this.nextMicroBurstTime <= 0 && !this.microBurstActive) {
                // Kích hoạt micro-event
                this.microBurstActive = true;
                this.microBurstDuration = 0.8 + Math.random() * 1.2; // 0.8-2.0 giây
                // 60% boost, 40% slow
                const isBoost = Math.random() < 0.6;
                this.microBurstMultiplier = isBoost ? (1.15 + Math.random() * 0.25) : (0.85 - Math.random() * 0.15);
            }
            
            if (this.microBurstActive) {
                this.microBurstDuration -= deltaTime;
                if (this.microBurstDuration <= 0) {
                    this.microBurstActive = false;
                    this.microBurstMultiplier = 1.0;
                    this.nextMicroBurstTime = 3 + Math.random() * 5; // 3-8 giây đến event tiếp theo
                }
            }
            
            const strategyMultiplier = this.#calculateStrategyMultiplier(progress);
            
            // Tính tốc độ cuối cùng với tất cả các yếu tố
            this.speed = this.baseSpeed * this.personalSpeedFactor * strategyMultiplier * this.luckFactor * this.microBurstMultiplier;
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
        // Nhanh ở đầu, nhưng kiệt sức mạnh ở cuối (tạo cơ hội comeback)
        if (p < 0.35) {
            // Rất nhanh ở đầu
            return 1.35 + (0.35 - p) * 0.3;
        } else if (p < 0.65) {
            // Bắt đầu mệt
            const transProgress = (p - 0.35) / 0.3;
            return 1.35 - transProgress * 0.5;
        } else {
            // Kiệt sức ở cuối
            const endProgress = (p - 0.65) / 0.35;
            return 0.85 - endProgress * 0.25;
        }
    }

    #curveLatBooster(p) {
        // Chậm ở đầu, nhưng bùng nổ cực mạnh ở cuối (comeback ngoạn mục)
        if (p < 0.45) {
            // Rất chậm ở đầu
            return 0.72 - (0.45 - p) * 0.12;
        } else if (p < 0.75) {
            // Bắt đầu tăng tốc
            const rampProgress = (p - 0.45) / 0.3;
            return 0.72 + rampProgress * 0.45;
        } else {
            // Bùng nổ mạnh mẽ ở 25% cuối
            const boostProgress = (p - 0.75) / 0.25;
            const boost = boostProgress * boostProgress; // easing để tăng tốc mạnh hơn
            return 1.17 + boost * 0.55;
        }
    }

    #curveSteadyRunner(p) {
        // Chạy đều nhưng có biến động nhẹ, khó đoán hơn
        const oscillation = Math.sin(p * Math.PI * 5 + this.id * 0.3) * 0.12;
        const microTrend = Math.sin(p * Math.PI * 2) * 0.05;
        return 0.98 + oscillation + microTrend;
    }

    #curveChaotic(p) {
        // Hoàn toàn khó lường, dao động mạnh
        const oscillation1 = Math.sin(p * Math.PI * 7 + this.id * 0.7) * 0.18;
        const oscillation2 = Math.sin(p * Math.PI * 3.5 + this.chaoticPhase) * 0.12;
        const trend = (Math.sin(p * Math.PI - Math.PI / 2) + 1) * 0.25;
        return 0.82 + oscillation1 + oscillation2 + trend;
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
