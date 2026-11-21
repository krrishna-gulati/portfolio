/* =====================================================================
   FX: shared utilities & global effects
   ===================================================================== */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- scroll dispatcher (one rAF-throttled listener) ---------- */
  const scrollFns = [];
  let ticking = false;
  function runScroll() {
    ticking = false;
    for (const fn of scrollFns) fn();
  }
  function requestScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(runScroll); }
  }
  addEventListener("scroll", requestScroll, { passive: true });
  addEventListener("resize", requestScroll);
  const onScroll = (fn) => { scrollFns.push(fn); fn(); };

  /* ---------- visibility helper (pause canvases off-screen) ---------- */
  function onVisible(el, cb, rootMargin = "100px") {
    const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin });
    io.observe(el);
    return io;
  }

  /* ---------- text scramble ---------- */
  const GLYPHS = "!<>-_\\/[]{}=+*^?#01XYZ$%&";
  function scrambleRun(from, to, set, duration = 900) {
    if (reduce) { set(to); return Promise.resolve(); }
    const len = Math.max(from.length, to.length);
    const q = [];
    for (let i = 0; i < len; i++) {
      const start = Math.random() * duration * 0.45;
      q.push({ from: from[i] || "", to: to[i] || "", start, end: start + 140 + Math.random() * duration * 0.55, ch: "" });
    }
    const t0 = performance.now();
    return new Promise((res) => {
      const tick = (now) => {
        const t = now - t0;
        let out = "", done = 0;
        for (const c of q) {
          if (t >= c.end) { done++; out += c.to; }
          else if (t >= c.start && c.to !== " ") {
            if (!c.ch || Math.random() < 0.3) c.ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
            out += c.ch;
          } else out += c.from;
        }
        set(out);
        if (done === q.length) { set(to); res(); } else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  /** Scramble an element to new text (plain text element). */
  function scramble(el, text, duration) {
    return scrambleRun(el.textContent, text, (s) => (el.textContent = s), duration);
  }
  /** Scramble every text node in place (keeps nested markup like <em>). */
  function scrambleInPlace(el, duration = 1100) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return Promise.all(nodes.map((n) => {
      const txt = n.nodeValue;
      return scrambleRun(txt, txt, (s) => (n.nodeValue = s), duration);
    }));
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(kicker, title, icon = "🏆", ms = 3400) {
    const el = $("#toast");
    if (!el) return;
    el.innerHTML = `<span class="toast__icon">${icon}</span><span><span class="toast__k">${esc(kicker)}</span><span class="toast__t">${esc(title)}</span></span>`;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), ms);
  }

  /* ---------- count up ---------- */
  function countUp(el, to, dur = 1600) {
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- full-screen FX canvas: confetti + matrix rain ---------- */
  const fx = { cv: null, ctx: null, parts: [], matrix: null, running: false, w: 0, h: 0 };
  const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01KRISHNAGULATI<>/{}";
  function fxResize() {
    if (!fx.cv) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    fx.w = innerWidth; fx.h = innerHeight;
    fx.cv.width = fx.w * dpr; fx.cv.height = fx.h * dpr;
    fx.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function fxInit() {
    fx.cv = $("#fxCanvas");
    if (!fx.cv) return;
    fx.ctx = fx.cv.getContext("2d");
    fxResize();
    addEventListener("resize", fxResize);
  }
  function fxStart() {
    if (!fx.running) { fx.running = true; requestAnimationFrame(fxLoop); }
  }
  function confetti(x = innerWidth / 2, y = innerHeight / 2, n = 160) {
    if (reduce || !fx.ctx) return;
    const colors = ["#d4ff3f", "#8b5cf6", "#22d3ee", "#ff4d8d", "#ffffff"];
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(4, 15);
      fx.parts.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - rand(3, 7),
        w: rand(5, 11), h: rand(3, 6), r: rand(0, 6), vr: rand(-0.3, 0.3),
        c: colors[i % colors.length], life: 1, decay: rand(0.005, 0.011)
      });
    }
    fxStart();
  }
  function matrixRain(ms = 6500) {
    if (reduce || !fx.ctx) return;
    const fs = 16;
    fx.matrix = { fs, drops: Array.from({ length: Math.ceil(fx.w / fs) }, () => rand(-40, 0)), until: performance.now() + ms, last: 0, fadeOut: 0 };
    document.body.classList.add("matrix-mode");
    fxStart();
  }
  function fxLoop(now) {
    const { ctx, w, h } = fx;
    const m = fx.matrix;
    if (m) {
      if (now - m.last > 45) {
        m.last = now;
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,0.14)";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
        if (now < m.until) {
          ctx.font = `${m.fs}px "JetBrains Mono", monospace`;
          for (let i = 0; i < m.drops.length; i++) {
            const y = m.drops[i] * m.fs;
            ctx.fillStyle = Math.random() < 0.05 ? "#eaffea" : "#00ff66";
            ctx.fillText(MATRIX_CHARS[(Math.random() * MATRIX_CHARS.length) | 0], i * m.fs, y);
            if (y > h && Math.random() > 0.97) m.drops[i] = 0;
            m.drops[i]++;
          }
        } else if (++m.fadeOut > 40) {
          fx.matrix = null;
          document.body.classList.remove("matrix-mode");
        }
      }
    } else {
      ctx.clearRect(0, 0, w, h);
    }
    for (let i = fx.parts.length - 1; i >= 0; i--) {
      const p = fx.parts[i];
      p.vy += 0.28; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= p.decay;
      if (p.life <= 0 || p.y > h + 40) { fx.parts.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 1.6);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (fx.matrix || fx.parts.length) requestAnimationFrame(fxLoop);
    else { ctx.clearRect(0, 0, w, h); fx.running = false; }
  }

  /* ---------- custom cursor ---------- */
  function initCursor() {
    if (!fine || reduce) return;
    document.documentElement.classList.add("has-cursor");
    const c = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, moved = false;
    c.style.opacity = "0"; // hidden until the first real mouse move
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!moved) { moved = true; rx = mx; ry = my; c.style.opacity = "1"; }
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });
    (function loop() {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-cursor], a, button, .card, .mcp-node, input, [role=button]");
      if (!t) { c.classList.remove("is-hover", "is-label"); return; }
      const l = t.getAttribute("data-cursor") || (t.classList.contains("card") ? "View" : "");
      if (l) { label.textContent = l; c.classList.add("is-label"); c.classList.remove("is-hover"); }
      else { c.classList.add("is-hover"); c.classList.remove("is-label"); }
    });
    document.addEventListener("mousedown", () => c.classList.add("is-down"));
    document.addEventListener("mouseup", () => c.classList.remove("is-down"));
    document.documentElement.addEventListener("mouseleave", () => (c.style.opacity = "0"));
    document.documentElement.addEventListener("mouseenter", () => (c.style.opacity = "1"));
  }

  /* ---------- magnetic buttons ---------- */
  function initMagnetic(root = document) {
    if (!fine || reduce) return;
    $$("[data-magnetic]", root).forEach((el) => {
      if (el._mag) return;
      el._mag = true;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.28}px, ${y * 0.38}px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- spotlight hover (sets --mx/--my) ---------- */
  function initSpot(root = document) {
    $$("[data-spot]", root).forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  /* ---------- reveal on scroll + scramble headings ---------- */
  let revealIO;
  function initReveal() {
    revealIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealIO.unobserve(e.target);
    }), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    $$("[data-reveal]").forEach((el) => revealIO.observe(el));

    const scrIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      scrambleInPlace(e.target);
      scrIO.unobserve(e.target);
    }), { threshold: 0.5 });
    $$("[data-scramble]").forEach((el) => scrIO.observe(el));
  }
  const observeReveal = (el) => revealIO && revealIO.observe(el);

  window.FX = {
    reduce, fine, $, $$, clamp, lerp, rand, esc,
    onScroll, onVisible, scramble, scrambleInPlace, toast, countUp,
    confetti, matrixRain, fxInit, initCursor, initMagnetic, initSpot, initReveal, observeReveal
  };
})();
