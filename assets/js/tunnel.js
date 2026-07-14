/* 隧道穿越 — 同心圆旋涡收缩（催眠隧道 + 透视感）
 * 参考：蓝白同心圆向中心急速收缩的视觉冲击效果
 * Bug fix: finish() 无条件关闭遮罩，点击/超时均可强制退出
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

    const speed = 0.018 + Math.pow(p, 1.8) * 0.22;
    const rot = elapsed * 0.0006;
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.15;

    ctx.fillStyle = theme.c1;
    ctx.fillRect(0, 0, w, h);

    const ringCount = 28 + Math.floor(p * 22);
    const phase = (elapsed * speed * 0.28) % 1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    for (let i = ringCount; i >= 0; i--) {
      const frac = ((i / ringCount) + phase) % 1;
      const perspFrac = Math.pow(frac, 1.4);
      const r = perspFrac * maxR;

      if (r < 1) continue;

      const isLight = i % 2 === 0;
      let fillColor;
      if (isLight) {
        const tint = Math.max(0, 1 - frac * 2.5);
        fillColor = lerpColor(theme.c2, theme.accent, tint);
      } else {
        fillColor = theme.c1;
      }

      ctx.beginPath();
      ctx.fillStyle = fillColor;
      ctx.ellipse(0, 0, Math.max(1, r * 1.45), Math.max(1, r), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const burstAlpha = p < 0.6 ? 0 : (p - 0.6) / 0.4 * 0.7;
    const burstG = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.3);
    burstG.addColorStop(0, `rgba(255,240,200,${burstAlpha})`);
    burstG.addColorStop(1, "transparent");
    ctx.fillStyle = burstG; ctx.beginPath();
    ctx.arc(0, 0, maxR * 0.3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

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

  /* 无论什么状态都强制关闭，不再检查 running */
  function finish() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
    layer.hidden = true;
    ctx.clearRect(0, 0, w, h);
    const cb = onDone; onDone = null; startT = 0;
    if (cb) cb();
  }

  let safetyTimer = null;
  function play(planet, cb) {
    onDone = cb;
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
      running = true;
      setTimeout(finish, 600);
      return;
    }

    if (safetyTimer) clearTimeout(safetyTimer);
    safetyTimer = setTimeout(finish, 4200);

    ctx.fillStyle = theme.c1; ctx.fillRect(0,0,w,h);
    running = true; startT = 0;
    raf = requestAnimationFrame(frame);
  }

  /* 点击遮罩层任意位置强制关闭（不判断 running） */
  layer.addEventListener("click", finish);
  skipBtn.addEventListener("click", e => { e.stopPropagation(); finish(); });
  window.addEventListener("resize", () => { if (running) resize(); });
  return { play };
})();
