/**
 * =====================================================================
 *  TUỆ ĐỨC AI ENGINE v6.0 — LÕI XỬ LÝ NGÔN NGỮ & TRUY XUẤT DỮ LIỆU
 * =====================================================================
 * Module độc lập, KHÔNG phụ thuộc trực tiếp vào server.js.
 * server.js chỉ cần gọi: aiEngine.reply(message, dataSnapshot)
 *
 * Gồm 2 tầng xử lý:
 *   Tầng 1 (luôn chạy, tức thì, offline, miễn phí):
 *      - Chuẩn hoá tiếng Việt không dấu để so khớp mờ (fuzzy match)
 *      - Bộ nhận diện ý định (intent) theo từ khoá/regex, ưu tiên cao -> thấp
 *      - Truy vấn trực tiếp systemState / registry / violations
 *   Tầng 2 (tuỳ chọn, chỉ kích hoạt khi có biến môi trường ANTHROPIC_API_KEY):
 *      - Nếu Tầng 1 không chắc chắn tìm được câu trả lời phù hợp,
 *        chuyển ngữ cảnh (đã được rút gọn, ẩn mật khẩu) sang Claude API
 *        để sinh câu trả lời tự nhiên hơn.
 *      - Nếu không có API key, hệ thống vẫn hoạt động 100% ổn định bằng Tầng 1.
 * =====================================================================
 */

const https = require('https');

// ---------------------------------------------------------------------
// TIỆN ÍCH CHUẨN HÓA TIẾNG VIỆT (BỎ DẤU) ĐỂ SO KHỚP MỜ KHÔNG PHÂN BIỆT DẤU
// ---------------------------------------------------------------------
function stripDiacritics(str) {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, (m) => (m === 'Đ' ? 'D' : 'd'))
        .toUpperCase()
        .trim();
}

function includesFuzzy(haystack, needle) {
    return stripDiacritics(haystack).includes(stripDiacritics(needle));
}

// ---------------------------------------------------------------------
// CÁC BỘ TỪ KHOÁ Ý ĐỊNH (INTENT KEYWORDS)
// ---------------------------------------------------------------------
const INTENT_KEYWORDS = {
    GREETING: ['XIN CHAO', 'CHAO BAN', 'HELLO', 'HI ', 'ALO', 'CHAO TUE DUC'],
    HELP: ['GIUP', 'HUONG DAN', 'LAM GI DUOC', 'CHUC NANG', 'BAN CO THE'],
    SECURITY: ['AN NINH', 'TINH TRANG AN NINH', 'CANH BAO', 'BAO DONG'],
    STATS: ['THONG KE', 'BAO NHIEU HO SO', 'SO LUONG HO SO', 'TONG QUAN HE THONG', 'BAO NHIEU CAN BO'],
    WANTED: ['TRUY NA', 'DANH SACH TRUY NA', 'TOI PHAM DANG TRON'],
    NEWS: ['TIN TUC MOI', 'THONG BAO MOI NHAT', 'SAC LENH MOI', 'QUYET DINH MOI'],
    PROCEDURE_CCCD: ['CAN CUOC', 'CCCD', 'THE CAN CUOC'],
    PROCEDURE_HOCHIEU: ['HO CHIEU', 'PASSPORT', 'VISA'],
    PROCEDURE_GPKD: ['GIAY PHEP KINH DOANH', 'DOANH NGHIEP'],
    PROCEDURE_BODAM: ['BO DAM', 'TAN SO'],
    PROCEDURE_CCHT: ['CONG CU HO TRO', 'VU KHI', 'GIAY PHEP SU DUNG'],
    PROCEDURE_YTE: ['SUC KHOE', 'BENH VIEN', 'GIAY XUAT VIEN', 'CHUNG CHI HANH NGHE Y'],
    PROCEDURE_GD: ['BANG TOT NGHIEP', 'HOC BA', 'CHUNG CHI GIANG DAY'],
    PROCEDURE_THUE: ['THUE', 'QUYET TOAN', 'HOA DON DIEN TU', 'KINH DOANH'],
    PROCEDURE_UBND: ['KHAI SINH', 'KET HON', 'XAY DUNG', 'TAM TRU', 'TAM VANG'],
    PHAN_QUYEN: ['PHAN QUYEN', 'CAP BAC', 'QUYEN HAN', 'AI DUOC PHEP'],
    REPORT_GUIDE: ['BAO CAO', 'CA TRUC'],
    ROSTER: ['CAN BO TRUC', 'AI DANG TRUC', 'DANG ONLINE', 'CAN BO ONLINE', 'BANG TRUC TUYEN'],
    LEADERBOARD: ['XEP HANG', 'BANG XEP HANG', 'TIN NHIEM CAN BO', 'CAN BO XUAT SAC'],
    SOS_INFO: ['GOI KHAN CAP', 'SOS', 'CAP CUU', '113', 'DIEU PHOI KHAN CAP'],
    THANKS: ['CAM ON', 'THANKS', 'TKS'],
};

// ---------------------------------------------------------------------
// BẢN ĐỒ LOẠI GIẤY TỜ CHI TIẾT (ĐỒNG BỘ VỚI AGENCY_DOC_TYPES PHÍA CLIENT)
// Cho phép bot nhận diện câu hỏi tự nhiên như "tôi muốn làm bằng lái xe"
// mà không cần khớp đúng từ khoá cố định.
// ---------------------------------------------------------------------
const DOC_TYPE_INDEX = [
    { keywords: ['CAN CUOC', 'CCCD'], agency: 'CÔNG AN', label: 'Căn Cước Công Dân Gắn Chíp' },
    { keywords: ['HO KHAU'], agency: 'CÔNG AN', label: 'Sổ Hộ Khẩu Điện Tử' },
    { keywords: ['BANG LAI XE', 'GIAY PHEP LAI XE'], agency: 'CÔNG AN', label: 'Bằng Lái Xe (qua Cổng Cấp Phôi)' },
    { keywords: ['BO DAM', 'TAN SO'], agency: 'CÔNG AN', label: 'Đăng Ký Tần Số Bộ Đàm Mã Hóa' },
    { keywords: ['NGHIA VU QUAN SU'], agency: 'QUÂN ĐỘI', label: 'Giấy Chứng Nhận Hoàn Thành NVQS' },
    { keywords: ['KHOI KIEN', 'TO TUNG'], agency: 'TOÀ ÁN', label: 'Đơn Khởi Kiện / Tố Tụng Dân Sự' },
    { keywords: ['TO CAO CAN BO', 'KHIEU NAI HANH CHINH'], agency: 'THANH TRA', label: 'Đơn Tố Cáo Cán Bộ / Khiếu Nại Hành Chính' },
    { keywords: ['HO CHIEU', 'VISA', 'PASSPORT'], agency: 'CHÍNH PHỦ', label: 'Hộ Chiếu Quốc Tế (Visa)' },
    { keywords: ['SUC KHOE', 'XUAT VIEN'], agency: 'Y TẾ', label: 'Giấy Chứng Nhận Sức Khỏe / Xuất Viện' },
    { keywords: ['BANG TOT NGHIEP', 'HOC BA'], agency: 'GIÁO DỤC', label: 'Văn Bằng Tốt Nghiệp / Học Bạ Điện Tử' },
    { keywords: ['QUYET TOAN THUE', 'HOA DON'], agency: 'TÀI CHÍNH', label: 'Tờ Khai Quyết Toán Thuế / Hoá Đơn Điện Tử' },
    { keywords: ['KHAI SINH'], agency: 'UBND', label: 'Giấy Khai Sinh' },
    { keywords: ['KET HON'], agency: 'UBND', label: 'Giấy Chứng Nhận Kết Hôn' },
    { keywords: ['XAY DUNG'], agency: 'UBND', label: 'Giấy Phép Xây Dựng' },
    { keywords: ['TAM TRU', 'TAM VANG'], agency: 'UBND', label: 'Xác Nhận Tạm Trú / Tạm Vắng' },
];
function findDocTypeMatch(normMsg) {
    return DOC_TYPE_INDEX.find(d => d.keywords.some(kw => normMsg.includes(kw)));
}

function detectIntent(normalizedMsg) {
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        if (keywords.some((kw) => normalizedMsg.includes(kw))) return intent;
    }
    return null;
}

// ---------------------------------------------------------------------
// TẦNG 1: BỘ NÃO QUY TẮC (RULE ENGINE) — CHẠY TRƯỚC TIÊN, TỨC THÌ
// ---------------------------------------------------------------------
function ruleEngineReply(rawMsg, data) {
    const { systemState, citizenIdentityRegistry, criminalRecordsRegistry } = data;
    const msg = rawMsg.toUpperCase();
    const normMsg = stripDiacritics(rawMsg);

    // 1) TRA MÃ HỒ SƠ HS-xxxx (kể cả trong kho lưu trữ)
    const appMatch = msg.match(/HS-\d+/);
    if (appMatch) {
        const appId = appMatch[0];
        const app = systemState.applications[appId] || systemState.archivedApplications[appId];
        if (app) {
            const archivedNote = systemState.archivedApplications[appId] ? ' (Hồ sơ đã niêm phong lưu kho)' : '';
            return `[Quét mã hồ sơ] ${appId} thuộc đơn vị [${app.agency}] — loại giấy tờ: ${app.docType}.${archivedNote} Trạng thái hiện tại: "${app.status}". Cán bộ thụ lý: ${app.handler}. Mức ưu tiên: ${app.priority || 'BÌNH THƯỜNG'}.`;
        }
        return `[Quét mã hồ sơ] Không tìm thấy hồ sơ mang mã ${appId} trên trục dữ liệu (có thể đã bị nhập sai mã hoặc chưa được khởi tạo).`;
    }

    // 2) TRA BIÊN BẢN VI PHẠM VP-xxx
    const vioMatch = msg.match(/VP-\d+/);
    if (vioMatch) {
        const vioId = vioMatch[0];
        for (const username in criminalRecordsRegistry) {
            const found = criminalRecordsRegistry[username].find((v) => v.id === vioId);
            if (found) {
                return `[Quét biên bản vi phạm] ${vioId} lập cho công dân @${username}: ${found.type} — ${found.lawClause}. Mức phạt: ${found.fine}. Trạng thái: ${found.status}. Cán bộ lập biên bản: ${found.officer}.`;
            }
        }
        return `[Quét biên bản vi phạm] Không tìm thấy biên bản mang mã ${vioId} trong cơ sở dữ liệu tư pháp.`;
    }

    // 3) TRA BÁO CÁO CA TRỰC RP-xxx
    const rptMatch = msg.match(/RP-\d+/);
    if (rptMatch) {
        const rptId = rptMatch[0];
        const rp = (systemState.shiftReports || []).find((r) => r.id === rptId);
        if (rp) {
            return `[Quét báo cáo ca trực] ${rptId} — cán bộ ${rp.officer} [${rp.agency}], ngày ${rp.date}. Tiến độ: ${rp.taskStatus}. Trạng thái phê duyệt: ${rp.status}.`;
        }
        return `[Quét báo cáo ca trực] Không tìm thấy báo cáo mang mã ${rptId}.`;
    }

    // 4) TRA CƯ DÂN THEO TÊN TÀI KHOẢN HOẶC HỌ TÊN (SO KHỚP MỜ, KHÔNG DẤU)
    for (const username in citizenIdentityRegistry) {
        const citizen = citizenIdentityRegistry[username];
        if (includesFuzzy(username, rawMsg) || includesFuzzy(citizen.name, rawMsg)) {
            const v = criminalRecordsRegistry[username] || [];
            const licenseTxt = citizen.licenses && citizen.licenses.length ? citizen.licenses.join(', ') : 'Chưa cấp phôi văn bằng nào';
            return `[Cơ sở dữ liệu cư dân] Công dân: ${citizen.name} (@${username}) | Sinh: ${citizen.dob} | Nguyên quán: ${citizen.pob} | Nghề nghiệp: ${citizen.job}. Lý lịch: ${citizen.status}. Vi phạm ghi nhận: ${v.length} lần. Văn bằng/giấy phép: ${licenseTxt}.`;
        }
    }

    // 5) NHẬN DIỆN Ý ĐỊNH THEO TỪ KHOÁ
    const intent = detectIntent(normMsg);
    switch (intent) {
        case 'GREETING':
            return `Xin chào công dân! Tôi là Tuệ Đức v6 - trợ lý số hóa liên thông quốc gia. Tôi có thể: (1) tra mã hồ sơ (VD: HS-1001), (2) tra biên bản vi phạm (VD: VP-501), (3) tra lý lịch cư dân theo tên tài khoản, (4) cho biết tình trạng an ninh, thống kê hệ thống, danh sách truy nã, tin tức mới nhất, và hướng dẫn thủ tục hành chính. Bạn cần hỗ trợ gì?`;
        case 'HELP':
            return `📋 Danh mục chức năng Tuệ Đức v7: \n• Nhập mã hồ sơ "HS-xxxx" để tra tiến độ xử lý.\n• Nhập mã "VP-xxx" để tra biên bản vi phạm.\n• Nhập mã "RP-xxx" để tra báo cáo ca trực.\n• Nhập tên tài khoản cư dân để tra lý lịch gốc.\n• Gõ "an ninh" để biết tình trạng an ninh hiện tại.\n• Gõ "thống kê" để xem tổng quan hệ thống.\n• Gõ "truy nã" để xem danh sách truy nã toàn quốc.\n• Gõ "tin tức mới" để xem sắc lệnh/thông báo mới nhất.\n• Gõ "cán bộ trực" để xem ai đang online.\n• Gõ "xếp hạng" để xem bảng tín nhiệm cán bộ.\n• Gõ "gọi khẩn cấp" để biết cách dùng nút SOS.\n• Hỏi về thủ tục (căn cước, hộ chiếu, giấy phép kinh doanh...) để được hướng dẫn.`;
        case 'SECURITY':
            return `[Trạng thái an ninh] Mức an ninh quốc gia hiện tại: "${systemState.securityLevel}". Bảng chữ chạy thông báo: "${systemState.tickerMessage}"`;
        case 'STATS': {
            const totalApp = Object.keys(systemState.applications).length;
            const archived = Object.keys(systemState.archivedApplications).length;
            const staff = Object.keys(systemState.authorizedPersonnel).length - 1;
            const wanted = (systemState.criminalWantedList || []).length;
            return `[Thống kê hệ thống] Hồ sơ đang xử lý: ${totalApp} | Hồ sơ đã lưu kho: ${archived} | Cán bộ trực ban: ${staff} | Đối tượng truy nã: ${wanted} | Mức an ninh: ${systemState.securityLevel}.`;
        }
        case 'WANTED': {
            const list = systemState.criminalWantedList || [];
            if (!list.length) return `[Truy quét dữ liệu] Hiện chưa ghi nhận đối tượng truy nã nào trên toàn quốc.`;
            return `[Lệnh truy nã toàn quốc] ${list.map((c) => `@${c.name} — tội danh: ${c.crime} (treo thưởng ${c.bounty})`).join(' || ')}`;
        }
        case 'NEWS': {
            const list = systemState.announcements || [];
            if (!list.length) return `[Trung tâm ấn bản] Hiện chưa có sắc lệnh/thông báo nào được ban hành.`;
            const latest = list[0];
            return `[Ấn bản mới nhất] (${latest.type}) "${latest.title}" — ${latest.content} — Ban hành lúc ${latest.timestamp}.`;
        }
        case 'PROCEDURE_CCCD':
            return `[Hướng dẫn thủ tục] Cấp mới/cấp đổi Căn Cước Công Dân gắn chíp: nộp đơn tại mục "Nộp Đơn / Thủ Tục Trực Tuyến", chọn loại giấy tờ "Căn Cước Công Dân Gắn Chíp", gửi tới BỘ CÔNG AN để thẩm định phôi.`;
        case 'PROCEDURE_HOCHIEU':
            return `[Hướng dẫn thủ tục] Hộ Chiếu Quốc Tế / Visa: nộp đơn trực tuyến, chọn cơ quan tiếp nhận phù hợp (thường là VĂN PHÒNG CHÍNH PHỦ hoặc CÔNG AN tùy kịch bản máy chủ), đính kèm nội dung thuyết minh mục đích xuất cảnh.`;
        case 'PROCEDURE_GPKD':
            return `[Hướng dẫn thủ tục] Giấy Phép Kinh Doanh Doanh Nghiệp: nộp đơn loại "Giấy Phép Doanh Nghiệp" kèm nội dung mô tả ngành nghề, gửi tới cơ quan phù hợp để thẩm định và cấp phôi.`;
        case 'PROCEDURE_BODAM':
            return `[Hướng dẫn thủ tục] Đăng Ký Tần Số Bộ Đàm Mã Hóa: nộp đơn loại "Đăng Ký Tần Số Bộ Đàm Mã Hóa" nêu rõ mục đích sử dụng và đơn vị công tác.`;
        case 'PROCEDURE_CCHT':
            return `[Hướng dẫn thủ tục] Giấy Phép Sử Dụng Công Cụ Hỗ Trợ / Vũ Khí: cần nộp đơn kèm lý do nghiệp vụ, sẽ được BỘ CÔNG AN hoặc BỘ CHỈ HUY QUÂN SỰ thẩm định trước khi cấp phôi văn bằng.`;
        case 'PROCEDURE_YTE':
            return `[Hướng dẫn thủ tục] Giấy Chứng Nhận Sức Khỏe / Chứng Chỉ Hành Nghề Y / Giấy Xuất Viện: chọn cơ quan tiếp nhận "BỘ Y TẾ" khi nộp đơn, đính kèm mô tả chi tiết tình trạng cần xác nhận.`;
        case 'PROCEDURE_GD':
            return `[Hướng dẫn thủ tục] Văn Bằng Tốt Nghiệp / Học Bạ Điện Tử / Chứng Chỉ Giảng Dạy: chọn cơ quan "BỘ GIÁO DỤC & ĐÀO TẠO" khi nộp đơn trực tuyến.`;
        case 'PROCEDURE_THUE':
            return `[Hướng dẫn thủ tục] Tờ Khai Quyết Toán Thuế / Hoá Đơn Điện Tử / Giấy Phép Kinh Doanh: chọn cơ quan "BỘ TÀI CHÍNH - THUẾ" khi nộp đơn.`;
        case 'PROCEDURE_UBND':
            return `[Hướng dẫn thủ tục] Giấy Khai Sinh / Kết Hôn / Xây Dựng / Tạm Trú Tạm Vắng: chọn cơ quan "ỦY BAN NHÂN DÂN ĐỊA PHƯƠNG" khi nộp đơn trực tuyến.`;
        case 'PHAN_QUYEN':
            return `[Cơ chế phân quyền] Hệ thống có 4 cấp bậc: CHUYÊN VIÊN (tiếp nhận, thẩm định sơ bộ, trình tấu lên cấp trên), LÃNH ĐẠO (phê duyệt/bác bỏ, niêm phong lưu kho, ban sắc lệnh), THANH TRA (giám sát toàn hệ thống, tiếp nhận khiếu nại), ADMIN (toàn quyền, cấp/thu hồi chứng thư nhân sự). Mọi thao tác đặc quyền đều được máy chủ xác thực lại bằng tài khoản thật, không thể giả mạo.`;
        case 'REPORT_GUIDE':
            return `[Hướng dẫn báo cáo] Cán bộ trực ban vào "Bàn Làm Việc Bộ Ngành" → mục "6. Báo Cáo Tiến Độ Ca Trực" để ghi nhận nhật ký công việc hàng ngày, chờ lãnh đạo phê duyệt.`;
        case 'ROSTER': {
            const roster = data.onlineRoster || [];
            if (!roster.length) return `[Bảng trực tuyến] Hiện chưa có cán bộ nào đăng nhập trực ban trên hệ thống.`;
            return `[Bảng trực tuyến] Đang có ${roster.length} cán bộ trực ban: ${roster.map(o => `${o.displayName} (${o.role} - ${o.agency})`).join(', ')}.`;
        }
        case 'LEADERBOARD': {
            const staff = Object.values(data.systemState.authorizedPersonnel).filter(u => u.role !== 'ADMIN');
            if (!staff.length) return `[Bảng tín nhiệm] Chưa có dữ liệu đánh giá cán bộ.`;
            const ranked = staff.sort((a, b) => (b.positiveRatings - b.negativeRatings) - (a.positiveRatings - a.negativeRatings)).slice(0, 5);
            return `[Bảng xếp hạng tín nhiệm TOP 5] ${ranked.map((u, i) => `#${i + 1} ${u.displayName} (👍${u.positiveRatings} / 👎${u.negativeRatings})`).join(' || ')}`;
        }
        case 'SOS_INFO':
            return `[Hướng dẫn khẩn cấp] Nếu bạn đang gặp tình huống khẩn cấp trong kịch bản (tai nạn, ẩu đả, truy đuổi...), hãy dùng nút "🚨 GỌI KHẨN CẤP 113" ở góc màn hình để gửi cảnh báo tức thì tới toàn bộ cán bộ đang trực ban.`;
        case 'THANKS':
            return `Rất vui được phục vụ công dân! Nếu cần thêm hỗ trợ, hãy tiếp tục đặt câu hỏi cho Tuệ Đức v6.`;
        default: {
            // TẦNG 1.5: NHẬN DIỆN LINH HOẠT THEO TÊN LOẠI GIẤY TỜ TỰ NHIÊN
            // (VD: "tôi muốn làm bằng lái xe" dù không khớp từ khoá ý định cố định)
            const docMatch = findDocTypeMatch(normMsg);
            if (docMatch) {
                return `[Hướng dẫn thủ tục] "${docMatch.label}" thuộc thẩm quyền cơ quan [${docMatch.agency}]. Vào mục "Nộp Đơn / Thủ Tục Trực Tuyến", chọn cơ quan tương ứng, hệ thống sẽ tự hiển thị đúng loại giấy tờ này trong danh sách để bạn nộp trực tuyến.`;
            }
            return null; // không chắc chắn -> có thể chuyển sang Tầng 2 nếu khả dụng
        }
    }
}

// ---------------------------------------------------------------------
// TẦNG 2 (TÙY CHỌN): GỌI CLAUDE API ĐỂ SINH CÂU TRẢ LỜI TỰ NHIÊN HƠN
// Chỉ kích hoạt khi biến môi trường ANTHROPIC_API_KEY tồn tại.
// Không có key -> bỏ qua hoàn toàn, không ảnh hưởng vận hành.
// ---------------------------------------------------------------------
function callClaudeFallback(rawMsg, data) {
    return new Promise((resolve) => {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) return resolve(null);

        const safeSnapshot = {
            securityLevel: data.systemState.securityLevel,
            tickerMessage: data.systemState.tickerMessage,
            totalApplications: Object.keys(data.systemState.applications).length,
            archivedApplications: Object.keys(data.systemState.archivedApplications).length,
            latestAnnouncements: (data.systemState.announcements || []).slice(0, 3),
            wantedList: data.systemState.criminalWantedList || [],
        };

        const systemPrompt = `Bạn là "Tuệ Đức", một trợ lý AI ảo trong một trang web GIẢ LẬP NHẬP VAI (roleplay) hành chính công dành cho cộng đồng Roblox tại Việt Nam. Đây KHÔNG phải hệ thống chính phủ thật, mọi dữ liệu đều hư cấu phục vụ trò chơi nhập vai. Hãy trả lời ngắn gọn (dưới 80 từ), đúng văn phong hành chính-kịch bản trang trọng, dựa trên dữ liệu snapshot được cung cấp nếu liên quan. Nếu câu hỏi không liên quan tới dữ liệu, hãy trả lời thân thiện và nhắc công dân có thể tra mã hồ sơ (HS-xxxx), biên bản vi phạm (VP-xxx), hoặc tên tài khoản cư dân.`;

        const payload = JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 300,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: `Dữ liệu snapshot hệ thống (JSON): ${JSON.stringify(safeSnapshot)}\n\nCâu hỏi của công dân: "${rawMsg}"`,
                },
            ],
        });

        const req = https.request(
            {
                hostname: 'api.anthropic.com',
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Length': Buffer.byteLength(payload),
                },
                timeout: 8000,
            },
            (res) => {
                let body = '';
                res.on('data', (chunk) => (body += chunk));
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        const text = (json.content || []).map((b) => b.text || '').join(' ').trim();
                        resolve(text || null);
                    } catch (e) {
                        resolve(null);
                    }
                });
            }
        );
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(payload);
        req.end();
    });
}

// ---------------------------------------------------------------------
// HÀM CHÍNH XUẤT RA NGOÀI: reply(message, data) -> Promise<string>
// ---------------------------------------------------------------------
async function reply(rawMsg, data) {
    if (!rawMsg || !rawMsg.trim()) {
        return 'Vui lòng nhập nội dung cần tra cứu (mã hồ sơ, tên tài khoản, hoặc câu hỏi về thủ tục).';
    }

    const ruleAnswer = ruleEngineReply(rawMsg, data);
    if (ruleAnswer) return ruleAnswer;

    // Tầng 1 không chắc chắn -> thử Tầng 2 (nếu có cấu hình API key)
    const aiAnswer = await callClaudeFallback(rawMsg, data);
    if (aiAnswer) return aiAnswer;

    // Không có Tầng 2 hoặc gọi lỗi -> trả lời mặc định thông minh
    return `Tôi là Tuệ Đức v6 - Hệ thống trợ lý ảo liên thông quốc gia. Tôi chưa nhận diện được yêu cầu này. Hãy cung cấp mã hồ sơ (HS-xxxx), mã biên bản vi phạm (VP-xxx), mã báo cáo (RP-xxx), tên tài khoản công dân, hoặc gõ "giúp" để xem danh mục chức năng.`;
}

module.exports = { reply, stripDiacritics };
