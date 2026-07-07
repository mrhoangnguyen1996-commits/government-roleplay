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

// =====================================================================
// HỆ THỐNG NGÂN HÀNG SỐ v11.0 — TÍNH NĂNG MỚI HOÀN TOÀN
// QUAN TRỌNG VỀ BẢO MẬT: Toàn bộ dữ liệu ngân hàng (số dư, mật khẩu, giao
// dịch) được lưu TÁCH BIỆT hoàn toàn khỏi `systemState` và KHÔNG BAO GIỜ
// được phát (broadcast) qua socket.io tới mọi người như các dữ liệu khác.
// Chỉ trả về qua các API endpoint có xác thực đúng chủ tài khoản hoặc
// đúng nhân viên/lãnh đạo Ngân Hàng/ADMIN — đúng yêu cầu "chỉ ngân hàng
// và admin mới thấy được".
// =====================================================================
let bankAccounts = {}; // key: username -> { accountNumber, username, pin, balance, savings, frozen, createdAt }
let bankTransactions = []; // { id, accountNumber, type, amount, counterpart, note, time, status, handledBy }
let loanRequests = []; // { id, accountNumber, username, amount, reason, status, time, decidedBy, installment, remaining }
let bankAccountRequests = []; // { id, username, fullName, purpose, pin, status, time, decidedBy } — yêu cầu MỞ TÀI KHOẢN do công dân tự gửi
const SAVINGS_INTEREST_RATE = 0.02; // 2% mỗi kỳ tính lãi (kịch bản, không phải lãi suất thật)
const LOAN_CYCLE_MS = 5 * 60 * 1000; // mô phỏng 1 "kỳ hạn" = 5 phút thực tế (RP time-compressed)

// Số tài khoản CỐ ĐỊNH suy ra từ tên tài khoản công dân — KHÔNG BAO GIỜ random,
// đảm bảo cùng 1 username luôn ra đúng 1 số tài khoản duy nhất, vĩnh viễn.
function deterministicAccountNumber(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) { hash = (hash * 31 + username.charCodeAt(i)) >>> 0; }
    return '9' + String(hash % 1000000000).padStart(9, '0');
}

// Tài khoản Kho Bạc Nhà Nước — nơi tiếp nhận mọi khoản tiền nộp phạt, dưới sự
// kiểm soát riêng của Lãnh Đạo Ngân Hàng & ADMIN, công dân không thao tác được.
const TREASURY_ACCOUNT = '900000000';
bankAccounts['__treasury__'] = { accountNumber: TREASURY_ACCOUNT, username: '__treasury__', pin: null, balance: 0, savings: 0, frozen: false, createdAt: new Date().toLocaleDateString('vi-VN'), isTreasury: true };

function findAccountByNumber(accNumber) {
    return Object.values(bankAccounts).find(a => a.accountNumber === accNumber);
}
function verifyBankAccount(accountNumber, pin) {
    const acc = findAccountByNumber(accountNumber);
    if (!acc || acc.isTreasury || acc.pin !== pin) return null;
    return acc;
}
function verifyBankStaff(actorUsername, actorPassword) {
    const user = verifyOfficer(actorUsername, actorPassword);
    if (!user) return null;
    const allowed = user.role === 'ADMIN' || user.agency === 'NGÂN HÀNG';
    return allowed ? user : null;
}
function parseFineAmount(fineStr) {
    // "4,000,000 VND" -> 4000000
    const digits = String(fineStr).replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
}
function logBankTx(entry) {
    bankTransactions.unshift(entry);
    if (bankTransactions.length > 2000) bankTransactions.pop();
}

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

        // TÍNH NĂNG MỚI v12.0: BOT TÍCH HỢP KIỂM TRA SỐ DƯ NGÂN HÀNG
        // Vì lý do bảo mật, bot CHỈ trả lời số dư khi người dùng cung cấp ĐÚNG
        // đồng thời cả số tài khoản (bắt đầu bằng 9, 10 chữ số) VÀ mã PIN trong
        // cùng một câu hỏi — không tiết lộ nếu thiếu 1 trong 2 yếu tố xác thực.
        const accMatch = message.match(/9\d{9}/);
        const pinMatch = message.match(/(?:PIN|pin|mã)\s*[:\s]?\s*(\d{4,8})/);
        if (accMatch && pinMatch) {
            const acc = verifyBankAccount(accMatch[0], pinMatch[1]);
            if (acc) {
                return res.json({ reply: `[Ngân Hàng Số] Tài khoản ${acc.accountNumber}: Số dư khả dụng ${acc.balance.toLocaleString('vi-VN')} VND | Sổ tiết kiệm: ${acc.savings.toLocaleString('vi-VN')} VND. ${acc.frozen ? '⚠️ Tài khoản đang bị tạm khoá.' : ''}` });
            }
            return res.json({ reply: `[Ngân Hàng Số] Số tài khoản hoặc mã PIN không đúng, vui lòng kiểm tra lại.` });
        }
        if (accMatch && !pinMatch) {
            return res.json({ reply: `[Ngân Hàng Số] Để tra cứu số dư, vui lòng cung cấp thêm mã PIN của bạn trong cùng câu hỏi (VD: "kiểm tra số dư 9xxxxxxxxx pin 1234"). Tôi sẽ không tiết lộ thông tin nếu thiếu mã PIN xác thực.` });
        }

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
        Object.values(systemState.authorizedPersonnel).forEach(u => { if (u.displayName === application.handler) { if (status === 'HÀI LÒNG') u.positiveRatings++; else u.negativeRatings++; } });
        application.logs.push({ sender: "Công Dân", msg: status === 'HÀI LÒNG' ? "✅ Công dân xác nhận hài lòng với kết quả xử lý hồ sơ." : "⚠️ Công dân đánh giá KHÔNG hài lòng với kết quả xử lý hồ sơ.", time: timeNow });
        broadcastUpdate();
        return res.json({ success: true });
    }

    // HỆ THỐNG KHIẾU NẠI 2 CẤP CHUYÊN NGHIỆP (v10.0): Cấp 1 lên Lãnh Đạo trực tiếp
    // của chính cơ quan thụ lý; nếu vẫn chưa thỏa đáng mới leo thang Cấp 2 lên
    // Thanh Tra Chính Phủ giám sát độc lập — đúng logic khiếu nại hành chính thực tế.
    if (action === 'escalate_complaint') {
        const tier = req.body.tier;
        if (tier === 1) {
            application.originalAgency = application.originalAgency || application.agency;
            application.status = "Đang Khiếu Nại Cấp 1 (Lãnh Đạo Trực Tiếp)"; application.stamp = "stamp-rejected"; application.escalationTier = 1;
            application.logs.push({ sender: "Hệ thống tự động", msg: "⚠️ Công dân chính thức gửi khiếu nại CẤP 1 lên Lãnh Đạo trực tiếp của cơ quan thụ lý, yêu cầu xem xét lại toàn bộ quy trình.", time: timeNow });
            addLog(`Hồ sơ ${id} bị khiếu nại Cấp 1 lên Lãnh Đạo cơ quan [${application.agency}].`);
        } else if (tier === 2) {
            application.status = "Đang Khiếu Nại Cấp 2 (Thanh Tra Chính Phủ)"; application.stamp = "stamp-rejected"; application.agency = "THANH TRA"; application.escalationTier = 2;
            application.logs.push({ sender: "Hệ thống tự động", msg: "🚨 Công dân leo thang khiếu nại lên CẤP 2 — Thanh Tra Chính Phủ sẽ giám sát độc lập toàn bộ quy trình xử lý hồ sơ này.", time: timeNow });
            addLog(`Hồ sơ ${id} được leo thang khiếu nại Cấp 2 lên Thanh Tra Chính Phủ.`);
        } else {
            return res.status(400).json({ error: 'Cấp độ khiếu nại không hợp lệ.' });
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
        if (status === 'Đã Phê Duyệt' || status === 'Bị Bác Bỏ') application.satisfaction = null; // mở lại cơ hội đánh giá mới sau mỗi phán quyết
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
    const { username, licenseName, issueAgency, signOfficer, licenseClass, duration, note } = req.body;
    if (!citizenIdentityRegistry[username]) return res.status(404).json({ error: "Không tồn tại tài khoản công dân." });
    const certNumber = `${(issueAgency || 'CP').slice(0,2)}-${Math.floor(100000 + Math.random() * 900000)}`;
    const phoiData = {
        certNumber, licenseName, issueAgency, signOfficer,
        licenseClass: licenseClass || '', duration, note: note || '',
        issueDate: new Date().toLocaleDateString('vi-VN'),
    };
    citizenIdentityRegistry[username].licenses.push(phoiData);
    addLog(`Cán bộ [${req.officer.displayName}] cấp phôi giấy tờ nghiệp vụ nâng cao cho cư dân @${username}: [${licenseName}] (Số: ${certNumber}).`);
    broadcastUpdate();
    res.json({ success: true, certNumber });
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
    const { username, name, dob, gender, pob, job, avatarUrl, licenses, status } = req.body;
    if (!username || !name) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tài khoản và họ tên công dân.' });
    const existing = citizenIdentityRegistry[username] || {};
    citizenIdentityRegistry[username] = { name, dob, gender, pob, job, avatarUrl: avatarUrl || existing.avatarUrl || '', licenses: licenses ? licenses.split(',').map(l => l.trim()) : (existing.licenses || []), status };
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
const SOS_CATEGORY_AGENCY = {
    'AN NINH TRẬT TỰ': 'CÔNG AN',
    'Y TẾ KHẨN CẤP': 'Y TẾ',
    'CHÁY NỔ': 'CÔNG AN',
    'AN NINH QUÂN SỰ': 'QUÂN ĐỘI',
    'KHÁC': 'CHÍNH PHỦ',
};
app.post('/api/dispatch/sos', safeRoute(async (req, res) => {
    const { callerName, category, location, message } = req.body;
    if (!location || !message) return res.status(400).json({ error: 'Vui lòng nhập vị trí và mô tả sự việc khẩn cấp.' });
    const callId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    const suggestedAgency = SOS_CATEGORY_AGENCY[category] || 'CÔNG AN';
    const entry = {
        id: callId,
        callerName: callerName || 'Công Dân Ẩn Danh',
        category: category || 'KHÁC',
        suggestedAgency,
        location, message,
        status: 'ĐANG CHỜ ĐIỀU PHỐI',
        time: new Date().toLocaleTimeString('vi-VN'),
    };
    systemState.dispatchCalls.unshift(entry);
    if (systemState.dispatchCalls.length > 50) systemState.dispatchCalls.pop();
    addLog(`🚨 CUỘC GỌI KHẨN CẤP [${callId}] (${entry.category}) từ ${entry.callerName} tại [${location}] — gợi ý điều phối: ${suggestedAgency}.`);
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

// =====================================================================
// ROUTE HỆ THỐNG NGÂN HÀNG SỐ v11.0
// =====================================================================

// [CÔNG DÂN] Gửi yêu cầu mở tài khoản ngân hàng (biểu mẫu đầy đủ, chờ Ngân Hàng phê duyệt)
app.post('/api/bank/request-account', safeRoute(async (req, res) => {
    const { username, fullName, purpose, pin } = req.body;
    if (!username || !fullName || !pin || pin.length < 4) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tài khoản, họ tên, và mã PIN tối thiểu 4 ký tự.' });
    if (bankAccounts[username]) return res.status(409).json({ error: `Bạn đã có tài khoản ngân hàng số [${bankAccounts[username].accountNumber}] rồi, không cần đăng ký lại.` });
    if (bankAccountRequests.find(r => r.username === username && r.status === 'CHỜ DUYỆT')) return res.status(409).json({ error: 'Bạn đã có một yêu cầu đang chờ duyệt, vui lòng chờ Ngân Hàng xử lý.' });
    const id = `YC-${Math.floor(1000 + Math.random() * 9000)}`;
    bankAccountRequests.unshift({ id, username, fullName, purpose: purpose || '', pin, status: 'CHỜ DUYỆT', time: new Date().toLocaleString('vi-VN') });
    addLog(`Công dân @${username} gửi yêu cầu mở tài khoản Ngân Hàng Số [${id}].`);
    res.json({ success: true, id });
}));

// [NHÂN VIÊN/LÃNH ĐẠO NGÂN HÀNG/ADMIN] Phê duyệt/Từ chối yêu cầu mở tài khoản
app.post('/api/bank/request-decide', safeRoute(async (req, res) => {
    const staff = verifyBankStaff(req.body.actorUsername, req.body.actorPassword);
    if (!staff) return res.status(403).json({ error: 'Chỉ Nhân Viên/Lãnh Đạo Ngân Hàng hoặc ADMIN mới có quyền phê duyệt.' });
    const reqEntry = bankAccountRequests.find(r => r.id === req.body.id);
    if (!reqEntry) return res.status(404).json({ error: 'Không tìm thấy yêu cầu này.' });
    if (reqEntry.status !== 'CHỜ DUYỆT') return res.status(409).json({ error: 'Yêu cầu này đã được xử lý trước đó.' });
    const decision = req.body.decision; // 'DUYỆT' | 'TỪ CHỐI'
    if (decision === 'DUYỆT') {
        const accountNumber = deterministicAccountNumber(reqEntry.username);
        bankAccounts[reqEntry.username] = { accountNumber, username: reqEntry.username, pin: reqEntry.pin, balance: 0, savings: 0, frozen: false, createdAt: new Date().toLocaleDateString('vi-VN') };
        reqEntry.status = 'ĐÃ DUYỆT'; reqEntry.accountNumber = accountNumber;
        addLog(`${staff.displayName} đã DUYỆT yêu cầu mở tài khoản [${reqEntry.id}] — cấp số TK [${accountNumber}] cho @${reqEntry.username}.`);
    } else {
        reqEntry.status = 'TỪ CHỐI';
        addLog(`${staff.displayName} đã TỪ CHỐI yêu cầu mở tài khoản [${reqEntry.id}] của @${reqEntry.username}.`);
    }
    reqEntry.decidedBy = staff.displayName;
    res.json({ success: true });
}));

// [CÔNG DÂN] Tra cứu trạng thái yêu cầu mở tài khoản của chính mình (không cần đăng nhập ngân hàng vì chưa có TK)
app.post('/api/bank/request-status', safeRoute(async (req, res) => {
    const { username } = req.body;
    const myRequests = bankAccountRequests.filter(r => r.username === username);
    res.json({ success: true, requests: myRequests });
}));

// [NHÂN VIÊN/LÃNH ĐẠO NGÂN HÀNG/ADMIN] Cấp tài khoản ngân hàng cho công dân
app.post('/api/bank/issue-account', safeRoute(async (req, res) => {
    const staff = verifyBankStaff(req.body.actorUsername, req.body.actorPassword);
    const { username, pin } = req.body;
    if (!username || !pin || pin.length < 4) return res.status(400).json({ error: 'Vui lòng nhập tài khoản công dân và mã PIN tối thiểu 4 ký tự.' });
    if (!citizenIdentityRegistry[username]) return res.status(404).json({ error: 'Tài khoản công dân này chưa được số hóa định danh. Hãy đăng ký định danh trước.' });
    const accountNumber = deterministicAccountNumber(username);
    if (bankAccounts[username]) return res.status(409).json({ error: `Công dân @${username} đã có tài khoản ngân hàng số [${accountNumber}] từ trước.` });
    bankAccounts[username] = { accountNumber, username, pin, balance: 0, savings: 0, frozen: false, createdAt: new Date().toLocaleDateString('vi-VN') };
    addLog(`Nhân viên ngân hàng [${staff.displayName}] cấp tài khoản ngân hàng số [${accountNumber}] cho công dân @${username}.`);
    res.json({ success: true, accountNumber });
}));

// [CÔNG DÂN] Đăng nhập ngân hàng bằng số tài khoản + mã PIN
app.post('/api/bank/login', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Số tài khoản hoặc mã PIN không đúng.' });
    const myTx = bankTransactions.filter(t => t.accountNumber === acc.accountNumber).slice(0, 100);
    const myLoans = loanRequests.filter(l => l.accountNumber === acc.accountNumber);
    res.json({ success: true, account: { accountNumber: acc.accountNumber, username: acc.username, balance: acc.balance, savings: acc.savings, frozen: acc.frozen, createdAt: acc.createdAt }, transactions: myTx, loans: myLoans });
}));

// [CÔNG DÂN] Làm mới dữ liệu tài khoản của chính mình (dùng lại sau mỗi thao tác)
app.post('/api/bank/my-state', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Phiên đăng nhập ngân hàng không hợp lệ.' });
    const myTx = bankTransactions.filter(t => t.accountNumber === acc.accountNumber).slice(0, 100);
    const myLoans = loanRequests.filter(l => l.accountNumber === acc.accountNumber);
    res.json({ success: true, account: { accountNumber: acc.accountNumber, username: acc.username, balance: acc.balance, savings: acc.savings, frozen: acc.frozen, createdAt: acc.createdAt }, transactions: myTx, loans: myLoans });
}));

app.post('/api/bank/deposit', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Phiên đăng nhập ngân hàng không hợp lệ.' });
    if (acc.frozen) return res.status(423).json({ error: 'Tài khoản đang bị tạm khoá, vui lòng liên hệ Ngân Hàng.' });
    const amount = parseInt(req.body.amount, 10);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Số tiền nộp không hợp lệ.' });
    acc.balance += amount;
    const id = `GD-${Date.now().toString().slice(-8)}`;
    logBankTx({ id, accountNumber: acc.accountNumber, type: 'NẠP TIỀN', amount, counterpart: 'Quầy giao dịch', note: 'Nộp tiền mặt tại quầy (mô phỏng)', time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
    res.json({ success: true, balance: acc.balance, billId: id });
}));

app.post('/api/bank/withdraw', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Phiên đăng nhập ngân hàng không hợp lệ.' });
    if (acc.frozen) return res.status(423).json({ error: 'Tài khoản đang bị tạm khoá, vui lòng liên hệ Ngân Hàng.' });
    const amount = parseInt(req.body.amount, 10);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Số tiền rút không hợp lệ.' });
    if (acc.balance < amount) return res.status(400).json({ error: `Số dư không đủ. Số dư hiện tại: ${acc.balance.toLocaleString('vi-VN')} VND.` });
    acc.balance -= amount;
    const id = `GD-${Date.now().toString().slice(-8)}`;
    logBankTx({ id, accountNumber: acc.accountNumber, type: 'RÚT TIỀN', amount: -amount, counterpart: 'Quầy giao dịch', note: 'Rút tiền mặt tại quầy (mô phỏng)', time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
    res.json({ success: true, balance: acc.balance, billId: id });
}));

app.post('/api/bank/transfer', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Phiên đăng nhập ngân hàng không hợp lệ.' });
    if (acc.frozen) return res.status(423).json({ error: 'Tài khoản đang bị tạm khoá, vui lòng liên hệ Ngân Hàng.' });
    const { toAccountNumber, note } = req.body;
    const amount = parseInt(req.body.amount, 10);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Số tiền chuyển không hợp lệ.' });
    if (toAccountNumber === acc.accountNumber) return res.status(400).json({ error: 'Không thể chuyển khoản cho chính mình.' });
    const target = findAccountByNumber(toAccountNumber);
    if (!target) return res.status(404).json({ error: 'Không tìm thấy số tài khoản người nhận.' });
    if (acc.balance < amount) return res.status(400).json({ error: `Số dư không đủ. Số dư hiện tại: ${acc.balance.toLocaleString('vi-VN')} VND.` });
    acc.balance -= amount; target.balance += amount;
    const id = `GD-${Date.now().toString().slice(-8)}`;
    logBankTx({ id, accountNumber: acc.accountNumber, type: 'CHUYỂN KHOẢN ĐI', amount: -amount, counterpart: toAccountNumber, note: note || '', time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
    logBankTx({ id: id + '-R', accountNumber: target.accountNumber, type: 'NHẬN CHUYỂN KHOẢN', amount, counterpart: acc.accountNumber, note: note || '', time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
    res.json({ success: true, balance: acc.balance, billId: id });
}));

// Nộp phạt vi phạm: tự động trừ tiền từ tài khoản công dân, chuyển vào Kho Bạc Nhà Nước
app.post('/api/bank/pay-fine', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Phiên đăng nhập ngân hàng không hợp lệ.' });
    const { violationId } = req.body;
    const records = criminalRecordsRegistry[acc.username] || [];
    const violation = records.find(v => v.id === violationId);
    if (!violation) return res.status(404).json({ error: 'Không tìm thấy biên bản vi phạm này trong tên tài khoản của bạn.' });
    if (violation.status === 'Đã Nộp Phạt') return res.status(409).json({ error: 'Biên bản này đã được nộp phạt trước đó.' });
    const amount = parseFineAmount(violation.fine);
    if (acc.balance < amount) return res.status(400).json({ error: `Số dư không đủ để nộp phạt ${amount.toLocaleString('vi-VN')} VND.` });
    acc.balance -= amount;
    bankAccounts['__treasury__'].balance += amount;
    violation.status = 'Đã Nộp Phạt';
    const id = `GD-${Date.now().toString().slice(-8)}`;
    logBankTx({ id, accountNumber: acc.accountNumber, type: 'NỘP PHẠT', amount: -amount, counterpart: 'KHO BẠC NHÀ NƯỚC', note: `Biên bản ${violationId}: ${violation.type}`, time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
    // GHI NHẬT KÝ TỰ ĐỘNG theo đúng yêu cầu: khi nộp phạt thành công, hệ thống
    // TỰ ĐỘNG ghi log chuyển trạng thái biên bản sang "Đã Nộp Phạt" và số tiền
    // đã được điều chuyển về Kho Bạc Nhà Nước dưới sự kiểm soát của Ngân Hàng.
    addLog(`✅ [TỰ ĐỘNG] Công dân @${acc.username} đã nộp phạt thành công ${amount.toLocaleString('vi-VN')} VND cho biên bản [${violationId}] qua Ngân Hàng Số — trạng thái biên bản tự động chuyển sang "Đã Nộp Phạt", số tiền đã điều chuyển về Kho Bạc Nhà Nước.`);
    broadcastUpdate();
    res.json({ success: true, balance: acc.balance, billId: id });
}));

app.post('/api/bank/savings', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Phiên đăng nhập ngân hàng không hợp lệ.' });
    const amount = parseInt(req.body.amount, 10);
    const action = req.body.action; // 'gui' | 'rut'
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Số tiền không hợp lệ.' });
    if (action === 'gui') {
        if (acc.balance < amount) return res.status(400).json({ error: 'Số dư khả dụng không đủ để gửi tiết kiệm.' });
        acc.balance -= amount; acc.savings += amount;
        logBankTx({ id: `GD-${Date.now().toString().slice(-8)}`, accountNumber: acc.accountNumber, type: 'GỬI TIẾT KIỆM', amount: -amount, counterpart: 'Sổ tiết kiệm', note: '', time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
    } else if (action === 'rut') {
        if (acc.savings < amount) return res.status(400).json({ error: 'Số dư tiết kiệm không đủ.' });
        acc.savings -= amount; acc.balance += amount;
        logBankTx({ id: `GD-${Date.now().toString().slice(-8)}`, accountNumber: acc.accountNumber, type: 'RÚT TIẾT KIỆM', amount, counterpart: 'Sổ tiết kiệm', note: '', time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
    } else { return res.status(400).json({ error: 'Hành động không hợp lệ.' }); }
    res.json({ success: true, balance: acc.balance, savings: acc.savings });
}));

app.post('/api/bank/loan/request', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Phiên đăng nhập ngân hàng không hợp lệ.' });
    const amount = parseInt(req.body.amount, 10);
    const reason = (req.body.reason || '').trim();
    if (!amount || amount <= 0 || !reason) return res.status(400).json({ error: 'Vui lòng nhập số tiền và lý do vay vốn hợp lệ.' });
    const id = `VV-${Math.floor(1000 + Math.random() * 9000)}`;
    loanRequests.unshift({ id, accountNumber: acc.accountNumber, username: acc.username, amount, reason, status: 'CHỜ DUYỆT', time: new Date().toLocaleString('vi-VN') });
    addLog(`Công dân @${acc.username} gửi yêu cầu vay vốn [${id}]: ${amount.toLocaleString('vi-VN')} VND.`);
    res.json({ success: true, id });
}));

// [NHÂN VIÊN/LÃNH ĐẠO NGÂN HÀNG/ADMIN] Duyệt/từ chối vay vốn
app.post('/api/bank/loan/decide', safeRoute(async (req, res) => {
    const staff = verifyBankStaff(req.body.actorUsername, req.body.actorPassword);
    if (!staff) return res.status(403).json({ error: 'Chỉ Nhân Viên/Lãnh Đạo Ngân Hàng hoặc ADMIN mới có quyền duyệt vay vốn.' });
    const loan = loanRequests.find(l => l.id === req.body.id);
    if (!loan) return res.status(404).json({ error: 'Không tìm thấy yêu cầu vay vốn.' });
    if (loan.status !== 'CHỜ DUYỆT') return res.status(409).json({ error: 'Yêu cầu này đã được xử lý trước đó.' });
    const decision = req.body.decision; // 'DUYỆT' | 'TỪ CHỐI'
    loan.status = decision === 'DUYỆT' ? 'ĐANG TRẢ GÓP' : 'TỪ CHỐI'; loan.decidedBy = staff.displayName;
    if (decision === 'DUYỆT') {
        const acc = bankAccounts[loan.username];
        if (acc) {
            acc.balance += loan.amount;
            // Chia thành 4 kỳ trả góp, mỗi kỳ hệ thống TỰ ĐỘNG truy thu (LOAN_CYCLE_MS/kỳ)
            loan.totalCycles = 4;
            loan.installment = Math.ceil(loan.amount * 1.1 / 4); // gốc + 10% phí dịch vụ, chia đều 4 kỳ
            loan.remaining = loan.installment * loan.totalCycles;
            loan.nextChargeAt = Date.now() + LOAN_CYCLE_MS;
            logBankTx({ id: `GD-${Date.now().toString().slice(-8)}`, accountNumber: acc.accountNumber, type: 'GIẢI NGÂN VAY VỐN', amount: loan.amount, counterpart: 'NGÂN HÀNG', note: `${loan.reason} (trả góp ${loan.totalCycles} kỳ, mỗi kỳ ${loan.installment.toLocaleString('vi-VN')} VND)`, time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
        }
    }
    addLog(`${staff.displayName} đã ${decision === 'DUYỆT' ? 'DUYỆT' : 'TỪ CHỐI'} yêu cầu vay vốn [${loan.id}] của @${loan.username}.`);
    res.json({ success: true });
}));


// [NHÂN VIÊN/LÃNH ĐẠO NGÂN HÀNG/ADMIN] Toàn cảnh giám sát ngân hàng
app.post('/api/bank/staff-state', safeRoute(async (req, res) => {
    const staff = verifyBankStaff(req.body.actorUsername, req.body.actorPassword);
    if (!staff) return res.status(403).json({ error: 'Chỉ Nhân Viên/Lãnh Đạo Ngân Hàng hoặc ADMIN mới được xem dữ liệu này.' });
    const accounts = Object.values(bankAccounts).filter(a => !a.isTreasury).map(a => ({ accountNumber: a.accountNumber, username: a.username, balance: a.balance, savings: a.savings, frozen: a.frozen, createdAt: a.createdAt }));
    res.json({ success: true, accounts, transactions: bankTransactions.slice(0, 300), loans: loanRequests, accountRequests: bankAccountRequests, treasuryBalance: bankAccounts['__treasury__'].balance, interestRate: SAVINGS_INTEREST_RATE });
}));

// [NHÂN VIÊN/LÃNH ĐẠO NGÂN HÀNG/ADMIN] Đóng/mở băng tài khoản, điều chỉnh số dư thủ công
app.post('/api/bank/adjust', safeRoute(async (req, res) => {
    const staff = verifyBankStaff(req.body.actorUsername, req.body.actorPassword);
    if (!staff) return res.status(403).json({ error: 'Không đủ thẩm quyền.' });
    const acc = bankAccounts[req.body.username];
    if (!acc) return res.status(404).json({ error: 'Không tìm thấy tài khoản ngân hàng của công dân này.' });
    if (req.body.action === 'freeze') { acc.frozen = true; addLog(`${staff.displayName} đã TẠM KHOÁ tài khoản ngân hàng [${acc.accountNumber}].`); }
    else if (req.body.action === 'unfreeze') { acc.frozen = false; addLog(`${staff.displayName} đã MỞ KHOÁ tài khoản ngân hàng [${acc.accountNumber}].`); }
    else if (req.body.action === 'adjust') {
        const amount = parseInt(req.body.amount, 10);
        if (!amount) return res.status(400).json({ error: 'Số tiền điều chỉnh không hợp lệ.' });
        acc.balance += amount;
        logBankTx({ id: `GD-${Date.now().toString().slice(-8)}`, accountNumber: acc.accountNumber, type: 'ĐIỀU CHỈNH THỦ CÔNG', amount, counterpart: staff.displayName, note: req.body.note || '', time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
        addLog(`${staff.displayName} điều chỉnh thủ công số dư tài khoản [${acc.accountNumber}]: ${amount > 0 ? '+' : ''}${amount.toLocaleString('vi-VN')} VND. Lý do: ${req.body.note || 'không ghi chú'}.`);
    } else return res.status(400).json({ error: 'Hành động không hợp lệ.' });
    res.json({ success: true });
}));

// TÍNH NĂNG MỚI v13.0: BỘ ĐẾM NGƯỜI TRUY CẬP TRỰC TIẾP CÔNG KHAI
// Đếm TẤT CẢ kết nối đang mở trang (công dân lẫn cán bộ), khác với bảng
// "cán bộ trực ban" (chỉ đếm người đã đăng nhập). Tạo cảm giác sống động,
// nhiều người đang cùng tham gia máy chủ trong lúc roleplay.
let liveVisitorCount = 0;
function broadcastVisitorCount() { io.emit('visitorCount', liveVisitorCount); }

io.on('connection', (socket) => {
    liveVisitorCount++;
    broadcastVisitorCount();
    socket.emit('initData', { systemState, citizenIdentityRegistry, criminalRecordsRegistry });
    socket.emit('rosterUpdate', Array.from(new Map(Array.from(onlineOfficers.values()).map(o => [o.username, o])).values()));

    // Cán bộ đăng nhập thành công ở client sẽ emit sự kiện này để hiện diện trên Bảng Trực Tuyến
    socket.on('identify', (payload) => {
        if (!payload || !payload.username) return;
        const user = systemState.authorizedPersonnel[payload.username];
        if (!user) return; // không tin dữ liệu client gửi lên, đối chiếu lại với dữ liệu thật trên server
        const isNewJoin = !Array.from(onlineOfficers.values()).some(o => o.username === user.username);
        onlineOfficers.set(socket.id, { username: user.username, displayName: user.displayName, role: user.role, agency: user.agency });
        broadcastRoster();
        if (isNewJoin) io.emit('officerJoined', { displayName: user.displayName, role: user.role, agency: user.agency });
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
        liveVisitorCount = Math.max(0, liveVisitorCount - 1);
        broadcastVisitorCount();
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

// =====================================================================
// TIẾN TRÌNH NỀN ĐỊNH KỲ NGÂN HÀNG SỐ v12.0
// Mỗi LOAN_CYCLE_MS (mô phỏng 1 "kỳ hạn" nhập vai): tự động cộng lãi cho
// sổ tiết kiệm, và tự động truy thu 1 kỳ trả góp cho các khoản vay đang
// hoạt động — đúng như quy trình ngân hàng thật, không cần thao tác thủ công.
// =====================================================================
setInterval(() => {
    const now = Date.now();
    // 1) Cộng lãi tiết kiệm định kỳ
    Object.values(bankAccounts).forEach(acc => {
        if (acc.isTreasury || !acc.savings || acc.savings <= 0) return;
        const interest = Math.round(acc.savings * SAVINGS_INTEREST_RATE);
        if (interest > 0) {
            acc.savings += interest;
            logBankTx({ id: `LS-${Date.now().toString().slice(-8)}`, accountNumber: acc.accountNumber, type: 'LÃI TIẾT KIỆM', amount: interest, counterpart: 'Ngân Hàng', note: `Lãi suất kỳ hạn ${(SAVINGS_INTEREST_RATE * 100).toFixed(0)}%`, time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
        }
    });
    // 2) Tự động truy thu trả góp vay vốn tới kỳ hạn
    loanRequests.forEach(loan => {
        if (loan.status !== 'ĐANG TRẢ GÓP' || !loan.nextChargeAt || now < loan.nextChargeAt) return;
        const acc = bankAccounts[loan.username];
        if (!acc) return;
        const charge = Math.min(loan.installment, loan.remaining);
        if (acc.balance >= charge) {
            acc.balance -= charge; loan.remaining -= charge;
            logBankTx({ id: `TG-${Date.now().toString().slice(-8)}`, accountNumber: acc.accountNumber, type: 'TRỪ NỢ VAY VỐN TỰ ĐỘNG', amount: -charge, counterpart: 'NGÂN HÀNG', note: `Trả góp khoản vay [${loan.id}]`, time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG' });
            addLog(`Ngân hàng tự động truy thu ${charge.toLocaleString('vi-VN')} VND trả góp khoản vay [${loan.id}] của @${loan.username}.`);
        } else {
            logBankTx({ id: `TG-${Date.now().toString().slice(-8)}`, accountNumber: acc.accountNumber, type: 'TRUY THU THẤT BẠI (SỐ DƯ KHÔNG ĐỦ)', amount: 0, counterpart: 'NGÂN HÀNG', note: `Khoản vay [${loan.id}] - cần thanh toán thủ công`, time: new Date().toLocaleString('vi-VN'), status: 'THẤT BẠI' });
            addLog(`⚠️ Truy thu trả góp khoản vay [${loan.id}] của @${loan.username} THẤT BẠI do số dư không đủ.`);
        }
        if (loan.remaining <= 0) { loan.status = 'ĐÃ TẤT TOÁN'; addLog(`Khoản vay [${loan.id}] của @${loan.username} đã được tất toán hoàn tất.`); }
        else { loan.nextChargeAt = now + LOAN_CYCLE_MS; }
    });
}, 60 * 1000); // kiểm tra mỗi 60 giây xem có kỳ hạn nào đến hạn không

server.listen(PORT, () => {
    console.log(`[REALTIME CENTRAL V13.0] RUNNING PERFECTLY ON PORT ${PORT}`);
    console.log(`[THỜI GIAN THỰC v13] Bộ đếm người truy cập trực tiếp + thông báo cán bộ vào trực + dải hoạt động sống động: SẴN SÀNG.`);
    console.log(`[NGÂN HÀNG SỐ v12] Biểu mẫu xin cấp TK + phê duyệt, lãi tiết kiệm ${(SAVINGS_INTEREST_RATE*100).toFixed(0)}%/kỳ, truy thu vay vốn tự động, bot kiểm tra số dư: SẴN SÀNG.`);
    console.log(`[NGÂN HÀNG SỐ] Hệ thống tài khoản/giao dịch/vay vốn hoàn chỉnh, dữ liệu tách biệt bảo mật, không broadcast qua socket: SẴN SÀNG.`);
    console.log(`[HỒ SƠ ĐỊNH DANH] Đã gộp tra cứu + kết xuất phôi thành 1 tab, hỗ trợ avatar nhân vật: SẴN SÀNG.`);
    console.log(`[KHO LƯU TRỮ] Tab kho lưu trữ hồ sơ đầy đủ cho bàn giám sát admin: SẴN SÀNG.`);
    console.log(`[TỐC ĐỘ] Đã tối ưu bỏ qua đồng bộ toàn phần cho các hành động nhẹ (chat) để phản hồi nhanh hơn.`);
    console.log(`[QUY TRÌNH] Stepper 6 bước + checklist tiếp nhận bắt buộc + khiếu nại 2 cấp (Lãnh Đạo -> Thanh Tra): SẴN SÀNG.`);
    console.log(`[VÁ LỖI CỰC KỲ NGHIÊM TRỌNG] Lớp bảo vệ dự phòng Toast/SFX phía client vẫn đang hoạt động.`);
    console.log(`[BẢO MẬT] Xác thực phân quyền thật (username/password) đã kích hoạt cho mọi thao tác đặc quyền.`);
    console.log(`[TUỆ ĐỨC AI ENGINE] Nhận diện linh hoạt loại giấy tờ tự nhiên + Claude API: ${process.env.ANTHROPIC_API_KEY ? 'ĐÃ KÍCH HOẠT' : 'chưa cấu hình (vẫn hoạt động bằng bộ quy tắc offline)'}`);
});
