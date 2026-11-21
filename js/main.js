/* =====================================================================
   MAIN: boot sequence, command palette, wiring
   ===================================================================== */
(function () {
  const { $, $$, reduce, esc } = FX;
  const D = window.PORTFOLIO;

  /* ---------- helpers ---------- */
  const go = (sel) => { const el = $(sel); if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };
  function copyEmail() {
    if (!D.email) { FX.toast("Almost there", "Email address coming soon", "📡"); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(D.email) : Promise.reject())
      .then(() => FX.toast("Copied", D.email, "📋"))
      .catch(() => { location.href = "mailto:" + D.email; });
  }
  function openLinkedIn() {
    if (!D.linkedin) { FX.toast("Coming soon", "LinkedIn link is being wired up", "🔗"); return; }
    window.open(D.linkedin, "_blank", "noopener");
  }

  /* ---------- boot loader ---------- */
  function boot() {
    const loader = $("#loader"), linesEl = $("#loaderLines"), countEl = $("#loaderCount"), bar = $("#loaderBar");
    let seen = false;
    try { seen = sessionStorage.getItem("kg-booted") === "1"; } catch (e) { /* storage blocked */ }

    const fontsReady = Promise.race([
      document.fonts ? document.fonts.load('800 100px "Syne"').then(() => document.fonts.ready) : Promise.resolve(),
      new Promise((r) => setTimeout(r, 2500))
    ]).catch(() => {});

    const LINES = [
      ["&gt; init krrishna.os --version 2.0", ""],
      ["&gt; loading modules: ml · apps · apis · mcp", ""],
      ["&gt; mounting experience: airbus → americana", ""],
      ["&gt; model context protocol handshake ...... ", "ok"],
      ["&gt; compiling portfolio ................... ", "ok"],
      ["&gt; ready. welcome.", ""]
    ];

    const anim = new Promise((resolve) => {
      if (reduce) { resolve(); return; }
      const dur = seen ? 700 : 2000;
      const t0 = performance.now();
      let shown = 0, skip = false;
      const onSkip = () => (skip = true);
      addEventListener("keydown", onSkip, { once: true });
      loader.addEventListener("click", onSkip, { once: true });
      const tick = (now) => {
        const p = skip ? 1 : Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        countEl.textContent = Math.round(e * 100);
        bar.style.transform = `scaleX(${e})`;
        while (shown < LINES.length && e >= shown / (LINES.length - 0.5)) {
          const [txt, ok] = LINES[shown++];
          const d = document.createElement("div");
          d.innerHTML = txt + (ok ? `<span class="ok">${ok}</span>` : "");
          if (shown === LINES.length) d.className = "ok";
          linesEl.appendChild(d);
        }
        if (p < 1) requestAnimationFrame(tick);
        else setTimeout(resolve, skip ? 0 : 280);
      };
      requestAnimationFrame(tick);
    });

    fontsReady.then(() => Hero.init());

    Promise.all([anim, fontsReady]).then(() => {
      try { sessionStorage.setItem("kg-booted", "1"); } catch (e) { /* ignore */ }
      loader.classList.add("is-done");
      document.body.classList.remove("is-loading");
      setTimeout(() => Hero.start(), reduce ? 0 : 350);
      setTimeout(() => (loader.style.display = "none"), 1300);
      // kick the role rotator after the reveal
      setTimeout(roleRotator, 1400);
    });
  }

  /* ---------- hero role rotator ---------- */
  function roleRotator() {
    const el = $("#roleText");
    let i = 0;
    setInterval(() => {
      i = (i + 1) % D.roles.length;
      FX.scramble(el, D.roles[i], 800);
    }, 2800);
  }

  /* ---------- nav: scrolled state, hide on scroll down, active link ---------- */
  function initNav() {
    const nav = $("#nav"), bar = $("#progressBar");
    let lastY = scrollY;
    FX.onScroll(() => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      nav.classList.toggle("is-scrolled", y > 30);
      nav.classList.toggle("is-hidden", y > lastY + 4 && y > 500);
      if (y < lastY - 4 || y < 500) nav.classList.remove("is-hidden");
      lastY = y;
    });
    const links = $$(".nav__links a");
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id === "mcp" ? "stack" : e.target.id === "certs" ? "work" : e.target.id;
      links.forEach((a) => a.classList.toggle("is-active", a === map.get(id)));
    }), { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section").forEach((s) => io.observe(s));
  }

  /* ---------- command palette ---------- */
  function initPalette() {
    const pal = $("#palette"), input = $("#paletteInput"), list = $("#paletteList");
    const nav = (label, sel, ico = "↗") => ({ ico, label: "Go to " + label, grp: "Navigate", run: () => go(sel) });
    const actions = [
      nav("About", "#about"), nav("Journey", "#journey"), nav("Stack", "#stack"), nav("How I work (MCP)", "#mcp"),
      nav("Work", "#work"), nav("Achievements", "#certs"), nav("Terminal", "#terminal"), nav("Contact", "#contact"),
      { ico: ">_", label: "Open terminal", grp: "Actions", run: () => Terminal.focus() },
      { ico: "↓", label: "Open resume", grp: "Actions", run: () => window.open(D.resume, "_blank", "noopener") },
      { ico: "@", label: "Copy email", grp: "Actions", run: copyEmail },
      { ico: "in", label: "Open LinkedIn", grp: "Actions", run: openLinkedIn },
      ...D.projects.map((p) => ({ ico: "◆", label: "Project: " + p.title, grp: "Work", run: () => Sections.openProject(p.id) })),
      { ico: "🎉", label: "sudo hire-me", grp: "Fun", run: () => { Terminal.focus(); setTimeout(() => Terminal.typeAndRun("sudo hire-me"), 800); } },
      { ico: "💥", label: "Explode the hero", grp: "Fun", run: () => { go("#top"); setTimeout(() => { const c = Hero.center(); Hero.explode(c.x, c.y); }, scrollY > 50 ? 800 : 50); } },
      { ico: "▦", label: "Matrix mode", grp: "Fun", run: () => FX.matrixRain() },
      { ico: "✦", label: "Confetti", grp: "Fun", run: () => FX.confetti() }
    ];
    let filtered = actions, sel = 0, lastFocus = null;

    function render() {
      const q = input.value.trim().toLowerCase();
      filtered = q ? actions.filter((a) => (a.label + " " + a.grp).toLowerCase().includes(q)) : actions;
      sel = Math.min(sel, Math.max(0, filtered.length - 1));
      list.innerHTML = filtered.length
        ? filtered.map((a, i) => `<li role="option" data-i="${i}" class="${i === sel ? "is-sel" : ""}" aria-selected="${i === sel}"><span class="ico">${a.ico}</span>${esc(a.label)}<span class="grp">${esc(a.grp)}</span></li>`).join("")
        : `<li class="empty">No results. Try "work" or "terminal"</li>`;
      const s = list.querySelector(".is-sel");
      if (s) s.scrollIntoView({ block: "nearest" });
    }
    function open() {
      lastFocus = document.activeElement;
      pal.classList.add("is-open");
      pal.setAttribute("aria-hidden", "false");
      input.value = ""; sel = 0; render();
      setTimeout(() => input.focus(), 30);
    }
    function close() {
      if (!pal.classList.contains("is-open")) return;
      pal.classList.remove("is-open");
      pal.setAttribute("aria-hidden", "true");
      if (lastFocus && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
    }
    function exec(i) {
      const a = filtered[i];
      if (!a) return;
      close();
      setTimeout(a.run, 120);
    }

    input.addEventListener("input", () => { sel = 0; render(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, filtered.length); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(1, filtered.length); render(); }
      else if (e.key === "Enter") { e.preventDefault(); exec(sel); }
    });
    list.addEventListener("click", (e) => { const li = e.target.closest("[data-i]"); if (li) exec(+li.dataset.i); });
    list.addEventListener("mousemove", (e) => {
      const li = e.target.closest("[data-i]");
      if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; render(); }
    });
    pal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    $("#cmdOpen").addEventListener("click", open);

    addEventListener("keydown", (e) => {
      const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        pal.classList.contains("is-open") ? close() : open();
      } else if (e.key === "/" && !typing && !pal.classList.contains("is-open")) {
        e.preventDefault(); open();
      } else if (e.key === "Escape") close();
    });
  }

  /* ---------- delegated buttons ---------- */
  function initDelegates() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-terminal]")) { e.preventDefault(); Terminal.focus(); }
      if (e.target.closest("[data-copy-email]")) { e.preventDefault(); copyEmail(); }
    });
  }

  /* ---------- easter eggs ---------- */
  function initEggs() {
    const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let k = 0;
    addEventListener("keydown", (e) => {
      k = e.key === code[k] || e.key.toLowerCase() === code[k] ? k + 1 : (e.key === code[0] ? 1 : 0);
      if (k === code.length) {
        k = 0;
        FX.matrixRain();
        FX.confetti();
        FX.toast("Cheat code accepted", "God mode: ON. You found the secret.", "🕹️");
      }
    });

    const title = document.title;
    document.addEventListener("visibilitychange", () => {
      document.title = document.hidden ? "👀 Come back, the AI misses you" : title;
    });

    console.log("%c KG. ", "background:#d4ff3f;color:#000;font:800 28px Syne,Arial Black,sans-serif;padding:6px 14px;border-radius:8px");
    console.log("%cHey, curious dev 👀  You clearly know your way around devtools. Let's talk: run  sudo hire-me  in the terminal section.", "color:#d4ff3f;font:13px monospace");
  }

  /* ---------- go ---------- */
  function start() {
    FX.fxInit();
    FX.initReveal();
    Sections.init();
    Terminal.init();
    FX.initCursor();
    FX.initMagnetic();
    FX.initSpot();
    initNav();
    initPalette();
    initDelegates();
    initEggs();
    boot();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
