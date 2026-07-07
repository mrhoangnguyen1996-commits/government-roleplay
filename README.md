# TRUNG TÂM QUỐC VỤ SỐ LIÊN THÔNG v13.0
### Cổng thông tin giả lập nhập vai (Roleplay) hành chính — dành cho cộng đồng Roblox

> ⚠️ **Lưu ý bắt buộc:** Đây là dự án giải trí, mô phỏng nhập vai (roleplay), không có giá trị pháp lý thật, không đại diện cho bất kỳ cơ quan chính phủ nào ngoài đời thực.

## 🆕 NÂNG CẤP LỚN v13.0 — THỜI GIAN THỰC & BỐ CỤC HỢP LÝ HƠN

- **Bộ đếm người truy cập trực tiếp**: hiển thị tổng số người đang mở trang (công dân + cán bộ) ngay trên header, cập nhật tức thời khi có người vào/ra.
- **Thông báo cán bộ vào trực**: khi một cán bộ đăng nhập, mọi người đang mở trang thấy Toast "X vừa vào trực ban" + xuất hiện trong dải hoạt động.
- **Dải Hoạt Động Trực Tiếp**: băng chạy ở đầu trang chủ hiển thị luân phiên các sự kiện công khai mới nhất (hồ sơ mới nộp, cảnh báo SOS, cán bộ vào trực...), tạo cảm giác nhiều người đang cùng tham gia.
- **Lối tắt nhanh trang chủ**: 4 nút bấm nhanh (Nộp Đơn, Tra Cứu Định Danh, Ngân Hàng Số, Khẩn Cấp 113) ngay đầu trang, giúp bố cục hợp lý và dễ tiếp cận hơn thay vì phải tìm trong thanh nav.

Toàn bộ chi tiết lỗi/tính năng của các phiên bản trước (v6.0 → v12.0) vẫn còn nguyên ở các mục bên dưới.

---


- **Biểu mẫu xin cấp tài khoản ngân hàng**: công dân tự điền tài khoản, họ tên, mục đích, mã PIN mong muốn → gửi cho Ngân Hàng xét duyệt → tra cứu được trạng thái (Chờ duyệt / Đã duyệt kèm số TK / Từ chối) mà không cần đăng nhập trước.
- **Lãi suất tiết kiệm định kỳ**: mỗi kỳ hạn (mô phỏng, kiểm tra mỗi 60 giây), sổ tiết kiệm tự động được cộng lãi 2%, ghi log giao dịch rõ ràng.
- **Tự động truy thu trả góp vay vốn**: khoản vay được duyệt chia thành 4 kỳ trả góp (gốc + 10% phí dịch vụ), hệ thống tự động trừ tiền theo đúng kỳ hạn; nếu số dư không đủ sẽ ghi log cảnh báo thay vì âm thầm bỏ qua.
- **Sao kê thiết kế lại chuyên nghiệp**: giao diện in sao kê giờ có bố cục thẻ số dư, bảng giao dịch rõ ràng, màu sắc phân biệt thu/chi, thay vì chữ monospace đơn điệu.
- **Bot Tuệ Đức tích hợp kiểm tra số dư ngân hàng**: gõ "kiểm tra số dư 9xxxxxxxxx pin 1234" để bot trả lời trực tiếp số dư — bot yêu cầu ĐỦ cả số tài khoản và mã PIN mới tiết lộ, đảm bảo không rò rỉ thông tin.
- **Log tự động khi nộp phạt thành công**: hệ thống ghi rõ ràng "[TỰ ĐỘNG] ... trạng thái biên bản tự động chuyển sang Đã Nộp Phạt, số tiền đã điều chuyển về Kho Bạc Nhà Nước" trong Nhật Ký Trục Lõi.

### ⚠️ Về báo cáo "hệ thống tê liệt hoàn toàn" lặp lại nhiều lần
Tôi đã kiểm tra lại toàn diện (route trùng lặp, cú pháp EJS, ID phần tử HTML/JS khớp nhau, và mô phỏng lại đầy đủ luồng nộp đơn → đăng nhập → thẩm định bằng một môi trường giả lập chạy đúng mã nguồn thật) — **tất cả đều cho kết quả đúng, không phát hiện lỗi**. Việc cùng một triệu chứng "tê liệt hoàn toàn" lặp lại giống hệt nhau qua nhiều lần cập nhật lớn, dù server và client đã được viết lại đáng kể mỗi lần, cho thấy khả năng cao đây là **vấn đề triển khai (deployment) chứ không phải lỗi logic trong code**:
- Bản deploy trên Render/GitHub có thể chưa được cập nhật lên phiên bản mới nhất mỗi lần.
- Hoặc server gặp lỗi khi khởi động (build fail, thiếu file `public/*.js`, sai biến môi trường...) khiến bản cũ vẫn đang chạy.

**Để tôi khoanh vùng chính xác**, lần tới khi gặp lỗi, bạn vui lòng cung cấp 1 trong 2 thứ sau: (1) mở Console trình duyệt (phím F12 → tab Console) ngay khi lỗi xảy ra và chụp/copy nội dung lỗi màu đỏ hiện ra, hoặc (2) vào Render Dashboard → dịch vụ của bạn → tab Logs, copy vài dòng log gần nhất. Có 1 trong 2 thông tin này, tôi sẽ xác định được chính xác nguyên nhân thay vì tiếp tục dò đoán.

Toàn bộ chi tiết lỗi/tính năng của các phiên bản trước (v6.0 → v11.0) vẫn còn nguyên ở các mục bên dưới.

---


### 🏦 Ngân Hàng Số (tab hoàn toàn mới)
- **Số tài khoản CỐ ĐỊNH** suy ra từ tên tài khoản công dân (hàm băm xác định, không random) — cùng 1 username luôn ra đúng 1 số tài khoản vĩnh viễn.
- Công dân đăng nhập bằng **số tài khoản + mã PIN** riêng (tách biệt hoàn toàn khỏi hệ thống đăng nhập cán bộ).
- Đầy đủ chức năng: **Nạp tiền, Rút tiền, Chuyển khoản** (kèm biên lai/bill có mã tra cứu), **Nộp phạt** (tự động trừ tiền + chuyển vào Kho Bạc Nhà Nước + cập nhật trạng thái biên bản vi phạm), **Gửi/Rút tiết kiệm**, **Vay vốn** (gửi yêu cầu, chờ Ngân Hàng duyệt), **In sao kê giao dịch**.
- **Bảo mật phân quyền nghiêm ngặt**: toàn bộ dữ liệu tài khoản/giao dịch được lưu **tách biệt hoàn toàn** khỏi dữ liệu chung, **KHÔNG BAO GIỜ** phát qua socket cho mọi người như các dữ liệu khác — chỉ Nhân Viên/Lãnh Đạo Ngân Hàng và ADMIN mới xem được qua API có xác thực riêng.
- **Bảng Điều Hành Ngân Hàng** dành cho Nhân Viên/Lãnh Đạo/ADMIN: cấp tài khoản mới, xem toàn bộ giao dịch, duyệt/từ chối vay vốn, khoá/mở khoá tài khoản, điều chỉnh số dư thủ công.

### 🪪 Gộp Tra Cứu Định Danh + Kết Xuất Phôi Thành 1 Tab
Trước đây 2 tab riêng biệt gây rối mắt và một trong hai có dấu hiệu không phản hồi — nay gộp thành **1 tab duy nhất "Hồ Sơ Định Danh Công Dân"**: tra cứu 1 lần hiện đầy đủ căn cước điện tử (kèm **avatar nhân vật** nếu có), toàn bộ văn bằng/giấy phép, và mọi biên bản vi phạm.

### 📋 Khi tiếp nhận hồ sơ: hiển thị đầy đủ thông tin cư dân
Bàn làm việc cán bộ giờ hiển thị avatar, ngày sinh, giới tính, số định danh, quê quán, nghề nghiệp, toàn bộ văn bằng và chi tiết từng biên bản vi phạm ngay trong màn hình xử lý hồ sơ — kèm nút "Xem Hồ Sơ Định Danh Đầy Đủ" để mở nhanh tab tra cứu.

### 🚨 Cải tiến logic Khẩn Cấp 113
Thêm phân loại tình huống (An ninh trật tự / Y tế khẩn cấp / Cháy nổ / An ninh quân sự / Khác), hệ thống tự gợi ý đúng cơ quan phụ trách, và **chỉ cán bộ thuộc đúng cơ quan đó** (hoặc ADMIN/THANH TRA/CHÍNH PHỦ) mới được phép tiếp nhận xử lý — đúng logic phân công thực tế.

### ⚡ Tối ưu tốc độ phản hồi
Tin nhắn trò chuyện (chat) giờ bỏ qua bước đồng bộ toàn phần không cần thiết, phản hồi tức thì hơn, trong khi các thao tác quan trọng (thẩm định, phê duyệt...) vẫn giữ nguyên cơ chế đồng bộ đầy đủ để đảm bảo tuyệt đối chính xác.

### 🗄️ Kho Lưu Trữ Hồ Sơ cho Bàn Giám Sát
Admin giờ có thể tìm kiếm và **mở xem đầy đủ** bất kỳ hồ sơ đã lưu kho nào (nội dung, cán bộ xử lý, toàn bộ nhật ký, đánh giá công dân) ngay trong bàn giám sát.

Toàn bộ chi tiết lỗi/tính năng của các phiên bản trước (v6.0 → v10.0) vẫn còn nguyên ở các mục bên dưới.

---


**Quy trình 6 bước trực quan (Công dân → Chuyên viên → Lãnh đạo → Lưu kho):**
Tiếp Nhận → Thẩm Định → Trình Lãnh Đạo → Ra Quyết Định → Trả Kết Quả → Lưu Kho, hiển thị dưới dạng stepper đồ hoạ ở cả khung tra cứu công dân lẫn bàn làm việc cán bộ, để ai cũng thấy rõ hồ sơ đang ở giai đoạn nào.

**Checklist tiếp nhận bắt buộc:** Cán bộ phải tích đủ 3 mục rà soát (đối chiếu định danh, nội dung rõ ràng, không trùng lặp/mạo danh) thì nút "Ký Nhận Thụ Lý" mới kích hoạt được — đảm bảo hồ sơ khi tiếp nhận thực sự đã được kiểm tra đầy đủ, đúng tinh thần chuyên nghiệp.

**Khiếu nại leo thang 2 cấp:** Công dân không hài lòng với kết quả có thể khiếu nại Cấp 1 lên Lãnh Đạo trực tiếp của cơ quan thụ lý; nếu vẫn chưa thoả đáng, leo thang Cấp 2 lên Thanh Tra Chính Phủ giám sát độc lập — đúng logic khiếu nại hành chính đời thực.

**Phôi điện tử đa trường thông tin + logo dập nổi 3D:** Form cấp phôi giờ có thêm số hiệu chứng thư tự sinh, hạng/phân loại, ngày cấp, ghi chú điều kiện; huy hiệu cơ quan hiển thị với hiệu ứng dập nổi 3D (phối cảnh nghiêng + đổ bóng nhiều lớp) trông như con dấu thật.

**Bot Tuệ Đức nhận diện linh hoạt hơn:** hiểu được câu hỏi tự nhiên về hơn 15 loại giấy tờ (VD: "tôi muốn làm bằng lái xe") mà không cần đúng từ khoá, tự động chỉ đúng cơ quan phụ trách.

Toàn bộ chi tiết lỗi/tính năng của các phiên bản trước (v6.0 → v9.0) vẫn còn nguyên ở các mục bên dưới.

---


**🔴 Nguyên nhân đã xác định bằng kiểm thử mô phỏng toàn luồng (submit → login → claim):** Sau khi dựng một môi trường giả lập chạy đúng y hệt mã nguồn thật (không phải đoán), phát hiện: nếu 2 file `public/sound-engine.js` và `public/ui-toast.js` (bổ sung ở bản v7.0) **không được tải lên đủ** khi đưa code lên GitHub (rất dễ xảy ra khi kéo-thả thủ công, đặc biệt với thư mục `public/`), thì `window.Toast` và `window.SFX` sẽ là `undefined`. Vì mọi hàm xử lý (bao gồm cả nút "Thẩm Định", "Ký Nhận Thụ Lý"...) đều gọi `Toast.error(...)` mà KHÔNG kiểm tra tồn tại trước, JavaScript sẽ ném lỗi và **NGẮT NGANG TOÀN BỘ hàm đang chạy một cách im lặng** — biểu hiện ra ngoài y hệt "bấm nút không có phản ứng gì" / hệ thống tê liệt hoàn toàn, dù server hoàn toàn hoạt động bình thường.

**Đã vá triệt để:** bổ sung lớp bảo vệ dự phòng ở đầu script — nếu `Toast`/`SFX` chưa tồn tại (vì bất kỳ lý do gì: thiếu file, lỗi mạng, sai đường dẫn...), hệ thống tự tạo bản thay thế an toàn tối giản để MỌI chức năng vẫn hoạt động bình thường. Đã kiểm thử lại toàn bộ luồng nộp đơn → đăng nhập → thẩm định trong cả 2 tình huống (có và không có 2 file phụ trợ) — đều chạy thành công.

**➡️ Hành động bạn cần làm:** Khi upload code mới này lên GitHub, hãy **kiểm tra kỹ thư mục `public/` có đủ 3 file**: `theme-matrix.js`, `sound-engine.js`, `ui-toast.js`. Dù đã có lớp bảo vệ, có đủ 3 file thì trải nghiệm (âm thanh, thông báo đẹp) mới đầy đủ.

**Các nâng cấp khác trong v9.0:**
- **Huy hiệu/logo giả định** cho 9 cơ quan ban ngành, tự động in trên căn cước & văn bằng điện tử.
- **Ma trận phân quyền minh bạch** — bảng hiển thị rõ vai trò nào được làm gì, đặt ngay trong Phòng Giám Sát Tối Cao.
- **2 biểu đồ thống kê trực quan** (hồ sơ theo cơ quan, hồ sơ theo trạng thái) bằng CSS thuần, không cần thư viện ngoài.

Toàn bộ chi tiết lỗi/tính năng của các phiên bản trước (v6.0 → v8.0) vẫn còn nguyên ở các mục bên dưới.

---


**🔴 Lỗi nghiêm trọng đã vá triệt để:** Nút "Ký Nhận Thụ Lý / Phê Duyệt / Bác Bỏ..." trước đây CHỈ cập nhật giao diện khi trình duyệt nhận được gói tin WebSocket `stateUpdate` từ server. Trên hạ tầng miễn phí (Render/Railway...), kết nối WebSocket đôi khi bị proxy làm trễ hoặc rớt tạm thời (máy chủ ngủ đông, mất mạng, tab bị trình duyệt tạm dừng...), khiến người bấm nút KHÔNG THẤY PHẢN HỒI dù server đã xử lý xong. **Đã vá bằng cơ chế đồng bộ dự phòng qua HTTP**: ngay sau mỗi thao tác, trình duyệt chủ động gọi `/api/state` để lấy dữ liệu mới nhất và vẽ lại giao diện NGAY LẬP TỨC, không còn phụ thuộc hoàn toàn vào WebSocket. Đồng thời tự động đồng bộ lại mỗi khi kết nối/tái kết nối thành công.

**Các nâng cấp khác:**
- **Giao diện responsive chuyên nghiệp**: thanh điều hướng cuộn ngang mượt trên di động thay vì vỡ dòng, ẩn thanh cuộn, tối ưu khoảng cách trên màn hình nhỏ.
- **Tìm kiếm & lọc hồ sơ trực tiếp** trong Bàn Làm Việc Bộ Ngành (theo mã hồ sơ, tài khoản, trạng thái).
- **Đa dạng hóa 9 cơ quan ban ngành**: bổ sung Bộ Y Tế, Bộ Giáo Dục & Đào Tạo, Bộ Tài Chính - Thuế, UBND Địa Phương (bên cạnh Công An, Quân Đội, Toà Án, Thanh Tra, Chính Phủ), mỗi cơ quan có bộ loại giấy tờ/thủ tục riêng, tự động đổi theo lựa chọn.
- **Phôi điện tử hiệu ứng holographic**: căn cước và văn bằng giờ có lớp ánh kim quét sáng động (mô phỏng lớp phản quang chống giả trên giấy tờ thật).
- **Bot AI Tuệ Đức v8 với quick-reply chips**: nút gợi ý nhanh (an ninh, thống kê, ai đang trực, truy nã, trợ giúp) + hỗ trợ Enter để gửi + hiểu thêm thủ tục của 4 cơ quan mới.
- **Xuất Nhật Ký Hệ Thống** ra file .txt cho ADMIN.

Toàn bộ chi tiết lỗi/tính năng của các phiên bản trước (v6.0, v7.0) vẫn còn nguyên ở các mục bên dưới.

---


**Lỗi gốc đã tìm ra và vá:** Dropdown "Đơn Vị Ban Ngành" khi cấp tài khoản cán bộ (mục Phòng Giám Sát Tối Cao) **thiếu tùy chọn "TOÀ ÁN"**, trong khi công dân vẫn có thể chọn nộp đơn tới Tòa Án. Hậu quả: nếu công dân nộp hồ sơ chọn cơ quan Tòa Án, **không thể tạo cán bộ chuyên trách cho cơ quan đó** để thẩm định — hồ sơ kẹt vĩnh viễn ở trạng thái chờ, đúng như hiện tượng "nộp hồ sơ xong không ai xử lý được" bạn gặp phải. Đã bổ sung đầy đủ.

**5 nhóm tính năng mới, tạo cảm giác đa nhiệm/chuyên nghiệp thật sự:**
1. **Phân quyền server-side thật** — trước đây mọi thao tác đặc quyền (phê duyệt, ban sắc lệnh, cấp tài khoản...) chỉ gửi TÊN dạng chữ, ai cũng giả mạo được bằng DevTools. Giờ mọi thao tác đều được máy chủ xác thực lại bằng tài khoản/mật khẩu thật, đúng cấp bậc mới được phép thực hiện.
2. **Trung Tâm Điều Phối Khẩn Cấp (SOS 113)** — tab mới, công dân bấm gửi cảnh báo, MỌI cán bộ đang mở trang nhận còi hụ + banner ngay lập tức, cán bộ có thể "Cử Cán Bộ Tiếp Nhận".
3. **Bảng Cán Bộ Trực Ban Thời Gian Thực** — thấy ngay ai đang online cùng lúc, đúng chất multiplayer.
4. **Bảng Xếp Hạng Tín Nhiệm TOP 5** — trực quan hoá dữ liệu đánh giá vốn đã có sẵn nhưng trước đây không hiển thị ở đâu cả.
5. **Hệ thống Toast + thư viện âm thanh mở rộng** — thay `alert()` thô sơ bằng banner góc màn hình có màu theo loại, và bổ sung còi báo động, radio bíp, fanfare đăng nhập, chuông tín nhiệm... bên cạnh 4 hiệu ứng gốc.

Toàn bộ chi tiết lỗi/tính năng cũ (v6.0) vẫn còn nguyên ở các mục bên dưới.

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
