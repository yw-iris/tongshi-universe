/* 通识宇宙 · 主逻辑 */
(function () {
  const STORE_KEY = "tongshi-universe-v1";
  const CADAL = typeof CADAL_HOME !== "undefined" ? CADAL_HOME : "https://cadal.edu.cn/index/home";

  // ---------- 进度存储 ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }
  let state = load();
  // 结构：{ nature:{read:[0,1], done:true}, ... }
  function pState(id) { return state[id] || (state[id] = { read: [], done: false }); }

  function isUnlocked(index) {
    if (index === 0) return true;
    const prev = PLANETS[index - 1];
    return !!(state[prev.id] && state[prev.id].done);
  }
  function doneCount() { return PLANETS.filter(p => state[p.id] && state[p.id].done).length; }

  // ---------- 视图 ----------
  const views = { home: document.getElementById("view-home"), planet: document.getElementById("view-planet") };
  function show(name) {
    Object.values(views).forEach(v => v.classList.remove("is-active"));
    views[name].classList.add("is-active");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // ---------- 顶部进度 ----------
  function renderProgress() {
    const n = doneCount();
    document.getElementById("progressText").textContent = n + " / " + PLANETS.length + " 星球点亮";
    document.getElementById("progressFill").style.width = (n / PLANETS.length * 100) + "%";
  }

  // ---------- 首页星图 ----------
  function renderGalaxy() {
    const wrap = document.getElementById("galaxy");
    wrap.innerHTML = "";
    PLANETS.forEach((planet, i) => {
      const unlocked = isUnlocked(i);
      const done = !!(state[planet.id] && state[planet.id].done);
      const card = document.createElement("button");
      card.className = "planet-card" + (unlocked ? "" : " locked");
      card.style.setProperty("--pc", planet.color);
      card.style.setProperty("--pc2", planet.color2);
      card.style.setProperty("--pg", planet.glow);
      let status = unlocked
        ? (done ? '<span class="planet-status done">✓ 已点亮</span>'
                : '<span class="planet-status">开始探险 →</span>')
        : '<span class="planet-status lock"><span class="lock-icn">🔒</span> 先完成上一颗</span>';
      card.innerHTML =
        '<div class="planet-orb">' + planet.emoji + '</div>' +
        '<h3>' + planet.name + '</h3>' +
        '<p class="p-tag">' + planet.tag + '</p>' +
        status;
      if (unlocked) card.addEventListener("click", () => enterPlanet(planet, i));
      wrap.appendChild(card);
    });
  }

  // ---------- 进入星球（隧道过场） ----------
  function enterPlanet(planet, index) {
    Tunnel.play(planet, () => {
      openPlanet(planet, index);
    });
  }

  let current = null;
  function openPlanet(planet, index) {
    current = { planet, index };
    document.body.style.setProperty("--pc", planet.color);
    document.getElementById("planetBadge").textContent = planet.emoji;
    document.getElementById("planetBadge").style.setProperty("--pc", planet.color);
    document.getElementById("planetBadge").style.setProperty("--pc2", planet.color2);
    document.getElementById("planetBadge").style.setProperty("--pg", planet.glow);
    document.getElementById("planetTag").textContent = planet.tag;
    document.getElementById("planetName").textContent = planet.name;
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
        '<p>' + (read ? "已读 · 点开可复习" : "点开认识新知识") + '</p>';
      card.addEventListener("click", () => openStation(planet, si));
      wrap.appendChild(card);
    });
  }

  function updateQuizLaunch(planet) {
    const ps = pState(planet.id);
    const allRead = ps.read.length >= planet.stations.length;
    const btn = document.getElementById("startQuizBtn");
    const hint = document.getElementById("quizLaunchHint");
    btn.disabled = !allRead;
    if (ps.done) {
      hint.textContent = "🎉 这颗星球已点亮！可以再来挑战一次。";
      btn.textContent = "再次闯关";
    } else if (allRead) {
      hint.textContent = "全部知识站已读完，来闯关点亮这颗星球吧！";
      btn.textContent = "开始闯关";
    } else {
      hint.textContent = "先读完全部知识站（" + ps.read.length + "/" + planet.stations.length + "），就能来闯关！";
      btn.textContent = "开始闯关";
    }
    btn.onclick = () => { if (!btn.disabled) startQuiz(planet); };
  }

  // ---------- 知识卡弹层 ----------
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
    const link = document.getElementById("mCadal");
    link.href = CADAL;
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

  // ---------- 闯关 ----------
  const quizModal = document.getElementById("quizModal");
  const quizBody = document.getElementById("quizBody");
  let quiz = null;
  function startQuiz(planet) {
    quiz = { planet, i: 0, correct: 0 };
    quizModal.hidden = false;
    renderQuestion();
  }
  function closeQuiz() { quizModal.hidden = true; quiz = null; }
  document.getElementById("quizClose").addEventListener("click", closeQuiz);

  function renderQuestion() {
    const { planet, i } = quiz;
    const item = planet.quiz[i];
    let opts = "";
    item.options.forEach((o, oi) => {
      opts += '<button class="quiz-opt" data-oi="' + oi + '">' + o + '</button>';
    });
    quizBody.innerHTML =
      '<p class="quiz-progress">第 ' + (i + 1) + ' / ' + planet.quiz.length + ' 关</p>' +
      '<p class="quiz-q">' + item.q + '</p>' +
      '<div class="quiz-options">' + opts + '</div>' +
      '<p class="quiz-feedback" id="quizFb"></p>';
    quizBody.querySelectorAll(".quiz-opt").forEach(b => {
      b.addEventListener("click", () => answer(parseInt(b.dataset.oi, 10)));
    });
  }

  function answer(oi) {
    const { planet, i } = quiz;
    const item = planet.quiz[i];
    const btns = quizBody.querySelectorAll(".quiz-opt");
    btns.forEach(b => (b.disabled = true));
    const fb = document.getElementById("quizFb");
    if (oi === item.answer) {
      btns[oi].classList.add("correct");
      quiz.correct++;
      fb.textContent = "答对啦！✨";
      fb.style.color = "#7dffbf";
    } else {
      btns[oi].classList.add("wrong");
      btns[item.answer].classList.add("correct");
      fb.textContent = "再想想～正确答案已标出";
      fb.style.color = "#ffb3b3";
    }
    setTimeout(() => {
      quiz.i++;
      if (quiz.i < planet.quiz.length) renderQuestion();
      else finishQuiz();
    }, 1100);
  }

  function finishQuiz() {
    const { planet, correct } = quiz;
    const total = planet.quiz.length;
    const passed = correct === total;
    if (passed) {
      const ps = pState(planet.id);
      const wasDone = ps.done;
      ps.done = true;
      save(state);
      renderProgress();
      if (!wasDone) burstConfetti(planet);
    }
    const nextIdx = current ? current.index + 1 : -1;
    const hasNext = nextIdx >= 0 && nextIdx < PLANETS.length;
    quizBody.innerHTML =
      '<div class="quiz-result">' +
      '<div class="big">' + (passed ? "🌟" : "💪") + '</div>' +
      '<h3>' + (passed ? "星球点亮成功！" : "差一点点！") + '</h3>' +
      '<p>你答对了 ' + correct + " / " + total + " 题。" +
      (passed
        ? (hasNext ? "下一颗「" + PLANETS[nextIdx].name + "」已经解锁，快去看看吧！" : "太厉害了，你已点亮全部星球，成为通识小达人！")
        : "全部答对就能点亮星球，回去复习一下知识站再来吧！") +
      '</p>' +
      '<button class="btn-primary" id="quizResBtn">' +
      (passed ? (hasNext ? "🚀 飞向下一颗星球" : "🏆 回到星图") : "再挑战一次") +
      '</button></div>';
    document.getElementById("quizResBtn").addEventListener("click", () => {
      if (!passed) { quiz.i = 0; quiz.correct = 0; renderQuestion(); return; }
      closeQuiz();
      if (hasNext) {
        renderGalaxy();
        enterPlanet(PLANETS[nextIdx], nextIdx);
      } else {
        renderGalaxy();
        show("home");
      }
    });
    // 更新当前星球页状态
    if (current) { renderStations(planet); updateQuizLaunch(planet); }
  }

  // ---------- 彩带 ----------
  function burstConfetti(planet) {
    const colors = [planet.color, planet.color2, "#ffd88a", "#ffffff", "#7db6ff"];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.transform = "rotate(" + Math.random() * 360 + "deg)";
      document.body.appendChild(c);
      const dur = 1600 + Math.random() * 1400;
      c.animate(
        [
          { transform: "translateY(-10px) rotate(0deg)", opacity: 1 },
          { transform: "translateY(105vh) rotate(" + (360 + Math.random() * 360) + "deg)", opacity: 0.9 }
        ],
        { duration: dur, easing: "cubic-bezier(.2,.6,.4,1)" }
      ).onfinish = () => c.remove();
    }
  }

  // ---------- 通用返回 ----------
  document.querySelectorAll("[data-go-home]").forEach(el =>
    el.addEventListener("click", () => { renderGalaxy(); renderProgress(); show("home"); })
  );
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!stationModal.hidden) closeStation();
      else if (!quizModal.hidden) closeQuiz();
    }
  });

  // ---------- 启动 ----------
  renderProgress();
  renderGalaxy();
})();
