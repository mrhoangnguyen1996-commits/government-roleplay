# Hướng dẫn đẩy lại lên GitHub (v14.0)

## Danh sách file BẮT BUỘC phải có trên repo

```
government-roleplay-service/
├── server.js                 ← lõi máy chủ
├── ai-engine.js              ← bot Tuệ Đức
├── package.json              ← dependencies (bản v14.0.0)
├── Procfile                  ← lệnh start cho Render/Heroku
├── render.yaml               ← cấu hình Render (nếu dùng)
├── README.md
├── .gitignore
├── .env.example              ← không chứa mật khẩu thật
├── .github/
│   └── workflows/
│       └── deploy.yml        ← tự kiểm tra cú pháp + deploy hook
├── public/
│   ├── sound-engine.js       ← BẮT BUỘC (thiếu = trang “tê liệt”)
│   ├── ui-toast.js           ← BẮT BUỘC
│   └── theme-matrix.js
└── views/
    └── index.ejs             ← toàn bộ giao diện
```

> **Cấm quên thư mục `public/`** — thiếu 2 file `sound-engine.js` / `ui-toast.js` sẽ làm web bấm nút không phản hồi.

---

## Cách 1 — GitHub Desktop / kéo-thả (đơn giản nhất)

1. Vào repo GitHub của bạn → tab **Code** → **Upload files** (hoặc mở bằng GitHub Desktop).
2. Kéo **toàn bộ thư mục** trên (giữ đúng cấu trúc `public/`, `views/`, `.github/`).
3. Commit message gợi ý: `Nâng cấp v14.0 — nạp tiền duyệt, lương KPI, kho trả HS, gộp luân chuyển`.
4. Bấm **Commit changes** / **Push**.
5. Vào **Render** → dịch vụ của bạn → **Manual Deploy → Deploy latest commit** (hoặc để Deploy Hook tự chạy nếu đã cấu hình secret `RENDER_DEPLOY_HOOK_URL`).

---

## Cách 2 — Dòng lệnh Git

Mở PowerShell tại thư mục dự án:

```powershell
cd "C:\Users\SVNB-PC-ACCOUTNT\Downloads\government-roleplay-service\government-roleplay-service"

# Lần đầu (nếu chưa có git)
git init
git branch -M main
git remote add origin https://github.com/TEN-BAN/TEN-REPO.git

# Đẩy bản v14
git add .
git status
git commit -m "Nâng cấp v14.0 — nạp tiền duyệt, lương KPI, kho trả HS, gộp luân chuyển"
git push -u origin main
```

Nếu remote đã có sẵn, chỉ cần:

```powershell
git add .
git commit -m "Nâng cấp v14.0"
git push origin main
```

---

## Kiểm tra sau khi push

1. GitHub → repo → **Actions**: workflow `Kiểm tra & Tự động triển khai lại` phải chạy xanh.
2. Render → **Logs**: thấy dòng `REALTIME CENTRAL V14.0`.
3. Mở web → F12 Console: không được có lỗi đỏ về `Toast` / `SFX`.
4. Thử đăng nhập cán bộ `canbo1` / `123` → mở tab **Bàn Làm Việc** → chọn hồ sơ HS-1001 → phải thấy thông tin công dân Nguyễn Mạnh Hoàng.

---

## Tài khoản demo sau khi deploy

| Tài khoản | Mật khẩu | Vai trò |
|-----------|----------|---------|
| `admin` | `123` | ADMIN toàn quyền |
| `canbo1` | `123` | Chuyên viên Công An |
| `lanhdao1` | `123` | Lãnh đạo Công An |
| `thanhtra1` | `123` | Thanh Tra |
| `nganhang1` | `123` | Lãnh đạo Ngân Hàng (lập bảng lương) |

---

## Render Deploy Hook (tuỳ chọn)

1. Render → service → **Settings → Deploy Hook** → copy URL.
2. GitHub → repo → **Settings → Secrets and variables → Actions** → New secret:
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: dán URL vừa copy.
3. Mỗi lần `push` lên `main`, Actions sẽ tự gọi Render deploy lại.
