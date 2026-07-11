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
        "thanhtra1": { username: "thanhtra1", password: "123", displayName: "Thanh Tra Viên Trần Lực", role: "THANH TRA", agency: "THANH TRA", positiveRatings: 2, negativeRatings: 0 },
        "bankmgr1": { username: "bankmgr1", password: "123", displayName: "Giám Đốc Ngân Hàng Nguyễn Thắng", role: "LÃNH ĐẠO", agency: "NGÂN HÀNG", positiveRatings: 6, negativeRatings: 0 }
    },
    archiveReturnRequests: []
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
let depositRequests = []; // { id, accountNumber, username, amount, method, reference, note, status, time, decidedBy }
let payrollBatches = []; // { id, period, items[], status, workflow[], submittedBy, ... }
let welfareBatches = []; // { id, title, welfareType, recipients[], status, submittedBy, approvedBy, time }
let salaryAdvances = []; // ứng lương trước kỳ: officer → lãnh đạo ĐV → ngân hàng → ADMIN
let officerMemos = []; // biên bản khen thưởng / vi phạm cán bộ đơn vị
// Điều chỉnh lương theo username: ứng còn nợ, thưởng/phạt chờ áp vào kỳ lương
const officerPayAdjustments = {}; // username -> { advanceDebt, bonusCredit, penaltyDebt }
const SAVINGS_INTEREST_RATE = 0.005;
const LOAN_CYCLE_MS = 5 * 60 * 1000;
const DAILY_BASE_SALARY = { 'CHUYÊN VIÊN': 350000, 'LÃNH ĐẠO': 550000, 'THANH TRA': 450000 };
const HOURLY_DUTY_RATE = { 'CHUYÊN VIÊN': 38000, 'LÃNH ĐẠO': 58000, 'THANH TRA': 48000 };
const BONUS_PER_APP_SHIFT = 45000;
const BONUS_PER_REG_SHIFT = 65000;
const LATE_PENALTY_PER_MINUTE = 2000; // phạt trễ so với lịch trực đã duyệt
// VÀO CA = điểm danh. Lương chỉ ghi sổ khi KẾT THÚC CA. Khóa ngày luôn pad 2 số để khớp kỳ lương.
const activeShifts = new Map();
const shiftHistory = [];
const dailySalaryLedger = {};
let shiftSchedules = []; // đăng ký lịch trực: cán bộ → lãnh đạo ĐV duyệt

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
function pad2(n) { return String(n).padStart(2, '0'); }
function formatDateKey(d = new Date()) {
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatMonthKey(d = new Date()) {
    return `${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function normalizeDateKey(dateKey) {
    const parts = String(dateKey || '').split('/');
    if (parts.length < 3) return String(dateKey || '');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parts[2];
    if (!day || !month || !year) return String(dateKey || '');
    return `${pad2(day)}/${pad2(month)}/${year}`;
}
function monthKeyFromDateKey(dateKey) {
    const norm = normalizeDateKey(dateKey);
    const parts = norm.split('/');
    if (parts.length < 3) return null;
    return `${parts[1]}/${parts[2]}`;
}
function todayKey() { return formatDateKey(); }
function currentMonthKey() { return formatMonthKey(); }
function dateInPeriod(dateKey, periodMonth) {
    const mk = monthKeyFromDateKey(dateKey);
    return !!mk && mk === (periodMonth || currentMonthKey());
}
function getDayLedgerEntry(username, dateKey = todayKey()) {
    const ledger = dailySalaryLedger[username];
    if (!ledger) return null;
    const want = normalizeDateKey(dateKey);
    if (ledger[want]) return ledger[want];
    const hit = Object.keys(ledger).find(k => normalizeDateKey(k) === want);
    return hit ? ledger[hit] : null;
}
function parseHmToDate(dateKey, hm) {
    const [dd, mm, yyyy] = normalizeDateKey(dateKey).split('/').map(Number);
    const [hh, mi] = String(hm || '00:00').split(':').map(n => parseInt(n, 10) || 0);
    return new Date(yyyy, (mm || 1) - 1, dd || 1, hh, mi, 0, 0);
}
function getApprovedScheduleFor(username, dateKey = todayKey()) {
    const want = normalizeDateKey(dateKey);
    return shiftSchedules.find(s =>
        s.username === username && normalizeDateKey(s.date) === want && s.status === 'ĐÃ DUYỆT'
    ) || null;
}
function bumpShiftStat(username, field, amount = 1) {
    const shift = activeShifts.get(username);
    if (shift) shift[field] = (shift[field] || 0) + amount;
}
function computeShiftPay(record, officer) {
    const role = record.role || officer?.role || 'CHUYÊN VIÊN';
    const baseDaily = DAILY_BASE_SALARY[role] || DAILY_BASE_SALARY['CHUYÊN VIÊN'];
    const rawHours = Math.max(Number(record.hours) || 0, 0);
    const hours = Math.min(Math.max(rawHours, (rawHours > 0 || record.forceMinBill) ? 1 / 60 : 0), 12);
    const lateMinutes = Math.max(0, parseInt(record.lateMinutes, 10) || 0);
    const latePenalty = lateMinutes * LATE_PENALTY_PER_MINUTE;
    if (hours <= 0 && !latePenalty) {
        return {
            basePay: 0, hourPay: 0, attendancePay: 0, appPay: 0, regPay: 0,
            latePenalty: 0, lateMinutes: 0, violationDeduction: 0, hours: 0,
            appsProcessed: record.appsProcessed || 0, registrations: record.registrations || 0, net: 0, role
        };
    }
    const dutyRatio = Math.min(1, Math.max(hours, 1 / 60) / 8);
    const basePay = Math.round(baseDaily * dutyRatio);
    const hourPay = Math.round(hours * (HOURLY_DUTY_RATE[role] || HOURLY_DUTY_RATE['CHUYÊN VIÊN']));
    const appPay = (record.appsProcessed || 0) * BONUS_PER_APP_SHIFT;
    const regPay = (record.registrations || 0) * BONUS_PER_REG_SHIFT;
    const net = Math.max(0, basePay + hourPay + appPay + regPay - latePenalty);
    return {
        basePay, hourPay, attendancePay: 0, appPay, regPay, latePenalty, lateMinutes,
        violationDeduction: latePenalty, hours: Math.round(hours * 100) / 100,
        appsProcessed: record.appsProcessed || 0, registrations: record.registrations || 0, net, role
    };
}
function getPayAdj(username) {
    if (!officerPayAdjustments[username]) officerPayAdjustments[username] = { advanceDebt: 0, bonusCredit: 0, penaltyDebt: 0 };
    return officerPayAdjustments[username];
}
function getLiveShiftMonitor(username, officer) {
    const shift = activeShifts.get(username);
    if (!shift) return null;
    const hours = Math.round(((Date.now() - shift.startAt) / 3600000) * 100) / 100;
    const pendingEstimate = computeShiftPay({ ...shift, hours: Math.max(hours, 1 / 60), forceMinBill: true }, officer || systemState.authorizedPersonnel[username]);
    return {
        date: todayKey(), hours,
        appsProcessed: shift.appsProcessed || 0, registrations: shift.registrations || 0,
        lateMinutes: shift.lateMinutes || 0, scheduleId: shift.scheduleId || null,
        live: true, onShift: true, startAt: shift.startAt, elapsedMs: Date.now() - shift.startAt,
        displayName: shift.displayName || officer?.displayName, role: shift.role || officer?.role,
        agency: shift.agency || officer?.agency, pendingEstimate
    };
}
function getLiveShiftPay(username, officer) {
    const mon = getLiveShiftMonitor(username, officer);
    if (!mon) return null;
    return { ...mon, ...(mon.pendingEstimate || {}), net: 0, live: true, onShift: true };
}
function accumulateDailySalary(shiftRecord) {
    const officer = systemState.authorizedPersonnel[shiftRecord.username];
    const calc = computeShiftPay({ ...shiftRecord, forceMinBill: true }, officer);
    const dateKey = normalizeDateKey(shiftRecord.date || todayKey());
    if (!dailySalaryLedger[shiftRecord.username]) dailySalaryLedger[shiftRecord.username] = {};
    Object.keys(dailySalaryLedger[shiftRecord.username]).forEach(k => {
        const nk = normalizeDateKey(k);
        if (nk !== k && dailySalaryLedger[shiftRecord.username][k]) {
            const old = dailySalaryLedger[shiftRecord.username][k];
            const cur = dailySalaryLedger[shiftRecord.username][nk];
            if (!cur) dailySalaryLedger[shiftRecord.username][nk] = { ...old, date: nk };
            else {
                dailySalaryLedger[shiftRecord.username][nk] = {
                    ...cur,
                    basePay: cur.basePay + old.basePay, hourPay: cur.hourPay + old.hourPay,
                    appPay: cur.appPay + old.appPay, regPay: cur.regPay + old.regPay,
                    latePenalty: (cur.latePenalty || 0) + (old.latePenalty || 0),
                    lateMinutes: (cur.lateMinutes || 0) + (old.lateMinutes || 0),
                    net: cur.net + old.net, hours: Math.round((cur.hours + old.hours) * 100) / 100,
                    appsProcessed: cur.appsProcessed + old.appsProcessed,
                    registrations: cur.registrations + old.registrations,
                    shifts: (cur.shifts || 0) + (old.shifts || 0),
                    shiftIds: [...(cur.shiftIds || []), ...(old.shiftIds || [])].slice(-30), date: nk
                };
            }
            delete dailySalaryLedger[shiftRecord.username][k];
        }
    });
    const ex = dailySalaryLedger[shiftRecord.username][dateKey] || {
        basePay: 0, hourPay: 0, attendancePay: 0, appPay: 0, regPay: 0,
        latePenalty: 0, lateMinutes: 0, violationDeduction: 0, net: 0, hours: 0,
        appsProcessed: 0, registrations: 0, shifts: 0, date: dateKey, shiftIds: []
    };
    dailySalaryLedger[shiftRecord.username][dateKey] = {
        basePay: ex.basePay + calc.basePay, hourPay: ex.hourPay + calc.hourPay, attendancePay: 0,
        appPay: ex.appPay + calc.appPay, regPay: ex.regPay + calc.regPay,
        latePenalty: (ex.latePenalty || 0) + (calc.latePenalty || 0),
        lateMinutes: (ex.lateMinutes || 0) + (calc.lateMinutes || 0),
        violationDeduction: (ex.latePenalty || 0) + (calc.latePenalty || 0),
        net: ex.net + calc.net, hours: Math.round((ex.hours + calc.hours) * 100) / 100,
        appsProcessed: ex.appsProcessed + calc.appsProcessed, registrations: ex.registrations + calc.registrations,
        shifts: (ex.shifts || 0) + 1, date: dateKey,
        shiftIds: [...(ex.shiftIds || []), shiftRecord.id].filter(Boolean).slice(-20),
        updatedAt: new Date().toLocaleString('vi-VN')
    };
    return dailySalaryLedger[shiftRecord.username][dateKey];
}
function startOfficerShift(officer, options = {}) {
    if (activeShifts.has(officer.username)) return activeShifts.get(officer.username);
    const dateKey = todayKey();
    const schedule = getApprovedScheduleFor(officer.username, dateKey);
    let lateMinutes = 0;
    let scheduleId = null;
    if (schedule) {
        scheduleId = schedule.id;
        const planned = parseHmToDate(dateKey, schedule.startTime);
        lateMinutes = Math.max(0, Math.floor((Date.now() - planned.getTime()) / 60000));
        if (lateMinutes <= 5) lateMinutes = 0;
        schedule.status = 'ĐANG TRỰC';
        schedule.checkedInAt = new Date().toLocaleString('vi-VN');
    }
    const shift = {
        username: officer.username, displayName: officer.displayName, role: officer.role, agency: officer.agency,
        startAt: Date.now(), appsProcessed: 0, registrations: 0,
        lateMinutes, scheduleId, scheduleStart: schedule?.startTime || null, scheduleEnd: schedule?.endTime || null
    };
    activeShifts.set(officer.username, shift);
    const lateNote = lateMinutes > 0
        ? ` — TRỄ ${lateMinutes} phút (phạt khi kết ca)`
        : (schedule ? ' — đúng lịch' : ' — không có lịch duyệt (vẫn ghi nhận ca)');
    addLog(`🟢 Cán bộ ${officer.displayName} điểm danh VÀO CA [${officer.agency}]${lateNote}.`);
    return shift;
}
function endOfficerShift(username, reason = 'Kết thúc ca') {
    const shift = activeShifts.get(username);
    if (!shift) return null;
    const endAt = Date.now();
    const elapsedMs = endAt - shift.startAt;
    const hours = Math.max(Math.round((elapsedMs / 3600000) * 100) / 100, 1 / 60);
    const record = {
        ...shift, endAt, hours, forceMinBill: true,
        date: todayKey(), id: `CA-${Date.now().toString().slice(-8)}`, reason
    };
    shiftHistory.unshift(record);
    if (shiftHistory.length > 5000) shiftHistory.pop();
    activeShifts.delete(username);
    if (shift.scheduleId) {
        const sch = shiftSchedules.find(s => s.id === shift.scheduleId);
        if (sch && sch.status === 'ĐANG TRỰC') {
            sch.status = 'HOÀN THÀNH';
            sch.checkedOutAt = new Date().toLocaleString('vi-VN');
            sch.actualHours = hours;
            sch.lateMinutes = shift.lateMinutes || 0;
        }
    }
    const dayLedger = accumulateDailySalary(record);
    const pay = computeShiftPay(record, systemState.authorizedPersonnel[username]);
    addLog(`🔴 ${shift.displayName} kết thúc ca (${reason}): ${hours}h | trễ ${shift.lateMinutes || 0}p | ${shift.appsProcessed} HS | ${shift.registrations} NL → GHI SỔ ${pay.net.toLocaleString('vi-VN')} VND (ngày: ${dayLedger.net.toLocaleString('vi-VN')} VND).`);
    return { record, pay, dayLedger };
}
function buildPayrollItems(periodMonth, agencyFilter = null, options = {}) {
    const monthKey = periodMonth || currentMonthKey();
    const includeZero = options.includeZero !== false;
    return Object.values(systemState.authorizedPersonnel)
        .filter(u => u.username !== 'admin' && u.role !== 'ADMIN' && (!agencyFilter || u.agency === agencyFilter))
        .map(u => {
            const ledger = dailySalaryLedger[u.username] || {};
            const adj = getPayAdj(u.username);
            const live = getLiveShiftMonitor(u.username, u);
            const total = {
                basePay: 0, hourPay: 0, attendancePay: 0, appPay: 0, regPay: 0,
                latePenalty: 0, lateMinutes: 0, violationDeduction: 0, net: 0,
                hours: 0, appsProcessed: 0, registrations: 0, workDays: 0, closedShifts: 0, dailyBreakdown: [],
                onShift: !!live, liveHours: live?.hours || 0, closedHours: 0,
                hasBankAccount: !!bankAccounts[u.username],
                advanceDebt: adj.advanceDebt || 0, bonusCredit: adj.bonusCredit || 0, penaltyDebt: adj.penaltyDebt || 0,
                statusLabel: 'CHƯA CÓ CÔNG',
                pendingEstimate: live?.pendingEstimate?.net || 0,
                liveLateMinutes: live?.lateMinutes || 0
            };
            Object.entries(ledger).forEach(([date, d]) => {
                if (!dateInPeriod(date, monthKey)) return;
                total.basePay += d.basePay; total.hourPay += d.hourPay;
                total.appPay += d.appPay; total.regPay += d.regPay;
                total.latePenalty += (d.latePenalty || 0);
                total.lateMinutes += (d.lateMinutes || 0);
                total.net += d.net; total.hours += d.hours; total.appsProcessed += d.appsProcessed;
                total.registrations += d.registrations; total.workDays += 1; total.closedHours += d.hours;
                total.closedShifts += (d.shifts || 0);
                total.dailyBreakdown.push({ date: normalizeDateKey(date), ...d, live: false, onShift: false, recorded: true });
            });
            if (live) {
                total.onShift = true;
                total.liveHours = live.hours;
                total.statusLabel = total.workDays > 0
                    ? 'ĐANG TRỰC — ĐÃ CÓ CÔNG GHI NHẬN'
                    : 'ĐANG TRỰC — CHƯA KẾT CA (chưa ghi sổ)';
            } else if (total.workDays > 0 || total.closedShifts > 0) {
                total.statusLabel = 'ĐÃ GHI NHẬN CÔNG';
            }
            const ratingPenalty = (u.negativeRatings || 0) * 80000;
            total.memoPenalty = adj.penaltyDebt || 0;
            total.violationDeduction = ratingPenalty + total.memoPenalty + total.latePenalty;
            total.bonusCredit = adj.bonusCredit || 0;
            total.advanceDebt = adj.advanceDebt || 0;
            const recordedNet = total.net;
            let net = recordedNet + total.bonusCredit - ratingPenalty - total.memoPenalty - total.advanceDebt;
            total.recordedNet = recordedNet;
            total.net = Math.max(0, net);
            total.finalNet = total.net;
            total.adjustedNet = total.net;
            total.proposedNet = total.net;
            total.autoCalculated = true;
            total.formulaNote = 'Ca đã kết thúc: LCB(giờ) + phụ cấp giờ + thưởng HS/NL − phạt trễ lịch − VP/phạt biên bản − nợ ứng + khen';
            total.dailyBreakdown.sort((a, b) => {
                const [da, ma, ya] = String(a.date || '').split('/').map(Number);
                const [db, mb, yb] = String(b.date || '').split('/').map(Number);
                return new Date(yb, (mb || 1) - 1, db || 1) - new Date(ya, (ma || 1) - 1, da || 1);
            });
            return { username: u.username, displayName: u.displayName, role: u.role, agency: u.agency, period: monthKey, ...total };
        })
        .filter(item => includeZero || item.hours > 0 || item.workDays > 0 || item.closedShifts > 0 || item.finalNet > 0 || item.advanceDebt > 0 || item.bonusCredit > 0 || item.onShift);
}
function isCrossAgencyOfficer(officer) {
    return !!officer && (officer.role === 'ADMIN' || officer.role === 'THANH TRA' || officer.agency === 'CHÍNH PHỦ');
}
function canAccessApplication(officer, app) {
    if (!officer || !app) return false;
    if (isCrossAgencyOfficer(officer)) return true;
    return app.agency === officer.agency || app.originalAgency === officer.agency;
}
function canAccessAgencyRecord(officer, agency) {
    if (!officer) return false;
    if (isCrossAgencyOfficer(officer)) return true;
    return officer.agency === agency;
}
function getUnitRoster(agency) {
    return Object.values(systemState.authorizedPersonnel)
        .filter(u => u.role !== 'ADMIN' && u.agency === agency)
        .map(u => {
            const att = getAttendanceStatus(u.username);
            const live = getLiveShiftMonitor(u.username, u);
            const today = getDayLedgerEntry(u.username, todayKey());
            const schedule = getApprovedScheduleFor(u.username, todayKey())
                || shiftSchedules.find(s => s.username === u.username && normalizeDateKey(s.date) === todayKey() && ['ĐANG TRỰC', 'HOÀN THÀNH'].includes(s.status))
                || null;
            return {
                username: u.username,
                displayName: u.displayName,
                role: u.role,
                agency: u.agency,
                onShift: !!att.onShift,
                startAt: att.startAt || null,
                elapsedMs: att.elapsedMs || 0,
                appsProcessed: att.appsProcessed || (today?.appsProcessed || 0),
                registrations: att.registrations || (today?.registrations || 0),
                liveHours: live ? live.hours : 0,
                lateMinutes: live?.lateMinutes || today?.lateMinutes || 0,
                pendingEstimate: live?.pendingEstimate?.net || 0,
                todayClosedNet: today ? today.net : 0,
                todayClosedHours: today ? today.hours : 0,
                todayClosedShifts: today ? (today.shifts || 0) : 0,
                todayLatePenalty: today?.latePenalty || 0,
                schedule: schedule ? { id: schedule.id, startTime: schedule.startTime, endTime: schedule.endTime, status: schedule.status } : null,
                hasBankAccount: !!bankAccounts[u.username]
            };
        });
}
const AGENCY_BRAND = {
    'CÔNG AN': { shortName: 'CA', color: '#1d4ed8', icon: 'fa-shield-halved', ring: '#2563eb' },
    'QUÂN ĐỘI': { shortName: 'QD', color: '#166534', icon: 'fa-star', ring: '#15803d' },
    'TOÀ ÁN': { shortName: 'TA', color: '#7c2d12', icon: 'fa-scale-balanced', ring: '#9a3412' },
    'THANH TRA': { shortName: 'TT', color: '#6b21a8', icon: 'fa-magnifying-glass', ring: '#7e22ce' },
    'CHÍNH PHỦ': { shortName: 'CP', color: '#b45309', icon: 'fa-landmark', ring: '#d97706' },
    'Y TẾ': { shortName: 'YT', color: '#0e7490', icon: 'fa-heart-pulse', ring: '#0891b2' },
    'GIÁO DỤC': { shortName: 'GD', color: '#1e40af', icon: 'fa-graduation-cap', ring: '#2563eb' },
    'TÀI CHÍNH': { shortName: 'TC', color: '#a16207', icon: 'fa-coins', ring: '#ca8a04' },
    'UBND': { shortName: 'UB', color: '#047857', icon: 'fa-building', ring: '#059669' },
    'NGÂN HÀNG': { shortName: 'NH', color: '#b45309', icon: 'fa-building-columns', ring: '#eab308' },
    'KHO BẠC / ADMIN': { shortName: 'KB', color: '#991b1b', icon: 'fa-vault', ring: '#dc2626' },
    'HỆ THỐNG': { shortName: 'HT', color: '#475569', icon: 'fa-server', ring: '#64748b' }
};
function getAgencySeal(agency) {
    const text = String(agency || 'LIÊN THÔNG').trim();
    const brand = AGENCY_BRAND[text] || { shortName: text.split(/\s+/).slice(0, 3).map(p => p[0]).join('').toUpperCase() || 'CQ', color: '#b91c1c', icon: 'fa-stamp', ring: '#dc2626' };
    return { agency: text, shortName: brand.shortName, color: brand.color, ring: brand.ring, icon: brand.icon, stampText: `DẤU MÔ PHỎNG ${text}` };
}
function getOfficerIncome(username) {
    const acc = bankAccounts[username];
    const officer = systemState.authorizedPersonnel[username];
    const ledger = dailySalaryLedger[username] || {};
    const monthKey = currentMonthKey();
    // Chỉ sổ ca đã kết thúc — khớp kỳ bằng dateInPeriod (pad tháng 01–12)
    const monthLedger = Object.entries(ledger)
        .filter(([date]) => dateInPeriod(date, monthKey))
        .map(([date, d]) => ({ date: normalizeDateKey(date), ...d, live: false, onShift: false, recorded: true }));
    monthLedger.sort((a, b) => {
        const [da, ma, ya] = String(a.date || '').split('/').map(Number);
        const [db, mb, yb] = String(b.date || '').split('/').map(Number);
        return new Date(yb, (mb || 1) - 1, db || 1) - new Date(ya, (ma || 1) - 1, da || 1);
    });
    const monthTotal = monthLedger.reduce((s, d) => ({
        net: s.net + d.net, hours: s.hours + d.hours, workDays: s.workDays + 1, shifts: s.shifts + (d.shifts || 0),
        lateMinutes: s.lateMinutes + (d.lateMinutes || 0), latePenalty: s.latePenalty + (d.latePenalty || 0),
        basePay: s.basePay + (d.basePay || 0), hourPay: s.hourPay + (d.hourPay || 0),
        appPay: s.appPay + (d.appPay || 0), regPay: s.regPay + (d.regPay || 0)
    }), { net: 0, hours: 0, workDays: 0, shifts: 0, lateMinutes: 0, latePenalty: 0, basePay: 0, hourPay: 0, appPay: 0, regPay: 0 });
    const live = getLiveShiftMonitor(username, officer);
    const mySchedules = shiftSchedules.filter(s => s.username === username).slice(0, 40);
    const payslips = acc ? bankTransactions.filter(t => t.accountNumber === acc.accountNumber && (t.payslip || (t.type && t.type.includes('LƯƠNG')))).slice(0, 30) : [];
    const welfare = acc ? bankTransactions.filter(t => t.accountNumber === acc.accountNumber && t.welfareSlip).slice(0, 20) : [];
    const unitBatches = payrollBatches.filter(b => b.items?.some(i => i.username === username)).slice(0, 10);
    const adj = getPayAdj(username);
    const myAdvances = salaryAdvances.filter(a => a.username === username).slice(0, 20);
    const myMemos = officerMemos.filter(m => m.targetUsername === username || m.submittedByUsername === username).slice(0, 20);
    return {
        hasAccount: !!acc,
        accountNumber: acc?.accountNumber || null,
        balance: acc?.balance || 0,
        monthKey,
        monthLedger,
        monthTotal,
        onShift: !!live,
        liveHours: live?.hours || 0,
        liveLateMinutes: live?.lateMinutes || 0,
        pendingEstimate: live?.pendingEstimate?.net || 0,
        livePay: 0,
        schedules: mySchedules,
        adjustments: adj,
        advances: myAdvances,
        memos: myMemos,
        payslips,
        welfare,
        payrollHistory: unitBatches.map(b => {
            const item = b.items.find(i => i.username === username);
            return { batchId: b.id, period: b.period, agency: b.agency, status: b.status, amount: item?.adjustedNet ?? item?.proposedNet ?? item?.finalNet ?? 0, paid: !!item?.paid, txId: item?.txId || null };
        })
    };
}
function canManageUnitPayroll(user) {
    return !!user && (user.role === 'ADMIN' || (user.role === 'LÃNH ĐẠO' && user.agency && user.agency !== 'NGÂN HÀNG'));
}
function getPayrollVisibleBatches(user) {
    if (!user) return [];
    const visible = payrollBatches.filter(b => !['ĐÃ CHI TRẢ', 'TỪ CHỐI'].includes(b.status));
    if (user.role === 'ADMIN') return visible.slice(0, 30);
    if (user.agency === 'NGÂN HÀNG') {
        return visible.filter(b => ['CHỜ NGÂN HÀNG KIỂM TRA', 'CHỜ ADMIN PHÊ DUYỆT'].includes(b.status)).slice(0, 30);
    }
    if (canManageUnitPayroll(user)) {
        return visible.filter(b => b.agency === user.agency).slice(0, 30);
    }
    return [];
}
function getVisibleAdvances(user) {
    if (!user) return [];
    if (user.role === 'ADMIN') return salaryAdvances.filter(a => !['ĐÃ CHI', 'TỪ CHỐI', 'BỊ BÁC'].includes(a.status)).slice(0, 40);
    if (user.agency === 'NGÂN HÀNG') return salaryAdvances.filter(a => ['CHỜ NGÂN HÀNG', 'CHỜ ADMIN'].includes(a.status)).slice(0, 40);
    if (canManageUnitPayroll(user)) return salaryAdvances.filter(a => a.agency === user.agency && !['ĐÃ CHI', 'TỪ CHỐI', 'BỊ BÁC'].includes(a.status)).slice(0, 40);
    return salaryAdvances.filter(a => a.username === user.username).slice(0, 20);
}
function getVisibleMemos(user) {
    if (!user) return [];
    if (user.role === 'ADMIN') return officerMemos.filter(m => !['ĐÃ ÁP DỤNG', 'TỪ CHỐI', 'BỊ BÁC'].includes(m.status)).slice(0, 40);
    if (user.agency === 'NGÂN HÀNG') return officerMemos.filter(m => ['CHỜ NGÂN HÀNG', 'CHỜ ADMIN'].includes(m.status)).slice(0, 40);
    if (canManageUnitPayroll(user)) return officerMemos.filter(m => m.agency === user.agency && !['ĐÃ ÁP DỤNG', 'TỪ CHỐI', 'BỊ BÁC'].includes(m.status)).slice(0, 40);
    return officerMemos.filter(m => m.targetUsername === user.username || m.submittedByUsername === user.username).slice(0, 20);
}
function getAttendanceStatus(username) {
    const shift = activeShifts.get(username);
    if (!shift) return { onShift: false, todayLedger: getDayLedgerEntry(username, todayKey()) };
    return {
        onShift: true,
        startAt: shift.startAt,
        appsProcessed: shift.appsProcessed,
        registrations: shift.registrations,
        elapsedMs: Date.now() - shift.startAt,
        lateMinutes: shift.lateMinutes || 0,
        scheduleId: shift.scheduleId || null,
        scheduleStart: shift.scheduleStart || null,
        scheduleEnd: shift.scheduleEnd || null,
        todayLedger: getDayLedgerEntry(username, todayKey())
    };
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
    const timeNow = new Date().toLocaleTimeString('vi-VN');
    const skipLookup = ['approve_archive_return'].includes(action);
    let application = skipLookup ? null : (systemState.applications[id] || systemState.archivedApplications[id]);
    if (!skipLookup && !application) return res.status(404).json({ error: `Không tìm thấy hồ sơ mang mã [${id}] trên trục liên thông (có thể đã bị xoá hoặc mã sai).` });

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

    // HỆ THỐNG KHIẾU NẠI 2 CẤP — LOGIC CHUẨN HÓA v14.0
    if (action === 'escalate_complaint') {
        const tier = req.body.tier;
        if (tier === 1) {
            if (!application.satisfaction || application.satisfaction === 'HÀI LÒNG') {
                return res.status(400).json({ error: 'Chỉ có thể khiếu nại khi công dân đánh giá KHÔNG hài lòng với kết quả xử lý.' });
            }
            application.originalAgency = application.originalAgency || application.agency;
            application.status = "Khiếu Nại Cấp 1 — Chờ Lãnh Đạo Tiếp Nhận";
            application.stamp = "stamp-rejected"; application.escalationTier = 1; application.complaintStatus = 'CHỜ TIẾP NHẬN';
            application.logs.push({ sender: "Hệ thống tự động", msg: "⚠️ Công dân gửi khiếu nại CẤP 1. Hồ sơ chuyển về Lãnh Đạo trực tiếp cơ quan [" + application.originalAgency + "] tiếp nhận xem xét lại.", time: timeNow });
            addLog(`Hồ sơ ${id} — khiếu nại Cấp 1, chờ Lãnh Đạo [${application.originalAgency}] tiếp nhận.`);
        } else if (tier === 2) {
            if (application.escalationTier !== 1) {
                return res.status(400).json({ error: 'Phải qua Cấp 1 (Lãnh Đạo cơ quan) trước khi leo thang lên Thanh Tra.' });
            }
            application.status = "Khiếu Nại Cấp 2 — Chờ Thanh Tra Giám Sát";
            application.stamp = "stamp-rejected"; application.agency = "THANH TRA"; application.escalationTier = 2; application.complaintStatus = 'CHỜ THANH TRA';
            application.logs.push({ sender: "Hệ thống tự động", msg: "🚨 Công dân leo thang khiếu nại CẤP 2 — Thanh Tra Chính Phủ tiếp nhận giám sát độc lập toàn bộ quy trình.", time: timeNow });
            addLog(`Hồ sơ ${id} leo thang khiếu nại Cấp 2 — chuyển Thanh Tra Chính Phủ.`);
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

    // Phân quyền theo đơn vị: cán bộ thường chỉ xử lý nội vụ đơn vị mình
    if (application && !canAccessApplication(officer, application) && !['approve_archive_return'].includes(action)) {
        return res.status(403).json({ error: `Hồ sơ thuộc đơn vị [${application.agency}] — tài khoản [${officer.agency}] không có thẩm quyền nội vụ đơn vị này.` });
    }

    if (action === 'claim_packet') {
        const claimable = application.status === 'Đang Chờ Tiếp Nhận'
            || String(application.status || '').includes('Trả Lại Từ Kho');
        if (!claimable) return res.status(409).json({ error: 'Hồ sơ này đã có cán bộ khác thụ lý trước đó, vui lòng tải lại trang.' });
        if (!activeShifts.has(officer.username) && officer.role !== 'ADMIN') {
            return res.status(409).json({ error: 'Bạn chưa điểm danh vào ca. Hãy vào ca trước khi thụ lý hồ sơ để hệ thống ghi nhận công và lương tự động.' });
        }
        application.status = "Đã Tiếp Nhận Xử Lý"; application.stamp = "stamp-forwarded"; application.handler = officer.displayName; application.handlerTitle = officer.role;
        application.logs.push({ sender: "Hệ thống số hóa", msg: `Cán bộ nghiệp vụ ${officerName} đã ký số tiếp nhận phụ trách hồ sơ này.`, time: timeNow });
        addLog(`Hồ sơ ${id} đã được phân phối thụ lý cho cán bộ ${officerName}.`);
        bumpShiftStat(officer.username, 'appsProcessed');
    } else if (action === 'status') {
        const leadershipOnlyStatuses = ['Đã Phê Duyệt', 'Bị Bác Bỏ'];
        if (leadershipOnlyStatuses.includes(status) && !isLead) {
            return res.status(403).json({ error: `Chỉ LÃNH ĐẠO hoặc ADMIN mới có quyền Phê Duyệt / Bác Bỏ hồ sơ. Cấp bậc hiện tại của bạn: ${officer.role}.` });
        }
        if (leadershipOnlyStatuses.includes(status) && officer.role === 'LÃNH ĐẠO' && !canAccessApplication(officer, application)) {
            return res.status(403).json({ error: 'Lãnh đạo chỉ phê duyệt hồ sơ thuộc đơn vị mình.' });
        }
        application.status = status; application.stamp = stamp;
        if (status === 'Đã Phê Duyệt' || status === 'Bị Bác Bỏ') application.satisfaction = null;
        application.logs.push({ sender: "Hội đồng thẩm định", msg: `Cán bộ quyền hạn ${officerName} thay đổi trạng thái hồ sơ sang: [${status}].`, time: timeNow });
        addLog(`Hồ sơ mang mã số ${id} thay đổi trạng thái xử lý sang: ${status} bởi ${officerName}.`);
        if (['Đã Phê Duyệt', 'Bị Bác Bỏ', 'Trình Duyệt Sắc Lệnh'].includes(status)) bumpShiftStat(officer.username, 'appsProcessed');
    } else if (action === 'forward') {
        if (!targetAgency) return res.status(400).json({ error: 'Vui lòng chọn cơ quan cần luân chuyển tới.' });
        application.logs.push({ sender: "Hệ thống điều phối", msg: `Hồ sơ vượt thẩm quyền, cán bộ ${officerName} ký chuyển ngành liên thông sang đơn vị bộ phận: [${targetAgency}].`, time: timeNow });
        application.agency = targetAgency; application.status = "Đang Chờ Tiếp Nhận"; application.stamp = "stamp-pending";
        application.handler = "Chưa phân phối"; application.handlerTitle = "Hệ thống tự động";
        addLog(`Hồ sơ ${id} được điều chuyển phân luồng nghiệp vụ sang cơ quan ban ngành [${targetAgency}].`);
    } else if (action === 'resolve_complaint') {
        const decision = req.body.decision; // 'CHAP_NHAN' | 'BAC_BO' | 'XEM_XET_LAI'
        const tier = application.escalationTier;
        if (!tier) return res.status(400).json({ error: 'Hồ sơ này không đang trong quy trình khiếu nại.' });
        if (tier === 1 && officer.role !== 'LÃNH ĐẠO' && officer.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Chỉ Lãnh Đạo cơ quan mới có quyền xử lý khiếu nại Cấp 1.' });
        }
        if (tier === 1 && officer.role === 'LÃNH ĐẠO' && officer.agency !== (application.originalAgency || application.agency) && officer.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Lãnh Đạo phải thuộc đúng cơ quan thụ lý ban đầu để xử lý khiếu nại Cấp 1.' });
        }
        if (tier === 2 && officer.role !== 'THANH TRA' && officer.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Chỉ Thanh Tra Chính Phủ mới có quyền xử lý khiếu nại Cấp 2.' });
        }
        if (decision === 'CHAP_NHAN') {
            application.status = "Đã Tiếp Nhận Xử Lý"; application.stamp = "stamp-forwarded"; application.complaintStatus = 'ĐÃ CHẤP NHẬN — XEM XÉT LẠI';
            application.escalationTier = null;
            application.logs.push({ sender: officerName, msg: `✅ Khiếu nại Cấp ${tier} được CHẤP NHẬN. Hồ sơ quay lại quy trình thẩm định để xem xét lại từ đầu.`, time: timeNow });
        } else if (decision === 'BAC_BO') {
            application.status = tier === 1 ? "Khiếu Nại Cấp 1 — Bị Bác (Giữ Nguyên Quyết Định)" : "Khiếu Nại Cấp 2 — Bị Bác (Giữ Nguyên Quyết Định)";
            application.stamp = "stamp-approved"; application.complaintStatus = 'ĐÃ BÁC KHIẾU NẠI';
            application.logs.push({ sender: officerName, msg: `❌ Khiếu nại Cấp ${tier} bị BÁC. Quyết định xử lý ban đầu được giữ nguyên.`, time: timeNow });
        } else {
            return res.status(400).json({ error: 'Quyết định khiếu nại không hợp lệ.' });
        }
        addLog(`Hồ sơ ${id}: Lãnh đạo/Thanh tra ${officerName} xử lý khiếu nại Cấp ${tier} — ${decision}.`);
    } else if (action === 'archive') {
        if (!isLead) return res.status(403).json({ error: 'Chỉ LÃNH ĐẠO hoặc ADMIN mới có quyền niêm phong lưu kho hồ sơ.' });
        if (officer.role === 'LÃNH ĐẠO' && !canAccessApplication(officer, application)) {
            return res.status(403).json({ error: 'Lãnh đạo chỉ được niêm phong hồ sơ thuộc đơn vị mình.' });
        }
        if (application.escalationTier && application.complaintStatus !== 'ĐÃ BÁC KHIẾU NẠI' && application.complaintStatus !== 'ĐÃ CHẤP NHẬN — XEM XÉT LẠI') {
            return res.status(409).json({ error: 'Không thể lưu kho khi hồ sơ đang trong quy trình khiếu nại chưa kết thúc.' });
        }
        application.status = "Đã Đóng & Lưu Kho Mật"; application.stamp = "stamp-archived";
        systemState.archivedApplications[id] = application; delete systemState.applications[id];
        addLog(`Niêm phong vĩnh viễn hồ sơ ${id} chuyển lưu kho dữ liệu quốc gia bởi ${officerName}.`);
    } else if (action === 'return_from_archive') {
        if (officer.role !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN mới có quyền trả hồ sơ từ kho lưu trữ.' });
        if (!systemState.archivedApplications[id]) return res.status(404).json({ error: 'Hồ sơ không nằm trong kho lưu trữ.' });
        application.status = "Đang Chờ Tiếp Nhận — Trả Lại Từ Kho"; application.stamp = "stamp-pending";
        application.handler = "Chưa phân phối"; application.handlerTitle = "Hệ thống tự động";
        application.logs.push({ sender: officerName, msg: `📤 ADMIN trả hồ sơ từ kho lưu trữ về hàng đợi xử lý. Lý do: ${req.body.reason || 'Theo yêu cầu cấp trên.'}`, time: timeNow });
        systemState.applications[id] = application; delete systemState.archivedApplications[id];
        addLog(`ADMIN ${officerName} trả hồ sơ ${id} từ kho lưu trữ về xử lý.`);
    } else if (action === 'delete_from_archive') {
        if (officer.role !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN mới có quyền hủy/xóa hồ sơ trong kho.' });
        if (!systemState.archivedApplications[id]) return res.status(404).json({ error: 'Hồ sơ không nằm trong kho lưu trữ.' });
        delete systemState.archivedApplications[id];
        addLog(`ADMIN ${officerName} đã HỦY/XÓA vĩnh viễn hồ sơ ${id} khỏi kho lưu trữ.`);
    } else if (action === 'request_archive_return') {
        if (!['LÃNH ĐẠO', 'THANH TRA', 'ADMIN'].includes(officer.role)) {
            return res.status(403).json({ error: 'Chỉ Lãnh Đạo hoặc Thanh Tra mới có quyền yêu cầu trả hồ sơ từ kho.' });
        }
        if (!systemState.archivedApplications[id]) return res.status(404).json({ error: 'Hồ sơ không nằm trong kho lưu trữ.' });
        // Lãnh đạo đơn vị chỉ yêu cầu trả hồ sơ thuộc đơn vị mình
        if (officer.role === 'LÃNH ĐẠO' && !canAccessApplication(officer, systemState.archivedApplications[id])) {
            return res.status(403).json({ error: 'Lãnh đạo chỉ được yêu cầu trả hồ sơ thuộc đơn vị mình.' });
        }
        const reason = (req.body.reason || '').trim();
        if (!reason) return res.status(400).json({ error: 'Vui lòng ghi rõ lý do yêu cầu trả hồ sơ.' });
        const pendingSame = (systemState.archiveReturnRequests || []).find(r => r.fileId === id && r.status === 'CHỜ ADMIN PHÊ DUYỆT');
        if (pendingSame) return res.status(409).json({ error: `Hồ sơ này đã có yêu cầu trả [${pendingSame.id}] đang chờ ADMIN.` });
        const reqId = `YC-TR-${Math.floor(1000 + Math.random() * 9000)}`;
        if (!systemState.archiveReturnRequests) systemState.archiveReturnRequests = [];
        systemState.archiveReturnRequests.unshift({ id: reqId, fileId: id, requestedBy: officer.displayName, role: officer.role, agency: officer.agency, reason, status: 'CHỜ ADMIN PHÊ DUYỆT', time: new Date().toLocaleString('vi-VN') });
        addLog(`${officerName} gửi yêu cầu trả hồ sơ ${id} từ kho [${reqId}]: ${reason}`);
    } else if (action === 'approve_archive_return') {
        if (officer.role !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN mới phê duyệt yêu cầu trả hồ sơ từ kho.' });
        const reqEntry = (systemState.archiveReturnRequests || []).find(r => r.id === req.body.requestId);
        if (!reqEntry || reqEntry.status !== 'CHỜ ADMIN PHÊ DUYỆT') return res.status(404).json({ error: 'Không tìm thấy yêu cầu trả hồ sơ.' });
        const archived = systemState.archivedApplications[reqEntry.fileId];
        if (!archived) return res.status(404).json({ error: 'Hồ sơ đã không còn trong kho.' });
        archived.status = "Đang Chờ Tiếp Nhận — Trả Lại Từ Kho"; archived.stamp = "stamp-pending";
        archived.handler = "Chưa phân phối";
        archived.logs.push({ sender: officerName, msg: `📤 Yêu cầu trả hồ sơ [${reqEntry.id}] của ${reqEntry.requestedBy} đã được ADMIN phê duyệt. Lý do: ${reqEntry.reason}`, time: timeNow });
        systemState.applications[reqEntry.fileId] = archived; delete systemState.archivedApplications[reqEntry.fileId];
        reqEntry.status = 'ĐÃ PHÊ DUYỆT'; reqEntry.approvedBy = officer.displayName;
        addLog(`ADMIN phê duyệt trả hồ sơ ${reqEntry.fileId} từ kho theo yêu cầu ${reqEntry.requestedBy}.`);
    } else {
        return res.status(400).json({ error: `Hành động [${action}] không được hỗ trợ.` });
    }
    broadcastUpdate();
    res.json({ success: true });
}));

// ROUTE CẤP VĂN BẰNG PHÔI BẰNG CHUYÊN SÂU (ĐA TRƯỜNG THÔNG TIN) — YÊU CẦU ĐĂNG NHẬP CÁN BỘ THẬT
app.post('/api/resident/add-license', requireAuth(), safeRoute(async (req, res) => {
    const { username, licenseName, signOfficer, licenseClass, duration, note } = req.body;
    if (!citizenIdentityRegistry[username]) return res.status(404).json({ error: "Không tồn tại tài khoản công dân." });
    // Đơn vị cấp phôi = đơn vị cán bộ đang đăng nhập (trừ ADMIN / CHÍNH PHỦ / THANH TRA)
    let issueAgency = req.body.issueAgency;
    if (!isCrossAgencyOfficer(req.officer)) {
        issueAgency = req.officer.agency;
    }
    if (!issueAgency) return res.status(400).json({ error: 'Thiếu đơn vị cấp phôi.' });
    const certNumber = `${(issueAgency || 'CP').slice(0,2)}-${Math.floor(100000 + Math.random() * 900000)}`;
    const phoiData = {
        certNumber, licenseName, issueAgency, signOfficer: signOfficer || req.officer.displayName,
        licenseClass: licenseClass || '', duration, note: note || '',
        issueDate: new Date().toLocaleDateString('vi-VN'),
    };
    citizenIdentityRegistry[username].licenses.push(phoiData);
    addLog(`Cán bộ [${req.officer.displayName}] cấp phôi giấy tờ nghiệp vụ nâng cao cho cư dân @${username}: [${licenseName}] (Số: ${certNumber}) — đơn vị [${issueAgency}].`);
    broadcastUpdate();
    res.json({ success: true, certNumber, issueAgency });
}));

// ROUTE BÁO CÁO CÔNG VIỆC HÀNG NGÀY / CA TRỰC NÂNG CAO — YÊU CẦU ĐĂNG NHẬP CÁN BỘ THẬT
app.post('/api/officer/report', requireAuth(), safeRoute(async (req, res) => {
    const agency = isCrossAgencyOfficer(req.officer) ? (req.body.agency || req.officer.agency) : req.officer.agency;
    const { taskStatus, content } = req.body;
    const id = `RP-${Math.floor(100 + Math.random() * 900)}`;
    systemState.shiftReports.unshift({
        id, date: new Date().toLocaleDateString('vi-VN'),
        officer: req.officer.displayName, officerUsername: req.officer.username,
        agency, taskStatus, content, status: "CHỜ PHÊ DUYỆT", feedback: ""
    });
    addLog(`Cán bộ trực ban [${req.officer.displayName}] nộp báo cáo tình trạng công việc hàng ngày [${id}]: [${taskStatus}] — đơn vị [${agency}].`);
    broadcastUpdate();
    res.json({ success: true });
}));

app.post('/api/officer/report-action', requireAuth(['LÃNH ĐẠO', 'THANH TRA']), safeRoute(async (req, res) => {
    const { id, status, feedback } = req.body;
    let rp = systemState.shiftReports.find(r => r.id === id);
    if (!rp) return res.status(404).json({ error: 'Không tìm thấy báo cáo ca trực này.' });
    if (!canAccessAgencyRecord(req.officer, rp.agency)) {
        return res.status(403).json({ error: `Báo cáo thuộc đơn vị [${rp.agency}] — bạn không có thẩm quyền phê duyệt nội vụ đơn vị này.` });
    }
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

// =====================================================================
// v15.0: ĐIỂM DANH CA TRỰC — VÀO CA / KẾT THÚC CA / TỔNG HỢP LƯƠNG NGÀY
// =====================================================================
app.post('/api/officer/attendance/checkin', requireAuth(), safeRoute(async (req, res) => {
    const shift = startOfficerShift(req.officer);
    broadcastUpdate();
    res.json({
        success: true,
        shift: {
            startAt: shift.startAt, onShift: true,
            lateMinutes: shift.lateMinutes || 0,
            scheduleId: shift.scheduleId || null,
            scheduleStart: shift.scheduleStart || null
        },
        message: shift.lateMinutes > 0
            ? `Đã vào ca — TRỄ ${shift.lateMinutes} phút (phạt khi kết ca).`
            : 'Đã điểm danh VÀO CA — lương ghi sổ khi kết ca.'
    });
}));
app.post('/api/officer/attendance/checkout', requireAuth(), safeRoute(async (req, res) => {
    const result = endOfficerShift(req.officer.username, req.body.reason || 'Kết thúc ca thủ công');
    if (!result) return res.status(409).json({ error: 'Bạn chưa điểm danh vào ca, không thể kết thúc ca.' });
    broadcastUpdate();
    const lateNote = result.record.lateMinutes > 0
        ? ` • phạt trễ ${result.record.lateMinutes}p (−${(result.pay.latePenalty || 0).toLocaleString('vi-VN')} VND)`
        : '';
    res.json({
        success: true,
        record: result.record,
        dailyPay: result.pay,
        dayLedger: result.dayLedger,
        message: `Đã ghi sổ lương ca: ${result.pay.net.toLocaleString('vi-VN')} VND${lateNote}`
    });
}));
app.post('/api/officer/attendance/status', requireAuth(), safeRoute(async (req, res) => {
    const status = getAttendanceStatus(req.officer.username);
    const todayClosed = getDayLedgerEntry(req.officer.username, todayKey());
    const live = getLiveShiftMonitor(req.officer.username, req.officer);
    const todaySchedule = getApprovedScheduleFor(req.officer.username, todayKey())
        || shiftSchedules.find(s => s.username === req.officer.username && normalizeDateKey(s.date) === todayKey())
        || null;
    res.json({
        success: true,
        attendance: status,
        todayLedger: todayClosed,
        todaySchedule: todaySchedule || null,
        liveShift: live ? {
            hours: live.hours,
            appsProcessed: live.appsProcessed,
            registrations: live.registrations,
            lateMinutes: live.lateMinutes || 0,
            pendingEstimate: live.pendingEstimate?.net || 0,
            startAt: live.startAt
        } : null,
        recentShifts: shiftHistory.filter(s => s.username === req.officer.username).slice(0, 10)
    });
}));

// ---- LỊCH TRỰC: cán bộ đăng ký → lãnh đạo ĐV phê duyệt ----
app.post('/api/officer/schedule/list', requireAuth(), safeRoute(async (req, res) => {
    const me = req.officer;
    let list;
    if (me.role === 'ADMIN' || me.role === 'THANH TRA') {
        list = shiftSchedules.filter(s => !req.body.agency || s.agency === req.body.agency);
    } else if (canManageUnitPayroll(me)) {
        list = shiftSchedules.filter(s => s.agency === me.agency);
    } else {
        list = shiftSchedules.filter(s => s.username === me.username);
    }
    list = [...list].sort((a, b) => {
        const [da, ma, ya] = normalizeDateKey(a.date).split('/').map(Number);
        const [db, mb, yb] = normalizeDateKey(b.date).split('/').map(Number);
        return new Date(yb, (mb || 1) - 1, db || 1) - new Date(ya, (ma || 1) - 1, da || 1);
    }).slice(0, 80);
    res.json({
        success: true,
        schedules: list,
        pendingCount: list.filter(s => s.status === 'CHỜ DUYỆT').length,
        latePenaltyPerMinute: LATE_PENALTY_PER_MINUTE
    });
}));
app.post('/api/officer/schedule/register', requireAuth(), safeRoute(async (req, res) => {
    const me = req.officer;
    if (me.role === 'ADMIN') return res.status(400).json({ error: 'ADMIN không đăng ký lịch trực cán bộ.' });
    const dateRaw = (req.body.date || todayKey()).trim();
    const date = normalizeDateKey(dateRaw);
    const startTime = String(req.body.startTime || '').trim();
    const endTime = String(req.body.endTime || '').trim();
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
        return res.status(400).json({ error: 'Giờ bắt đầu / kết thúc phải dạng HH:MM (ví dụ 08:00).' });
    }
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if ((eh * 60 + em) <= (sh * 60 + sm)) {
        return res.status(400).json({ error: 'Giờ kết thúc phải sau giờ bắt đầu.' });
    }
    const dup = shiftSchedules.find(s =>
        s.username === me.username && normalizeDateKey(s.date) === date &&
        ['CHỜ DUYỆT', 'ĐÃ DUYỆT', 'ĐANG TRỰC'].includes(s.status)
    );
    if (dup) return res.status(409).json({ error: `Bạn đã có lịch ${dup.status} ngày ${date} (${dup.startTime}–${dup.endTime}).` });
    const id = `LT-${Date.now().toString().slice(-8)}`;
    const item = {
        id, username: me.username, displayName: me.displayName, role: me.role, agency: me.agency,
        date, startTime, endTime, note: (req.body.note || '').trim().slice(0, 200),
        status: 'CHỜ DUYỆT', createdAt: new Date().toLocaleString('vi-VN'),
        approvedBy: null, approvedAt: null, rejectReason: null
    };
    shiftSchedules.unshift(item);
    addLog(`${me.displayName} đăng ký lịch trực ${date} ${startTime}–${endTime} [${me.agency}] — chờ lãnh đạo duyệt.`);
    broadcastUpdate();
    res.json({ success: true, schedule: item, message: 'Đã nộp đăng ký lịch trực — chờ lãnh đạo đơn vị phê duyệt.' });
}));
app.post('/api/officer/schedule/decide', requireAuth(), safeRoute(async (req, res) => {
    if (!canManageUnitPayroll(req.officer)) {
        return res.status(403).json({ error: 'Chỉ lãnh đạo đơn vị hoặc ADMIN mới phê duyệt lịch trực.' });
    }
    const sch = shiftSchedules.find(s => s.id === req.body.id);
    if (!sch) return res.status(404).json({ error: 'Không tìm thấy lịch trực.' });
    if (req.officer.role !== 'ADMIN' && sch.agency !== req.officer.agency) {
        return res.status(403).json({ error: 'Không được duyệt lịch ngoài đơn vị của bạn.' });
    }
    if (sch.status !== 'CHỜ DUYỆT') return res.status(409).json({ error: `Lịch đã ở trạng thái [${sch.status}].` });
    const decision = String(req.body.decision || '').toUpperCase();
    if (decision === 'DUYỆT' || decision === 'APPROVE') {
        sch.status = 'ĐÃ DUYỆT';
        sch.approvedBy = req.officer.displayName;
        sch.approvedAt = new Date().toLocaleString('vi-VN');
        sch.rejectReason = null;
        addLog(`${req.officer.displayName} DUYỆT lịch trực ${sch.id} của ${sch.displayName} (${sch.date} ${sch.startTime}–${sch.endTime}).`);
    } else if (decision === 'TỪ CHỐI' || decision === 'REJECT') {
        sch.status = 'TỪ CHỐI';
        sch.approvedBy = req.officer.displayName;
        sch.approvedAt = new Date().toLocaleString('vi-VN');
        sch.rejectReason = (req.body.reason || '').trim().slice(0, 200) || 'Không phù hợp lịch đơn vị';
        addLog(`${req.officer.displayName} TỪ CHỐI lịch trực ${sch.id} của ${sch.displayName}.`);
    } else {
        return res.status(400).json({ error: 'decision phải là DUYỆT hoặc TỪ CHỐI.' });
    }
    broadcastUpdate();
    res.json({ success: true, schedule: sch, status: sch.status });
}));

// Lãnh đạo đơn vị: danh sách ca trực realtime của cán bộ trong đơn vị
app.post('/api/officer/unit-roster', requireAuth(), safeRoute(async (req, res) => {
    if (!canManageUnitPayroll(req.officer) && req.officer.role !== 'THANH TRA') {
        return res.status(403).json({ error: 'Chỉ lãnh đạo đơn vị / ADMIN / Thanh Tra mới xem danh sách ca trực đơn vị.' });
    }
    const agency = (req.officer.role === 'ADMIN' || req.officer.role === 'THANH TRA')
        ? (req.body.agency || req.officer.agency)
        : req.officer.agency;
    const roster = getUnitRoster(agency);
    const payroll = buildPayrollItems(currentMonthKey(), agency, { includeZero: true });
    res.json({
        success: true,
        agency,
        period: currentMonthKey(),
        roster,
        payrollSummary: {
            officers: payroll.length,
            onShift: roster.filter(r => r.onShift).length,
            withRecordedPay: payroll.filter(i => i.workDays > 0 || i.hours > 0).length,
            totalNet: payroll.reduce((s, i) => s + (i.finalNet || 0), 0),
            totalHours: payroll.reduce((s, i) => s + (i.hours || 0), 0),
            closedShifts: payroll.reduce((s, i) => s + (i.closedShifts || 0), 0)
        }
    });
}));

// Lãnh đạo chốt / kết thúc các ca đang mở trong đơn vị → ghi sổ lương ngay
app.post('/api/officer/unit-close-shifts', requireAuth(), safeRoute(async (req, res) => {
    if (!canManageUnitPayroll(req.officer)) {
        return res.status(403).json({ error: 'Chỉ lãnh đạo đơn vị hoặc ADMIN mới chốt ca đơn vị.' });
    }
    const agency = req.officer.role === 'ADMIN' ? (req.body.agency || req.officer.agency) : req.officer.agency;
    if (!agency) return res.status(400).json({ error: 'Thiếu đơn vị.' });
    const reason = (req.body.reason || 'Lãnh đạo đơn vị chốt sổ ca để ký bảng lương').trim();
    const closed = [];
    for (const [username, shift] of activeShifts.entries()) {
        if (shift.agency !== agency) continue;
        const result = endOfficerShift(username, reason);
        if (result) {
            closed.push({
                username,
                displayName: result.record.displayName,
                hours: result.record.hours,
                net: result.pay.net
            });
        }
    }
    broadcastUpdate();
    addLog(`${req.officer.displayName} chốt ${closed.length} ca đang mở đơn vị [${agency}] để ghi sổ lương.`);
    res.json({
        success: true,
        agency,
        closedCount: closed.length,
        closed,
        message: closed.length
            ? `Đã chốt ${closed.length} ca và ghi sổ lương.`
            : 'Không có ca đang mở trong đơn vị.'
    });
}));

// Phiếu lương, phúc lợi và sổ công của cán bộ (không cần đăng nhập ngân hàng riêng)
app.post('/api/officer/my-income', requireAuth(), safeRoute(async (req, res) => {
    res.json({ success: true, income: getOfficerIncome(req.officer.username), officer: { displayName: req.officer.displayName, agency: req.officer.agency, role: req.officer.role } });
}));

// Danh sách bảng lương / phúc lợi chờ phê duyệt (Lãnh Đạo, Ngân Hàng, ADMIN)
app.post('/api/approvals/pending', requireAuth(), safeRoute(async (req, res) => {
    const payroll = getPayrollVisibleBatches(req.officer);
    const welfare = req.officer.role === 'ADMIN'
        ? welfareBatches.filter(w => w.status === 'CHỜ ADMIN PHÊ DUYỆT').slice(0, 20)
        : [];
    res.json({
        success: true,
        payrollBatches: payroll,
        welfareBatches: welfare,
        advances: getVisibleAdvances(req.officer),
        memos: getVisibleMemos(req.officer)
    });
}));

// ===== ỨNG LƯƠNG TRƯỚC KỲ (Officer → Lãnh đạo ĐV → Ngân hàng → ADMIN) =====
app.post('/api/officer/advance/submit', requireAuth(), safeRoute(async (req, res) => {
    if (req.officer.role === 'ADMIN') return res.status(400).json({ error: 'ADMIN không nộp đơn ứng lương cá nhân.' });
    const amount = Math.max(0, parseInt(req.body.amount, 10) || 0);
    const reason = (req.body.reason || '').trim();
    if (amount < 100000) return res.status(400).json({ error: 'Số tiền ứng tối thiểu 100.000 VND.' });
    if (!reason) return res.status(400).json({ error: 'Vui lòng ghi rõ lý do ứng lương (biểu mẫu).' });
    if (!bankAccounts[req.officer.username]) return res.status(400).json({ error: 'Bạn cần có tài khoản ngân hàng để nhận ứng lương.' });
    const pending = salaryAdvances.find(a => a.username === req.officer.username && !['ĐÃ CHI', 'TỪ CHỐI', 'BỊ BÁC'].includes(a.status));
    if (pending) return res.status(409).json({ error: `Bạn đang có đơn ứng lương [${pending.id}] chưa hoàn tất.` });
    const earned = buildPayrollItems(currentMonthKey(), req.officer.agency, { includeZero: true })
        .find(i => i.username === req.officer.username);
    const earnedNet = earned?.finalNet || 0;
    if (amount > Math.max(earnedNet * 2, 2000000)) {
        return res.status(400).json({ error: `Số ứng vượt hạn mức nhập vai (tối đa gấp 2 lương tạm tính kỳ này hoặc 2.000.000 VND). Lương tạm: ${earnedNet.toLocaleString('vi-VN')} VND.` });
    }
    const id = `UL-${Math.floor(1000 + Math.random() * 9000)}`;
    const time = new Date().toLocaleString('vi-VN');
    const form = {
        title: 'BIỂU MẪU ĐỀ NGHỊ ỨNG LƯƠNG TRƯỚC KỲ',
        officer: req.officer.displayName, agency: req.officer.agency, role: req.officer.role,
        amount, reason, period: currentMonthKey(), earnedSnapshot: earnedNet, time
    };
    salaryAdvances.unshift({
        id, username: req.officer.username, displayName: req.officer.displayName,
        agency: req.officer.agency, role: req.officer.role, amount, reason, form,
        status: 'CHỜ LÃNH ĐẠO ĐƠN VỊ', period: currentMonthKey(),
        workflow: [{ step: 'CÁN BỘ NỘP ĐƠN ỨNG LƯƠNG', by: req.officer.displayName, time, note: reason }],
        signatures: { officer: { name: req.officer.displayName, signedAt: time }, unitLeader: null, bankLeader: null, admin: null },
        seals: { unit: getAgencySeal(req.officer.agency), bank: getAgencySeal('NGÂN HÀNG'), admin: getAgencySeal('KHO BẠC / ADMIN') },
        time, submittedBy: req.officer.displayName
    });
    addLog(`${req.officer.displayName} nộp đơn ứng lương [${id}] ${amount.toLocaleString('vi-VN')} VND — chờ lãnh đạo [${req.officer.agency}].`);
    broadcastUpdate();
    res.json({ success: true, id, form });
}));

app.post('/api/officer/advance/decide', requireAuth(), safeRoute(async (req, res) => {
    const adv = salaryAdvances.find(a => a.id === req.body.id);
    if (!adv) return res.status(404).json({ error: 'Không tìm thấy đơn ứng lương.' });
    const decision = req.body.decision; // DUYỆT | TỪ CHỐI
    const note = (req.body.note || '').trim();
    const actor = req.officer;
    const time = new Date().toLocaleString('vi-VN');

    if (adv.status === 'CHỜ LÃNH ĐẠO ĐƠN VỊ') {
        if (!canManageUnitPayroll(actor) || (actor.role !== 'ADMIN' && actor.agency !== adv.agency)) {
            return res.status(403).json({ error: 'Chỉ lãnh đạo đúng đơn vị mới duyệt bước này.' });
        }
        if (decision !== 'DUYỆT') {
            adv.status = 'TỪ CHỐI';
            adv.workflow.push({ step: 'LÃNH ĐẠO ĐƠN VỊ TỪ CHỐI', by: actor.displayName, time, note: note || 'Không đồng ý ứng trước kỳ.' });
            broadcastUpdate();
            return res.json({ success: true, status: adv.status });
        }
        adv.status = 'CHỜ NGÂN HÀNG';
        adv.signatures.unitLeader = { name: actor.displayName, title: actor.role, agency: actor.agency, signedAt: time };
        adv.workflow.push({ step: 'LÃNH ĐẠO ĐƠN VỊ KÝ DUYỆT', by: actor.displayName, time, note: note || 'Đồng ý đề nghị ứng lương.' });
    } else if (adv.status === 'CHỜ NGÂN HÀNG') {
        const bank = verifyBankStaff(req.body.actorUsername, req.body.actorPassword) || (actor.agency === 'NGÂN HÀNG' || actor.role === 'ADMIN' ? actor : null);
        if (!bank || (bank.role !== 'LÃNH ĐẠO' && bank.role !== 'ADMIN')) {
            return res.status(403).json({ error: 'Chỉ lãnh đạo ngân hàng / ADMIN kiểm tra bước này.' });
        }
        if (decision !== 'DUYỆT') {
            adv.status = 'BỊ BÁC';
            adv.workflow.push({ step: 'NGÂN HÀNG BÁC ĐƠN', by: bank.displayName, time, note: note || 'Thủ tục / hạn mức chưa đạt.' });
            broadcastUpdate();
            return res.json({ success: true, status: adv.status });
        }
        adv.status = 'CHỜ ADMIN';
        adv.signatures.bankLeader = { name: bank.displayName, title: bank.role, agency: bank.agency, signedAt: time };
        adv.workflow.push({ step: 'NGÂN HÀNG KIỂM TRA & KÝ', by: bank.displayName, time, note: note || 'Đủ điều kiện chi ứng.' });
    } else if (adv.status === 'CHỜ ADMIN') {
        if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN phê chuẩn chi ứng lương.' });
        if (decision !== 'DUYỆT') {
            adv.status = 'TỪ CHỐI';
            adv.workflow.push({ step: 'ADMIN TỪ CHỐI', by: actor.displayName, time, note });
            broadcastUpdate();
            return res.json({ success: true, status: adv.status });
        }
        const acc = bankAccounts[adv.username];
        if (!acc) return res.status(400).json({ error: 'Cán bộ chưa có tài khoản ngân hàng.' });
        acc.balance += adv.amount;
        getPayAdj(adv.username).advanceDebt += adv.amount;
        const txId = `UNG-${Date.now().toString().slice(-8)}`;
        logBankTx({
            id: txId, accountNumber: acc.accountNumber, type: 'ỨNG LƯƠNG TRƯỚC KỲ', amount: adv.amount,
            counterpart: 'KHO BẠC NHÀ NƯỚC', note: `Đơn ${adv.id}: ${adv.reason}`, time, status: 'THÀNH CÔNG', handledBy: actor.displayName,
            advanceSlip: { batchId: adv.id, amount: adv.amount, reason: adv.reason, period: adv.period, form: adv.form }
        });
        bankAccounts['__treasury__'].balance = Math.max(0, (bankAccounts['__treasury__'].balance || 0) - adv.amount);
        adv.status = 'ĐÃ CHI'; adv.paidAt = time; adv.txId = txId;
        adv.signatures.admin = { name: actor.displayName, title: actor.role, agency: actor.agency, signedAt: time };
        adv.workflow.push({ step: 'ADMIN PHÊ CHUẨN CHI ỨNG', by: actor.displayName, time, note: note || 'Đã chi vào tài khoản — sẽ trừ vào kỳ lương.' });
        addLog(`ADMIN chi ứng lương [${adv.id}] ${adv.amount.toLocaleString('vi-VN')} VND cho ${adv.displayName}.`);
    } else {
        return res.status(409).json({ error: 'Đơn ứng lương không ở trạng thái chờ duyệt phù hợp.' });
    }
    broadcastUpdate();
    res.json({ success: true, status: adv.status });
}));

// ===== BIÊN BẢN KHEN / PHẠT CÁN BỘ ĐƠN VỊ =====
app.post('/api/officer/memo/submit', requireAuth(), safeRoute(async (req, res) => {
    if (!canManageUnitPayroll(req.officer) && req.officer.role !== 'THANH TRA') {
        return res.status(403).json({ error: 'Chỉ lãnh đạo đơn vị / Thanh Tra / ADMIN lập biên bản khen-phạt.' });
    }
    const type = req.body.type === 'KHEN' ? 'KHEN' : 'PHẠT';
    const targetUsername = (req.body.targetUsername || '').trim();
    const target = systemState.authorizedPersonnel[targetUsername];
    if (!target || target.role === 'ADMIN') return res.status(404).json({ error: 'Không tìm thấy cán bộ đích.' });
    if (req.officer.role !== 'ADMIN' && req.officer.role !== 'THANH TRA' && target.agency !== req.officer.agency) {
        return res.status(403).json({ error: 'Chỉ lập biên bản cho cán bộ thuộc đơn vị mình.' });
    }
    const amount = Math.max(0, parseInt(req.body.amount, 10) || 0);
    const reason = (req.body.reason || '').trim();
    const payoutMode = req.body.payoutMode === 'TAI_KHOAN' ? 'TAI_KHOAN' : 'LUONG';
    if (!reason) return res.status(400).json({ error: 'Vui lòng ghi nội dung / căn cứ biên bản.' });
    if (amount <= 0) return res.status(400).json({ error: 'Số tiền thưởng/phạt phải lớn hơn 0.' });
    const id = `BB-${Math.floor(1000 + Math.random() * 9000)}`;
    const time = new Date().toLocaleString('vi-VN');
    const form = {
        title: type === 'KHEN' ? 'BIỂU MẪU BIÊN BẢN KHEN THƯỞNG CÁN BỘ' : 'BIỂU MẪU BIÊN BẢN VI PHẠM / KỶ LUẬT CÁN BỘ',
        type, target: target.displayName, targetRole: target.role, agency: target.agency,
        amount, reason, payoutMode, submittedBy: req.officer.displayName, time
    };
    officerMemos.unshift({
        id, type, targetUsername, targetDisplayName: target.displayName, agency: target.agency,
        amount, reason, payoutMode, form, status: 'CHỜ NGÂN HÀNG',
        submittedBy: req.officer.displayName, submittedByUsername: req.officer.username, time,
        workflow: [{ step: 'LÃNH ĐẠO LẬP BIÊN BẢN', by: req.officer.displayName, time, note: reason }],
        signatures: { unitLeader: { name: req.officer.displayName, title: req.officer.role, agency: req.officer.agency, signedAt: time }, bankLeader: null, admin: null },
        seals: { unit: getAgencySeal(target.agency), bank: getAgencySeal('NGÂN HÀNG'), admin: getAgencySeal('KHO BẠC / ADMIN') }
    });
    addLog(`${req.officer.displayName} lập biên bản ${type} [${id}] cho ${target.displayName}: ${amount.toLocaleString('vi-VN')} VND (${payoutMode}).`);
    broadcastUpdate();
    res.json({ success: true, id, form });
}));

app.post('/api/officer/memo/decide', requireAuth(), safeRoute(async (req, res) => {
    const memo = officerMemos.find(m => m.id === req.body.id);
    if (!memo) return res.status(404).json({ error: 'Không tìm thấy biên bản.' });
    const decision = req.body.decision;
    const note = (req.body.note || '').trim();
    const actor = req.officer;
    const time = new Date().toLocaleString('vi-VN');

    if (memo.status === 'CHỜ NGÂN HÀNG') {
        if (!(actor.agency === 'NGÂN HÀNG' && actor.role === 'LÃNH ĐẠO') && actor.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Chỉ lãnh đạo ngân hàng / ADMIN kiểm tra biên bản tiền tệ.' });
        }
        if (decision !== 'DUYỆT') {
            memo.status = 'BỊ BÁC';
            memo.workflow.push({ step: 'NGÂN HÀNG BÁC BIÊN BẢN', by: actor.displayName, time, note });
            broadcastUpdate();
            return res.json({ success: true, status: memo.status });
        }
        memo.status = 'CHỜ ADMIN';
        memo.signatures.bankLeader = { name: actor.displayName, title: actor.role, agency: actor.agency, signedAt: time };
        memo.workflow.push({ step: 'NGÂN HÀNG XÁC NHẬN THỦ TỤC', by: actor.displayName, time, note: note || 'Hợp lệ để trình ADMIN.' });
    } else if (memo.status === 'CHỜ ADMIN') {
        if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN phê chuẩn biên bản khen/phạt.' });
        if (decision !== 'DUYỆT') {
            memo.status = 'TỪ CHỐI';
            memo.workflow.push({ step: 'ADMIN TỪ CHỐI', by: actor.displayName, time, note });
            broadcastUpdate();
            return res.json({ success: true, status: memo.status });
        }
        const adj = getPayAdj(memo.targetUsername);
        const acc = bankAccounts[memo.targetUsername];
        if (memo.type === 'KHEN') {
            if (memo.payoutMode === 'TAI_KHOAN') {
                if (!acc) return res.status(400).json({ error: 'Cán bộ chưa có tài khoản — chọn chế độ cộng vào lương kỳ sau.' });
                acc.balance += memo.amount;
                logBankTx({
                    id: `KHEN-${Date.now().toString().slice(-8)}`, accountNumber: acc.accountNumber,
                    type: 'KHEN THƯỞNG CÁN BỘ', amount: memo.amount, counterpart: 'KHO BẠC NHÀ NƯỚC',
                    note: `Biên bản ${memo.id}: ${memo.reason}`, time, status: 'THÀNH CÔNG', handledBy: actor.displayName,
                    memoSlip: { id: memo.id, type: memo.type, amount: memo.amount, reason: memo.reason }
                });
                bankAccounts['__treasury__'].balance = Math.max(0, (bankAccounts['__treasury__'].balance || 0) - memo.amount);
            } else {
                adj.bonusCredit += memo.amount;
            }
        } else {
            if (memo.payoutMode === 'TAI_KHOAN') {
                if (!acc) return res.status(400).json({ error: 'Cán bộ chưa có tài khoản — chọn trừ vào lương kỳ sau.' });
                const charge = Math.min(acc.balance, memo.amount);
                acc.balance -= charge;
                if (memo.amount > charge) adj.penaltyDebt += (memo.amount - charge);
                logBankTx({
                    id: `PHAT-${Date.now().toString().slice(-8)}`, accountNumber: acc.accountNumber,
                    type: 'PHẠT / KỶ LUẬT CÁN BỘ', amount: -charge, counterpart: 'KHO BẠC NHÀ NƯỚC',
                    note: `Biên bản ${memo.id}: ${memo.reason}`, time, status: 'THÀNH CÔNG', handledBy: actor.displayName,
                    memoSlip: { id: memo.id, type: memo.type, amount: memo.amount, reason: memo.reason }
                });
                bankAccounts['__treasury__'].balance = (bankAccounts['__treasury__'].balance || 0) + charge;
            } else {
                adj.penaltyDebt += memo.amount;
            }
            // Ghi nhận đánh giá tiêu cực nhẹ cho RP
            const t = systemState.authorizedPersonnel[memo.targetUsername];
            if (t) t.negativeRatings = (t.negativeRatings || 0) + 1;
        }
        memo.status = 'ĐÃ ÁP DỤNG'; memo.appliedAt = time;
        memo.signatures.admin = { name: actor.displayName, title: actor.role, agency: actor.agency, signedAt: time };
        memo.workflow.push({ step: 'ADMIN PHÊ CHUẨN ÁP DỤNG', by: actor.displayName, time, note: note || `Đã áp dụng (${memo.payoutMode}).` });
        addLog(`ADMIN áp dụng biên bản ${memo.type} [${memo.id}] cho ${memo.targetDisplayName}.`);
    } else {
        return res.status(409).json({ error: 'Biên bản không ở bước chờ duyệt phù hợp.' });
    }
    broadcastUpdate();
    res.json({ success: true, status: memo.status });
}));

app.post('/api/resident/register', requireAuth(), safeRoute(async (req, res) => {
    const { username, name, dob, gender, pob, job, avatarUrl, licenses, status } = req.body;
    if (!username || !name) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tài khoản và họ tên công dân.' });
    if (!activeShifts.has(req.officer.username) && req.officer.role !== 'ADMIN') {
        return res.status(409).json({ error: 'Bạn chưa điểm danh vào ca. Hãy vào ca trước khi nhập liệu cư dân để hệ thống ghi nhận công và lương tự động.' });
    }
    const existing = citizenIdentityRegistry[username] || {};
    citizenIdentityRegistry[username] = { name, dob, gender, pob, job, avatarUrl: avatarUrl || existing.avatarUrl || '', licenses: licenses ? licenses.split(',').map(l => l.trim()) : (existing.licenses || []), status };
    bumpShiftStat(req.officer.username, 'registrations');
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
    // v14.0: Nạp tiền KHÔNG tự động — chuyển sang luồng yêu cầu chờ Ngân Hàng phê duyệt
    return res.status(400).json({ error: 'Nạp tiền phải qua biểu mẫu yêu cầu và chờ Ngân Hàng phê duyệt. Vui lòng dùng chức năng "Gửi Yêu Cầu Nạp Tiền".' });
}));

// [CÔNG DÂN] Gửi biểu mẫu yêu cầu nạp tiền — chờ Ngân Hàng phê duyệt
app.post('/api/bank/deposit-request', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Phiên đăng nhập ngân hàng không hợp lệ.' });
    if (acc.frozen) return res.status(423).json({ error: 'Tài khoản đang bị tạm khoá, vui lòng liên hệ Ngân Hàng.' });
    const amount = parseInt(req.body.amount, 10);
    const method = (req.body.method || 'CHUYỂN KHOẢN NGÂN HÀNG').trim();
    const reference = (req.body.reference || '').trim();
    const note = (req.body.note || '').trim();
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Số tiền nộp không hợp lệ.' });
    if (!reference) return res.status(400).json({ error: 'Vui lòng nhập mã tham chiếu/mã giao dịch ngân hàng để đối soát.' });
    if (depositRequests.find(r => r.accountNumber === acc.accountNumber && r.status === 'CHỜ DUYỆT')) {
        return res.status(409).json({ error: 'Bạn đã có một yêu cầu nạp tiền đang chờ duyệt.' });
    }
    const id = `NT-${Math.floor(1000 + Math.random() * 9000)}`;
    depositRequests.unshift({ id, accountNumber: acc.accountNumber, username: acc.username, amount, method, reference, note, status: 'CHỜ DUYỆT', time: new Date().toLocaleString('vi-VN') });
    addLog(`Công dân @${acc.username} gửi yêu cầu nạp tiền [${id}]: ${amount.toLocaleString('vi-VN')} VND — mã GD: ${reference}.`);
    res.json({ success: true, id });
}));

// [CÔNG DÂN] Tra cứu yêu cầu nạp tiền
app.post('/api/bank/deposit-status', safeRoute(async (req, res) => {
    const acc = verifyBankAccount(req.body.accountNumber, req.body.pin);
    if (!acc) return res.status(401).json({ error: 'Phiên đăng nhập ngân hàng không hợp lệ.' });
    const myReqs = depositRequests.filter(r => r.accountNumber === acc.accountNumber).slice(0, 20);
    res.json({ success: true, requests: myReqs });
}));

// [NHÂN VIÊN NGÂN HÀNG] Phê duyệt/từ chối yêu cầu nạp tiền
app.post('/api/bank/deposit-decide', safeRoute(async (req, res) => {
    const staff = verifyBankStaff(req.body.actorUsername, req.body.actorPassword);
    if (!staff) return res.status(403).json({ error: 'Chỉ Nhân Viên/Lãnh Đạo Ngân Hàng hoặc ADMIN mới có quyền duyệt nạp tiền.' });
    const reqEntry = depositRequests.find(r => r.id === req.body.id);
    if (!reqEntry) return res.status(404).json({ error: 'Không tìm thấy yêu cầu nạp tiền.' });
    if (reqEntry.status !== 'CHỜ DUYỆT') return res.status(409).json({ error: 'Yêu cầu này đã được xử lý.' });
    const decision = req.body.decision;
    if (decision === 'DUYỆT') {
        const acc = findAccountByNumber(reqEntry.accountNumber);
        if (!acc) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
        acc.balance += reqEntry.amount;
        const txId = `GD-${Date.now().toString().slice(-8)}`;
        logBankTx({ id: txId, accountNumber: acc.accountNumber, type: 'NẠP TIỀN (ĐÃ DUYỆT)', amount: reqEntry.amount, counterpart: reqEntry.method, note: `Mã GD: ${reqEntry.reference}${reqEntry.note ? ' — ' + reqEntry.note : ''}`, time: new Date().toLocaleString('vi-VN'), status: 'THÀNH CÔNG', handledBy: staff.displayName });
        reqEntry.status = 'ĐÃ DUYỆT'; reqEntry.txId = txId;
        addLog(`${staff.displayName} DUYỆT nạp tiền [${reqEntry.id}] +${reqEntry.amount.toLocaleString('vi-VN')} VND cho @${reqEntry.username}.`);
    } else {
        reqEntry.status = 'TỪ CHỐI';
        addLog(`${staff.displayName} TỪ CHỐI yêu cầu nạp tiền [${reqEntry.id}] của @${reqEntry.username}.`);
    }
    reqEntry.decidedBy = staff.displayName;
    res.json({ success: true });
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
    res.json({
        success: true, accounts, transactions: bankTransactions.slice(0, 300), loans: loanRequests,
        accountRequests: bankAccountRequests, depositRequests: depositRequests.slice(0, 100),
        payrollBatches: payrollBatches.slice(0, 20), welfareBatches: welfareBatches.slice(0, 20),
        advances: getVisibleAdvances(staff), memos: getVisibleMemos(staff),
        treasuryBalance: bankAccounts['__treasury__'].balance, interestRate: SAVINGS_INTEREST_RATE, payrollPeriod: currentMonthKey()
    });
}));

// [LÃNH ĐẠO ĐƠN VỊ / NGÂN HÀNG] Xem bảng lương tự động đồng bộ ca trực (kể cả ca đang mở)
app.post('/api/bank/payroll/preview', safeRoute(async (req, res) => {
    const actor = verifyOfficer(req.body.actorUsername, req.body.actorPassword);
    if (!actor) return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ.' });
    const isBankLead = actor.role === 'ADMIN' || (actor.agency === 'NGÂN HÀNG' && actor.role === 'LÃNH ĐẠO');
    const isUnitLead = canManageUnitPayroll(actor);
    if (!isBankLead && !isUnitLead) {
        return res.status(403).json({ error: 'Chỉ Lãnh Đạo đơn vị, Lãnh Đạo Ngân Hàng hoặc ADMIN mới xem bảng lương.' });
    }
    const period = req.body.period || currentMonthKey();
    const agency = isUnitLead && actor.role !== 'ADMIN' ? actor.agency : (req.body.agency || null);
    const items = buildPayrollItems(period, agency, { includeZero: true });
    const roster = agency ? getUnitRoster(agency) : [];
    const recentClosed = shiftHistory
        .filter(s => (!agency || s.agency === agency) && dateInPeriod(s.date, period))
        .slice(0, 40)
        .map(s => ({
            id: s.id, username: s.username, displayName: s.displayName, agency: s.agency,
            hours: s.hours, appsProcessed: s.appsProcessed, registrations: s.registrations,
            lateMinutes: s.lateMinutes || 0,
            date: normalizeDateKey(s.date), reason: s.reason,
            pay: computeShiftPay({ ...s, forceMinBill: true }, systemState.authorizedPersonnel[s.username])
        }));
    const unitSchedules = agency
        ? shiftSchedules.filter(s => s.agency === agency).slice(0, 50)
        : [];
    res.json({
        success: true,
        items,
        period,
        agency: agency || 'TOÀN QUỐC',
        seal: getAgencySeal(agency || actor.agency),
        autoSync: true,
        formula: 'Chỉ ca đã kết thúc: LCB(giờ/8) + phụ cấp giờ + thưởng HS/NL − phạt trễ lịch − VP/phạt biên bản − nợ ứng + khen. Vào ca = điểm danh.',
        latePenaltyPerMinute: LATE_PENALTY_PER_MINUTE,
        onShiftCount: items.filter(i => i.onShift).length,
        withPayCount: items.filter(i => i.hours > 0 || i.workDays > 0 || i.recordedNet > 0).length,
        closedShifts: items.reduce((s, i) => s + (i.closedShifts || 0), 0),
        recentClosedShifts: recentClosed,
        schedules: unitSchedules,
        roster: agency ? roster : undefined
    });
}));

// [LÃNH ĐẠO ĐƠN VỊ] Ký đề nghị chi lương — số tiền lấy TỰ ĐỘNG từ hệ thống (không nhập tay)
app.post('/api/bank/payroll/submit', safeRoute(async (req, res) => {
    const actor = verifyOfficer(req.body.actorUsername, req.body.actorPassword);
    if (!actor) return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ.' });
    if (!canManageUnitPayroll(actor)) {
        return res.status(403).json({ error: 'Chỉ Lãnh Đạo đơn vị hoặc ADMIN mới lập đề nghị chi lương.' });
    }
    const agency = actor.role === 'ADMIN' ? (req.body.agency || null) : actor.agency;
    if (!agency) return res.status(400).json({ error: 'Thiếu thông tin đơn vị lập bảng lương.' });
    const pending = payrollBatches.find(b => b.agency === agency && !['ĐÃ CHI TRẢ', 'TỪ CHỐI', 'BỊ BÁC BỎ'].includes(b.status));
    if (pending) return res.status(409).json({ error: `Đơn vị ${agency} đang có bảng lương [${pending.id}] chưa hoàn tất.` });
    const period = req.body.period || currentMonthKey();
    // Chỉ ca đã kết thúc (sổ lương). Ca đang mở chưa ghi sổ — không đưa vào đề nghị chi.
    const items = buildPayrollItems(period, agency, { includeZero: false })
        .filter(item => item.hours > 0 || item.workDays > 0 || item.recordedNet > 0 || item.advanceDebt > 0 || item.bonusCredit > 0)
        .map(item => ({
            ...item,
            proposedNet: item.finalNet,
            unitLeaderAdjusted: false,
            unitLeaderNote: req.body.note || '',
            autoCalculated: true
        }));
    if (!items.length) return res.status(400).json({ error: `Đơn vị ${agency} chưa có ca nào đã kết thúc trong kỳ ${period}. Cán bộ cần kết thúc ca để hệ thống ghi sổ lương trước khi lãnh đạo ký đề nghị.` });
    const onShiftNames = buildPayrollItems(period, agency, { includeZero: true }).filter(i => i.onShift).map(i => i.displayName);
    const id = `BL-${Math.floor(1000 + Math.random() * 9000)}`;
    const unitSeal = getAgencySeal(agency);
    const time = new Date().toLocaleString('vi-VN');
    const noteParts = [req.body.note || 'Đã rà soát sổ công từ các ca đã kết thúc.'];
    if (onShiftNames.length) noteParts.push(`Lưu ý: ${onShiftNames.length} cán bộ đang trực (chưa kết ca, chưa ghi sổ lần này): ${onShiftNames.join(', ')}.`);
    payrollBatches.unshift({
        id, period, agency, items, status: 'CHỜ NGÂN HÀNG KIỂM TRA',
        workflow: [{ step: 'LÃNH ĐẠO ĐƠN VỊ KÝ ĐỀ NGHỊ CHI LƯƠNG (THEO SỔ CA ĐÃ KẾT THÚC)', by: actor.displayName, time, note: noteParts.join(' ') }],
        submittedBy: actor.displayName, time,
        totalNet: items.reduce((s, i) => s + (i.proposedNet ?? i.finalNet), 0),
        autoCalculated: true,
        includesLiveShifts: false,
        signatures: {
            unitLeader: { name: actor.displayName, title: actor.role, agency, signedAt: time },
            bankLeader: null,
            admin: null
        },
        seals: { unit: unitSeal, bank: getAgencySeal('NGÂN HÀNG'), admin: getAgencySeal('KHO BẠC / ADMIN') },
        proposalForm: { title: `Đề nghị chi lương theo sổ ca đã kết thúc — ${agency}`, note: noteParts.join(' '), period }
    });
    addLog(`${actor.displayName} ký đề nghị chi lương [${id}] đơn vị [${agency}] kỳ ${period} — ${items.length} cán bộ (chỉ ca đã ghi sổ), tổng ${items.reduce((s, i) => s + i.finalNet, 0).toLocaleString('vi-VN')} VND.`);
    broadcastUpdate();
    res.json({ success: true, id, agency, count: items.length, includesLiveShifts: false });
}));

// Ngân Hàng kiểm tra hồ sơ chi lương của từng đơn vị trước khi trình ADMIN
app.post('/api/bank/payroll/approve-step', safeRoute(async (req, res) => {
    const actor = verifyOfficer(req.body.actorUsername, req.body.actorPassword);
    if (!actor) return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ.' });
    const batch = payrollBatches.find(b => b.id === req.body.id);
    if (!batch) return res.status(404).json({ error: 'Không tìm thấy bảng lương.' });
    const note = req.body.note || '';
    const decision = req.body.decision || 'DUYỆT';
    if (batch.status === 'CHỜ NGÂN HÀNG KIỂM TRA') {
        const bankLead = verifyBankStaff(req.body.actorUsername, req.body.actorPassword);
        if (!bankLead || (bankLead.role !== 'LÃNH ĐẠO' && bankLead.role !== 'ADMIN')) {
            return res.status(403).json({ error: 'Chỉ Lãnh Đạo Ngân Hàng mới kiểm tra và ký duyệt bước ngân hàng.' });
        }
        if (decision === 'BÁC BỎ') {
            batch.status = 'BỊ BÁC BỎ';
            batch.workflow.push({ step: 'LÃNH ĐẠO NGÂN HÀNG BÁC BỎ', by: bankLead.displayName, time: new Date().toLocaleString('vi-VN'), note: note || 'Hồ sơ chưa đủ thủ tục chi lương.' });
            addLog(`${bankLead.displayName} bác bỏ bảng lương [${batch.id}] của đơn vị [${batch.agency}].`);
            broadcastUpdate();
            return res.json({ success: true, status: batch.status });
        }
        batch.status = 'CHỜ ADMIN PHÊ DUYỆT';
        const signedAt = new Date().toLocaleString('vi-VN');
        batch.workflow.push({ step: 'LÃNH ĐẠO NGÂN HÀNG KIỂM TRA & KÝ DUYỆT', by: bankLead.displayName, time: signedAt, note: note || 'Đã kiểm tra thủ tục chi lương và tổng hợp hợp lệ.' });
        batch.signatures.bankLeader = { name: bankLead.displayName, title: bankLead.role, agency: bankLead.agency, signedAt };
        addLog(`${bankLead.displayName} ký duyệt ngân hàng bảng lương [${batch.id}] của đơn vị [${batch.agency}] → trình ADMIN.`);
    } else {
        return res.status(409).json({ error: 'Bảng lương không ở bước phê duyệt phù hợp.' });
    }
    broadcastUpdate();
    res.json({ success: true, status: batch.status });
}));

// [ADMIN] Phê duyệt/từ chối chi lương — có thể điều chỉnh số tiền từng cán bộ
app.post('/api/bank/payroll/decide', safeRoute(async (req, res) => {
    const actor = verifyOfficer(req.body.actorUsername, req.body.actorPassword);
    if (!actor || actor.role !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN mới phê duyệt chi lương cuối cùng.' });
    const batch = payrollBatches.find(b => b.id === req.body.id);
    if (!batch) return res.status(404).json({ error: 'Không tìm thấy bảng lương.' });
    if (batch.status !== 'CHỜ ADMIN PHÊ DUYỆT') return res.status(409).json({ error: 'Bảng lương chưa tới bước ADMIN hoặc đã xử lý.' });
    const decision = req.body.decision;
    const adjustments = req.body.adjustments || {}; // { username: finalNet }
    if (decision === 'DUYỆT') {
        batch.items.forEach(item => {
            if (adjustments[item.username] !== undefined) {
                item.adjustedNet = Math.max(0, parseInt(adjustments[item.username], 10) || 0);
                item.adminNote = req.body.adminNote || 'ADMIN điều chỉnh';
            } else {
                item.adjustedNet = item.proposedNet ?? item.finalNet;
            }
        });
        batch.totalNet = batch.items.reduce((s, i) => s + (i.adjustedNet ?? i.proposedNet ?? i.finalNet), 0);
        batch.status = 'ĐÃ CHI TRẢ'; batch.approvedBy = actor.displayName; batch.paidAt = new Date().toLocaleString('vi-VN');
        batch.workflow.push({ step: 'ADMIN PHÊ DUYỆT CHI TRẢ', by: actor.displayName, time: batch.paidAt, note: req.body.adminNote || '' });
        batch.signatures.admin = { name: actor.displayName, title: actor.role, agency: actor.agency, signedAt: batch.paidAt };
        batch.items.forEach(item => {
            const payAmount = item.adjustedNet ?? item.proposedNet ?? item.finalNet;
            const acc = bankAccounts[item.username];
            if (acc && payAmount > 0) {
                acc.balance += payAmount;
                const txId = `LUONG-${Date.now().toString().slice(-6)}-${item.username.slice(0, 3)}`;
                logBankTx({
                    id: txId, accountNumber: acc.accountNumber, type: 'CHI TRẢ LƯƠNG & PHÚC LỢI', amount: payAmount,
                    counterpart: 'KHO BẠC NHÀ NƯỚC',
                    note: `Kỳ ${batch.period} | LCB: ${item.basePay.toLocaleString('vi-VN')} + Giờ: ${item.hourPay.toLocaleString('vi-VN')} + HS: ${item.appPay.toLocaleString('vi-VN')} + NL: ${item.regPay.toLocaleString('vi-VN')} + Khen: ${(item.bonusCredit || 0).toLocaleString('vi-VN')} − VP/phạt: ${item.violationDeduction.toLocaleString('vi-VN')} − Ứng: ${(item.advanceDebt || 0).toLocaleString('vi-VN')}`,
                    time: batch.paidAt, status: 'THÀNH CÔNG', handledBy: actor.displayName,
                    payslip: {
                        period: batch.period, basePay: item.basePay, hourPay: item.hourPay,
                        attendancePay: 0, appPay: item.appPay, regPay: item.regPay,
                        bonusCredit: item.bonusCredit || 0, advanceDebt: item.advanceDebt || 0,
                        violationDeduction: item.violationDeduction, workDays: item.workDays, hours: item.hours,
                        appsProcessed: item.appsProcessed, registrations: item.registrations, net: payAmount,
                        closedShifts: item.closedShifts || 0,
                        dailyBreakdown: item.dailyBreakdown, agency: batch.agency, approvedBy: actor.displayName
                    }
                });
                item.paid = true; item.txId = txId;
            } else { item.paid = false; item.note = acc ? 'Số tiền bằng 0' : 'Chưa có tài khoản ngân hàng'; }
            // Sau khi chi kỳ lương: xóa nợ ứng / thưởng / phạt đã áp vào phiếu này
            const adj = getPayAdj(item.username);
            adj.advanceDebt = 0;
            adj.bonusCredit = 0;
            adj.penaltyDebt = 0;
        });
        bankAccounts['__treasury__'].balance = Math.max(0, (bankAccounts['__treasury__'].balance || 0) - batch.totalNet);
        addLog(`ADMIN ${actor.displayName} PHÊ DUYỆT chi lương [${batch.id}] — ${batch.items.filter(i => i.paid).length} cán bộ.`);
    } else {
        batch.status = 'TỪ CHỐI'; batch.approvedBy = actor.displayName;
        batch.workflow.push({ step: 'ADMIN TỪ CHỐI', by: actor.displayName, time: new Date().toLocaleString('vi-VN'), note: req.body.adminNote || '' });
        addLog(`ADMIN ${actor.displayName} TỪ CHỐI bảng lương [${batch.id}].`);
    }
    broadcastUpdate();
    res.json({ success: true, batch });
}));

// =====================================================================
// v15.0: PHÚC LỢI CỘNG ĐỒNG — Ngân Hàng trình ADMIN phê duyệt
// =====================================================================
app.post('/api/bank/welfare/recipients', safeRoute(async (req, res) => {
    const staff = verifyBankStaff(req.body.actorUsername, req.body.actorPassword);
    if (!staff) return res.status(403).json({ error: 'Chỉ Ngân Hàng/ADMIN mới xem danh sách phúc lợi.' });
    const citizens = Object.keys(citizenIdentityRegistry).map(u => ({ username: u, displayName: citizenIdentityRegistry[u]?.name || u, type: 'CÔNG DÂN', hasAccount: !!bankAccounts[u] }));
    const officers = Object.values(systemState.authorizedPersonnel).filter(o => o.username !== 'admin').map(o => ({ username: o.username, displayName: o.displayName, type: 'CÁN BỘ', hasAccount: !!bankAccounts[o.username], agency: o.agency }));
    res.json({ success: true, citizens, officers });
}));

app.post('/api/bank/welfare/submit', safeRoute(async (req, res) => {
    const staff = verifyBankStaff(req.body.actorUsername, req.body.actorPassword);
    if (!staff || (staff.role !== 'LÃNH ĐẠO' && staff.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Chỉ Lãnh Đạo Ngân Hàng mới trình phúc lợi cộng đồng.' });
    }
    const { title, welfareType, recipients, note } = req.body;
    if (!title || !welfareType || !recipients || !recipients.length) {
        return res.status(400).json({ error: 'Vui lòng nhập tiêu đề, loại phúc lợi và danh sách người nhận.' });
    }
    const id = `PL-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsed = recipients.map(r => ({
        username: r.username, displayName: r.displayName || r.username,
        recipientType: r.recipientType || 'CÔNG DÂN', amount: parseInt(r.amount, 10) || 0, note: r.note || ''
    })).filter(r => r.amount > 0);
    if (!parsed.length) return res.status(400).json({ error: 'Không có khoản phúc lợi hợp lệ.' });
    welfareBatches.unshift({
        id, title, welfareType, recipients: parsed, note: note || '',
        status: 'CHỜ ADMIN PHÊ DUYỆT', submittedBy: staff.displayName,
        time: new Date().toLocaleString('vi-VN'), totalAmount: parsed.reduce((s, r) => s + r.amount, 0)
    });
    addLog(`${staff.displayName} trình phúc lợi cộng đồng [${id}] — ${welfareType}: ${parsed.length} người nhận.`);
    res.json({ success: true, id });
}));

app.post('/api/bank/welfare/decide', safeRoute(async (req, res) => {
    const actor = verifyOfficer(req.body.actorUsername, req.body.actorPassword);
    if (!actor || actor.role !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN phê duyệt phúc lợi cộng đồng.' });
    const batch = welfareBatches.find(w => w.id === req.body.id);
    if (!batch || batch.status !== 'CHỜ ADMIN PHÊ DUYỆT') return res.status(404).json({ error: 'Không tìm thấy đợt phúc lợi hoặc đã xử lý.' });
    if (req.body.decision === 'DUYỆT') {
        batch.status = 'ĐÃ CHI TRẢ'; batch.approvedBy = actor.displayName; batch.paidAt = new Date().toLocaleString('vi-VN');
        batch.recipients.forEach(r => {
            const acc = bankAccounts[r.username];
            if (acc && r.amount > 0) {
                acc.balance += r.amount;
                const txId = `PL-${Date.now().toString().slice(-6)}-${r.username.slice(0, 3)}`;
                logBankTx({
                    id: txId, accountNumber: acc.accountNumber, type: `PHÚC LỢI: ${batch.welfareType}`, amount: r.amount,
                    counterpart: 'QUỸ PHÚC LỢI XÃ HỘI', note: `${batch.title} — ${r.note || batch.note}`, time: batch.paidAt,
                    status: 'THÀNH CÔNG', handledBy: actor.displayName,
                    welfareSlip: { batchId: batch.id, title: batch.title, welfareType: batch.welfareType, recipientType: r.recipientType, amount: r.amount, note: r.note }
                });
                r.paid = true; r.txId = txId;
            } else { r.paid = false; r.failReason = acc ? 'Số tiền không hợp lệ' : 'Chưa có tài khoản ngân hàng'; }
        });
        bankAccounts['__treasury__'].balance = Math.max(0, (bankAccounts['__treasury__'].balance || 0) - batch.totalAmount);
        addLog(`ADMIN ${actor.displayName} chi trả phúc lợi [${batch.id}] — ${batch.recipients.filter(r => r.paid).length}/${batch.recipients.length} người.`);
    } else {
        batch.status = 'TỪ CHỐI'; batch.approvedBy = actor.displayName;
        addLog(`ADMIN ${actor.displayName} từ chối phúc lợi [${batch.id}].`);
    }
    res.json({ success: true, batch });
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
        startOfficerShift(user);
        broadcastRoster();
        if (isNewJoin) io.emit('officerJoined', { displayName: user.displayName, role: user.role, agency: user.agency });
    });

    socket.on('typing', (payload) => {
        if (payload && payload.fileId) socket.broadcast.emit('typingIndicator', payload);
    });

    socket.on('logout', () => {
        const info = onlineOfficers.get(socket.id);
        if (info) {
            endOfficerShift(info.username, 'Đăng xuất hệ thống');
            broadcastUpdate();
        }
        if (onlineOfficers.has(socket.id)) {
            onlineOfficers.delete(socket.id);
            broadcastRoster();
        }
    });

    socket.on('disconnect', () => {
        liveVisitorCount = Math.max(0, liveVisitorCount - 1);
        broadcastVisitorCount();
        const info = onlineOfficers.get(socket.id);
        if (info) {
            endOfficerShift(info.username, 'Ngắt kết nối / đóng trang');
            broadcastUpdate();
        }
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
    console.log(`[REALTIME CENTRAL V15.0] RUNNING PERFECTLY ON PORT ${PORT}`);
    console.log(`[LƯƠNG v16] Phiếu lương cán bộ + tab giám sát chia hạng mục + ngân hàng nhập vai + dấu/chữ ký nâng cấp: SẴN SÀNG.`);
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
