# TRUNG TÂM QUỐC VỤ SỐ LIÊN THÔNG v6.0
### Cổng thông tin giả lập nhập vai (Roleplay) hành chính — dành cho cộng đồng Roblox

> ⚠️ **Lưu ý bắt buộc:** Đây là dự án giải trí, mô phỏng nhập vai (roleplay), không có giá trị pháp lý thật, không đại diện cho bất kỳ cơ quan chính phủ nào ngoài đời thực.

---

## 1. ĐIỂM QUAN TRỌNG NHẤT: TẠI SAO KHÔNG THỂ CHẠY 100% TRÊN GITHUB PAGES

Đây là điều cần nói rõ ngay từ đầu để bạn không mất thời gian debug sai hướng:

**GitHub Pages chỉ là dịch vụ lưu trữ file tĩnh** (HTML/CSS/JS thuần chạy trên trình duyệt). Nó **không có khả năng chạy Node.js**, không chạy được `express`, và đặc biệt **không duy trì được kết nối WebSocket** mà `socket.io` cần để đồng bộ dữ liệu thời gian thực giữa nhiều cán bộ/công dân đang online cùng lúc.

Dự án của bạn là một **ứng dụng máy chủ (backend) thật sự**:
- `server.js` chạy Express để xử lý API, EJS để render giao diện động theo state phía server.
- `socket.io` để đẩy cập nhật (hồ sơ mới, chat, thay đổi trạng thái...) tới mọi người đang mở trang **theo thời gian thực**, không cần load lại trang.
- Toàn bộ dữ liệu (`systemState`, `citizenIdentityRegistry`...) được lưu **trong bộ nhớ RAM của server**, không phải trong trình duyệt.

→ Nếu ép chạy trên GitHub Pages, bạn sẽ **mất hoàn toàn** tính năng multiplayer thời gian thực, hệ thống tài khoản dùng chung, và toàn bộ các API `/api/...`. Trang sẽ chỉ còn là HTML tĩnh vô tri.

### Vậy nên làm gì? → Deploy lên một dịch vụ hỗ trợ Node.js (miễn phí)

Vẫn giữ code trên **GitHub** như bình thường (để quản lý phiên bản, để bạn hoặc bạn bè cùng chỉnh sửa), nhưng **trỏ việc chạy thật sự** sang một nền tảng hỗ trợ Node.js. Dưới đây là các lựa chọn miễn phí phù hợp nhất, xếp theo độ dễ:

| Nền tảng | Ưu điểm | Ghi chú |
|---|---|---|
| **[Render.com](https://render.com)** *(khuyến nghị)* | Free tier ổn định, hỗ trợ WebSocket, tự deploy khi push GitHub | Đã có sẵn file `render.yaml` trong repo này |
| **[Railway.app](https://railway.app)** | Rất dễ dùng, UI đẹp | Free tier có giới hạn giờ chạy/tháng |
| **[Glitch.com](https://glitch.com)** | Import trực tiếp từ GitHub, chỉnh sửa online | Phù hợp cho thử nghiệm nhanh |
| **[Fly.io](https://fly.io)** | Hiệu năng tốt, gần với production thật | Cần biết CLI, hơi kỹ thuật hơn |

### Hướng dẫn nhanh: Deploy lên Render.com (khuyến nghị)

1. Đẩy toàn bộ thư mục này lên một **GitHub repository** mới (xem mục 2 bên dưới).
2. Vào [render.com](https://render.com) → đăng nhập bằng GitHub → **New +** → **Blueprint**.
3. Chọn repo vừa tạo. Render sẽ tự đọc file `render.yaml` có sẵn và cấu hình đúng (`npm install` + `npm start`).
4. (Tuỳ chọn) Nếu muốn bật AI sinh ngôn ngữ nâng cao cho bot, vào **Environment** → thêm biến `ANTHROPIC_API_KEY`.
5. Bấm **Deploy** — sau ~2 phút bạn sẽ có link dạng `https://ten-du-an.onrender.com` chạy đầy đủ 100% tính năng, kể cả real-time multiplayer.
6. Mỗi lần bạn `git push` code mới lên GitHub, Render **tự động build & deploy lại** — đây chính là trải nghiệm "code trên GitHub, web tự cập nhật" mà không cần GitHub Pages.

> Repo cũng đã kèm sẵn `.github/workflows/deploy.yml`: nếu bạn muốn GitHub tự gọi "webhook" để Render redeploy ngay khi push (thay vì chờ Render tự động dò), chỉ cần lấy **Deploy Hook URL** trong Render → Settings, rồi thêm vào GitHub repo dưới dạng Secret tên `RENDER_DEPLOY_HOOK_URL`.

---

## 2. CHẠY THỬ Ở MÁY CÁ NHÂN (LOCAL)

```bash
# 1. Cài Node.js (khuyến nghị bản 18 trở lên): https://nodejs.org
# 2. Giải nén / clone thư mục dự án, sau đó:
cd government-roleplay-service
npm install
npm start
```

Mở trình duyệt tại `http://localhost:3000`.

Tài khoản mẫu có sẵn để đăng nhập thử (đổi mật khẩu thật khi vận hành công khai):

| Tài khoản | Mật khẩu | Vai trò |
|---|---|---|
| `admin` | `123` | ADMIN — toàn quyền |
| `canbo1` | `123` | CHUYÊN VIÊN — CÔNG AN |
| `lanhdao1` | `123` | LÃNH ĐẠO — CÔNG AN |
| `thanhtra1` | `123` | THANH TRA CHÍNH PHỦ |

---

## 3. ĐƯA CODE LÊN GITHUB (ĐỂ QUẢN LÝ PHIÊN BẢN, KHÔNG PHẢI ĐỂ CHẠY WEB)

```bash
git init
git add .
git commit -m "v6.0 - Va loi, bo sung AI Engine, chuan hoa trien khai"
git branch -M main
git remote add origin https://github.com/<ten-ban>/<ten-repo>.git
git push -u origin main
```

File `.gitignore` đã được cấu hình sẵn để không đẩy `node_modules/` và `.env` (chứa API key) lên GitHub — **tuyệt đối không commit API key thật**.

---

## 4. DANH SÁCH LỖI ĐÃ RÀ SOÁT & KHẮC PHỤC (v5.0 → v6.0)

1. **Thiếu route `/api/national/publish`** — nút "Ký Ban Hành Ấn Bản Quyết Định" ở khối lãnh đạo trước đây gọi API không tồn tại → lỗi 404 im lặng, không có sắc lệnh/lệnh truy nã nào được ban hành thành công. **→ Đã bổ sung**, hỗ trợ cả loại "QUYẾT ĐỊNH", "THÔNG BÁO KHẨN" (vào mục tin tức) và "TRUY NÃ" (vào danh sách truy nã).
2. **Thiếu route `/api/national/delete-announcement`** — hàm `deleteNews()` phía client tồn tại nhưng gọi vào API không có thật. **→ Đã bổ sung**, đồng thời gắn nút xoá (❌) trực tiếp trên từng ấn bản/lệnh truy nã cho Lãnh đạo/Admin/Thanh tra.
3. **Thiếu hàm `actionShiftReport()` phía client** — 2 nút "Phê Duyệt ✅" / "Kỷ Luật Nhắc Nhở 🚨" trong danh sách báo cáo ca trực gọi một hàm chưa từng được định nghĩa → bấm vào không có phản hồi gì (lỗi `ReferenceError` âm thầm trong console). **→ Đã bổ sung hàm** kết nối đúng tới `/api/officer/report-action`.
4. **File `theme-matrix.js` bị "mồ côi"** — được viết sẵn nhưng chưa từng được nhúng `<script>` vào trang, đồng thời gây trùng lặp toàn bộ hệ thống âm thanh với đoạn script inline đã có sẵn (2 AudioContext cùng lúc). **→ Đã tách gọn**: file mới trong `public/theme-matrix.js` chỉ còn giữ hiệu ứng nền Matrix (đã nhúng đúng cách), phần âm thanh giữ nguyên logic inline đang hoạt động tốt để tránh xung đột.
5. **Bot AI (Tuệ Đức) còn khá đơn giản** — chỉ nhận diện được mã hồ sơ, tên cư dân, và 2 từ khoá cố định. **→ Nâng cấp toàn diện** thành module `ai-engine.js` riêng (xem mục 5).
6. **Không có xử lý lỗi tập trung** — một lỗi bất ngờ ở bất kỳ route nào có thể làm sập cả tiến trình server. **→ Đã bổ sung** middleware bắt lỗi toàn cục, route 404 riêng cho `/api/*`, và bắt `unhandledRejection`/`uncaughtException` để log thay vì crash.
7. **Danh sách truy nã không có mã định danh (`id`)** — khiến không thể thao tác xoá từng lệnh truy nã riêng lẻ. **→ Đã bổ sung** trường `id` (`TN-xxx`) cho mọi lệnh truy nã, cũ lẫn mới.
8. **Thiếu ghi log khi lãnh đạo duyệt/kỷ luật báo cáo ca trực** — nay đã được ghi vào Nhật Ký Trục Lõi ở Phòng Giám Sát Tối Cao.

---

## 5. BOT AI "TUỆ ĐỨC" v6.0 — KIẾN TRÚC 2 TẦNG

Toàn bộ logic được tách sang file **`ai-engine.js`** độc lập, dễ mở rộng thêm về sau mà không cần đụng vào `server.js`.

**Tầng 1 — Bộ quy tắc thông minh (luôn chạy, tức thì, 100% miễn phí, không cần Internet ngoài):**
- Chuẩn hoá tiếng Việt không dấu để so khớp mờ (gõ không dấu vẫn nhận diện đúng tên cư dân).
- Tra cứu tức thì: mã hồ sơ (`HS-xxxx`), biên bản vi phạm (`VP-xxx`), báo cáo ca trực (`RP-xxx`), lý lịch cư dân theo tên/tài khoản.
- Nhận diện hơn 10 nhóm ý định: chào hỏi, hướng dẫn sử dụng, tình trạng an ninh, thống kê hệ thống, danh sách truy nã, tin tức mới nhất, hướng dẫn 5 loại thủ tục hành chính khác nhau, hướng dẫn báo cáo ca trực, cảm ơn...

**Tầng 2 — AI sinh ngôn ngữ nâng cao (tuỳ chọn, chỉ bật khi bạn cấu hình API key):**
- Khi Tầng 1 không chắc chắn tìm được câu trả lời, hệ thống **tự động** (nếu có `ANTHROPIC_API_KEY` trong biến môi trường) gửi một bản tóm tắt dữ liệu **đã được ẩn thông tin nhạy cảm** (không gửi mật khẩu, không gửi toàn bộ database) sang Claude API để sinh câu trả lời tự nhiên, linh hoạt hơn.
- **Không có key → hệ thống vẫn chạy ổn định 100%** bằng Tầng 1, không văng lỗi, không phụ thuộc dịch vụ ngoài.
- Cách bật: xem file `.env.example`, tạo file `.env` cùng cấp với `server.js`, điền `ANTHROPIC_API_KEY=sk-ant-...` lấy tại [console.anthropic.com](https://console.anthropic.com/). Trên Render/Railway thì thêm biến này trong mục Environment Variables của dịch vụ (không upload file `.env` lên GitHub).

---

## 6. CẤU TRÚC THƯ MỤC

```
├── server.js              # Máy chủ Express + Socket.io (logic chính, state trong RAM)
├── ai-engine.js           # Bộ não bot Tuệ Đức (2 tầng, tách riêng để dễ bảo trì)
├── views/
│   └── index.ejs          # Toàn bộ giao diện (giữ nguyên thiết kế gốc, chỉ vá lỗi + bổ sung)
├── public/
│   └── theme-matrix.js    # Hiệu ứng nền Matrix (phục vụ tĩnh qua express.static)
├── package.json
├── render.yaml            # Cấu hình 1-click deploy trên Render.com
├── Procfile               # Tương thích Railway/Heroku-style
├── .env.example           # Mẫu biến môi trường (copy thành .env nếu cần)
├── .github/workflows/
│   └── deploy.yml         # CI kiểm tra cú pháp + tự trigger redeploy Render (tuỳ chọn)
└── README.md
```

---

## 7. GIỚI HẠN CẦN LƯU Ý (ĐỂ VẬN HÀNH LÂU DÀI ỔN ĐỊNH)

- Toàn bộ dữ liệu (`systemState`, hồ sơ, cư dân...) đang lưu **trong bộ nhớ RAM**, nghĩa là **mỗi lần server restart (kể cả tự động trên free tier) dữ liệu sẽ về lại trạng thái ban đầu**. Nếu cần lưu trữ lâu dài qua nhiều lần restart, bước tiếp theo nên cân nhắc là tích hợp một database nhẹ (SQLite, hoặc MongoDB Atlas free tier) — có thể triển khai sau nếu bạn cần, đây là việc tách biệt với các lỗi đã nêu ở mục 4.
- Free tier của Render sẽ "ngủ" sau ~15 phút không có truy cập rồi mất khoảng 30–50 giây để "thức dậy" ở lượt truy cập kế tiếp — là giới hạn bình thường của gói miễn phí, không phải lỗi code.
- Mật khẩu tài khoản cán bộ hiện lưu dạng plain-text (phù hợp bối cảnh roleplay nội bộ, admin xem để hỗ trợ nhanh) — nếu mai này mở public rộng rãi ngoài nhóm bạn bè tin cậy, nên cân nhắc mã hoá mật khẩu.
