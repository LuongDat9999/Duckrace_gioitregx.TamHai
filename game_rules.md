## TỔNG QUAN DỰ ÁN
Trò chơi đua vịt với hệ thống đích đến nhiều cấp độ (multi-checkpoint system)

## CẤU TRÚC DỰ ÁNduck-race-game/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js          # [MỚI] Cấu hình game
│   ├── Duck.js            # [GIỮ NGUYÊN] Class vịt (chỉ giữ phần draw)
│   ├── WaveLayers.js      # [GIỮ NGUYÊN] Hiệu ứng sóng
│   ├── GameState.js       # [MỚI] Quản lý trạng thái game
│   ├── CheckpointManager.js # [MỚI] Quản lý các đích đến
│   ├── WinnerManager.js   # [MỚI] Quản lý người chiến thắng
│   ├── UIRenderer.js      # [GIỮ NGUYÊN] Vẽ giao diện (grass, water, timer)
│   ├── GameEngine.js      # [MỚI] Logic chính game
│   └── main.js            # [SỬA] Entry point
├── img/
│   ├── wave.png           # [GIỮ NGUYÊN]
│   └── firework.png       # [MỚI - optional]
└── audio/
└── celebration.mp3    # [MỚI - optional]

## TÍNH NĂNG YÊU CẦU

### 1. CẤU HÌNH GAME
- Tổng số vịt: configurable (mặc định 180)
- Số người thắng: configurable (mặc định 20)
- Số đích đến: configurable (mặc định 4)
- Thời gian game: configurable (mặc định 120s)
- Tự động chia: 20 người / 4 đích = 5 người/đích

### 2. CƠ CHẾ CHECKPOINT (ĐÍCH ĐẾN)
- Đích ban đầu: ẩn (ngoài màn hình)
- Timing: Đích xuất hiện tại thời điểm cụ thể
- Animation: Đích "chạy vào" từ bên phải màn hình
- Logic: Khi đủ N người về đích → đích tiếp theo xuất hiện
- Đích cuối: Đích 4 là đích chung cuộc

### 3. QUẢN LÝ NGƯỜI THẮNG
- Checkpoint 1: 5 vịt đầu tiên → di chuyển lên grass area, tiếp tục đua
- Checkpoint 2: 5 vịt tiếp theo → di chuyển lên grass area, tiếp tục đua
- Checkpoint 3: 5 vịt tiếp theo → di chuyển lên grass area, tiếp tục đua
- Checkpoint 4 (FINAL): 5 vịt cuối → GAME OVER
- Hiển thị: Winners sắp xếp theo grid trên grass area

### 4. HIỆU ỨNG KẾT THÚC
- Modal popup: Hiển thị grid người thắng (4 hàng x 5 cột)
- Fireworks: Pháo hoa animation
- Sound effect: Âm thanh chúc mừng
- Replay button: Chơi lại

## QUY TRÌNH THỰC HIỆN

### BƯỚC 1: Setup Configuration
### BƯỚC 2: Game State Management
### BƯỚC 3: Checkpoint System
### BƯỚC 4: Winner Management
### BƯỚC 5: Duck Racing Logic
### BƯỚC 6: Integration & Testing
### BƯỚC 7: Victory Screen & Effects

## LƯU Ý QUAN TRỌNG
⚠️ KHÔNG XÓA hoặc SỬA các file UI hiện tại (Duck.draw, WaveLayers, UIRenderer)
⚠️ CHỈ SỬA phần logic di chuyển, collision, state management
⚠️ GIỮ NGUYÊN toàn bộ code Canvas rendering hiện tại