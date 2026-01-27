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

    constructor({ id, name, x = 0, y = 0, speed = 120, minSpeed = 80, maxSpeed = 200, finishedStage = false, isWinner = false, winnerRank = null }) {
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
        this.winnerRank = winnerRank; // Thứ tự về đích (0 = sớm nhất, null = không phải winner)
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
        
        // Yếu tố mới cho DRAMA
        this.stamina = 0.8 + Math.random() * 0.4; // 0.8-1.2: thể lực (vịt nhanh có thể kiệt sức)
        this.finalSprintPower = Math.random(); // 0-1: sức bứt phá cuối
        this.positionRank = 0; // Vị trí thứ hạng hiện tại (cập nhật từ ngoài)
        this.hadFinalBurst = false; // Đã dùng final burst chưa
        
        // Khoảng cách tới đích
        this.finishDistance = 1000;
        this.startPosition = x;
        
        // ===== BOOST LOGIC =====
        this.shouldBoost = false; // Được set từ GameEngine khi gần checkpoint
        this.boostMultiplier = 1; // Hệ số boost (mặc định 1, có thể lên 10)
        this.shouldSlowDown = false; // Được set từ GameEngine cho non-winners gần checkpoint
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
            // Tăng tần suất và cường độ ở 80% cuối
            const burstIntensity = progress > 0.8 ? 1.5 : 1.0;
            this.nextMicroBurstTime -= deltaTime;
            if (this.nextMicroBurstTime <= 0 && !this.microBurstActive) {
                // Kích hoạt micro-event
                this.microBurstActive = true;
                this.microBurstDuration = 0.8 + Math.random() * 1.2; // 0.8-2.0 giây
                // Tăng biên độ và tỉ lệ boost ở cuối đua
                const boostChance = progress > 0.8 ? 0.7 : 0.6;
                const isBoost = Math.random() < boostChance;
                const burstRange = isBoost ? (1.2 + Math.random() * 0.4) : (0.75 - Math.random() * 0.25);
                this.microBurstMultiplier = burstRange * burstIntensity;
            }
            
            if (this.microBurstActive) {
                this.microBurstDuration -= deltaTime;
                if (this.microBurstDuration <= 0) {
                    this.microBurstActive = false;
                    this.microBurstMultiplier = 1.0;
                    // Giảm thời gian chờ ở cuối đua để tăng tần suất events
                    const nextInterval = progress > 0.8 ? (2 + Math.random() * 3) : (3 + Math.random() * 5);
                    this.nextMicroBurstTime = nextInterval;
                }
            }
            
            // Final Chaos Zone (90-100%): drama cực đại!
            let finalChaosMultiplier = 1.0;
            if (progress > 0.9 && !this.hadFinalBurst) {
                // 40% cơ vịt bất kỳ có thể bứt phá hoặc sụp đổ (tăng từ 30%)
                if (Math.random() < 0.4) {
                    this.hadFinalBurst = true;
                    // Vịt có finalSprintPower cao sẽ bùng nổ, thấp sẽ kiệt sức
                    if (this.finalSprintPower > 0.65) {
                        // Nếu là vịt cuối bảng (>120): MIRACLE ULTRA BOOST!
                        if (this.positionRank > 120) {
                            finalChaosMultiplier = 2.5 + Math.random() * 1.0; // 2.5-3.5x!
                        } else {
                            finalChaosMultiplier = 1.8 + Math.random() * 0.5; // 1.8-2.3x
                        }
                    } else if (this.finalSprintPower < 0.3) {
                        finalChaosMultiplier = 0.4 + Math.random() * 0.2; // EXHAUSTION!
                    }
                }
            }
            
            // Position Pressure: vịt dẫn đầu chịu áp lực, vịt sau thoải mái hơn
            let positionPressure = 1.0;
            if (this.positionRank <= 5 && progress > 0.7) {
                // Top 5 chịu áp lực ở 70% cuối
                positionPressure = 0.95 - (this.positionRank * 0.02); // Top 1: 0.95, Top 5: 0.87
            } else if (this.positionRank > 100 && progress > 0.75) {
                // Vịt cuối bảng (>100) có "underdog boost" cực mạnh!
                const underdogBoost = Math.min((this.positionRank - 100) / 80, 1.0); // 0-1 từ rank 100-180
                if (progress > 0.9) {
                    // ở 90% cuối: boost cực mạnh
                    positionPressure = 1.3 + underdogBoost * 0.7; // 1.3-2.0x!
                } else if (progress > 0.85) {
                    // ở 85% cuối: boost mạnh
                    positionPressure = 1.2 + underdogBoost * 0.5; // 1.2-1.7x
                } else {
                    // ở 75% cuối: boost vừa
                    positionPressure = 1.1 + underdogBoost * 0.3; // 1.1-1.4x
                }
            }
            
            const strategyMultiplier = this.#calculateStrategyMultiplier(progress);
            
            // ===== TÍNH TỐC ĐỘ CUỐI CÙNG =====
            // Nếu có WINNER BOOST (gần checkpoint), ưu tiên boost này
            if (this.shouldBoost && this.boostMultiplier > 1) {
                // BOOST THAY THẾ: Chỉ dùng baseSpeed * boost, bỏ qua các factor khác
                // Điều này đảm bảo winners luôn về đích đúng thứ tự
                this.speed = this.baseSpeed * this.boostMultiplier;
            } else if (this.shouldSlowDown) {
                // SLOW DOWN cho non-winners gần checkpoint: giảm xuống 15% tốc độ
                this.speed = this.baseSpeed * 0.15;
            } else {
                // Logic cũ: kết hợp tất cả các yếu tố
                this.speed = this.baseSpeed * this.personalSpeedFactor * strategyMultiplier * 
                            this.luckFactor * this.microBurstMultiplier * finalChaosMultiplier * positionPressure;
            }
            
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
        const bgWidth = numDigits === 1 ? 22 : 20 + (numDigits - 1) * 11;  // Tăng padding
        const bgHeight = 18;  // Tăng chiều cao cho padding trên/dưới
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
        ctx.font = 'bold 29px Arial';  // Tăng 20% từ 24px
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
        // Nhanh ở đầu, nhưng kiệt sức CỰC MẠNH ở cuối (drama!)
        if (p < 0.35) {
            // Siêu nhanh ở đầu
            return 1.4 + (0.35 - p) * 0.35;
        } else if (p < 0.65) {
            // Bắt đầu mệt
            const transProgress = (p - 0.35) / 0.3;
            return 1.4 - transProgress * 0.6;
        } else if (p < 0.9) {
            // Kiệt sức dần
            const midProgress = (p - 0.65) / 0.25;
            return 0.8 - midProgress * 0.3;
        } else {
            // SỤP ĐỔ hoàn toàn ở 10% cuối!
            const finalProgress = (p - 0.9) / 0.1;
            return 0.5 - finalProgress * 0.25; // Xuống còn 0.25x!
        }
    }

    #curveLatBooster(p) {
        // Chậm ở đầu, nhưng bùng nổ KHỦNG KHIẾP ở cuối (miracle!)
        if (p < 0.45) {
            // Rất chậm ở đầu
            return 0.55 - (0.45 - p) * 0.18;
        } else if (p < 0.7) {
            // Vẫn còn chậm
            const rampProgress = (p - 0.45) / 0.25;
            return 0.55 + rampProgress * 0.5;
        } else if (p < 0.85) {
            // Bắt đầu tăng tốc
            const boostProgress = (p - 0.7) / 0.15;
            return 1.05 + boostProgress * 0.8;
        } else if (p < 0.95) {
            // Bùng nổ mạnh
            const superBoostProgress = (p - 0.85) / 0.1;
            const boost = superBoostProgress * superBoostProgress;
            return 1.85 + boost * 1.5; // Lên tới 3.35x
        } else {
            // SIÊU BÚNG NỔ ở 5% cuối - TĂNG GẤP 4-5 LẦN!
            const finalProgress = (p - 0.95) / 0.05;
            const ultraBoost = finalProgress * finalProgress * finalProgress;
            return 3.35 + ultraBoost * 1.65; // Từ 3.35x lên 5.0x!
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
