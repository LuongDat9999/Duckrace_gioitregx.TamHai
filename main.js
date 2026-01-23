
// DOM & Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = countdownOverlay?.querySelector('.countdown-number');
const totalRaceTimeInput = document.getElementById('totalRaceTime');
const totalDucksInput = document.getElementById('totalDucks');
const winnersPerZoneInput = document.getElementById('winnersPerZone');
const finishZonesInput = document.getElementById('finishZones');
const winnersListEl = document.getElementById('winnersList');

// === GLOBAL WINNERS ARRAY (ALL WINNERS DISPLAYED ON PODIUM) ===
let globalWinners = []; // Array to store all winning ducks

// === GAME LAYOUT CONSTANTS ===
let GRASS_HEIGHT = 0.25; // ratio
let WATER_Y_START = 0;
let WATER_HEIGHT = 0;
let START_LINE_X = 80;
let FINISH_LINE_X = 0;
let WINNER_PODIUM_X = 50;
let WINNER_PODIUM_Y = 20;
let TIMER_X = 0;
let TIMER_Y = 20;

function updateLayoutConstants() {
    const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
    const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
    GRASS_HEIGHT = canvasHeight * 0.25;
    WATER_Y_START = GRASS_HEIGHT;
    WATER_HEIGHT = canvasHeight * 0.75;
    FINISH_LINE_X = canvasWidth - 100;
    TIMER_X = canvasWidth - 170;
}

// Lớp Duck mô tả một chú vịt di chuyển ngang màn hình
class Duck {
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
        this.baseSpeed = speed; // tốc độ cơ sở không thay đổi
        this.speed = this.#clampSpeed(speed); // px mỗi giây
        this.finishedStage = finishedStage;
        this.isWinner = isWinner;
        this.radius = 18;
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
        const weights = [0.25, 0.25, 0.35, 0.15]; // 25% early, 25% late, 35% steady, 15% chaotic
        this.strategy = this.#selectStrategy(strategies, weights);
        
        // Các tham số riêng cho chiến thuật chaotic
        this.chaoticPhase = Math.random() * Math.PI * 2;
        this.chaoticFrequency = 2 + Math.random() * 3;
        
        // Tốc độ cơ sở riêng cho mỗi vịt
        this.personalSpeedFactor = 0.92 + Math.random() * 0.16; // 0.92 - 1.08
        
        // Khoảng cách tới đích (được cập nhật động)
        this.finishDistance = 1000;
        this.startPosition = x;
    }
    setStageSpeed(remainingDistance, stageDuration, variation = 0.12) {
        // Lưu thông tin stage hiện tại
        this.finishDistance = remainingDistance;
        this.startPosition = this.x;
        this.stageStartTime = 0;
        this.stageDuration = stageDuration;
    }
    // deltaTime tính bằng giây; trackWidth: bề ngang đường đua
    update(deltaTime, trackWidth) {
        this.wobblePhase += deltaTime * this.wobbleSpeed;

        if (this.state === 'racing') {
            // Tính tiến độ cuộc đua (0.0 -> 1.0)
            const totalDistance = this.finishDistance || trackWidth;
            const distanceTraveled = this.x - this.startPosition;
            const progress = Math.max(0, Math.min(1, distanceTraveled / totalDistance));
            
            // Tính hệ số tốc độ dựa trên chiến thuật
            const strategyMultiplier = this.#calculateStrategyMultiplier(progress);
            
            // Tính tốc độ cuối cùng
            this.speed = this.baseSpeed * this.personalSpeedFactor * strategyMultiplier;
            this.speed = this.#clampSpeed(this.speed);
            
            // Cập nhật vị trí
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
        // finished: giữ nguyên vị trí, chỉ wobble nhẹ
    }
    draw(ctx) {
        ctx.save();
        const wobbleY = Math.sin(this.wobblePhase) * this.wobbleAmp;
        ctx.translate(this.x, this.y + wobbleY);

        // Đảm bảo ảnh vịt đã load
        Duck.loadDuckImage();
        const img = Duck.duckImage;
        const ready = Duck.duckImageLoaded && img && img.complete;
        // Kích thước vịt (tăng kích thước)
        const duckW = 110, duckH = 90;
        const drawX = -duckW / 2;
        const drawY = -duckH / 2;
        if (ready) {
            ctx.drawImage(img, drawX, drawY, duckW, duckH);
        } else {
            // Nếu ảnh chưa load, vẽ placeholder hình elip vàng
            ctx.beginPath();
            ctx.ellipse(0, 0, duckW/2, duckH/2, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffe066';
            ctx.fill();
        }

        // Vẽ số thứ tự lên vịt (trên lưng, hơi lệch trái)
        const idText = this.id.toString();
        const numDigits = idText.length;
        // Nền số: elip trắng, viền đen, bóng đổ nhẹ
        const bgWidth = numDigits === 1 ? 16 : 14 + (numDigits - 1) * 9;
        const bgHeight = 14;
        const bgX = -duckW/4; // lệch trái
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
        // Số ID đậm, màu xanh đậm, có viền đen
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

        // ...đã thay thế bằng đoạn vẽ số ID trên hình vịt phía trên...

        

        ctx.restore();
    }

    // Luôn giữ tốc độ trong khoảng min-max để không dừng hẳn
    #clampSpeed(value) {
        return Math.min(this.speedMax, Math.max(this.speedMin, value));
    }

    #easeOutCubic(t) {
        const p = 1 - t;
        return 1 - p * p * p;
    }

    // Tính hệ số tốc độ dựa trên chiến thuật và tiến độ
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

    // Early Leader: Nhanh đầu, chậm cuối
    #curveEarlyLeader(p) {
        if (p < 0.4) {
            // Tốc độ cao ở đầu (1.3-1.4)
            return 1.3 + (0.4 - p) * 0.25;
        } else if (p < 0.7) {
            // Từ từ giảm tốc (1.3 → 0.95)
            const transProgress = (p - 0.4) / 0.3;
            return 1.3 - transProgress * 0.35;
        } else {
            // Giảm tốc mạnh ở cuối (0.95 → 0.6)
            const endProgress = (p - 0.7) / 0.3;
            return 0.95 - endProgress * 0.35;
        }
    }

    // Late Booster: Chậm đầu, bứt tốc cuối
    #curveLatBooster(p) {
        if (p < 0.5) {
            // Chạy chậm ở đầu (0.75-0.8)
            return 0.78 - (0.5 - p) * 0.1;
        } else if (p < 0.8) {
            // Tăng tốc dần (0.78 → 1.1)
            const rampProgress = (p - 0.5) / 0.3;
            return 0.78 + rampProgress * 0.32;
        } else {
            // Tăng tốc mạnh ở cuối (1.1 → 1.5)
            const boostProgress = (p - 0.8) / 0.2;
            return 1.1 + boostProgress * 0.4;
        }
    }

    // Steady Runner: Ổn định suốt cuộc đua
    #curveSteadyRunner(p) {
        // Biến động nhẹ xung quanh 1.0 - không random thuần
        // Dùng hàm sin để tạo biến động mượt
        const oscillation = Math.sin(p * Math.PI * 4) * 0.08;
        return 0.98 + oscillation;
    }

    // Chaotic: Dao động bất thường để tạo bất ngờ
    #curveChaotic(p) {
        // Dao động theo sin với tần số cao
        const oscillation = Math.sin(p * Math.PI * 6 + this.id * 0.7) * 0.15;
        
        // Thêm một xu hướng: chậm giữa, nhanh ở hai đầu
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

// Canvas resize handler
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scale = window.devicePixelRatio || 1;

    // Reset transform before resizing to avoid compounded scales
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    canvas.width = containerWidth * scale;
    canvas.height = containerHeight * scale;

    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    return { width: containerWidth, height: containerHeight, scale };
}

// Scrolling Water Background
class ScrollingWaterBackground {
    constructor(imagePath = 'img/wave.png') {
        this.image = new window.Image();
        this.image.src = imagePath;
        this.imageLoaded = false;
        this.offset = 0;
        this.scrollSpeed = 150; // pixels per second (right to left)

        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => {
            console.warn('Failed to load water background image:', imagePath);
        };
    }

    update(deltaTime) {
        if (!this.imageLoaded) return;
        
        // Decrease offset (move image left)
        this.offset -= this.scrollSpeed * deltaTime;
        
        // Reset offset when it goes beyond image width
        if (this.offset <= -this.image.width) {
            this.offset = 0;
        }
    }

    draw(ctx, canvasWidth, canvasHeight, y = 0, height = null) {
        if (!this.imageLoaded) return;
        
        const drawHeight = height || canvasHeight - y;
        const imageWidth = this.image.width;
        const imageHeight = this.image.height;
        
        ctx.save();
        
        // Draw first copy of image
        ctx.drawImage(
            this.image,
            Math.floor(this.offset),
            Math.floor(y),
            imageWidth,
            Math.ceil(drawHeight)
        );
        
        // Draw second copy to fill the gap (seamless scroll)
        ctx.drawImage(
            this.image,
            Math.floor(this.offset + imageWidth),
            Math.floor(y),
            imageWidth,
            Math.ceil(drawHeight)
        );
        
        ctx.restore();
    }

    reset() {
        this.offset = 0;
    }
}

// Wave Layers - 3 animated wave layers with flowing effect
class WaveLayers {
    constructor(imagePath = 'img/wave.png') {
        this.image = new window.Image();
        this.image.src = imagePath;
        this.imageLoaded = false;
        
        // 3 wave layers with different speeds
        this.waves = [
            { offset: 0, scrollSpeed: 120, yRatio: -0.3, scale: 0.5 },    // Top wave (sát bờ) - nhỏ hơn
            { offset: 0, scrollSpeed: 100, yRatio: 0, scale: 1.0 },     // Middle wave (ở giữa) - chuẩn
            { offset: 0, scrollSpeed: 120, yRatio: 0.85, scale: 0.9 }     // Bottom wave (ở dưới) - vừa
        ];

        this.image.onload = () => {
            this.imageLoaded = true;
            console.log('Wave image loaded:', this.image.width, 'x', this.image.height);
        };
        this.image.onerror = () => {
            console.warn('Failed to load wave image:', imagePath);
        };
    }

    update(deltaTime) {
        if (!this.imageLoaded) return;
        
        // Update offset for each wave layer
        for (const wave of this.waves) {
            wave.offset -= wave.scrollSpeed * deltaTime;
            
            // QUAN TRỌNG: Reset dựa trên waveWidth đã scale, không phải image.width gốc
            const waveWidth = this.image.width * wave.scale;
            
            // Reset offset khi vượt qua một chu kỳ hoàn chỉnh
            if (wave.offset <= -waveWidth) {
                wave.offset += waveWidth; // Cộng thêm thay vì reset về 0
            }
        }
    }

    draw(ctx, canvasWidth, waterYStart, waterHeight) {
        if (!this.imageLoaded || !this.image.width || !this.image.height) return;
        
        const originalWidth = this.image.width;
        const originalHeight = this.image.height;

        ctx.save();

        for (let waveIndex = 0; waveIndex < this.waves.length; waveIndex++) {
            const wave = this.waves[waveIndex];
            
            // Tính toán kích thước với tỷ lệ gốc (không bị bóp méo)
            const waveHeight = originalHeight * wave.scale;
            const waveWidth = originalWidth * wave.scale;
            
            // Vị trí Y dựa trên tỷ lệ trong vùng nước
            const y = waterYStart + waterHeight * wave.yRatio;
            
            // Độ mờ khác nhau cho mỗi lớp sóng (tạo chiều sâu)
            const alphas = [0.7, 0.85, 0.6]; // Top, Middle, Bottom
            ctx.globalAlpha = alphas[waveIndex];
            
            // Số lần lặp lại cần thiết để phủ kín chiều ngang
            const repeatCount = Math.ceil(canvasWidth / waveWidth) + 2;
            
            // Vẽ nhiều bản sao để phủ kín màn hình
            for (let i = 0; i < repeatCount; i++) {
                const x = wave.offset + i * waveWidth;
                
                // Chỉ vẽ nếu nằm trong viewport (tối ưu performance)
                if (x + waveWidth >= 0 && x <= canvasWidth) {
                    ctx.drawImage(
                        this.image, 
                        x, 
                        y, 
                        waveWidth, 
                        waveHeight
                    );
                }
            }
        }

        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    reset() {
        for (const wave of this.waves) {
            wave.offset = 0;
        }
    }
}

// Draw grass area (top 1/4)
function drawGrassArea(ctx) {
    ctx.save();
    ctx.fillStyle = '#7CB342';
    ctx.fillRect(0, 0, canvas.width, GRASS_HEIGHT);
    ctx.restore();
}

// Draw water area (bottom 3/4)
function drawWaterArea(ctx, waterBg = null) {
    ctx.save();
    
    // Draw solid blue background
    ctx.fillStyle = '#1E88E5'; // Deep blue background
    ctx.fillRect(0, WATER_Y_START, canvas.width, WATER_HEIGHT);
    
    // Draw water background with scrolling image if available
    if (waterBg && waterBg.imageLoaded) {
        const ratio = window.devicePixelRatio || 1;
        waterBg.draw(ctx, canvas.width / ratio, WATER_HEIGHT, WATER_Y_START);
    }
    
    // Draw 3 wave layers (top, middle, bottom) with dark blue and white
    const waveHeight = WATER_HEIGHT / 4;
    const wavePositions = [
        WATER_Y_START + WATER_HEIGHT * 0,
        WATER_Y_START + WATER_HEIGHT * 0.15,  // Top wave
        WATER_Y_START + WATER_HEIGHT * 0.5,   // Middle wave
        WATER_Y_START + WATER_HEIGHT * 0.75   // Bottom wave
    ];
    
    wavePositions.forEach((baseY, waveIndex) => {
        ctx.globalAlpha = 0.6;
        
        // Draw white wave line
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 15) {
            const y = baseY + Math.sin(x * 0.04 + waveIndex * Math.PI) * 6;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Draw dark blue wave line offset
        ctx.strokeStyle = '#0D47A1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 15) {
            const y = baseY + Math.sin(x * 0.04 + waveIndex * Math.PI) * 6 + 3;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    });
    
    ctx.globalAlpha = 1;
    ctx.restore();
}

// Quản lý tạo, xáo trộn làn và reset đàn vịt
class RaceManager {
    constructor({ maxDucks = 300, startX = 20, lanePadding = 16, minSpeed = 80, maxSpeed = 200 } = {}) {
        this.maxDucks = maxDucks;
        this.startX = startX;
        this.lanePadding = lanePadding;
        this.minSpeed = minSpeed;
        this.maxSpeed = maxSpeed;
        this.ducks = [];
    }

    createDucks(count, trackHeight) {
        const total = Math.min(this.maxDucks, Math.max(1, count));
        this.ducks.length = 0;
        const lanes = this.#buildLanePositions(total);
        this.#shuffle(lanes);

        for (let i = 0; i < total; i += 1) {
            const y = lanes[i];
            this.ducks.push(new Duck({
                id: i + 1,
                name: `Vịt ${i + 1}`,
                x: START_LINE_X,
                y,
                speed: this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed),
                minSpeed: this.minSpeed,
                maxSpeed: this.maxSpeed
            }));
        }
    }

    assignLanes(trackHeight) {
        if (this.ducks.length === 0) return;
        const lanes = this.#buildLanePositions(this.ducks.length);
        this.#shuffle(lanes);
        for (let i = 0; i < this.ducks.length; i += 1) {
            this.ducks[i].y = lanes[i];
        }
    }

    resetRace(trackHeight) {
        if (this.ducks.length === 0) return;
        const lanes = this.#buildLanePositions(this.ducks.length);
        this.#shuffle(lanes);
        for (let i = 0; i < this.ducks.length; i += 1) {
            const duck = this.ducks[i];
            duck.x = START_LINE_X;
            duck.finishedStage = false;
            duck.state = 'racing';
            duck.isWinner = false;
            duck.targetX = duck.x;
            duck.targetY = lanes[i];
            duck.speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
            duck.y = lanes[i];
        }
    }

    #buildLanePositions(count) {
        const usableHeight = Math.max(WATER_HEIGHT - this.lanePadding * 2, 40);
        const gap = usableHeight / (count + 1);
        const top = WATER_Y_START + (WATER_HEIGHT - usableHeight) / 2;
        const lanes = new Array(count);
        for (let i = 0; i < count; i += 1) {
            lanes[i] = top + gap * (i + 1);
        }
        return lanes;
    }

    #shuffle(arr) {
        // Fisher-Yates để xáo đều và nhanh
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
    }
}

// Tính vị trí ảo cho bảng thắng, để vẽ vịt bay vào panel trên canvas
class WinnerAnimator {
    constructor({ panelX = 40, panelY = 80, zoneGap = 120, itemSpacing = 26 } = {}) {
        this.panelX = panelX;
        this.panelY = panelY;
        this.zoneGap = zoneGap;
        this.itemSpacing = itemSpacing;
    }

    getTarget(zoneIndex, winnerIndex) {
        return {
            x: this.panelX,
            y: this.panelY + zoneIndex * this.zoneGap + winnerIndex * this.itemSpacing
        };
    }
}

// Draw start line - more visible
function drawStartLine(ctx) {
    ctx.save();
    const x = START_LINE_X;
    const y = WATER_Y_START;
    const w = 20;
    const h = WATER_HEIGHT;
    
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    
    // White base with black stripes
    for (let i = 0; i < h; i += 20) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - w/2, y + i, w, 10);
        ctx.fillStyle = '#000';
        ctx.fillRect(x - w/2, y + i + 10, w, 10);
    }
    
    ctx.shadowBlur = 0;
    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - w/2, y, w, h);
    
    // Label
    ctx.save();
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.strokeText('START', x, y - 10);
    ctx.fillText('START', x, y - 10);
    ctx.restore();
    ctx.restore();
}

// Draw finish line (checkered pattern) - more visible
function drawFinishLine(ctx) {
    ctx.save();
    const x = FINISH_LINE_X;
    const y = WATER_Y_START;
    const w = 20;
    const h = WATER_HEIGHT;
    
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = -2;
    
    // Draw checkered pattern
    const square = 10;
    for (let i = 0; i < Math.ceil(h / square); i++) {
        for (let j = 0; j < 2; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? '#D32F2F' : '#fff';
            ctx.fillRect(x - w/2 + j * (w / 2), y + i * square, w / 2, square);
        }
    }
    
    ctx.shadowBlur = 0;
    // Border
    ctx.strokeStyle = '#D32F2F';
    ctx.lineWidth = 4;
    ctx.strokeRect(x - w/2, y, w, h);
    
    // Label with background
    ctx.fillStyle = 'rgba(211, 47, 47, 0.8)';
    ctx.fillRect(x - 35, y - 35, 70, 28);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 35, y - 35, 70, 28);
    
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FINISH', x, y - 21);
    ctx.restore();
}

// ...existing code...


// Phát âm thanh "quack" đơn giản bằng Web Audio
class QuackPlayer {
    constructor() {
        this.ctx = null;
    }

    play() {
        try {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = this.ctx;
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
            // bỏ qua nếu âm thanh không được phép
        }
    }
}

// Quản lý vùng cán đích nhiều mốc và chọn người thắng cho từng zone
class FinishManager {
    constructor({ totalFinishZones = 1, winnersPerZone = 1, raceDistance = 1000 } = {}) {
        this.totalFinishZones = Math.max(1, totalFinishZones);
        this.winnersPerZone = Math.max(1, winnersPerZone);
        this.raceDistance = Math.max(1, raceDistance);
        this.winnerIds = new Set();
        this.zones = this.#buildZones();
        this.completed = false;
    }

    configure({ totalFinishZones, winnersPerZone, raceDistance }) {
        if (totalFinishZones) this.totalFinishZones = Math.max(1, totalFinishZones);
        if (winnersPerZone) this.winnersPerZone = Math.max(1, winnersPerZone);
        if (raceDistance) this.raceDistance = Math.max(1, raceDistance);
        this.zones = this.#buildZones();
        this.reset();
    }

    setRaceDistance(distance) {
        this.raceDistance = Math.max(1, distance);
        this.zones = this.#buildZones();
        this.completed = false;
    }

    reset() {
        this.winnerIds.clear();
        for (const zone of this.zones) zone.winners = [];
        this.completed = false;
    }

    process(ducks) {
        const zones = this.zones;
        const limit = this.winnersPerZone;
        const newWinners = [];
        for (let i = 0; i < ducks.length; i += 1) {
            const duck = ducks[i];
            if (this.winnerIds.has(duck.id)) continue;
            if (duck.state !== 'racing') continue;

            const front = duck.x + duck.radius;
            for (let z = 0; z < zones.length; z += 1) {
                const zone = zones[z];
                if (zone.winners.length >= limit) continue;
                if (front >= zone.distance) {
                    zone.winners.push(duck.id);
                    this.winnerIds.add(duck.id);
                    duck.isWinner = true;
                    newWinners.push({ duckId: duck.id, zoneIndex: z, position: zone.winners.length - 1 });
                    break; // Một vịt chỉ thắng một zone
                }
            }
        }

        // Hoàn thành khi tất cả zone đủ số lượng thắng
        this.completed = zones.every(z => z.winners.length >= limit);
        return newWinners;
    }

    isComplete() {
        return this.completed;
    }

    #buildZones() {
        const zones = [];
        for (let i = 1; i <= this.totalFinishZones; i += 1) {
            const distance = this.raceDistance * (i / this.totalFinishZones);
            zones.push({ distance, winners: [] });
        }
        return zones;
    }
}

// Quản lý toàn bộ vòng lặp game và danh sách vịt
class Game {
    constructor(canvas, ctx, { maxDucks = 300, totalRaceTime = 60, countdownDuration = 3 } = {}) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.raceManager = new RaceManager({ maxDucks });
        this.finishManager = new FinishManager({ totalFinishZones: 3, winnersPerZone: 1, raceDistance: canvas.clientWidth });
        this.waterBackground = new ScrollingWaterBackground('img/wave.png');
        this.waveLayers = new WaveLayers('img/wave.png');
        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;
        this.scale = window.devicePixelRatio || 1;
        this.lastTime = 0;
        this.running = false;
        this._loop = this.loop.bind(this);
        this.winnersDirty = true;
        this.slowMoTimer = 0;
        this.slowMoFactor = 0.45;
        this.quackPlayer = new QuackPlayer();
        this.totalRaceTime = totalRaceTime; // tổng thời gian đua (giây)
        this.raceTimer = totalRaceTime; // đồng hồ đếm ngược
        this.stageDuration = totalRaceTime / 3; // chia đều cho các stage
        this.stageTimer = this.stageDuration;
        this.stageIndex = 0;
        this.countdownDuration = countdownDuration; // giây
        this.countdownTimer = 0;
        this.isCountdown = false;
        this.gameStarted = false; // trạng thái game đã bắt đầu chưa
    }

    setDimensions({ width, height, scale }) {
        this.width = width;
        this.height = height;
        this.scale = scale;
        updateLayoutConstants();
        this.finishManager.setRaceDistance(width);
        this.stageDuration = this.totalRaceTime / Math.max(1, this.finishManager.totalFinishZones);
        if (this.gameStarted) {
            this.startStage(this.stageIndex);
        }
    }

    startStage(stageIndex = 0) {
        this.stageIndex = Math.max(0, Math.min(stageIndex, this.finishManager.zones.length - 1));
        this.stageTimer = this.stageDuration;
        const targetDist = this.finishManager.zones[this.stageIndex]?.distance ?? this.width;
        const ducks = this.raceManager.ducks;
        for (let i = 0; i < ducks.length; i += 1) {
            const duck = ducks[i];
            if (duck.state !== 'racing') continue;
            const remaining = Math.max(10, targetDist - (duck.x + duck.radius));
            duck.setStageSpeed(remaining, this.stageDuration, 0.14);
        }
    }

    initDucks(count = 8) {
        this.raceManager.createDucks(count, this.height);
        this.finishManager.reset();
        globalWinners = []; // Clear winners
        this.winnersDirty = true;
        for (const duck of this.raceManager.ducks) {
            duck.state = 'racing';
            duck.isWinner = false;
            duck.finishedStage = false;
        }
        this.startStage(0);
    }

    start() {
        if (this.running) return;
        this.isCountdown = true;
        this.countdownTimer = this.countdownDuration;
        this.raceTimer = this.totalRaceTime;
        this.running = true;
        this.gameStarted = true;
        this.waterBackground.reset(); // Reset water animation
        this.waveLayers.reset();
        this.lastTime = performance.now();
        this.updateCountdownUI();
        requestAnimationFrame(this._loop);
    }

    updateCountdownUI() {
        const num = Math.ceil(this.countdownTimer);
        if (countdownNumber) {
            countdownNumber.textContent = Math.max(0, num);
        }
        if (countdownOverlay) {
            if (this.isCountdown && this.countdownTimer > 0) {
                countdownOverlay.classList.remove('hidden');
            } else {
                countdownOverlay.classList.add('hidden');
            }
        }
    }

    stop() {
        this.running = false;
        this.isCountdown = false;
        if (countdownOverlay) {
            countdownOverlay.classList.add('hidden');
        }
    }

    loop(timestamp) {
        if (!this.running) return;
        let delta = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        if (this.isCountdown) {
            this.countdownTimer -= delta;
            this.updateCountdownUI();
            if (this.countdownTimer <= 0) {
                this.isCountdown = false;
                this.updateCountdownUI();
                this.startStage(0);
            }
            this.render();
            requestAnimationFrame(this._loop);
            return;
        }

        if (this.slowMoTimer > 0) {
            delta *= this.slowMoFactor;
            this.slowMoTimer = Math.max(0, this.slowMoTimer - delta);
        }

        this.update(delta);
        this.render();

        requestAnimationFrame(this._loop);
    }

    update(delta) {
        const ducks = this.raceManager.ducks;
        const n = ducks.length;
        const trackWidth = this.width;

        // Đếm ngược thời gian đua
        this.raceTimer = Math.max(0, this.raceTimer - delta);
        
        // Update water background animation
        this.waterBackground.update(delta);
        this.waveLayers.update(delta);

        // Đếm thời gian stage; khi hết thời gian mà chưa đủ người thắng, phát lại tốc độ để kéo gần đích
        this.stageTimer -= delta;
        if (this.stageTimer <= 0 && !this.finishManager.isComplete()) {
            this.startStage(this.stageIndex);
        }

        for (let i = 0; i < n; i += 1) {
            ducks[i].update(delta, trackWidth);
        }

        // Check for ducks reaching finish line (FINISH_LINE_X)
        for (let i = 0; i < n; i += 1) {
            const duck = ducks[i];
            if (duck.state === 'racing' && duck.x + duck.radius >= FINISH_LINE_X) {
                duck.state = 'winning';
                duck.lerpT = 0;
                duck.isWinner = true;
                globalWinners.push(duck); // Add to global winners
                this.winnersDirty = true;
                this.slowMoTimer = 0.6;
                if (Math.random() < 0.65) this.quackPlayer.play();
            }
        }

        // Update winning ducks animation to podium position
        for (let i = 0; i < globalWinners.length; i += 1) {
            const duck = globalWinners[i];
            if (duck.state === 'winning') {
                // Calculate podium position (horizontal layout in grass area)
                const podiumX = WINNER_PODIUM_X + 50 + i * 70;
                const podiumY = WINNER_PODIUM_Y + 55;
                duck.targetX = podiumX;
                duck.targetY = podiumY;
            }
        }

        // Kết thúc game khi thời gian hết
        if (this.raceTimer <= 0) {
            this.stop();
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Draw layers in correct order
        drawGrassArea(ctx);
        drawWaterArea(ctx, this.waterBackground);
        this.waveLayers.draw(ctx, this.width, WATER_Y_START, WATER_HEIGHT);
        drawStartLine(ctx);
        drawFinishLine(ctx);
        
        // Draw logo in top left corner
        this.drawLogo(ctx);

        // Draw ducks
        const ducks = this.raceManager.ducks;
        const n = ducks.length;
        for (let i = 0; i < n; i += 1) {
            ducks[i].draw(ctx);
        }

        // Draw timer in grass area (top right)
        if (this.gameStarted && !this.isCountdown) {
            this.drawTimer(ctx, this.raceTimer);
        }

        // Draw winner podium in grass area (top left)
        if (globalWinners.length > 0) {
            this.drawWinnerPodium(ctx, globalWinners);
        }

        // Draw start button when not started
        if (!this.gameStarted) {
            this.#renderStartButton(ctx);
        }
    }

    // Draw timer in grass area (top right)
    drawTimer(ctx, time) {
        const totalSeconds = Math.ceil(time);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 6;
        ctx.fillRect(TIMER_X, TIMER_Y, 110, 44);
        ctx.strokeRect(TIMER_X, TIMER_Y, 110, 44);
        ctx.shadowBlur = 0;
        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = time <= 10 ? '#D32F2F' : '#222';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(timeStr, TIMER_X + 55, TIMER_Y + 22);
        ctx.restore();
    }


    // Draw logo in top left corner
    drawLogo(ctx) {
        Duck.loadLogoImage();
        const logo = Duck.logoImage;
        const ready = Duck.logoImageLoaded && logo && logo.complete;
        
        if (ready) {
            ctx.save();
            // Vẽ logo với kích thước phù hợp (chiều cao ~60px)
            const logoHeight = 100;
            const logoWidth = (logo.width / logo.height) * logoHeight;
            const logoX = 15; // Cách lề trái 15px
            const logoY = 15; // Cách lề trên 15px
            
            ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
            ctx.restore();
        }
    }

    // Draw winner podium in grass area (top left)
    drawWinnerPodium(ctx, winners) {
        ctx.save();
        
        // Chữ ở trên giữa canvas

        ctx.font = 'bold 25px Arial';

        ctx.fillStyle = '#e60a0aff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('CHÚC MỪNG:', WINNER_PODIUM_X + 100, WINNER_PODIUM_Y);
        
        ctx.restore();
    }

    #renderStartButton(ctx) {
        const btnX = this.width / 2;
        const btnY = this.height / 2;
        const btnWidth = 200;
        const btnHeight = 60;

        // Kiểm tra hover
        const isHovered = this.startButtonHovered || false;

        ctx.save();
        // Bóng đổ
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = isHovered ? 25 : 20;
        ctx.shadowOffsetY = isHovered ? 6 : 4;

        // Nền nút với hiệu ứng hover
        ctx.fillStyle = isHovered ? '#2a8fd9' : '#1e73be';
        ctx.beginPath();
        ctx.roundRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 10);
        ctx.fill();

        // Viền vàng
        ctx.strokeStyle = '#c48b3c';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Chữ
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BẮT ĐẦU', btnX, btnY);
        ctx.restore();

        // Lưu vị trí nút để xử lý click
        this.startButtonBounds = {
            x: btnX - btnWidth / 2,
            y: btnY - btnHeight / 2,
            width: btnWidth,
            height: btnHeight
        };
    }
}

// Fullscreen management
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen?.() || canvas.webkitRequestFullscreen?.();
        document.body.classList.add('fullscreen');
    } else {
        document.exitFullscreen?.();
        document.body.classList.remove('fullscreen');
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen');
    }
});

// Initialize canvas on load
window.addEventListener('load', () => {
    const dims = resizeCanvas();
    game.setDimensions(dims);
    const totalDucks = parseInputInt(totalDucksInput, 20, 1, 300);
    game.initDucks(totalDucks);
    renderWinnersList(winnersListEl, game.finishManager.zones, game.raceManager.ducks);
    game.render();
});

// Resize canvas when window size changes
window.addEventListener('resize', () => {
    const dims = resizeCanvas();
    game.setDimensions(dims);
    game.raceManager.assignLanes(dims.height);
    if (!game.running) {
        game.render();
    }
});

const game = new Game(canvas, ctx, { maxDucks: 300 });

console.log('Duck Racing Game initialized!');

// UI helpers
function renderWinnersList(container, zones, ducks) {
    if (!container) return;
    const nameMap = new Map();
    for (let i = 0; i < ducks.length; i += 1) nameMap.set(ducks[i].id, ducks[i].name);

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < zones.length; i += 1) {
        const zone = zones[i];
        const card = document.createElement('div');
        card.className = 'winner-zone';
        const title = document.createElement('h4');
        title.textContent = `Mốc ${i + 1} (>= ${Math.round(zone.distance)} px)`;
        card.appendChild(title);
        const list = document.createElement('ul');
        const ids = zone.winners;
        for (let j = 0; j < ids.length; j += 1) {
            const id = ids[j];
            const li = document.createElement('li');
            li.className = 'winner-chip';
            li.textContent = nameMap.get(id) ?? `Vịt #${id}`;
            list.appendChild(li);
        }
        card.appendChild(list);
        fragment.appendChild(card);
    }
    container.innerHTML = '';
    container.appendChild(fragment);
}

function parseInputInt(el, fallback, min, max) {
    const val = parseInt(el?.value, 10);
    if (Number.isNaN(val)) return fallback;
    return Math.min(max, Math.max(min, val));
}

function startRaceFromUI() {
    const totalRaceTime = parseInputInt(totalRaceTimeInput, 60, 10, 300);
    const totalDucks = parseInputInt(totalDucksInput, 20, 1, 300);
    const winnersPerZone = parseInputInt(winnersPerZoneInput, 1, 1, 10);
    const finishZones = parseInputInt(finishZonesInput, 3, 1, 5);

    // Cập nhật totalRaceTime cho game
    game.totalRaceTime = totalRaceTime;
    game.finishManager.configure({ totalFinishZones: finishZones, winnersPerZone, raceDistance: game.width });
    game.stageDuration = totalRaceTime / Math.max(1, finishZones);
    game.stageIndex = 0;
    game.stageTimer = game.stageDuration;
    game.raceTimer = totalRaceTime;
    globalWinners = []; // Clear winners
    game.initDucks(totalDucks);
    game.raceManager.assignLanes(game.height);
    game.startStage(0);
    game.winnersDirty = true;
    game.lastTime = performance.now();
    game.start();
}
function resetRaceUI() {
    const totalRaceTime = parseInputInt(totalRaceTimeInput, 60, 10, 300);
    
    game.totalRaceTime = totalRaceTime;
    game.stop();
    game.gameStarted = false;
    game.raceTimer = totalRaceTime;
    game.finishManager.reset();
    globalWinners = []; // Clear winners
    game.stageIndex = 0;
    game.stageDuration = totalRaceTime / Math.max(1, game.finishManager.totalFinishZones);
    game.stageTimer = game.stageDuration;
    game.raceManager.assignLanes(game.height);
    const startX = game.raceManager.startX || 20;
    for (const duck of game.raceManager.ducks) {
        duck.x = startX;
        duck.state = 'racing';
        duck.finishedStage = false;
        duck.isWinner = false;
        duck.targetX = duck.x;
        duck.targetY = duck.y;
    }
    game.winnersDirty = true;
    game.slowMoTimer = 0;
    game.render();
}

startBtn?.addEventListener('click', startRaceFromUI);
resetBtn?.addEventListener('click', resetRaceUI);
fullscreenBtn?.addEventListener('click', toggleFullscreen);

// Canvas click handler for start button
canvas.addEventListener('click', (e) => {
    if (!game.gameStarted && game.startButtonBounds) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const bounds = game.startButtonBounds;
        
        if (x >= bounds.x && x <= bounds.x + bounds.width &&
            y >= bounds.y && y <= bounds.y + bounds.height) {
            startRaceFromUI();
        }
    }
});

// Canvas mouse move handler for hover effect
canvas.addEventListener('mousemove', (e) => {
    if (!game.gameStarted && game.startButtonBounds) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const bounds = game.startButtonBounds;
        
        const wasHovered = game.startButtonHovered || false;
        const isHovered = x >= bounds.x && x <= bounds.x + bounds.width &&
                         y >= bounds.y && y <= bounds.y + bounds.height;
        
        game.startButtonHovered = isHovered;
        
        // Update cursor
        canvas.style.cursor = isHovered ? 'pointer' : 'default';
        
        // Re-render if hover state changed
        if (wasHovered !== isHovered) {
            game.render();
        }
    } else {
        canvas.style.cursor = 'default';
    }
});
