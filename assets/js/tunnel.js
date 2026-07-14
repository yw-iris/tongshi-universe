/* 隧道穿越 — 同心圆旋涡收缩（催眠隧道 + 透视感）
 * 参考：蓝白同心圆向中心急速收缩的视觉冲击效果
 */
const Tunnel = (function () {
  const layer  = document.getElementById("tunnelLayer");
  const canvas = document.getElementById("tunnelCanvas");
  const ctx    = canvas.getContext("2d");
  const titleEl= document.getElementById("tunnelTitle");
  const skipBtn= document.getElementById("skipTunnel");

  const DURATION = 2800;
  const reduce   = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  let w, h, cx, cy, dpr;
  let raf = null, running = false, startT = 0, onDone = null;
  let theme = { c1: "#1a3a8c", c2: "#e8e0c4", accent: "#f5c842" };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width  = window.innerWidth  * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    cx = w / 2; cy = h / 2;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function frame(t) {
    if (!running) return;
    if (!startT) startT = t;
    const elapsed = t - startT;
    const p = Math.min(elapsed / DURATION, 1);

    // 加速曲线：前半段慢，后半段极快
    const speed = 0.018 + Math.pow(p, 1.8) * 0.22;

    // 旋转角度：略微旋转增加动感
    const rot = elapsed * 0.0006;

    // 最大半径 = 屏幕对角线
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.15;

    ctx.fillStyle = theme.c1;
    ctx.fillRect(0, 0, w, h);

    // 同心圆条纹数量（越接近终点越多，越密）
    const ringCount = 28 + Math.floor(p * 22);
    // 相位偏移：随时间向内收缩
    const phase = (elapsed * speed * 0.28) % 1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    for (let i = ringCount; i >= 0; i--) {
      // 环的归一化位置 0~1，0 = 中心，1 = 外边
      const frac = ((i / ringCount) + phase) % 1;

      // 透视映射：远处环间距小，近处大（模拟透视隧道）
      const perspFrac = Math.pow(frac, 1.4);
      const r = perspFrac * maxR;

      // 颜色交替：深蓝 / 米白/金
      const isLight = i % 2 === 0;
      let fillColor;
      if (isLight) {
        // 米白 + 靠近中心时染上主题色
        const tint = Math.max(0, 1 - frac * 2.5);
        fillColor = lerpColor(theme.c2, theme.accent, tint);
      } else {
        // 深蓝底色
        fillColor = theme.c1;
      }

      ctx.beginPath();
      ctx.fillStyle = fillColor;
      // 画扭曲椭圆（宽比高 = 1.45 模拟透视椭圆）
      ctx.ellipse(0, 0, r * 1.45, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 中心强光 burst
    const burstAlpha = p < 0.6 ? 0 : (p - 0.6) / 0.4 * 0.7;
    const burstG = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.3);
    burstG.addColorStop(0, `rgba(255,240,200,${burstAlpha})`);
    burstG.addColorStop(1, "transparent");
    ctx.fillStyle = burstG; ctx.beginPath();
    ctx.arc(0, 0, maxR * 0.3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // 抵达：全白闪现
    if (p >= 1) {
      const flashA = Math.min(1, (elapsed - DURATION) / 200);
      ctx.fillStyle = `rgba(255,248,220,${flashA})`;
      ctx.fillRect(0, 0, w, h);
      if (elapsed > DURATION + 220) return finish();
    }

    raf = requestAnimationFrame(frame);
  }

  function lerpColor(hex1, hex2, t) {
    const h2r = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    const [r1,g1,b1] = h2r(hex1), [r2,g2,b2] = h2r(hex2);
    return `rgb(${Math.round(lerp(r1,r2,t))},${Math.round(lerp(g1,g2,t))},${Math.round(lerp(b1,b2,t))})`;
  }

  function finish() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    layer.hidden = true;
    ctx.clearRect(0, 0, w, h);
    const cb = onDone; onDone = null; startT = 0;
    if (cb) cb();
  }

  function play(planet, cb) {
    onDone = cb;
    // 每颗星球有自己的隧道配色
    const palettes = {
      nature:     { c1: "#0a2e1a", c2: "#e8f5e0", accent: "#3ddc97" },
      history:    { c1: "#2e1a04", c2: "#f5e8c4", accent: "#f5b544" },
      society:    { c1: "#041a2e", c2: "#d0eeff", accent: "#4bc8ff" },
      humanities: { c1: "#1a0a2e", c2: "#ecdcff", accent: "#c58bff" },
    };
    theme = palettes[planet.id] || { c1: "#0a122e", c2: "#e8e4d8", accent: "#f5c842" };

    titleEl.textContent = "前往 " + planet.name;
    titleEl.style.color  = planet.color;
    layer.hidden = false;
    resize();

    if (reduce) {
      ctx.fillStyle = theme.c1; ctx.fillRect(0,0,w,h);
      running = true; setTimeout(finish, 600); return;
    }

    ctx.fillStyle = theme.c1; ctx.fillRect(0,0,w,h);
    running = true; startT = 0;
    raf = requestAnimationFrame(frame);
  }

  skipBtn.addEventListener("click", finish);
  window.addEventListener("resize", () => { if (running) resize(); });
  return { play };
})();
