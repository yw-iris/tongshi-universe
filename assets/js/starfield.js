/* 首页星空背景：缓慢闪烁 + 轻微漂移的星点 */
(function () {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let stars = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const count = Math.min(220, Math.floor((window.innerWidth * window.innerHeight) / 7000));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.4 + 0.3) * devicePixelRatio,
        a: Math.random(),
        tw: Math.random() * 0.02 + 0.004,
        vx: (Math.random() - 0.5) * 0.06 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.06 * devicePixelRatio,
        hue: Math.random() < 0.25 ? 210 : Math.random() < 0.5 ? 270 : 45
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.a += s.tw;
      const alpha = 0.35 + Math.abs(Math.sin(s.a)) * 0.55;
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue},90%,80%,${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.4 * devicePixelRatio) {
        ctx.fillStyle = `hsla(${s.hue},90%,80%,${alpha * 0.18})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();
  tick();
})();
