/* 隧道穿越：Canvas 虫洞粒子动画
 * playTunnel(planet, onArrive) —— 播放约 2.6s 加速穿越后回调 onArrive
 */
const Tunnel = (function () {
  const layer = document.getElementById("tunnelLayer");
  const canvas = document.getElementById("tunnelCanvas");
  const ctx = canvas.getContext("2d");
  const titleEl = document.getElementById("tunnelTitle");
  const skipBtn = document.getElementById("skipTunnel");

  let w, h, cx, cy, dpr;
  let particles = [];
  let raf = null;
  let running = false;
  let startT = 0;
  let onDone = null;
  let theme = { color: "#7db6ff", color2: "#3ddc97" };
  const DURATION = 2600;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    cx = w / 2; cy = h / 2;
  }

  function spawn(z) {
    // 环状分布，中心留出隧道口
    const angle = Math.random() * Math.PI * 2;
    const ring = 0.28 + Math.random() * 0.72; // 0.28~1 的半径带
    return {
      angle,
      ring,
      z: z === undefined ? Math.random() : z,
      hue: Math.random(),
      size: Math.random() * 1.6 + 0.6,
      pz: 0
    };
  }

  function reset() {
    particles = [];
    const n = Math.floor(Math.min(520, (window.innerWidth * window.innerHeight) / 3400));
    for (let i = 0; i < n; i++) particles.push(spawn());
  }

  function hexToRgb(hex) {
    const m = hex.replace("#", "");
    return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
  }

  function frame(t) {
    if (!running) return;
    if (!startT) startT = t;
    const elapsed = t - startT;
    const p = Math.min(elapsed / DURATION, 1);
    // 速度曲线：先慢后极快
    const speed = (0.006 + Math.pow(p, 2.2) * 0.06);

    // 拖尾：不清空、叠加半透黑，形成流光
    ctx.fillStyle = "rgba(2,3,10," + (0.28 + p * 0.15) + ")";
    ctx.fillRect(0, 0, w, h);

    const scale = Math.min(w, h) * 0.62;
    const rot = elapsed * 0.00035; // 隧道整体缓慢旋转
    const [r1, g1, b1] = hexToRgb(theme.color);
    const [r2, g2, b2] = hexToRgb(theme.color2);

    ctx.lineCap = "round";
    for (const s of particles) {
      s.pz = s.z;
      s.z -= speed;
      if (s.z <= 0.02) {
        Object.assign(s, spawn(1));
        continue;
      }
      const a = s.angle + rot;
      const radNow = (s.ring / s.z) * scale;
      const radPrev = (s.ring / s.pz) * scale;
      const x = cx + Math.cos(a) * radNow;
      const y = cy + Math.sin(a) * radNow;
      const px = cx + Math.cos(a) * radPrev;
      const py = cy + Math.sin(a) * radPrev;

      if (radNow > Math.max(w, h) * 0.85) continue;

      const depth = 1 - s.z;               // 越靠近越亮越粗
      const mix = s.hue;
      const R = Math.round(r1 * mix + r2 * (1 - mix));
      const G = Math.round(g1 * mix + g2 * (1 - mix));
      const B = Math.round(b1 * mix + b2 * (1 - mix));
      const alpha = Math.min(1, 0.15 + depth * 0.9);
      ctx.strokeStyle = `rgba(${R},${G},${B},${alpha})`;
      ctx.lineWidth = s.size * depth * 3 * dpr + 0.4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // 中心辉光隧道口
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * (0.5 + p * 0.5));
    glow.addColorStop(0, `rgba(${r1},${g1},${b1},${0.05 + p * 0.35})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    if (p >= 1) {
      // 抵达：白光闪现
      ctx.fillStyle = "rgba(255,255,255," + Math.min(1, (elapsed - DURATION) / 220 + 0.2) + ")";
      ctx.fillRect(0, 0, w, h);
      if (elapsed > DURATION + 240) return finish();
    }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    if (!running) return;
    running = false;
    if (raf) cancelAnimationFrame(raf);
    layer.hidden = true;
    ctx.clearRect(0, 0, w, h);
    const cb = onDone; onDone = null; startT = 0;
    if (cb) cb();
  }

  function play(planet, cb) {
    onDone = cb;
    theme = { color: planet.color, color2: planet.color2 };
    titleEl.textContent = "前往 " + planet.name;
    titleEl.style.color = planet.color;
    layer.hidden = false;
    resize();

    if (reduce) { // 尊重减少动效：直接短暂过场
      ctx.fillStyle = "#02030a"; ctx.fillRect(0, 0, w, h);
      running = true;
      setTimeout(finish, 700);
      return;
    }
    reset();
    ctx.fillStyle = "#02030a";
    ctx.fillRect(0, 0, w, h);
    running = true;
    startT = 0;
    raf = requestAnimationFrame(frame);
  }

  skipBtn.addEventListener("click", finish);
  window.addEventListener("resize", function () { if (running) resize(); });

  return { play };
})();
