/**
 * Cấu hình game - Duck Racing
 * Chứa tất cả các thông số có thể điều chỉnh
 */

export const GAME_CONFIG = {
    // Cấu hình vịt
    TOTAL_DUCKS: 180,
    MIN_SPEED: 80,
    MAX_SPEED: 200,
    
    // Cấu hình checkpoint
    TOTAL_CHECKPOINTS: 4,
    WINNERS_PER_CHECKPOINT: 5,
    
    // Tính tự động: 20 người thắng / 4 checkpoint = 5 người/checkpoint
    get TOTAL_WINNERS() {
        return this.TOTAL_CHECKPOINTS * this.WINNERS_PER_CHECKPOINT;
    },
    
    // Thời gian game
    TOTAL_RACE_TIME: 120, // giây
    COUNTDOWN_DURATION: 3, // giây
    BUFFER_TIME: 12, // thời gian dư để hiện modal (giây)
    
    // Tính tốc độ tối ưu cho vịt (pixels/giây)
    // Vịt nhanh nhất cần về đích cuối vào TOTAL_RACE_TIME - BUFFER_TIME
    // Tăng hệ số để vịt chạy nhanh hơn, đảm bảo kịp đến checkpoint cuối
    calculateOptimalSpeed(raceDistance) {
        const effectiveRaceTime = this.TOTAL_RACE_TIME - this.BUFFER_TIME;
        const baseSpeed = raceDistance / effectiveRaceTime;
        return {
            winnerSpeed: baseSpeed * 1.3, // tăng từ 1.0 → 1.3 (nhanh hơn 30%)
            averageSpeed: baseSpeed * 1.1, // tăng từ 0.85 → 1.1
            slowSpeed: baseSpeed * 0.85 // tăng từ 0.70 → 0.85
        };
    },
    
    // Tính timing cho checkpoint (giây)
    // Công thức: khoảng cách thời gian = (thời gian * 0.45) / số lượng checkpoint
    // Giảm xuống 0.45 để vịt có đủ thời gian đến checkpoint cuối
    getCheckpointTimings() {
        const intervalTime = (this.TOTAL_RACE_TIME * 0.45) / this.TOTAL_CHECKPOINTS;
        const timings = [];
        for (let i = 1; i <= this.TOTAL_CHECKPOINTS; i++) {
            timings.push(intervalTime * i);
        }
        return timings;
    },
    
    // Layout constants (tỷ lệ %)
    GRASS_HEIGHT_RATIO: 0.25,
    WATER_HEIGHT_RATIO: 0.75,
    
    // Vị trí
    START_LINE_X: 80,
    FINISH_LINE_OFFSET: 100, // cách lề phải
    
    // Podium winners
    WINNER_PODIUM_X: 50,
    WINNER_PODIUM_Y: 20,
    WINNER_SPACING_X: 90,
    WINNER_SPACING_Y: 75,
    WINNER_GRID_COLS: 5,
    
    // Timer
    TIMER_OFFSET_X: 170,
    TIMER_Y: 20,
    
    // Duck rendering
    DUCK_RADIUS: 18,
    DUCK_WIDTH: 110,
    DUCK_HEIGHT: 90,
    
    // Animation
    SLOW_MO_DURATION: 0.6,
    SLOW_MO_FACTOR: 0.45,
    
    // Checkpoint animation
    CHECKPOINT_SLIDE_DURATION: 2.0, // giây (200px / 2s = 100 px/s giống sóng)
    CHECKPOINT_APPEAR_OFFSET: 200, // pixels ngoài màn hình
    
    // Modal
    MODAL_GRID_COLS: 5,
    MODAL_GRID_ROWS: 4
};

// Layout calculations (sẽ được cập nhật khi resize)
export const LAYOUT = {
    canvasWidth: 0,
    canvasHeight: 0,
    grassHeight: 0,
    waterYStart: 0,
    waterHeight: 0,
    startLineX: GAME_CONFIG.START_LINE_X,
    finishLineX: 0,
    timerX: 0,
    timerY: GAME_CONFIG.TIMER_Y,
    
    update(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.grassHeight = height * GAME_CONFIG.GRASS_HEIGHT_RATIO;
        this.waterYStart = this.grassHeight;
        this.waterHeight = height * GAME_CONFIG.WATER_HEIGHT_RATIO;
        this.finishLineX = width - GAME_CONFIG.FINISH_LINE_OFFSET;
        this.timerX = width - GAME_CONFIG.TIMER_OFFSET_X;
    }
};
