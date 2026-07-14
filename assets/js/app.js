/* 通识宇宙 · 主逻辑 v2 — 可拖动星图 + 小王子风格 */
(function () {
  const STORE_KEY = "tongshi-universe-v1";
  const CADAL = typeof CADAL_HOME !== "undefined" ? CADAL_HOME : "https://cadal.edu.cn/index/home";

  /* ── 进度 ── */
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } }
  function save(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }
  let state = load();
  function pState(id) { return state[id] || (state[id] = { read: [], done: false }); }
  function isUnlocked(i) {
    if (i === 0) return true;
    return !!(state[PLANETS[i - 1].id] && state[PLANETS[i - 1].id].done);
  }
  function doneCount() { return PLANETS.filter(p => state[p.id] && state[p.id].done).length; }

  /* ── 视图 ── */
  const views = { home: document.getElementById("view-home"), planet: document.getElementById("view-planet") };
  function show(name) {
    Object.values(views).forEach(v => v.classList.remove("is-active"));
    views[name].classList.add("is-active");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ── 进度条 ── */
  function renderProgress() {
    const n = doneCount();
    document.getElementById("progressText").textContent = n + " / " + PLANETS.length + " 星球点亮";
    document.getElementById("progressFill").style.width = (n / PLANETS.length * 100) + "%";
  }

  /* ── 星图（可拖动） ── */
  const track = document.getElementById("galaxyTrack");
  const wrap  = document.getElementById("galaxyWrap");
  let isDragging = false, dragStartX = 0, scrollStart = 0, didDrag = false;

  // 星球尺寸：中间大、两侧略小（透视感）
  const ORB_SIZES = [110, 140, 140, 110];
  const BOB_DELAYS = ["0s", ".8s", "1.6s", "2.4s"];
  const RING_ROTS  = ["-15deg", "-22deg", "-18deg", "-25deg"];

  function renderGalaxy() {
    track.innerHTML = "";
    PLANETS.forEach((planet, i) => {
      const unlocked = isUnlocked(i);
      const done     = !!(state[planet.id] && state[planet.id].done);
      const size     = ORB_SIZES[i] || 130;

      const card = document.createElement("button");
      card.className = "planet-card" + (unlocked ? "" : " locked");
      card.style.setProperty("--pc",       planet.color);
      card.style.setProperty("--pc2",      planet.color2);
      card.style.setProperty("--pg",       planet.glow);
      card.style.setProperty("--pg2",      planet.glow2 || "transparent");
      card.style.setProperty("--orb-size", size + "px");
      card.style.setProperty("--bob-delay",BOB_DELAYS[i] || "0s");
      card.style.setProperty("--ring-rot", RING_ROTS[i] || "-20deg");

      let statusHtml = "";
      if (!unlocked)  statusHtml = '<span class="p-status lock">🔒 先完成上一颗</span>';
      else if (done)  statusHtml = '<span class="p-status done">✦ 已点亮</span>';
      else            statusHtml = '<span class="p-status">出发探险 →</span>';

      card.innerHTML =
        '<div class="planet-orb">' + planet.emoji + '</div>' +
        '<div class="planet-label">' +
          '<h3>' + planet.name + '</h3>' +
          '<p class="p-tag">' + planet.tag + '</p>' +
          statusHtml +
        '</div>';

      if (unlocked) {
        card.addEventListener("click", () => {
          if (didDrag) return; // 拖动后不触发点击
          enterPlanet(planet, i);
        });
      }
      track.appendChild(card);
    });
  }

  // 拖动逻辑（mouse + touch）
  function dragStart(x) { isDragging = true; didDrag = false; dragStartX = x; scrollStart = wrap.scrollLeft; }
  function dragMove(x)  { if (!isDragging) return; const dx = dragStartX - x; if (Math.abs(dx) > 5) didDrag = true; wrap.scrollLeft = scrollStart + dx; }
  function dragEnd()    { isDragging = false; }

  wrap.addEventListener("mousedown",  e => dragStart(e.clientX));
  window.addEventListener("mousemove",e => dragMove(e.clientX));
  window.addEventListener("mouseup",  dragEnd);
  wrap.addEventListener("touchstart", e => dragStart(e.touches[0].clientX), { passive:true });
  wrap.addEventListener("touchmove",  e => dragMove(e.touches[0].clientX),  { passive:true });
  wrap.addEventListener("touchend",   dragEnd);

  /* ── 进入星球 ── */
  function enterPlanet(planet, index) {
    Tunnel.play(planet, () => openPlanet(planet, index));
  }

  let current = null;
  function openPlanet(planet, index) {
    current = { planet, index };
    // 传主题色给 badge 和 know-list
    const badge = document.getElementById("planetBadge");
    badge.textContent = planet.emoji;
    badge.style.setProperty("--pc",  planet.color);
    badge.style.setProperty("--pc2", planet.color2);
    badge.style.setProperty("--pg",  planet.glow);
    document.getElementById("planetTag").textContent   = planet.tag;
    document.getElementById("planetName").textContent  = planet.name;
    document.getElementById("planetIntro").textContent = planet.intro;
    renderStations(planet);
    updateQuizLaunch(planet);
    show("planet");
  }

  function renderStations(planet) {
    const ps = pState(planet.id);
    const wrap = document.getElementById("stations");
    wrap.innerHTML = "";
    planet.stations.forEach((st, si) => {
      const read = ps.read.includes(si);
      const card = document.createElement("button");
      card.className = "station-card" + (read ? " read" : "");
      card.style.setProperty("--pc", planet.color);
      card.innerHTML =
        '<span class="station-check">✓</span>' +
        '<span class="station-emoji">' + st.emoji + '</span>' +
        '<h4>' + st.title + '</h4>' +
        '<p>' + (read ? "已读完 · 点开可复习" : "点开认识新知识 →") + '</p>';
      card.addEventListener("click", () => openStation(planet, si));
      wrap.appendChild(card);
    });
  }

  function updateQuizLaunch(planet) {
    const ps     = pState(planet.id);
    const allRead = ps.read.length >= planet.stations.length;
    const btn    = document.getElementById("startQuizBtn");
    const hint   = document.getElementById("quizLaunchHint");
    btn.disabled = !allRead;
    if (ps.done) {
      hint.textContent = "🌟 这颗星球已点亮！可以再来挑战一次。";
      btn.textContent  = "再次闯关";
    } else if (allRead) {
      hint.textContent = "全部知识站已读完，来闯关点亮这颗星球吧！";
      btn.textContent  = "开始闯关";
    } else {
      hint.textContent = "先读完全部知识站（" + ps.read.length + "/" + planet.stations.length + "），就能来闯关！";
      btn.textContent  = "开始闯关";
    }
    btn.onclick = () => { if (!btn.disabled) startQuiz(planet); };
  }

  /* ── 知识卡弹层 ── */
  const stationModal = document.getElementById("stationModal");
  let modalCtx = null;

  function openStation(planet, si) {
    const st = planet.stations[si];
    modalCtx = { planet, si };
    document.getElementById("mEmoji").textContent = st.emoji;
    document.getElementById("mTitle").textContent = st.title;
    const ul = document.getElementById("mPoints");
    ul.innerHTML = "";
    ul.style.setProperty("--pc", planet.color);
    st.points.forEach(p => {
      const li = document.createElement("li");
      li.style.borderLeftColor = planet.color;
      li.textContent = p;
      ul.appendChild(li);
    });
    document.getElementById("mCadal").href = CADAL;
    document.getElementById("mCadalText").textContent = st.readMore || "到图书馆看更多";
    stationModal.hidden = false;
  }
  function closeStation() { stationModal.hidden = true; modalCtx = null; }
  document.getElementById("stationClose").addEventListener("click", closeStation);
  stationModal.addEventListener("click", e => { if (e.target === stationModal) closeStation(); });
  document.getElementById("mDone").addEventListener("click", () => {
    if (!modalCtx) return;
    const ps = pState(modalCtx.planet.id);
    if (!ps.read.includes(modalCtx.si)) { ps.read.push(modalCtx.si); save(state); }
    renderStations(modalCtx.planet);
    updateQuizLaunch(modalCtx.planet);
    closeStation();
  });

  /* ── 闯关 ── */
  const quizModal = document.getElementById("quizModal");
  const quizBody  = document.getElementById("quizBody");
  let quiz = null;

  function startQuiz(planet) { quiz = { planet, i:0, correct:0 }; quizModal.hidden = false; renderQuestion(); }
  function closeQuiz() { quizModal.hidden = true; quiz = null; }
  document.getElementById("quizClose").addEventListener("click", closeQuiz);

  function renderQuestion() {
    const { planet, i } = quiz;
    const item = planet.quiz[i];
    let opts = "";
    item.options.forEach((o, oi) =>
      opts += '<button class="quiz-opt" data-oi="' + oi + '">' + o + '</button>'
    );
    quizBody.innerHTML =
      '<p class="quiz-progress">第 ' + (i+1) + ' / ' + planet.quiz.length + ' 关</p>' +
      '<p class="quiz-q">' + item.q + '</p>' +
      '<div class="quiz-options">' + opts + '</div>' +
      '<p class="quiz-feedback" id="quizFb"></p>';
    quizBody.querySelectorAll(".quiz-opt").forEach(b =>
      b.addEventListener("click", () => answer(parseInt(b.dataset.oi, 10)))
    );
  }

  function answer(oi) {
    const { planet, i } = quiz;
    const item = planet.quiz[i];
    const btns = quizBody.querySelectorAll(".quiz-opt");
    btns.forEach(b => (b.disabled = true));
    const fb = document.getElementById("quizFb");
    if (oi === item.answer) {
      btns[oi].classList.add("correct"); quiz.correct++;
      fb.textContent = "答对啦！✨"; fb.style.color = "#ffd778";
    } else {
      btns[oi].classList.add("wrong"); btns[item.answer].classList.add("correct");
      fb.textContent = "再想想～正确答案已标出"; fb.style.color = "#ff9090";
    }
    setTimeout(() => { quiz.i++; quiz.i < planet.quiz.length ? renderQuestion() : finishQuiz(); }, 1100);
  }

  function finishQuiz() {
    const { planet, correct } = quiz;
    const total  = planet.quiz.length;
    const passed = correct === total;
    if (passed) {
      const ps = pState(planet.id); const wasDone = ps.done;
      ps.done = true; save(state); renderProgress();
      if (!wasDone) burstConfetti(planet);
    }
    const nextIdx = current ? current.index + 1 : -1;
    const hasNext = nextIdx >= 0 && nextIdx < PLANETS.length;
    quizBody.innerHTML =
      '<div class="quiz-result">' +
        '<div class="big">' + (passed ? "🌟" : "💪") + '</div>' +
        '<h3>' + (passed ? "星球点亮成功！" : "差一点！") + '</h3>' +
        '<p>你答对了 ' + correct + " / " + total + " 题。" +
        (passed
          ? (hasNext ? "下一颗「" + PLANETS[nextIdx].name + "」已经解锁啦！" : "你已点亮全部星球，成为通识小达人！🏆")
          : "全对才能点亮星球，回去再读读知识站吧~") +
        '</p>' +
        '<button class="btn-primary" id="quizResBtn">' +
        (passed ? (hasNext ? "🚀 飞向下一颗" : "回到星图") : "再挑战一次") +
        '</button></div>';
    document.getElementById("quizResBtn").addEventListener("click", () => {
      if (!passed) { quiz.i = 0; quiz.correct = 0; renderQuestion(); return; }
      closeQuiz();
      if (hasNext) { renderGalaxy(); enterPlanet(PLANETS[nextIdx], nextIdx); }
      else         { renderGalaxy(); show("home"); }
    });
    if (current) { renderStations(planet); updateQuizLaunch(planet); }
  }

  /* ── 彩带 ── */
  function burstConfetti(planet) {
    const colors = [planet.color, "#ffd778", "#ff8ec4", "#ffffff", "#ffb84d"];
    for (let i = 0; i < 65; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left      = Math.random() * 100 + "vw";
      c.style.background= colors[i % colors.length];
      c.style.transform = "rotate(" + (Math.random() * 360) + "deg)";
      document.body.appendChild(c);
      const dur = 1500 + Math.random() * 1400;
      c.animate(
        [{ transform:"translateY(-10px) rotate(0)", opacity:1 },
         { transform:"translateY(108vh) rotate(" + (360 + Math.random()*360) + "deg)", opacity:.8 }],
        { duration:dur, easing:"cubic-bezier(.2,.6,.4,1)" }
      ).onfinish = () => c.remove();
    }
  }

  /* ── 全局返回 ── */
  document.querySelectorAll("[data-go-home]").forEach(el =>
    el.addEventListener("click", () => { renderGalaxy(); renderProgress(); show("home"); })
  );
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!stationModal.hidden) closeStation();
      else if (!quizModal.hidden) closeQuiz();
    }
  });

  /* ── 初始化 ── */
  renderProgress();
  renderGalaxy();
  // 初始滚动到第一个未解锁的星球（居中）
  requestAnimationFrame(() => {
    const cards = track.querySelectorAll(".planet-card");
    const firstLocked = Array.from(cards).findIndex(c => c.classList.contains("locked"));
    const target = firstLocked > 0 ? cards[firstLocked - 1] : cards[0];
    if (target) {
      const wrapW  = wrap.offsetWidth;
      const cardL  = target.offsetLeft;
      const cardW  = target.offsetWidth;
      wrap.scrollLeft = cardL - wrapW / 2 + cardW / 2;
    }
  });
})();
