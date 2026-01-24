# Duck Racing Game - Giới Trẻ Giáo Xứ Tam Hải

## Cấu trúc dự án mới

```
duck-race-game/
├── index.html              # HTML chính
├── main.js                 # Entry point
├── css/
│   └── style.css          # Styles (bao gồm modal & fireworks)
├── js/
│   ├── config.js          # Cấu hình game
│   ├── Duck.js            # Class vịt
│   ├── WaveLayers.js      # Hiệu ứng sóng
│   ├── GameState.js       # Quản lý trạng thái
│   ├── CheckpointManager.js # Quản lý checkpoint
│   ├── WinnerManager.js   # Quản lý người thắng
│   ├── UIRenderer.js      # Render UI
│   └── GameEngine.js      # Logic chính game
├── img/
│   ├── wave.png
│   ├── duck.png
│   └── logo gioi tre_tieuchuan.png
└── audio/                  # (dự phòng cho audio)
```

## Tính năng mới

### 1. Cấu hình game (config.js)
- ✅ Tổng số vịt: configurable (mặc định 180)
- ✅ Số người thắng mỗi checkpoint: configurable (mặc định 5)
- ✅ Số checkpoint: configurable (mặc định 4)
- ✅ Thời gian game: configurable (mặc định 120s)
- ✅ Tự động tính: 20 người thắng / 4 checkpoint = 5 người/checkpoint

### 2. Checkpoint System
- ✅ Checkpoint ban đầu ẩn (ngoài màn hình)
- ✅ Animation: Checkpoint "chạy vào" từ bên phải
- ✅ Logic: Khi đủ N người về checkpoint → checkpoint tiếp theo xuất hiện
- ✅ Checkpoint cuối (Final): Đích cuối cùng màu vàng
- ✅ Hiển thị số người đã về: "3/5"

### 3. Winner Management
- ✅ Checkpoint 1: 5 vịt đầu tiên → di chuyển lên grass area
- ✅ Checkpoint 2: 5 vịt tiếp theo → di chuyển lên grass area
- ✅ Checkpoint 3: 5 vịt tiếp theo → di chuyển lên grass area
- ✅ Checkpoint 4 (FINAL): 5 vịt cuối → GAME OVER
- ✅ Hiển thị: Winners sắp xếp theo grid (5 cột) trên grass area
- ✅ Animation: Vịt bay mượt lên podium

### 4. Hiệu ứng kết thúc
- ✅ Modal popup: Grid 5x4 hiển thị tất cả người thắng
- ✅ Fireworks: Animation pháo hoa khi hiển thị modal
- ✅ Replay button: Chơi lại game
- ✅ Animation: Fade in modal, pop in từng winner

## Cách sử dụng

### Chạy game
1. Mở `index.html` trong trình duyệt
2. Điều chỉnh các thông số:
   - Tổng thời gian đua
   - Tổng số vịt
   - Số người thắng mỗi checkpoint
   - Số checkpoint
3. Nhấn "Bắt đầu" hoặc click vào nút trên canvas
4. Chờ đếm ngược 3-2-1-GO!
5. Xem vịt đua và về đích từng checkpoint

### Điều khiển
- **Bắt đầu**: Bắt đầu game mới
- **Làm mới**: Reset game về trạng thái ban đầu
- **Fullscreen**: Phóng to toàn màn hình
- **Chơi lại** (trong modal): Đóng modal và reset game

## Thay đổi so với version cũ

### Kiến trúc
- ✅ Tách code thành modules ES6
- ✅ Separation of concerns rõ ràng
- ✅ Dễ maintain và mở rộng

### Tính năng
- ✅ Hệ thống checkpoint thay vì finish line đơn
- ✅ Checkpoint xuất hiện dần theo timing
- ✅ Winner manager với grid layout
- ✅ Modal kết quả đẹp mắt
- ✅ Fireworks animation
- ✅ Cấu hình linh hoạt hơn

### UI/UX
- ✅ Animation mượt mà hơn
- ✅ Visual feedback tốt hơn
- ✅ Modal responsive
- ✅ Checkpoint có label rõ ràng

## File backup
- `main_old.js`: File main.js gốc (backup)
- `style.css`: File CSS gốc (vẫn giữ ở root, copy sang css/)

## Browser support
- Chrome, Firefox, Safari, Edge (modern browsers)
- ES6 modules required
- Canvas API required

## Credits
Developed for Giới Trẻ Giáo Xứ Tam Hải
