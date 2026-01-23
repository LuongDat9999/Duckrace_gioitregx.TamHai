---
agent: agent
---
I. Phân tích trò chơi Duck Race (phiên bản gốc)
Core gameplay (rút gọn)

Có n con vịt (player)

Mỗi con có:

name

position (x/y)

speed (random theo thời gian)

Có 1 đường đua ngang

Khi Start:

Vịt di chuyển sang phải

Con chạm đích trước → thắng

Có timer + shuffle

II. Yêu cầu mở rộng của bạn (diễn giải kỹ thuật)
1️⃣ Tối đa 300 con vịt

👉 Không thể dùng DOM thuần (div mỗi con) → Canvas là lựa chọn bắt buộc

2️⃣ Nhiều người chiến thắng

Không dừng game khi có 1 con về đích

Mỗi đích có K người thắng

Game chỉ kết thúc khi đủ tổng số người thắng

3️⃣ Nhiều đích đến (multi-finish zones)

Ví dụ:

180 người chơi

20 người thắng

4 đích
→ Mỗi đích: 5 người thắng
→ Logic:

Finish Zone 1 → lấy 5 con đầu
Finish Zone 2 → lấy 5 con tiếp theo
Finish Zone 3 → lấy 5 con tiếp theo
Finish Zone 4 → lấy 5 con tiếp theo


⚠️ Vịt không reset giữa các đích
👉 Đích chỉ là checkpoint logic, không phải teleport

III. Kiến trúc tổng thể (đơn giản – đúng web mindset)
/duck-race
 ├── index.html
 ├── style.css
 ├── main.js
 ├── engine/
 │    ├── Game.js
 │    ├── Duck.js
 │    ├── RaceManager.js
 │    ├── FinishManager.js
 │    └── Random.js
 └── README.md (file bạn lưu prompt)

IV. Data Model (rất quan trọng)
Duck
{
  id: number,
  name: string,
  x: number,
  y: number,
  speed: number,
  finishedStage: number, // đã thắng ở đích nào
  isWinner: boolean
}

Race Config
{
  totalDucks: 180,
  totalWinners: 20,
  totalFinishZones: 4,
  winnersPerZone: 5,
  raceDistance: 1200
}

V. Logic lõi (high-level)
Game Loop
while (gameRunning):
  updateDuckSpeedRandomly()
  updateDuckPosition()
  checkFinishZones()
  render()

Check Finish Zones
for each finishZone:
  if zone chưa đủ winners:
    lấy những duck vượt qua zone
    sort theo thời gian
    pick K duck đầu tiên

VI. Công nghệ đề xuất
Thành phần	Công nghệ
Render	HTML5 Canvas
Animation	requestAnimationFrame
Random	pseudo-random theo frame
State	JS Object
UI	HTML Overlay
Storage	❌ Không dùng DB