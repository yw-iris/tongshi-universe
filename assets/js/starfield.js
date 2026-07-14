/* 《小王子》风格星空 — 暖金/琥珀/淡紫星点 + 首页椭圆轨道弧线 */
(function () {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let stars = [], nebulae = [];
  let w, h;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width  = window.innerWidth  * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";

    stars = [];
    const count = Math.min(280, Math.floor(window.innerWidth * window.innerHeight / 5000));
    for (let i = 0; i < count; i++) {
      const hue = [45, 38, 280, 200, 50][Math.floor(Math.random() * 5)];
      stars.push({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 1.6 + 0.2) * dpr,
        a: Math.random() * Math.PI * 2,
        tw: Math.random() * 0.018 + 0.004,
        vx: (Math.random() - 0.5) * 0.04 * dpr,
        vy: (Math.random() - 0.5) * 0.04 * dpr,
        hue, sat: 60 + Math.random() * 30, bright: 75 + Math.random() * 20,
        dpr
      });
    }

    nebulae = [];
    for (let i = 0; i < 6; i++) {
      nebulae.push({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 3 + 2) * dpr,
        hue: 45 + Math.random() * 20, a: Math.random() * Math.PI * 2,
        tw: 0.008 + Math.random() * 0.01, dpr
      });
    }
  }

  /* ── 首页椭圆轨道弧线（参考 TheGleamArts + Cosmic Origins 轨道圈） ── */
  function drawOrbitArcs() {
    const isHome = document.getElementById("view-home").classList.contains("is-active");
    if (!isHome) return;

    ctx.save();

    /* 主轨道：大虚线椭圆，覆盖整个星球展示区域 */
    const arcCx = w * 0.50;
    const arcCy = h * 0.60;
    const arcRx = w * 0.50;
    const arcRy = h * 0.32;

    ctx.setLineDash([10 * (w / 1920 || 1), 18 * (w / 1920 || 1)]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(215,200,148,0.20)";
    ctx.beginPath();
    ctx.ellipse(arcCx, arcCy, arcRx, arcRy, -0.06, 0, Math.PI * 2);
    ctx.stroke();

    /* 内圈（次轨道，参考 TheGleamArts 多圈设计） */
    ctx.setLineDash([6, 22]);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "rgba(200,185,130,0.12)";
    ctx.beginPath();
    ctx.ellipse(arcCx, arcCy, arcRx * 0.68, arcRy * 0.68, -0.04, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    /* 星云光晕 */
    for (const n of nebulae) {
      n.a += n.tw;
      const alpha = 0.08 + Math.abs(Math.sin(n.a)) * 0.18;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 28);
      g.addColorStop(0, `hsla(${n.hue},80%,70%,${alpha})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 28, 0, Math.PI * 2); ctx.fill();
    }

    /* 星点 */
    for (const s of stars) {
      s.a += s.tw;
      const alpha = 0.3 + Math.abs(Math.sin(s.a)) * 0.65;
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;

      if (s.r > 1.8 * s.dpr) {
        ctx.strokeStyle = `hsla(${s.hue},${s.sat}%,${s.bright}%,${alpha * 0.6})`;
        ctx.lineWidth = 0.8 * s.dpr;
        const arm = s.r * 4;
        ctx.beginPath(); ctx.moveTo(s.x - arm, s.y); ctx.lineTo(s.x + arm, s.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.x, s.y - arm); ctx.lineTo(s.x, s.y + arm); ctx.stroke();
      }

      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue},${s.sat}%,${s.bright}%,${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();

      if (s.r > 1.2 * s.dpr) {
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue},${s.sat}%,${s.bright}%,${alpha * 0.12})`;
        ctx.arc(s.x, s.y, s.r * 4.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* 首页轨道弧线叠加在星点之上 */
    drawOrbitArcs();

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize(); tick();
})();
