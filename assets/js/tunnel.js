/* 隧道穿越 v3 — 暗底+有机波浪环（参考 r_44 波浪形状，保留深空底色以提高可感知度）
 *  深蓝/黑底 + 奶油白/星球色交替波浪椭圆环从外向内扩张（飞入感）
 *  波浪用三谐波叠加模拟有机手绘质感
 */
const Tunnel = (function () {
  const layer   = document.getElementById("tunnelLayer");
  const canvas  = document.getElementById("tunnelCanvas");
  const ctx     = canvas.getContext("2d");
  const titleEl = document.getElementById("tunnelTitle");
  const skipBtn = document.getElementById("skipTunnel");

  const DURATION = 2200;
  const reduce   = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  let w, h, cx, cy, dpr;
  let raf = null, running = false, startT = 0, onDone = null;
  let currentColor = "#ffd778";

  /* 每颗星球保留自己的配色主题 */
  const PALETTES = {
    nature:     { bg: "#020f06", light: "#d4ffeb", accent: "#40ee80" },
    history:    { bg: "#07030f", light: "#e8e0ff", accent: "#9070ff" },
    society:    { bg: "#020810", light: "#c8eeff", accent: "#40c0f0" },
    humanities: { bg: "#0f0206", light: "#ffe0ee", accent: "#f04880" },
  };
  let theme = PALETTES.nature;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width  = window.innerWidth  * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    cx = w / 2; cy = h / 2;
  }

  /* 有机波浪椭圆：三谐波叠加 */
  function wavyRing(baseRx, baseRy, wobble, seed) {
    const STEPS = 160;
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const t = (i / STEPS) * Math.PI * 2;
      const wave = (
        Math.sin(3 * t + seed)            * 0.50 +
        Math.sin(5 * t + seed * 1.43)     * 0.30 +
        Math.sin(7 * t + seed * 0.77)     * 0.20
      );
      const sc = 1 + wobble * wave;
      const x  = cx + baseRx * sc * Math.cos(t);
      const y  = cy + baseRy * sc * Math.sin(t);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function frame(t) {
    if (!running) return;
    try {
      if (!startT) startT = t;
      const elapsed = t - startT;
      const p = Math.min(elapsed / DURATION, 1);

      /* 加速曲线 */
      const speed = 0.010 + Math.pow(p, 2.2) * 0.25;
      const phase = (elapsed * speed * 0.30) % 1;

      /* 最大半径：宽椭圆（模拟透视隧道口） */
      const maxRx = Math.max(w, h) * 1.30;
      const maxRy = maxRx * 0.58;
      const RINGS = 22;

      /* 深色底 */
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, w, h);

      /* 波浪环：由外到内叠画（内层覆盖外层） */
      for (let i = RINGS; i >= 0; i--) {
        const frac   = ((i / RINGS) + phase) % 1;
        const pf     = Math.pow(frac, 1.30);
        const rx     = Math.max(2, pf * maxRx);
        const ry     = Math.max(1, pf * maxRy);
        const isLight = (i % 2 === 0);
        /* 亮环=奶油白（靠近中心逐渐染上星球主色），暗环=深底色 */
        let col;
        if (isLight) {
          const tint = Math.max(0, 1 - frac * 2.2);
          col = tint > 0.05
            ? lerpHex(theme.light, theme.accent, tint)
            : theme.light;
        } else {
          col = theme.bg;
        }
        const wobble = pf * 0.10;
        const seed   = (i * 1.6180339) % (Math.PI * 2);
        wavyRing(rx, ry, wobble, seed);
        ctx.fillStyle = col;
        ctx.fill();
      }

      /* 中心发光点 */
      const gr  = Math.max(10, Math.min(w, h) * 0.20);
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
      grd.addColorStop(0,   `rgba(255,255,240,0.95)`);
      grd.addColorStop(0.4, `rgba(220,255,220,0.45)`);
      grd.addColorStop(1,   "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2); ctx.fill();

      /* 结束闪白 */
      if (p >= 1) {
        const fa = Math.min(1, (elapsed - DURATION) / 180);
        ctx.fillStyle = `rgba(255,255,255,${fa})`;
        ctx.fillRect(0, 0, w, h);
        if (elapsed > DURATION + 200) return finish();
      }
    } catch (e) {
      /* 任何渲染错误直接完成，不卡死 */
      return finish();
    }
    raf = requestAnimationFrame(frame);
  }

  /* 简易颜色插值（十六进制） */
  function lerpHex(hex1, hex2, t) {
    const p = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    const [r1,g1,b1] = p(hex1), [r2,g2,b2] = p(hex2);
    const r = r => Math.round(r1 + (r2 - r1) * r);
    return `rgb(${r(1-t)},${[g1+(g2-g1)*(1-t)]|0},${[b1+(b2-b1)*(1-t)]|0})`;
  }

  function finish() {
    running = false;                          // 无论什么状态都强制关闭
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
    layer.hidden = true;                      // 必须隐藏遮罩
    ctx.clearRect(0, 0, w, h);
    const cb = onDone; onDone = null; startT = 0;
    if (cb) cb();
  }

  let safetyTimer = null;
  function play(planet, cb) {
    onDone = cb;
    theme = PALETTES[planet.id] || PALETTES.nature;
    titleEl.textContent = "前往 " + planet.name;
    titleEl.style.color = theme.light;
    layer.hidden = false;
    resize();

    if (reduce) {
      ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h);
      running = true;
      setTimeout(finish, 500);
      return;
    }

    /* 4 秒硬超时：无论动画状态，强制进入星球 */
    if (safetyTimer) clearTimeout(safetyTimer);
    safetyTimer = setTimeout(finish, 4200);

    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h);
    running = true; startT = 0;
    raf = requestAnimationFrame(frame);
  }

  /* 点击隧道层任意位置强制关闭（不判断 running） */
  layer.addEventListener("click", finish);
  skipBtn.addEventListener("click", e => { e.stopPropagation(); finish(); });
  window.addEventListener("resize", () => { if (running) resize(); });
  return { play };
})();
