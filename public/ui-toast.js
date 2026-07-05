/**
 * =====================================================================
 * HỆ THỐNG THÔNG BÁO TOAST CHUYÊN NGHIỆP v7.0
 * =====================================================================
 * Thay thế hoàn toàn alert()/confirm() mặc định của trình duyệt (vốn
 * chặn luồng, xấu, không đồng bộ theme) bằng banner trượt góc màn hình,
 * có màu sắc theo loại (success/error/warning/info), tự đóng, xếp chồng.
 *
 * Cách dùng ở index.ejs:
 *   Toast.success("Đã lưu thành công!");
 *   Toast.error("Không tìm thấy hồ sơ.");
 *   Toast.warning("Vui lòng kiểm tra lại.");
 *   Toast.info("Đang đồng bộ dữ liệu...");
 * =====================================================================
 */
(function () {
    let container;

    function ensureContainer() {
        if (container) return container;
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:360px;pointer-events:none;';
        document.body.appendChild(container);
        return container;
    }

    const THEME = {
        success: { bg: 'linear-gradient(135deg,#064e3b,#022c22)', border: '#10b981', icon: 'fa-circle-check', text: '#6ee7b7' },
        error:   { bg: 'linear-gradient(135deg,#450a0a,#1c0505)', border: '#ef4444', icon: 'fa-triangle-exclamation', text: '#fca5a5' },
        warning: { bg: 'linear-gradient(135deg,#451a03,#1c0a00)', border: '#f59e0b', icon: 'fa-circle-exclamation', text: '#fcd34d' },
        info:    { bg: 'linear-gradient(135deg,#082f49,#020617)', border: '#38bdf8', icon: 'fa-circle-info', text: '#7dd3fc' },
    };

    function show(message, type = 'info', duration = 4200) {
        const c = ensureContainer();
        const theme = THEME[type] || THEME.info;
        const el = document.createElement('div');
        el.style.cssText = `background:${theme.bg};border:1px solid ${theme.border};color:${theme.text};padding:12px 14px;border-radius:12px;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,0.5);display:flex;align-items:flex-start;gap:10px;pointer-events:auto;opacity:0;transform:translateX(40px);transition:all 0.25s cubic-bezier(.4,0,.2,1);`;
        el.innerHTML = `<i class="fa-solid ${theme.icon}" style="margin-top:1px;font-size:14px;"></i><span style="line-height:1.4;">${message}</span><span style="margin-left:auto;cursor:pointer;opacity:0.6;font-weight:900;" onclick="this.parentElement.remove()">✕</span>`;
        c.appendChild(el);
        requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(0)'; });
        setTimeout(() => {
            el.style.opacity = '0'; el.style.transform = 'translateX(40px)';
            setTimeout(() => el.remove(), 250);
        }, duration);
    }

    window.Toast = {
        success: (msg, d) => show(msg, 'success', d),
        error: (msg, d) => show(msg, 'error', d || 5500),
        warning: (msg, d) => show(msg, 'warning', d),
        info: (msg, d) => show(msg, 'info', d),
    };
})();
