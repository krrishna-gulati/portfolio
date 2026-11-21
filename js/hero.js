/* =====================================================================
   HERO: interactive particle name
   Particles assemble into the name, flee the cursor, explode on click.
   ===================================================================== */
(function () {
  const { reduce, clamp, rand } = FX;
  const D = window.PORTFOLIO;
  const MAX_PARTICLES = 7000;
  const FONT = (px) => `800 ${px}px Syne, "Arial Black", Impact, sans-serif`;

  const H = {
    parts: [], groups: [], rings: [],
    w: 0, h: 0, dpr: 1, R: 110,
    mouse: { x: -9999, y: -9999 },
    spring: 0.003, running: false, visible: true, started: false
  };

  function init() {
    H.cv = document.getElementById("heroCanvas");
    H.ctx = H.cv.getContext("2d");
    H.stage = document.getElementById("heroStage");
    H.hero = document.getElementById("top");

    resize(true);
    // ResizeObserver also catches the scrollbar appearing once the loader finishes
    let rt;
    new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => resize(false), 150); }).observe(H.hero);

    const pos = (e) => {
      const r = H.cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    H.hero.addEventListener("pointermove", (e) => { const p = pos(e); H.mouse.x = p.x; H.mouse.y = p.y; });
    H.hero.addEventListener("pointerleave", () => { H.mouse.x = H.mouse.y = -9999; });
    H.hero.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") H.mouse.x = H.mouse.y = -9999; });
    H.hero.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      const p = pos(e);
      explode(p.x, p.y);
    });

    FX.onVisible(H.hero, (v) => { H.visible = v; if (v) loop(); }, "0px");
  }

  function resize(force) {
    const r = H.hero.getBoundingClientRect();
    // Ignore mobile URL-bar height jitter
    if (!force && Math.abs(r.width - H.w) < 2 && Math.abs(r.height - H.h) < 140) return;
    H.w = r.width; H.h = r.height;
    H.dpr = Math.min(devicePixelRatio || 1, 2);
    H.cv.width = Math.round(H.w * H.dpr);
    H.cv.height = Math.round(H.h * H.dpr);
    H.ctx.setTransform(H.dpr, 0, 0, H.dpr, 0, 0);
    build(!force);
    if (reduce || !H.started) drawStatic();
  }

  function build(keepPositions) {
    const hr = H.hero.getBoundingClientRect();
    const sr = H.stage.getBoundingClientRect();
    const box = { x: sr.left - hr.left, y: sr.top - hr.top, w: sr.width, h: Math.max(sr.height, 160) };
    const W = Math.ceil(H.w), Ht = Math.ceil(H.h);

    const oc = document.createElement("canvas");
    oc.width = W; oc.height = Ht;
    const o = oc.getContext("2d", { willReadFrequently: true });
    const lines = [D.first, D.last];

    o.font = FONT(100);
    const widest = Math.max(...lines.map((l) => o.measureText(l).width));
    const fs = Math.max(28, Math.min((100 * box.w * 0.98) / widest, box.h / lines.length / 0.9));
    const lh = fs * 0.9;
    o.font = FONT(fs);
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.fillStyle = "#fff";
    const cx = box.x + box.w / 2;
    const y0 = box.y + box.h / 2 - (lh * lines.length) / 2 + lh / 2;
    lines.forEach((l, i) => o.fillText(l, cx, y0 + i * lh));
    const split = y0 + lh / 2; // boundary between line 1 and line 2

    const data = o.getImageData(0, 0, W, Ht).data;
    // small (mobile) text needs denser sampling to stay legible
    let gap = fs < 90 ? 2 : Math.max(3, Math.round(fs / 34));
    let targets;
    const x0 = Math.max(0, Math.floor(box.x)), x1 = Math.min(W, Math.ceil(box.x + box.w));
    const yA = Math.max(0, Math.floor(box.y - fs * 0.2)), yB = Math.min(Ht, Math.ceil(box.y + box.h + fs * 0.2));
    do {
      targets = [];
      for (let y = yA; y < yB; y += gap)
        for (let x = x0; x < x1; x += gap)
          if (data[(y * W + x) * 4 + 3] > 128) targets.push([x, y]);
      if (targets.length > MAX_PARTICLES) gap++;
    } while (targets.length > MAX_PARTICLES);

    H.R = clamp(fs * 0.55, 60, 140);
    H.size = gap <= 2 ? 1.7 : Math.max(1.4, gap * 0.55);
    H.jitter = gap * 0.14; // idle "breathing" scaled to particle spacing

    const old = H.parts;
    H.parts = targets.map(([tx, ty], i) => {
      const line2 = ty > split;
      const accent = Math.random() < 0.06;
      const c = line2 ? (accent ? "#f2f2f5" : "#d4ff3f") : (accent ? "#8b5cf6" : "#f2f2f5");
      const prev = keepPositions && old[i];
      let x, y;
      if (prev) { x = prev.x; y = prev.y; }
      else if (reduce) { x = tx; y = ty; }
      else {
        // fly in from a ring around the stage
        const a = rand(0, Math.PI * 2), d = rand(0.6, 1.4) * Math.max(H.w, H.h) * 0.6;
        x = cx + Math.cos(a) * d; y = box.y + box.h / 2 + Math.sin(a) * d;
      }
      return { x, y, tx, ty, vx: 0, vy: 0, c, ph: Math.random() * 6.28 };
    });

    const byColor = new Map();
    for (const p of H.parts) {
      if (!byColor.has(p.c)) byColor.set(p.c, []);
      byColor.get(p.c).push(p);
    }
    H.groups = Array.from(byColor.entries());
  }

  function drawStatic() {
    const { ctx } = H;
    ctx.clearRect(0, 0, H.w, H.h);
    if (!H.started && !reduce) return;
    for (const [c, ps] of H.groups) {
      ctx.fillStyle = c;
      for (const p of ps) ctx.fillRect(p.tx, p.ty, H.size, H.size);
    }
  }

  function loop() {
    if (H.running || !H.started || reduce) return;
    H.running = true;
    requestAnimationFrame(frame);
  }

  function frame(t) {
    if (!H.visible || !H.started) { H.running = false; return; }
    const { ctx, R, size } = H;
    ctx.clearRect(0, 0, H.w, H.h);
    H.spring = Math.min(0.055, H.spring + 0.0005);
    const k = H.spring, mx = H.mouse.x, my = H.mouse.y, R2 = R * R, J = H.jitter;
    const tA = t * 0.0012, tB = t * 0.001;

    for (const [c, ps] of H.groups) {
      ctx.fillStyle = c;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2), f = (1 - d / R) * 2.8;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        p.vx = (p.vx + (p.tx + Math.sin(tA + p.ph) * J - p.x) * k) * 0.86;
        p.vy = (p.vy + (p.ty + Math.cos(tB + p.ph) * J - p.y) * k) * 0.86;
        p.x += p.vx; p.y += p.vy;
        ctx.fillRect(p.x, p.y, size, size);
      }
    }

    // shockwave rings
    for (let i = H.rings.length - 1; i >= 0; i--) {
      const r = H.rings[i];
      r.r += 16; r.a -= 0.028;
      if (r.a <= 0) { H.rings.splice(i, 1); continue; }
      if (r.r <= 0) continue;
      ctx.strokeStyle = `rgba(212,255,63,${r.a})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (H.started) return;
    H.started = true;
    H.spring = reduce ? 0.055 : 0.003;
    if (reduce) drawStatic(); else loop();
  }

  function explode(x = H.w / 2, y = H.h / 2) {
    if (reduce || !H.started) return;
    for (const p of H.parts) {
      const dx = p.x - x, dy = p.y - y, d = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const f = Math.min(55, 2600 / d) * rand(0.6, 1.25);
      p.vx += (dx / d) * f; p.vy += (dy / d) * f;
    }
    H.rings.push({ x, y, r: 0, a: 0.9 }, { x, y, r: -40, a: 0.6 });
  }

  window.Hero = { init, start, explode, center: () => ({ x: H.w / 2, y: H.h * 0.45 }) };
})();
