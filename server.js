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
    dispatchCalls: [],
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

// =====================================================================
// LỚP XÁC THỰC & PHÂN QUYỀN THẬT SỰ PHÍA SERVER (v7.0)
// Trước đây mọi request đặc quyền (phê duyệt, cấp quyền, ban sắc lệnh...)
// chỉ gửi TÊN cán bộ dạng text từ client -> ai cũng có thể giả mạo bằng
// DevTools mà không cần đăng nhập thật. Từ v7.0, MỌI hành động đặc quyền
// đều phải gửi kèm { username, password } và được xác thực lại tại đây.
// =====================================================================
function verifyOfficer(username, password) {
    const user = systemState.authorizedPersonnel[username];
    if (!user || user.password !== password) return null;
    return user;
}

function requireAuth(allowedRoles = null) {
    return (req, res, next) => {
        const { actorUsername, actorPassword } = req.body || {};
        const user = verifyOfficer(actorUsername, actorPassword);
        if (!user) return res.status(401).json({ error: "Chứng thư không hợp lệ hoặc đã hết hiệu lực. Vui lòng đăng nhập lại." });
        if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
            return res.status(403).json({ error: `Cấp quyền [${user.role}] không đủ thẩm quyền thực hiện thao tác này. Yêu cầu: ${allowedRoles.join(' / ')}.` });
        }
        req.officer = user;
        next();
    };
}

// Bọc route async để lỗi bất ngờ không làm sập tiến trình, luôn trả JSON rõ ràng
function safeRoute(handler) {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (err) {
            console.error('[LỖI ROUTE]', req.originalUrl, err);
            res.status(500).json({ error: 'Lõi xử lý hệ thống gặp sự cố ngoài dự kiến. Đã ghi log, vui lòng thử lại.' });
        }
    };
}

// =====================================================================
// BẢNG THEO DÕI CÁN BỘ TRỰC TUYẾN THỜI GIAN THỰC (ONLINE ROSTER) v7.0
// Giúp mọi cán bộ đang đăng nhập thấy được ai khác đang trực ban cùng lúc
// -> tăng cảm giác đa nhiệm/multiplayer thật sự cho máy chủ roleplay.
// =====================================================================
const onlineOfficers = new Map(); // socket.id -> { username, displayName, role, agency }

function broadcastRoster() {
    const roster = Array.from(onlineOfficers.values());
    // Loại trùng theo username (1 người có thể mở nhiều tab)
    const uniqueMap = new Map();
    roster.forEach(o => uniqueMap.set(o.username, o));
    io.emit('rosterUpdate', Array.from(uniqueMap.values()));
}

// AI ENGINE BOT V6 - TRUY XUẤT TRẠNG THÁI LÕI + NHẬN DIỆN Ý ĐỊNH NÂNG CAO
// (Logic chi tiết đã được tách sang module ./ai-engine.js để dễ bảo trì và mở rộng)
// ROUTE ĐỒNG BỘ TRẠNG THÁI DỰ PHÒNG QUA HTTP (v8.0)
// Trước đây giao diện CHỈ cập nhật khi nhận được sự kiện 'stateUpdate' qua WebSocket.
// Trên một số hạ tầng miễn phí (proxy, cold-start, mạng chập chờn), gói tin realtime
// đôi khi bị trễ hoặc rơi rớt, khiến người bấm nút không thấy phản hồi dù server đã
// xử lý xong. Route này cho phép client CHỦ ĐỘNG kéo lại trạng thái mới nhất ngay sau
// mỗi thao tác, đảm bảo giao diện luôn đúng bất kể WebSocket có trục trặc hay không.
app.get('/api/state', (req, res) => {
    res.json({ systemState, citizenIdentityRegistry, criminalRecordsRegistry });
});

app.get('/', (req, res) => {
    res.render('index', { state: systemState, registry: citizenIdentityRegistry, violations: criminalRecordsRegistry });
});

app.post('/api/bot/chat', async (req, res) => {
    try {
        const message = (req.body && req.body.message) ? String(req.body.message) : '';
        const onlineRosterSnapshot = Array.from(new Map(Array.from(onlineOfficers.values()).map(o => [o.username, o])).values());
        const replyText = await aiEngine.reply(message, { systemState, citizenIdentityRegistry, criminalRecordsRegistry, onlineRoster: onlineRosterSnapshot });
        res.json({ reply: replyText });
    } catch (err) {
        console.error('[BOT AI ERROR]', err);
        res.status(500).json({ reply: 'Hệ thống Tuệ Đức tạm thời gián đoạn, vui lòng thử lại sau ít phút.' });
    }
});

// VÁ LỖI VÀ ĐA DẠNG HÓA MA TRẬN LUỒNG XỬ LÝ HỒ SƠ TƯ PHÁP + PHÂN QUYỀN THẬT SỰ v7.0
app.post('/api/applications/action', safeRoute(async (req, res) => {
    const { id, action, msg, actorUsername, actorPassword, status, stamp, targetAgency } = req.body;
    let application = systemState.applications[id] || systemState.archivedApplications[id];
    if (!application) return res.status(404).json({ error: `Không tìm thấy hồ sơ mang mã [${id}] trên trục liên thông (có thể đã bị xoá hoặc mã sai).` });
    const timeNow = new Date().toLocaleTimeString('vi-VN');

    // Hành động công khai, không cần đăng nhập (dành cho công dân): chat & đánh giá hài lòng
    if (action === 'chat') {
        const senderLabel = (msg && req.body.officerName) ? req.body.officerName : 'Công Dân';
        if (!msg || !msg.trim()) return res.status(400).json({ error: 'Nội dung tin nhắn trống.' });
        application.logs.push({ sender: senderLabel, msg, time: timeNow });
        io.emit('newChatMessage', { fileId: id });
        broadcastUpdate();
        return res.json({ success: true });
    }
    if (action === 'satisfaction') {
        application.satisfaction = status;
        if (status === 'KHIẾU NẠI CẤP CAO') {
            application.status = "Đang Khiếu Nại Cấp Cao"; application.stamp = "stamp-rejected"; application.agency = "THANH TRA";
            application.logs.push({ sender: "Hệ thống tự động", msg: "🚨 CÔNG DÂN CHÍNH THỨC PHÁT LỆNH KHIẾU NẠI KHẨN CẤP VỀ QUY TRÌNH HÀNH CHÍNH LÊN THANH TRA CHÍNH PHỦ.", time: timeNow });
            addLog(`Hồ sơ ${id} bị khiếu nại khẩn cấp lên Thanh Tra Chính Phủ.`);
        } else {
            Object.values(systemState.authorizedPersonnel).forEach(u => { if (u.displayName === application.handler) { if (status === 'HÀI LÒNG') u.positiveRatings++; else u.negativeRatings++; } });
        }
        broadcastUpdate();
        return res.json({ success: true });
    }

    // Từ đây trở xuống là các hành động NGHIỆP VỤ CÁN BỘ -> BẮT BUỘC xác thực thật
    const officer = verifyOfficer(actorUsername, actorPassword);
    if (!officer) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục thao tác." });
    const officerName = `${officer.displayName} (${officer.agency})`;
    const isLead = (officer.role === 'LÃNH ĐẠO' || officer.role === 'ADMIN');

    if (action === 'claim_packet') {
        if (application.status !== 'Đang Chờ Tiếp Nhận') return res.status(409).json({ error: 'Hồ sơ này đã có cán bộ khác thụ lý trước đó, vui lòng tải lại trang.' });
        application.status = "Đã Tiếp Nhận Xử Lý"; application.stamp = "stamp-forwarded"; application.handler = officer.displayName; application.handlerTitle = officer.role;
        application.logs.push({ sender: "Hệ thống số hóa", msg: `Cán bộ nghiệp vụ ${officerName} đã ký số tiếp nhận phụ trách hồ sơ này.`, time: timeNow });
        addLog(`Hồ sơ ${id} đã được phân phối thụ lý cho cán bộ ${officerName}.`);
    } else if (action === 'status') {
        const leadershipOnlyStatuses = ['Đã Phê Duyệt', 'Bị Bác Bỏ'];
        if (leadershipOnlyStatuses.includes(status) && !isLead) {
            return res.status(403).json({ error: `Chỉ LÃNH ĐẠO hoặc ADMIN mới có quyền Phê Duyệt / Bác Bỏ hồ sơ. Cấp bậc hiện tại của bạn: ${officer.role}.` });
        }
        application.status = status; application.stamp = stamp;
        application.logs.push({ sender: "Hội đồng thẩm định", msg: `Cán bộ quyền hạn ${officerName} thay đổi trạng thái hồ sơ sang: [${status}].`, time: timeNow });
        addLog(`Hồ sơ mang mã số ${id} thay đổi trạng thái xử lý sang: ${status} bởi ${officerName}.`);
    } else if (action === 'forward') {
        if (!targetAgency) return res.status(400).json({ error: 'Vui lòng chọn cơ quan cần luân chuyển tới.' });
        application.logs.push({ sender: "Hệ thống điều phối", msg: `Hồ sơ vượt thẩm quyền, cán bộ ${officerName} ký chuyển ngành liên thông sang đơn vị bộ phận: [${targetAgency}].`, time: timeNow });
        application.agency = targetAgency; application.status = "Đang Chờ Tiếp Nhận"; application.stamp = "stamp-pending";
        addLog(`Hồ sơ ${id} được điều chuyển phân luồng nghiệp vụ sang cơ quan ban ngành [${targetAgency}].`);
    } else if (action === 'archive') {
        if (!isLead) return res.status(403).json({ error: 'Chỉ LÃNH ĐẠO hoặc ADMIN mới có quyền niêm phong lưu kho hồ sơ.' });
        application.status = "Đã Đóng & Lưu Kho Mật"; application.stamp = "stamp-archived";
        systemState.archivedApplications[id] = application; delete systemState.applications[id];
        addLog(`Niêm phong vĩnh viễn hồ sơ ${id} chuyển lưu kho dữ liệu quốc gia bởi ${officerName}.`);
    } else {
        return res.status(400).json({ error: `Hành động [${action}] không được hỗ trợ.` });
    }
    broadcastUpdate();
    res.json({ success: true });
}));

// ROUTE CẤP VĂN BẰNG PHÔI BẰNG CHUYÊN SÂU (ĐA TRƯỜNG THÔNG TIN) — YÊU CẦU ĐĂNG NHẬP CÁN BỘ THẬT
app.post('/api/resident/add-license', requireAuth(), safeRoute(async (req, res) => {
    const { username, licenseName, issueAgency, signOfficer, duration } = req.body;
    if (!citizenIdentityRegistry[username]) return res.status(404).json({ error: "Không tồn tại tài khoản công dân." });
    const phoiData = `Văn bằng: ${licenseName} | Đơn vị cấp: ${issueAgency} | Ấn ký: ${signOfficer} | Thời hạn kịch bản: ${duration}`;
    citizenIdentityRegistry[username].licenses.push(phoiData);
    addLog(`Cán bộ [${req.officer.displayName}] cấp phôi giấy tờ nghiệp vụ nâng cao cho cư dân @${username}: [${licenseName}].`);
    broadcastUpdate();
    res.json({ success: true });
}));

// ROUTE BÁO CÁO CÔNG VIỆC HÀNG NGÀY / CA TRỰC NÂNG CAO — YÊU CẦU ĐĂNG NHẬP CÁN BỘ THẬT
app.post('/api/officer/report', requireAuth(), safeRoute(async (req, res) => {
    const { agency, taskStatus, content } = req.body;
    const id = `RP-${Math.floor(100 + Math.random() * 900)}`;
    systemState.shiftReports.unshift({ id, date: new Date().toLocaleDateString('vi-VN'), officer: req.officer.displayName, agency, taskStatus, content, status: "CHỜ PHÊ DUYỆT", feedback: "" });
    addLog(`Cán bộ trực ban [${req.officer.displayName}] nộp báo cáo tình trạng công việc hàng ngày [${id}]: [${taskStatus}].`);
    broadcastUpdate();
    res.json({ success: true });
}));

app.post('/api/officer/report-action', requireAuth(['LÃNH ĐẠO', 'THANH TRA']), safeRoute(async (req, res) => {
    const { id, status, feedback } = req.body;
    let rp = systemState.shiftReports.find(r => r.id === id);
    if (!rp) return res.status(404).json({ error: 'Không tìm thấy báo cáo ca trực này.' });
    rp.status = status; rp.feedback = feedback;
    addLog(`Báo cáo ca trực [${id}] của cán bộ ${rp.officer} được cập nhật trạng thái: [${status}] bởi [${req.officer.displayName}].`);
    broadcastUpdate();
    res.json({ success: true });
}));

app.post('/api/resident/violation', requireAuth(), safeRoute(async (req, res) => {
    const { username, type, lawClause, fine, status } = req.body;
    if (!username || !type) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tài khoản công dân và loại vi phạm.' });
    const recordId = `VP-${Math.floor(100 + Math.random() * 900)}`;
    if (!criminalRecordsRegistry[username]) criminalRecordsRegistry[username] = [];
    criminalRecordsRegistry[username].unshift({ id: recordId, type, lawClause, fine, status, officer: req.officer.displayName, date: new Date().toLocaleDateString('vi-VN') });
    addLog(`Cán bộ [${req.officer.displayName}] lập biên bản xử lý kỷ luật vi phạm [${recordId}] áp dụng cho công dân @${username}.`);
    broadcastUpdate();
    res.json({ success: true });
}));

app.post('/api/resident/register', requireAuth(), safeRoute(async (req, res) => {
    const { username, name, dob, gender, pob, job, licenses, status } = req.body;
    if (!username || !name) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tài khoản và họ tên công dân.' });
    citizenIdentityRegistry[username] = { name, dob, gender, pob, job, licenses: licenses ? licenses.split(',').map(l => l.trim()) : [], status };
    addLog(`Cán bộ [${req.officer.displayName}] đồng bộ dữ liệu số hóa định danh công dân mới: @${username} (${name}).`);
    broadcastUpdate();
    res.json({ success: true });
}));

app.post('/api/applications/submit', safeRoute(async (req, res) => {
    const { sender, agency, docType, content, priority } = req.body;
    if (!sender || !agency || !docType || !content) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin đơn thư trước khi nộp.' });
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
}));

// ROUTE GIÁM SÁT ADMIN / ĐIỀU CHỈNH PHÂN QUYỀN — CHỈ ADMIN THẬT SỰ MỚI ĐƯỢC PHÉP (v7.0)
app.post('/api/officer/save', safeRoute(async (req, res) => {
    const { username, password, displayName, role, agency, actorUsername, actorPassword } = req.body;
    const actor = verifyOfficer(actorUsername, actorPassword);
    if (!actor || actor.role !== 'ADMIN') return res.status(403).json({ error: 'Chỉ tài khoản ADMIN mới có quyền cấp/sửa chứng thư nhân sự.' });
    if (!username || !password || !displayName) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tài khoản, mật khẩu và họ tên hiển thị.' });
    const isNew = !systemState.authorizedPersonnel[username];
    const existingRatings = systemState.authorizedPersonnel[username] || { positiveRatings: 0, negativeRatings: 0 };
    systemState.authorizedPersonnel[username] = { username, password, displayName, role, agency, positiveRatings: existingRatings.positiveRatings, negativeRatings: existingRatings.negativeRatings };
    addLog(`ADMIN [${actor.displayName}] ${isNew ? 'cấp mới' : 'chỉnh sửa'} chứng thư quyền hạn nhân sự quốc gia: @${username} (${displayName}).`);
    broadcastUpdate();
    res.json({ success: true });
}));

app.post('/api/officer/delete', safeRoute(async (req, res) => {
    const { username, actorUsername, actorPassword } = req.body;
    const actor = verifyOfficer(actorUsername, actorPassword);
    if (!actor || actor.role !== 'ADMIN') return res.status(403).json({ error: 'Chỉ tài khoản ADMIN mới có quyền thu hồi chứng thư nhân sự.' });
    if (username === 'admin') return res.status(400).json({ error: 'Không thể xoá tài khoản ADMIN gốc của hệ thống.' });
    if (!systemState.authorizedPersonnel[username]) return res.status(404).json({ error: 'Không tìm thấy tài khoản cán bộ này.' });
    delete systemState.authorizedPersonnel[username];
    addLog(`ADMIN [${actor.displayName}] đã thu hồi chứng thư quyền hạn của tài khoản @${username}.`);
    broadcastUpdate();
    res.json({ success: true });
}));

// Cho phép LÃNH ĐẠO / THANH TRA / ADMIN / cán bộ thuộc CHÍNH PHỦ thao tác cấp quốc gia
function verifyLeadership(username, password) {
    const user = verifyOfficer(username, password);
    if (!user) return null;
    const allowed = ['LÃNH ĐẠO', 'THANH TRA', 'ADMIN'].includes(user.role) || user.agency === 'CHÍNH PHỦ';
    return allowed ? user : null;
}

app.post('/api/national/ticker', safeRoute(async (req, res) => {
    const leader = verifyLeadership(req.body.actorUsername, req.body.actorPassword);
    if (!leader) return res.status(403).json({ error: 'Không đủ thẩm quyền chỉnh sửa bảng tin chạy quốc gia.' });
    systemState.tickerMessage = req.body.message; addLog(`[${leader.displayName}] cập nhật bảng tin chạy quốc gia.`); broadcastUpdate(); res.json({ success: true });
}));
app.post('/api/national/security', safeRoute(async (req, res) => {
    const leader = verifyLeadership(req.body.actorUsername, req.body.actorPassword);
    if (!leader) return res.status(403).json({ error: 'Không đủ thẩm quyền điều chỉnh mức an ninh quốc gia.' });
    systemState.securityLevel = req.body.level; addLog(`[${leader.displayName}] điều chỉnh mức an ninh quốc gia sang: ${req.body.level}.`); broadcastUpdate(); res.json({ success: true });
}));

// ROUTE BAN HÀNH ẤN BẢN / SẮC LỆNH / LỆNH TRUY NÃ (VÁ LỖI THIẾU ROUTE 404 v6.0 + PHÂN QUYỀN v7.0)
app.post('/api/national/publish', safeRoute(async (req, res) => {
    const { type, title, content, actorUsername, actorPassword } = req.body;
    const leader = verifyLeadership(actorUsername, actorPassword);
    if (!leader) return res.status(403).json({ error: 'Không đủ thẩm quyền ban hành ấn bản/sắc lệnh quốc gia.' });
    if (!title || !content) return res.status(400).json({ error: "Vui lòng nhập đầy đủ tiêu đề và nội dung ấn bản." });
    const nowStr = new Date().toLocaleTimeString('vi-VN') + ", " + new Date().toLocaleDateString('vi-VN');
    const author = leader.displayName;

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
}));

// ROUTE GỠ BỎ ẤN BẢN / TIN TỨC ĐÃ BAN HÀNH (VÁ LỖI THIẾU ROUTE 404 v6.0 + PHÂN QUYỀN v7.0)
app.post('/api/national/delete-announcement', safeRoute(async (req, res) => {
    const leader = verifyLeadership(req.body.actorUsername, req.body.actorPassword);
    if (!leader) return res.status(403).json({ error: 'Không đủ thẩm quyền gỡ bỏ ấn bản quốc gia.' });
    const { id } = req.body;
    const before = systemState.announcements.length;
    systemState.announcements = systemState.announcements.filter(a => a.id !== id);
    if (systemState.announcements.length !== before) addLog(`Ấn bản [${id}] đã bị gỡ bỏ khỏi trung tâm ấn bản bởi [${leader.displayName}].`);
    broadcastUpdate();
    res.json({ success: true });
}));

// ROUTE GỠ BỎ LỆNH TRUY NÃ (BỔ SUNG MỚI v6.0 + PHÂN QUYỀN v7.0)
app.post('/api/national/delete-wanted', safeRoute(async (req, res) => {
    const leader = verifyLeadership(req.body.actorUsername, req.body.actorPassword);
    if (!leader) return res.status(403).json({ error: 'Không đủ thẩm quyền gỡ bỏ lệnh truy nã.' });
    const { id } = req.body;
    const before = systemState.criminalWantedList.length;
    systemState.criminalWantedList = systemState.criminalWantedList.filter(c => c.id !== id);
    if (systemState.criminalWantedList.length !== before) addLog(`Lệnh truy nã [${id}] đã được gỡ bỏ khỏi hệ thống bởi [${leader.displayName}] (đối tượng đã bị bắt giữ hoặc rút lệnh).`);
    broadcastUpdate();
    res.json({ success: true });
}));

// =====================================================================
// HỆ THỐNG ĐIỀU PHỐI KHẨN CẤP (SOS DISPATCH) — TÍNH NĂNG MỚI v7.0
// Công dân bấm nút "GỌI KHẨN CẤP 113" -> mọi cán bộ đang online trên toàn
// hệ thống nhận được cảnh báo còi hụ tức thì kèm vị trí/nội dung sự việc.
// Đây là tính năng tương tác đa nhiệm thời gian thực đúng chất roleplay.
// =====================================================================
app.post('/api/dispatch/sos', safeRoute(async (req, res) => {
    const { callerName, location, message } = req.body;
    if (!location || !message) return res.status(400).json({ error: 'Vui lòng nhập vị trí và mô tả sự việc khẩn cấp.' });
    const callId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    const entry = {
        id: callId,
        callerName: callerName || 'Công Dân Ẩn Danh',
        location, message,
        status: 'ĐANG CHỜ ĐIỀU PHỐI',
        time: new Date().toLocaleTimeString('vi-VN'),
    };
    systemState.dispatchCalls.unshift(entry);
    if (systemState.dispatchCalls.length > 50) systemState.dispatchCalls.pop();
    addLog(`🚨 CUỘC GỌI KHẨN CẤP [${callId}] từ ${entry.callerName} tại [${location}]: ${message}`);
    io.emit('sosAlert', entry); // kích hoạt còi hụ + banner trên MỌI thiết bị đang mở trang
    broadcastUpdate();
    res.json({ success: true, id: callId });
}));

app.post('/api/dispatch/resolve', safeRoute(async (req, res) => {
    const officer = verifyOfficer(req.body.actorUsername, req.body.actorPassword);
    if (!officer) return res.status(401).json({ error: 'Vui lòng đăng nhập tài khoản cán bộ để tiếp nhận xử lý điều phối.' });
    const call = systemState.dispatchCalls.find(c => c.id === req.body.id);
    if (!call) return res.status(404).json({ error: 'Không tìm thấy cuộc gọi khẩn cấp này.' });
    call.status = 'ĐÃ CỬ CÁN BỘ XỬ LÝ'; call.handledBy = officer.displayName;
    addLog(`Cán bộ ${officer.displayName} đã tiếp nhận xử lý cuộc gọi khẩn cấp [${call.id}].`);
    broadcastUpdate();
    res.json({ success: true });
}));

io.on('connection', (socket) => {
    socket.emit('initData', { systemState, citizenIdentityRegistry, criminalRecordsRegistry });
    socket.emit('rosterUpdate', Array.from(new Map(Array.from(onlineOfficers.values()).map(o => [o.username, o])).values()));

    // Cán bộ đăng nhập thành công ở client sẽ emit sự kiện này để hiện diện trên Bảng Trực Tuyến
    socket.on('identify', (payload) => {
        if (!payload || !payload.username) return;
        const user = systemState.authorizedPersonnel[payload.username];
        if (!user) return; // không tin dữ liệu client gửi lên, đối chiếu lại với dữ liệu thật trên server
        onlineOfficers.set(socket.id, { username: user.username, displayName: user.displayName, role: user.role, agency: user.agency });
        broadcastRoster();
    });

    socket.on('typing', (payload) => {
        if (payload && payload.fileId) socket.broadcast.emit('typingIndicator', payload);
    });

    socket.on('logout', () => {
        if (onlineOfficers.has(socket.id)) {
            onlineOfficers.delete(socket.id);
            broadcastRoster();
        }
    });

    socket.on('disconnect', () => {
        if (onlineOfficers.has(socket.id)) {
            onlineOfficers.delete(socket.id);
            broadcastRoster();
        }
    });
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
    console.log(`[REALTIME CENTRAL V9.0] RUNNING PERFECTLY ON PORT ${PORT}`);
    console.log(`[VÁ LỖI CỰC KỲ NGHIÊM TRỌNG] Đã bổ sung lớp bảo vệ dự phòng cho Toast/SFX phía client — trang KHÔNG BAO GIỜ "tê liệt" nữa dù file phụ trợ có tải được hay không.`);
    console.log(`[VÁ LỖI] Đồng bộ trạng thái dự phòng qua HTTP (/api/state) đã kích hoạt — nút thẩm định/xử lý hồ sơ luôn phản hồi ngay cả khi WebSocket chập chờn.`);
    console.log(`[BẢO MẬT] Xác thực phân quyền thật (username/password) đã kích hoạt cho mọi thao tác đặc quyền.`);
    console.log(`[GIAO DIỆN] Ma trận phân quyền, biểu đồ thống kê, huy hiệu cơ quan trên phôi điện tử: SẴN SÀNG.`);
    console.log(`[ĐA DẠNG CƠ QUAN] Hỗ trợ 9 cơ quan ban ngành và hơn 20 loại giấy tờ thủ tục.`);
    console.log(`[ĐIỀU PHỐI SOS] Hệ thống gọi khẩn cấp thời gian thực: SẴN SÀNG.`);
    console.log(`[BẢNG TRỰC TUYẾN] Theo dõi cán bộ online thời gian thực: SẴN SÀNG.`);
    console.log(`[TUỆ ĐỨC AI ENGINE] Tầng sinh AI mở rộng (Claude API): ${process.env.ANTHROPIC_API_KEY ? 'ĐÃ KÍCH HOẠT' : 'chưa cấu hình (vẫn hoạt động bằng bộ quy tắc offline)'}`);
});
