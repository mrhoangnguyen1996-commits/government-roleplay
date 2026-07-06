/**
 * =====================================================================
 * MA TRẬN ĐỒ HỌA NỀN v6.0 — CYBER BACKGROUND CANVAS
 * =====================================================================
 * File này CHỈ phụ trách hiệu ứng hạt chữ Matrix phía nền (Canvas).
 * Phần âm thanh (click / success / stamp...) đã có sẵn và hoạt động
 * trực tiếp trong views/index.ejs nên KHÔNG lặp lại ở đây để tránh
 * việc khởi tạo 2 AudioContext song song (gây giật/lag trên máy yếu).
 *
 * File được phục vụ tĩnh qua express.static('public') và được nhúng
 * trong views/index.ejs bằng: <script src="/theme-matrix.js"></script>
 * =====================================================================
 */
(function () {
    function initCyberBackground() {
        const canvas = document.createElement('canvas');
        canvas.id = 'cyber-matrix-bg';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0.04';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const columns = Math.floor(width / 20);
        const drops = Array(columns).fill(1);
        const chars = "010101ABCDEFGHIJKLMNOPQRSTUVWXYZ全国務デジタル";

        let rafHandle = null;
        let lastFrame = 0;
        const FRAME_INTERVAL = 33; // ~30fps, giữ nguyên tốc độ bản gốc nhưng dùng rAF tiết kiệm pin hơn setInterval

        function draw(ts) {
            rafHandle = requestAnimationFrame(draw);
            if (ts - lastFrame < FRAME_INTERVAL) return;
            lastFrame = ts;

            ctx.fillStyle = 'rgba(2, 5, 14, 0.1)';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#00ffcc';
            ctx.font = '14px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);
                if (drops[i] * 20 > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        rafHandle = requestAnimationFrame(draw);

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        // Tạm dừng vẽ khi tab ẩn để tiết kiệm tài nguyên máy người dùng
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && rafHandle) {
                cancelAnimationFrame(rafHandle);
                rafHandle = null;
            } else if (!document.hidden && !rafHandle) {
                rafHandle = requestAnimationFrame(draw);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', initCyberBackground);
})();
