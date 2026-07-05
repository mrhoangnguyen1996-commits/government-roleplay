/**
 * =====================================================================
 * THƯ VIỆN ÂM THANH MỞ RỘNG v7.0 — SFX ĐA DẠNG CHO TRẢI NGHIỆM ROLEPLAY
 * =====================================================================
 * Bổ sung THÊM các hiệu ứng mới (còi báo động khẩn cấp, tín hiệu radio,
 * thông báo trực tuyến, xếp hạng, lỗi...) mà KHÔNG đụng vào 4 hiệu ứng
 * gốc (click/success/alert/stamp) đã có sẵn và hoạt động tốt trong
 * views/index.ejs, để tránh xung đột hai AudioContext cùng lúc.
 *
 * Dùng: window.SFX.siren(), window.SFX.radioBeep(), window.SFX.errorBuzz(),
 *       window.SFX.notifyDing(), window.SFX.rosterChime(), window.SFX.typingTick(),
 *       window.SFX.loginFanfare(), window.SFX.warrantAlarm()
 * =====================================================================
 */
(function () {
    let ctx = null;
    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function tone(freq, type, duration, vol, delay = 0, glideTo = null) {
        const c = getCtx();
        const start = c.currentTime + delay;
        try {
            const osc = c.createOscillator(); const gain = c.createGain();
            osc.type = type; osc.frequency.setValueAtTime(freq, start);
            if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, start + duration);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.linearRampToValueAtTime(vol, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            osc.connect(gain); gain.connect(c.destination);
            osc.start(start); osc.stop(start + duration + 0.05);
        } catch (e) { /* trình duyệt chưa cho phép audio (chưa có tương tác) */ }
    }

    function noiseBurst(duration, vol, delay = 0) {
        const c = getCtx();
        const start = c.currentTime + delay;
        try {
            const bufferSize = c.sampleRate * duration;
            const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            const src = c.createBufferSource(); src.buffer = buffer;
            const gain = c.createGain(); gain.gain.setValueAtTime(vol, start);
            const filter = c.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1800;
            src.connect(filter); filter.connect(gain); gain.connect(c.destination);
            src.start(start);
        } catch (e) { /* ignore */ }
    }

    const SFX = {
        // Còi hụ báo động khẩn cấp — dùng khi có cuộc gọi SOS mới
        siren() {
            for (let i = 0; i < 4; i++) {
                tone(600, 'sawtooth', 0.4, 0.09, i * 0.4, 900);
                tone(900, 'sawtooth', 0.4, 0.09, i * 0.4 + 0.4, 600);
            }
        },
        // Tiếng bíp bộ đàm khi điều phối
        radioBeep() {
            tone(1400, 'square', 0.06, 0.06);
            setTimeout(() => noiseBurst(0.12, 0.05), 70);
        },
        // Tiếng chuông cảnh báo lỗi thao tác (rõ ràng hơn tránh nhầm với thành công)
        errorBuzz() {
            tone(180, 'sawtooth', 0.28, 0.12);
            tone(140, 'square', 0.32, 0.08, 0.05);
        },
        // Tiếng "ting" thông báo có sự kiện mới (nhẹ nhàng, không giật mình)
        notifyDing() {
            tone(1046.5, 'sine', 0.15, 0.08);
            setTimeout(() => tone(1318.5, 'sine', 0.18, 0.07), 90);
        },
        // Tiếng chuông khi có cán bộ mới vào ca trực (roster online)
        rosterChime() {
            tone(784, 'triangle', 0.12, 0.06);
            setTimeout(() => tone(1046.5, 'triangle', 0.16, 0.06), 80);
        },
        // Tiếng gõ phím nhẹ khi ai đó đang gõ tin nhắn
        typingTick() {
            tone(2200, 'square', 0.02, 0.02);
        },
        // Fanfare chào mừng khi đăng nhập thành công
        loginFanfare() {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 'sine', 0.18, 0.09, i * 0.09));
        },
        // Chuông báo động cấp cao khi ban hành lệnh truy nã / cảnh báo an ninh
        warrantAlarm() {
            tone(220, 'sawtooth', 0.5, 0.1);
            tone(440, 'sawtooth', 0.5, 0.07, 0.1);
            noiseBurst(0.3, 0.04, 0.15);
        },
    };

    window.SFX = SFX;
})();
