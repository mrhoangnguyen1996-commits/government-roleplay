const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const aiEngine = require('./ai-engine');

// Tải biến môi trường từ file .env nếu tồn tại (không bắt buộc phải cài dotenv để chạy)
try { require('dotenv').config(); } catch (e) { /* dotenv chưa cài đặt -> bỏ qua, vẫn chạy bình thường */ }

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(ROOT_DIR, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(ROOT_DIR, 'views'));

// HỆ THỐNG STATE MATRIX TOÀN QUỐC BẢO MẬT v5.0
let systemState = {
    securityLevel: "AN TOÀN",
    tickerMessage: "⚡ HỆ THỐNG LIÊN THÔNG QUỐC GIA CHÍNH PHỦ SỐ: Yêu cầu các bộ phận xử lý hồ sơ cư dân đúng quy trình kịch bản. Chú ý theo dõi bảng báo cáo ca trực và luân chuyển đơn thư vượt thẩm quyền kịp thời.",
    systemLogs: [
        { time: new Date().toLocaleTimeString('vi-VN') + " - 28/06/2026", text: "Trục cơ sở dữ liệu số hóa quốc gia v5.0 chính thức vận hành." }
    ],
    announcements: [
        { id: "AN-101", type: "QUYẾT ĐỊNH", title: "Áp dụng Luật số hóa hồ sơ kịch bản và phân tầng quyền tư pháp 2026", content: "Đồng bộ hóa phôi con dấu điện tử, tách biệt cổng cấp phôi độc lập và nâng cấp Trợ lý AI Tuệ Đức đọc trạng thái lõi.", timestamp: "28/06/2026, 08:00:00" }
    ],
    criminalWantedList: [
        { id: "TN-101", name: "Nguyen_Van_A", crime: "Tổ chức đua xe kịch bản và chống người thi hành công vụ", bounty: "20,000,000 VND", date: "25/06/2026" }
    ],
    applications: {
        "HS-1001": {
            id: "HS-1001", sender: "Nguyen_Manh_Hoang", agency: "CÔNG AN", docType: "CĂN CƯỚC CÔNG DÂN",
            content: "Xin cấp lại thẻ căn cước công dân gắn chíp điện tử do bị thất lạc trong quá trình làm việc kịch bản.",
            status: "Đang Chờ Tiếp Nhận", stamp: "stamp-pending", handler: "Chưa phân phối", handlerTitle: "Trực ban liên thông",
            logs: [{ sender: "Hệ thống", msg: "Khởi tạo thành công hồ sơ trên cổng liên thông.", time: new Date().toLocaleTimeString('vi-VN') }],
            satisfaction: null, priority: "BÌNH THƯỜNG"
        }
    },
    archivedApplications: {},
    shiftReports: [
        { id: "RP-99", date: "28/06/2026", officer: "Thiếu Tá Lê Minh Tuấn", agency: "CÔNG AN", taskStatus: "HOÀN THÀNH XUẤT SẮC", content: "Hoàn tất tuần tra quảng trường kịch bản, xử lý 4 biên bản giao thông, quân số trực ban đầy đủ.", status: "ĐÃ PHÊ DUYỆT", feedback: "Rất tốt." }
    ],
    authorizedPersonnel: {
        "admin": { username: "admin", password: "123", displayName: "Văn Phòng Trung Ương Điều Hành", role: "ADMIN", agency: "HỆ THỐNG", positiveRatings: 0, negativeRatings: 0 },
        "canbo1": { username: "canbo1", password: "123", displayName: "Thiếu Tá Lê Minh Tuấn", role: "CHUYÊN VIÊN", agency: "CÔNG AN", positiveRatings: 5, negativeRatings: 1 },
        "lanhdao1": { username: "lanhdao1", password: "123", displayName: "Đại Tá Nguyễn Hoàng", role: "LÃNH ĐẠO", agency: "CÔNG AN", positiveRatings: 8, negativeRatings: 0 },
        "thanhtra1": { username: "thanhtra1", password: "123", displayName: "Thanh Tra Viên Trần Lực", role: "THANH TRA", agency: "THANH TRA", positiveRatings: 2, negativeRatings: 0 }
    }
};

let citizenIdentityRegistry = {
    "Nguyen_Manh_Hoang": { name: "Nguyễn Mạnh Hoàng", dob: "18/05/1996", gender: "Nam", pob: "Lâm Đồng, Việt Nam", job: "Chuyên Viên Thẩm Định Cung Ứng Vật Tư Cao Cấp", licenses: ["Bằng Lái Xe Ô Tô Hạng B2", "Giấy Phép Sử Dụng Công Cụ Hỗ Trợ"], status: "Dân Cư Hợp Pháp - Lý Lịch Trong Sạch" }
};

let criminalRecordsRegistry = {
    "Nguyen_Manh_Hoang": [{ id: "VP-501", type: "VI PHẠM GIAO THÔNG", lawClause: "Điều 5 Nghị định 100/2019/NĐ-CP - Vượt đèn đỏ kịch bản", fine: "4,000,000 VND", status: "Đã Nộp Phạt", officer: "Thiếu Tá Lê Minh Tuấn", date: "10/05/2026" }]
};

function addLog(text) {
    const timeStr = new Date().toLocaleTimeString('vi-VN') + " - 28/06/2026";
    systemState.systemLogs.unshift({ time: timeStr, text });
}

function broadcastUpdate() {
    io.emit('stateUpdate', { systemState, citizenIdentityRegistry, criminalRecordsRegistry });
}

// AI ENGINE BOT V6 - TRUY XUẤT TRẠNG THÁI LÕI + NHẬN DIỆN Ý ĐỊNH NÂNG CAO
// (Logic chi tiết đã được tách sang module ./ai-engine.js để dễ bảo trì và mở rộng)
app.get('/', (req, res) => {
    res.render('index', { state: systemState, registry: citizenIdentityRegistry, violations: criminalRecordsRegistry });
});

app.post('/api/bot/chat', async (req, res) => {
    try {
        const message = (req.body && req.body.message) ? String(req.body.message) : '';
        const replyText = await aiEngine.reply(message, { systemState, citizenIdentityRegistry, criminalRecordsRegistry });
        res.json({ reply: replyText });
    } catch (err) {
        console.error('[BOT AI ERROR]', err);
        res.status(500).json({ reply: 'Hệ thống Tuệ Đức tạm thời gián đoạn, vui lòng thử lại sau ít phút.' });
    }
});

// VÁ LỖI VÀ ĐA DẠNG HÓA MA TRẬN LUỒNG XỬ LÝ HỒ SƠ TƯ PHÁP
app.post('/api/applications/action', (req, res) => {
    const { id, action, msg, officerName, officerRole, status, stamp, targetAgency } = req.body;
    let app = systemState.applications[id] || systemState.archivedApplications[id];
    if (!app) return res.status(404).json({ error: "Không tìm thấy hồ sơ hành chính trên trục liên thông." });
    const timeNow = new Date().toLocaleTimeString('vi-VN');

    if (action === 'chat') {
        app.logs.push({ sender: officerName, msg, time: timeNow });
        io.emit('newChatMessage', { fileId: id });
    } else if (action === 'claim_packet') {
        app.status = "Đã Tiếp Nhận Xử Lý"; app.stamp = "stamp-forwarded"; app.handler = officerName; app.handlerTitle = officerRole;
        app.logs.push({ sender: "Hệ thống số hóa", msg: `Cán bộ nghiệp vụ ${officerName} đã ký số tiếp nhận phụ trách hồ sơ này.`, time: timeNow });
        addLog(`Hồ sơ ${id} đã được phân phối thụ lý cho cán bộ ${officerName}.`);
    } else if (action === 'status') {
        app.status = status; app.stamp = stamp;
        app.logs.push({ sender: "Hội đồng thẩm định", msg: `Cán bộ quyền hạn ${officerName} thay đổi trạng thái hồ sơ sang: [${status}].`, time: timeNow });
        addLog(`Hồ sơ mang mã số ${id} thay đổi trạng thái xử lý sang: ${status} bởi ${officerName}.`);
    } else if (action === 'forward') { 
        app.logs.push({ sender: "Hệ thống điều phối", msg: `Hồ sơ vượt thẩm quyền, cán bộ ${officerName} ký chuyển ngành liên thông sang đơn vị bộ phận: [${targetAgency}].`, time: timeNow });
        app.agency = targetAgency; app.status = "Đang Chờ Tiếp Nhận"; app.stamp = "stamp-pending";
        addLog(`Hồ sơ ${id} được điều chuyển phân luồng nghiệp vụ sang cơ quan ban ngành [${targetAgency}].`);
    } else if (action === 'archive') {
        app.status = "Đã Đóng & Lưu Kho Mật"; app.stamp = "stamp-archived";
        systemState.archivedApplications[id] = app; delete systemState.applications[id];
        addLog(`Niêm phong vĩnh viễn hồ sơ ${id} chuyển lưu kho dữ liệu quốc gia.`);
    } else if (action === 'satisfaction') {
        app.satisfaction = status;
        if (status === 'KHIẾU NẠI CẤP CAO') {
            app.status = "Đang Khiếu Nại Cấp Cao"; app.stamp = "stamp-rejected"; app.agency = "THANH TRA";
            app.logs.push({ sender: "Hệ thống tự động", msg: "🚨 CÔNG DÂN CHÍNH THỨC PHÁT LỆNH KHIẾU NẠI KHẨN CẤP VỀ QUY TRÌNH HÀNH CHÍNH LÊN THANH TRA CHÍNH PHỦ.", time: timeNow });
        } else {
            Object.values(systemState.authorizedPersonnel).forEach(u => { if (u.displayName === app.handler) { if (status === 'HÀI LÒNG') u.positiveRatings++; else u.negativeRatings++; } });
        }
    }
    broadcastUpdate();
    res.json({ success: true });
});

// ROUTE CẤP VĂN BẰNG PHÔI BẰNG CHUYÊN SÂU (ĐA TRƯỜNG THÔNG TIN)
app.post('/api/resident/add-license', (req, res) => {
    const { username, licenseName, issueAgency, signOfficer, duration } = req.body;
    if (citizenIdentityRegistry[username]) {
        const phoiData = `Văn bằng: ${licenseName} | Đơn vị cấp: ${issueAgency} | Ấn ký: ${signOfficer} | Thời hạn kịch bản: ${duration}`;
        citizenIdentityRegistry[username].licenses.push(phoiData);
        addLog(`Cán bộ cấp phôi giấy tờ nghiệp vụ nâng cao cho cư dân @${username}: [${licenseName}].`);
        broadcastUpdate();
        res.json({ success: true });
    } else { res.status(404).json({ error: "Không tồn tại tài khoản công dân." }); }
});

// ROUTE BÁO CÁO CÔNG VIỆC HÀNG NGÀY / CA TRỰC NÂNG CAO
app.post('/api/officer/report', (req, res) => {
    const { officer, agency, taskStatus, content } = req.body;
    const id = `RP-${Math.floor(100 + Math.random() * 900)}`;
    systemState.shiftReports.unshift({ id, date: new Date().toLocaleDateString('vi-VN'), officer, agency, taskStatus, content, status: "CHỜ PHÊ DUYỆT", feedback: "" });
    addLog(`Cán bộ trực ban [${officer}] nộp báo cáo tình trạng công việc hàng ngày [${id}]: [${taskStatus}].`);
    broadcastUpdate();
    res.json({ success: true });
});

app.post('/api/officer/report-action', (req, res) => {
    const { id, status, feedback } = req.body;
    let rp = systemState.shiftReports.find(r => r.id === id);
    if (rp) {
        rp.status = status; rp.feedback = feedback;
        addLog(`Báo cáo ca trực [${id}] của cán bộ ${rp.officer} được cập nhật trạng thái: [${status}].`);
        broadcastUpdate();
    }
    res.json({ success: true });
});

app.post('/api/resident/violation', (req, res) => {
    const { username, type, lawClause, fine, status, officerName } = req.body;
    const recordId = `VP-${Math.floor(100 + Math.random() * 900)}`;
    if (!criminalRecordsRegistry[username]) criminalRecordsRegistry[username] = [];
    criminalRecordsRegistry[username].unshift({ id: recordId, type, lawClause, fine, status, officer: officerName, date: new Date().toLocaleDateString('vi-VN') });
    addLog(`Lập biên bản xử lý kỷ luật vi phạm [${recordId}] áp dụng cho công dân @${username}.`);
    broadcastUpdate();
    res.json({ success: true });
});

app.post('/api/resident/register', (req, res) => {
    const { username, name, dob, gender, pob, job, licenses, status, officerName } = req.body;
    citizenIdentityRegistry[username] = { name, dob, gender, pob, job, licenses: licenses ? licenses.split(',').map(l => l.trim()) : [], status };
    addLog(`Đồng bộ dữ liệu số hóa định danh công dân mới: @${username} (${name}).`);
    broadcastUpdate();
    res.json({ success: true });
});

app.post('/api/applications/submit', (req, res) => {
    const { sender, agency, docType, content, priority } = req.body;
    const id = `HS-${Math.floor(1000 + Math.random() * 9000)}`;
    systemState.applications[id] = {
        id, sender, agency, docType, content, priority,
        status: "Đang Chờ Tiếp Nhận", stamp: "stamp-pending", handler: "Chưa phân phối", handlerTitle: "Hệ thống tự động",
        logs: [{ sender: "Hệ thống", msg: "Đơn thư số hóa truyền tải lên trục liên thông thành công.", time: new Date().toLocaleTimeString('vi-VN') }],
        satisfaction: null
    };
    addLog(`Công dân @${sender} nộp thủ tục hành chính trực tuyến [${id}] sang đơn vị [${agency}].`);
    broadcastUpdate();
    io.emit('newApplicationAlert', { id, agency, docType, priority });
    res.json({ success: true, id });
});

// ROUTE GIÁM SÁT ADMIN / ĐIỀU CHỈNH PHÂN QUYỀN
app.post('/api/officer/save', (req, res) => {
    const { username, password, displayName, role, agency } = req.body;
    systemState.authorizedPersonnel[username] = { username, password, displayName, role, agency, positiveRatings: 0, negativeRatings: 0 };
    addLog(`Cấp điều chỉnh chứng thư quyền hạn nhân sự quốc gia: @${username} (${displayName}).`);
    broadcastUpdate();
    res.json({ success: true });
});

app.post('/api/officer/delete', (req, res) => {
    if (req.body.username !== 'admin') { delete systemState.authorizedPersonnel[req.body.username]; broadcastUpdate(); }
    res.json({ success: true });
});

app.post('/api/national/ticker', (req, res) => { systemState.tickerMessage = req.body.message; broadcastUpdate(); res.json({ success: true }); });
app.post('/api/national/security', (req, res) => { systemState.securityLevel = req.body.level; broadcastUpdate(); res.json({ success: true }); });

// ROUTE BAN HÀNH ẤN BẢN / SẮC LỆNH / LỆNH TRUY NÃ (VÁ LỖI THIẾU ROUTE 404 v6.0)
app.post('/api/national/publish', (req, res) => {
    const { type, title, content, author } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Vui lòng nhập đầy đủ tiêu đề và nội dung ấn bản." });
    const nowStr = new Date().toLocaleTimeString('vi-VN') + ", " + new Date().toLocaleDateString('vi-VN');

    if (type === 'TRUY NÃ') {
        const wantedId = `TN-${Math.floor(100 + Math.random() * 900)}`;
        systemState.criminalWantedList.unshift({
            id: wantedId,
            name: title.trim().replace(/\s+/g, '_'),
            crime: content,
            bounty: "20,000,000 VND",
            date: new Date().toLocaleDateString('vi-VN')
        });
        addLog(`Lãnh đạo [${author}] chính thức ban hành lệnh truy nã đối tượng: ${title}.`);
    } else {
        const id = `AN-${Math.floor(100 + Math.random() * 900)}`;
        systemState.announcements.unshift({ id, type: type || "QUYẾT ĐỊNH", title, content, timestamp: nowStr });
        addLog(`Lãnh đạo [${author}] ban hành ấn bản [${id}] loại [${type || "QUYẾT ĐỊNH"}]: ${title}.`);
    }
    broadcastUpdate();
    res.json({ success: true });
});

// ROUTE GỠ BỎ ẤN BẢN / TIN TỨC ĐÃ BAN HÀNH (VÁ LỖI THIẾU ROUTE 404 v6.0)
app.post('/api/national/delete-announcement', (req, res) => {
    const { id } = req.body;
    const before = systemState.announcements.length;
    systemState.announcements = systemState.announcements.filter(a => a.id !== id);
    if (systemState.announcements.length !== before) addLog(`Ấn bản [${id}] đã bị gỡ bỏ khỏi trung tâm ấn bản.`);
    broadcastUpdate();
    res.json({ success: true });
});

// ROUTE GỠ BỎ LỆNH TRUY NÃ (BỔ SUNG MỚI v6.0)
app.post('/api/national/delete-wanted', (req, res) => {
    const { id } = req.body;
    const before = systemState.criminalWantedList.length;
    systemState.criminalWantedList = systemState.criminalWantedList.filter(c => c.id !== id);
    if (systemState.criminalWantedList.length !== before) addLog(`Lệnh truy nã [${id}] đã được gỡ bỏ khỏi hệ thống (đối tượng đã bị bắt giữ hoặc rút lệnh).`);
    broadcastUpdate();
    res.json({ success: true });
});

io.on('connection', (socket) => {
    socket.emit('initData', { systemState, citizenIdentityRegistry, criminalRecordsRegistry });
});

// ROUTE 404 CHO CÁC ĐƯỜNG DẪN API KHÔNG TỒN TẠI (TRÁNH TRẢ VỀ HTML MẶC ĐỊNH GÂY LỖI FRONT-END)
app.use('/api', (req, res) => {
    res.status(404).json({ error: `Không tìm thấy endpoint [${req.method} ${req.originalUrl}] trên trục liên thông.` });
});

// MIDDLEWARE BẮT LỖI TOÀN CỤC - GIỮ SERVER LUÔN ỔN ĐỊNH, KHÔNG SẬP TIẾN TRÌNH
app.use((err, req, res, next) => {
    console.error('[LỖI HỆ THỐNG TOÀN CỤC]', err);
    res.status(500).json({ error: 'Đã xảy ra sự cố lõi xử lý hệ thống, vui lòng thử lại.' });
});

process.on('unhandledRejection', (reason) => console.error('[UNHANDLED REJECTION]', reason));
process.on('uncaughtException', (err) => console.error('[UNCAUGHT EXCEPTION]', err));

server.listen(PORT, () => {
    console.log(`[REALTIME CENTRAL V6] RUNNING PERFECTLY ON PORT ${PORT}`);
    console.log(`[TUỆ ĐỨC AI ENGINE] Tầng sinh AI mở rộng (Claude API): ${process.env.ANTHROPIC_API_KEY ? 'ĐÃ KÍCH HOẠT' : 'chưa cấu hình (vẫn hoạt động bằng bộ quy tắc offline)'}`);
});
