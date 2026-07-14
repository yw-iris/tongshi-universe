/* 隧道穿越 — 波浪有机同心椭圆环（参考 r_44：奶油色/深蓝交替波浪圆环）
 *  奶油米白背景 + 深蓝/米白交替波浪环从中心向外扩张，营造飞入隧道的感觉
 */
const Tunnel = (function () {
  const layer   = document.getElementById("tunnelLayer");
  const canvas  = document.getElementById("tunnelCanvas");
  const ctx     = canvas.getContext("2d");
  const titleEl = document.getElementById("tunnelTitle");
  const skipBtn = document.getElementById("skipTunnel");

  const DURATION = 2800;
  const reduce   = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  let w, h, cx, cy, dpr;
  let raf = null, running = false, startT = 0, onDone = null;

  /* ── 颜色主题（固定奶油/深蓝，参考 r_44） ── */
  const CREAM = "#F0E8D0";
  const BLUE  = "#1212A8";

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width  = window.innerWidth  * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    cx = w / 2; cy = h / 2;
  }

  /* ── 画一个有机波浪椭圆（多谐波叠加，模拟手绘/有机感） ── */
  function wavyRing(cx, cy, baseRx, baseRy, wobble, seed) {
    const STEPS = 180;
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const t = (i / STEPS) * Math.PI * 2;
      /* 三个谐波叠加产生不规则有机感，频率 3/5/7 各有相位偏移 */
      const wave = (
        Math.sin(3 * t + seed)             * 0.50 +
        Math.sin(5 * t + seed * 1.43)      * 0.30 +
        Math.sin(7 * t + seed * 0.77)      * 0.20
      );
      const scale = 1 + wobble * wave;
      const x = cx + baseRx * scale * Math.cos(t);
      const y = cy + baseRy * scale * Math.sin(t);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function frame(t) {
    if (!running) return;
    if (!startT) startT = t;
    const elapsed = t - startT;
    const p = Math.min(elapsed / DURATION, 1);

    /* 加速曲线：前段慢、后段急速加速，最后冲入 */
    const speed = 0.009 + Math.pow(p, 2.4) * 0.22;
    const phase = (elapsed * speed * 0.34) % 1;

    /* 最大椭圆半径——宽椭圆（参考 r_44 宽高比约 2.4:1） */
    const maxRx = Math.max(w, h) * 1.35;
    const maxRy = maxRx * 0.55;
    const RINGS = 24;

    /* 奶油底色 */
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, w, h);

    /* 从最外层到最内层绘制，内层覆盖外层 */
    for (let i = RINGS; i >= 0; i--) {
      const frac = ((i / RINGS) + phase) % 1;
      /* 透视压缩：越靠中心环间距越小 */
      const pf = Math.pow(frac, 1.35);

      const rx = Math.max(2, pf * maxRx);
      const ry = Math.max(1, pf * maxRy);

      /* 偶数圈=深蓝，奇数圈=奶油（或反相，取决于 phase 偏移） */
      const isBlue = (i % 2 === 0);
      const col    = isBlue ? BLUE : CREAM;

      /* 越外层波浪越大（外大内小，模拟透视） */
      const wobble = pf * 0.11;
      /* 黄金比 seed 保证每圈波浪形状不同但稳定 */
      const seed   = (i * 1.6180339) % (Math.PI * 2);

      wavyRing(cx, cy, rx, ry, wobble, seed);
      ctx.fillStyle = col;
      ctx.fill();
    }

    /* 中心暖光晕（消散点） */
    const gr = Math.min(w, h) * 0.22;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
    grd.addColorStop(0,   "rgba(255,250,228,0.98)");
    grd.addColorStop(0.4, "rgba(245,238,202,0.70)");
    grd.addColorStop(1,   "transparent");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, gr, 0, Math.PI * 2);
    ctx.fill();

    /* 结束：全屏奶油闪白 */
    if (p >= 1) {
      const fa = Math.min(1, (elapsed - DURATION) / 200);
      ctx.fillStyle = `rgba(245,240,218,${fa})`;
      ctx.fillRect(0, 0, w, h);
      if (elapsed > DURATION + 220) return finish();
    }

    raf = requestAnimationFrame(frame);
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
    titleEl.textContent = "前往 " + planet.name;
    layer.hidden = false;
    resize();

    if (reduce) {
      ctx.fillStyle = CREAM; ctx.fillRect(0, 0, w, h);
      running = true; setTimeout(finish, 600); return;
    }

    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, w, h);
    running = true; startT = 0;
    raf = requestAnimationFrame(frame);
  }

  skipBtn.addEventListener("click", finish);
  window.addEventListener("resize", () => { if (running) resize(); });
  return { play };
})();
