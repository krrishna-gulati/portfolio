/* =====================================================================
   SECTIONS: about, journey, stack, mcp, work, achievements, contact
   ===================================================================== */
(function () {
  const { $, $$, clamp, lerp, rand, esc, reduce, fine } = FX;
  const D = window.PORTFOLIO;
  const LIME = "#d4ff3f", VIOLET = "#8b5cf6", CYAN = "#22d3ee";

  function sizeCanvas(cv) {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  /* ================================================================
     ABOUT: words light up as you scroll
     ================================================================ */
  function initAbout() {
    const el = $("#aboutText");
    let inHl = false;
    el.innerHTML = D.about.split(/\s+/).map((tok) => {
      const starts = tok.startsWith("*");
      const ends = /\*[.,!?;:]*$/.test(tok);
      const word = tok.replace(/\*/g, "");
      if (starts) inHl = true;
      const hl = inHl;
      if (ends) inHl = false;
      return `<span class="w${hl ? " hl" : ""}">${esc(word)}</span>`;
    }).join(" ");
    const words = $$(".w", el);
    let lastN = -1;
    FX.onScroll(() => {
      const r = el.getBoundingClientRect();
      const start = innerHeight * 0.85, end = innerHeight * 0.4;
      const p = reduce ? 1 : clamp((start - r.top) / (r.height + start - end), 0, 1);
      const n = Math.ceil(p * words.length);
      if (n === lastN) return;
      lastN = n;
      words.forEach((w, i) => w.classList.toggle("lit", i < n));
    });

    const stats = $("#stats");
    stats.innerHTML = D.stats.map((s, i) => `
      <div class="stat" data-reveal style="--d:${i * 0.08}s">
        <div class="stat__v"><b data-count="${s.value}">0</b><span>${esc(s.suffix)}</span></div>
        <div class="stat__l">${esc(s.label)}</div>
      </div>`).join("");
    $$(".stat", stats).forEach(FX.observeReveal);
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      $$("[data-count]", stats).forEach((b) => FX.countUp(b, +b.dataset.count));
      io.disconnect();
    }), { threshold: 0.4 });
    io.observe(stats);
  }

  /* ================================================================
     JOURNEY: pinned horizontal "level-up" track with XP HUD
     ================================================================ */
  function initJourney() {
    const sec = $("#journey"), track = $("#journeyTrack");
    const line = $(".journey__line", track), fill = $("#journeyLineFill");
    const hud = $(".hud"), hudLevel = $("#hudLevel"), hudTitle = $("#hudTitle"), hudXp = $("#hudXp"), hudXpText = $("#hudXpText");
    const MAX_XP = (D.journey.length - 1) * 1000;

    track.insertAdjacentHTML("beforeend", D.journey.map((j) => `
      <div class="level${j.current ? " level--current" : ""}">
        <div class="level__node">${String(j.level).padStart(2, "0")}</div>
        <article class="level__card">
          <span class="level__big" aria-hidden="true">${String(j.level).padStart(2, "0")}</span>
          ${j.current ? '<span class="level__current-tag">● NOW</span>' : ""}
          <span class="level__badge">LVL ${j.level} · ${esc(j.badge)}</span>
          <h3 class="level__title">${esc(j.title)}</h3>
          <p class="level__org">${esc(j.org)}</p>
          <p class="level__meta">${esc(j.period)}${j.place ? " · " + esc(j.place) : ""}</p>
          <ul class="level__pts">${j.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </article>
      </div>`).join("") +
      `<div class="level level--end" aria-hidden="true"><p>To be continued<span>…</span><br>next level loading.</p></div>`);

    const levels = $$(".level:not(.level--end)", track);
    const mq = matchMedia("(max-width: 860px)");
    let maxX = 0, current = -1, celebrated = false;

    function layout() {
      const first = levels[0], last = levels[levels.length - 1];
      if (mq.matches) {
        sec.style.height = "";
        track.style.transform = "";
        Object.assign(line.style, {
          left: first.offsetLeft + 22 + "px", top: first.offsetTop + 23 + "px",
          width: "2px", height: last.offsetTop - first.offsetTop + "px"
        });
      } else {
        const end = track.lastElementChild;
        const contentW = end.offsetLeft + end.offsetWidth + parseFloat(getComputedStyle(track).paddingRight);
        maxX = Math.max(0, contentW - sec.clientWidth);
        sec.style.height = maxX + innerHeight + "px";
        Object.assign(line.style, {
          left: first.offsetLeft + 23 + "px", top: first.offsetTop + 22 + "px",
          width: last.offsetLeft - first.offsetLeft + "px", height: "2px"
        });
      }
      update();
    }

    function setLevel(idx) {
      if (idx === current) return;
      const up = idx > current && current !== -1;
      current = idx;
      levels.forEach((l, i) => l.classList.toggle("is-reached", i <= idx));
      if (idx < 0) return;
      const j = D.journey[idx];
      hudLevel.textContent = j.level;
      FX.scramble(hudTitle, j.title.toUpperCase(), 500);
      if (up) {
        hud.classList.add("is-flash");
        setTimeout(() => hud.classList.remove("is-flash"), 500);
        if (j.current && !celebrated) {
          celebrated = true;
          FX.toast("Achievement unlocked", j.title + " · " + j.org, "🏆");
          const r = (mq.matches ? levels[idx] : hud).getBoundingClientRect();
          FX.confetti(r.left + r.width / 2, r.top + r.height / 2, 120);
        } else if (!mq.matches) {
          FX.toast("Level up · LVL " + j.level, j.title + " @ " + j.org, "⚡", 1800);
        }
      }
    }

    function update() {
      let frac;
      if (mq.matches) {
        const first = levels[0].getBoundingClientRect();
        const lineH = parseFloat(line.style.height) || 1;
        const play = innerHeight * 0.7;
        frac = clamp((play - first.top - 23) / lineH, 0, 1);
        fill.style.width = "100%";
        fill.style.height = frac * 100 + "%";
        let idx = -1;
        levels.forEach((l, i) => { if (l.getBoundingClientRect().top + 23 < play) idx = i; });
        setLevel(idx);
      } else {
        const total = sec.offsetHeight - innerHeight;
        const p = total > 0 ? clamp(-sec.getBoundingClientRect().top / total, 0, 1) : 0;
        track.style.transform = `translate3d(${-p * maxX}px,0,0)`;
        frac = clamp(p / 0.88, 0, 1);
        fill.style.height = "100%";
        fill.style.width = frac * 100 + "%";
        setLevel(Math.floor(frac * (levels.length - 1) + 1e-4));
      }
      hudXp.style.width = frac * 100 + "%";
      hudXpText.textContent = `${Math.round(frac * MAX_XP)} / ${MAX_XP}`;
    }

    layout();
    FX.onScroll(update);
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
    mq.addEventListener("change", layout);
    if (document.fonts) document.fonts.ready.then(layout);
    addEventListener("load", layout);
  }

  /* ================================================================
     STACK: bento cards, neural net, typing code, marquee
     ================================================================ */
  function initStack() {
    for (const [k, s] of Object.entries(D.skills)) {
      const t = $(`[data-skill-title="${k}"]`), b = $(`[data-skill-blurb="${k}"]`), c = $(`[data-skill-chips="${k}"]`);
      if (t) t.textContent = s.title;
      if (b) b.textContent = s.blurb;
      if (c) c.innerHTML = s.chips.map((x) => `<li>${esc(x)}</li>`).join("");
    }
    $("#aiTools").innerHTML = D.aiTools.map((t) => `<li>${esc(t)}<span>connected</span></li>`).join("");

    const item = (t) => `<span class="marquee__item">${esc(t)}</span><span class="marquee__item star">✦</span>`;
    const row = (arr) => { const h = arr.map(item).join(""); return h + h; };
    $("#marqueeA").innerHTML = row(D.marquee);
    $("#marqueeB").innerHTML = row(D.marquee.slice().reverse());

    initNeuralNet();
    initCodeTyping();
  }

  function initNeuralNet() {
    const cv = $("#nnCanvas");
    const layers = [4, 6, 6, 3];
    let ctx, w, h, nodes = [], pulses = [], visible = false, raf = 0, lastSpawn = 0;

    function size() {
      ({ ctx, w, h } = sizeCanvas(cv));
      nodes = layers.map((n, li) => Array.from({ length: n }, (_, i) => ({
        x: w * 0.2 + li * ((w * 0.7) / (layers.length - 1)),
        y: h * 0.12 + ((i + 1) * (h * 0.76)) / (n + 1),
        g: 0
      })));
    }
    function spawn(li, a) {
      if (li >= layers.length - 1) return;
      const k = 1 + ((Math.random() * 2) | 0);
      for (let i = 0; i < k; i++) pulses.push({ li, a, b: (Math.random() * layers[li + 1]) | 0, t: 0, sp: rand(0.014, 0.028) });
    }
    function frame(now) {
      if (!visible) { raf = 0; return; }
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let li = 0; li < nodes.length - 1; li++)
        for (const a of nodes[li]) for (const b of nodes[li + 1]) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
      ctx.stroke();

      if (now - lastSpawn > 420) { lastSpawn = now; spawn(0, (Math.random() * layers[0]) | 0); }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.sp;
        const A = nodes[p.li][p.a], B = nodes[p.li + 1][p.b];
        if (p.t >= 1) {
          B.g = 1;
          if (Math.random() < 0.75) spawn(p.li + 1, p.b);
          pulses.splice(i, 1);
          continue;
        }
        const x = lerp(A.x, B.x, p.t), y = lerp(A.y, B.y, p.t);
        ctx.strokeStyle = "rgba(212,255,63,0.35)";
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = "rgba(212,255,63,0.18)";
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.fill();
        ctx.fillStyle = LIME;
        ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.283); ctx.fill();
      }
      for (const layer of nodes) for (const n of layer) {
        n.g *= 0.94;
        ctx.fillStyle = "#0c0c11";
        ctx.strokeStyle = n.g > 0.05 ? `rgba(212,255,63,${0.3 + n.g * 0.7})` : "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, 6 + n.g * 3, 0, 6.283); ctx.fill(); ctx.stroke();
        if (n.g > 0.05) {
          ctx.fillStyle = `rgba(212,255,63,${n.g})`;
          ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, 6.283); ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    }
    size();
    addEventListener("resize", size);
    if (reduce) { visible = true; frame(0); visible = false; return; }
    FX.onVisible(cv, (v) => { visible = v; if (v && !raf) raf = requestAnimationFrame(frame); });
  }

  function initCodeTyping() {
    const el = $("#codeType");
    const src = [
      "// ship.js · built with AI as co-pilot",
      "const agent = new Agent({ tools: [zoho, azure] });",
      'const res = await agent.run("triage complaints");',
      "await loyalty.reward(res.customer, 120);",
      'console.log("shipped ✓");'
    ].join("\n");
    // tokenize once: [className, text]
    const re = /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|\b(const|await|new|async|return|let)\b|([A-Za-z_]\w*)(?=\()/g;
    const toks = [];
    let last = 0, m;
    while ((m = re.exec(src))) {
      if (m.index > last) toks.push(["", src.slice(last, m.index)]);
      toks.push([m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : "f", m[0]]);
      last = re.lastIndex;
    }
    if (last < src.length) toks.push(["", src.slice(last)]);

    const render = (n) => {
      let out = "", left = n;
      for (const [c, t] of toks) {
        if (left <= 0) break;
        const s = t.slice(0, left);
        left -= s.length;
        out += c ? `<span class="${c}">${esc(s)}</span>` : esc(s);
      }
      el.innerHTML = out + '<span class="cur"></span>';
    };
    if (reduce) { render(src.length); return; }

    let n = 0, visible = false, timer = 0;
    const tick = () => {
      if (!visible) { timer = 0; return; }
      n++;
      render(n);
      if (n >= src.length) { timer = setTimeout(() => { n = 0; tick(); }, 3200); return; }
      const ch = src[n - 1];
      timer = setTimeout(tick, ch === "\n" ? 260 : rand(18, 55));
    };
    render(0);
    FX.onVisible(el, (v) => { visible = v; if (v && !timer) tick(); });
  }

  /* ================================================================
     MCP: animated agent ↔ tools graph with live log
     ================================================================ */
  function initMCP() {
    const svg = $("#mcpSvg"), log = $("#mcpLog");
    const NS = "http://www.w3.org/2000/svg";
    const C = 300, RAD = 222;
    const mk = (tag, attrs = {}, parent = svg) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      parent.appendChild(e);
      return e;
    };

    const defs = mk("defs");
    const f = mk("filter", { id: "glow", x: "-100%", y: "-100%", width: "300%", height: "300%" }, defs);
    mk("feGaussianBlur", { stdDeviation: "3", result: "b" }, f);
    const fm = mk("feMerge", {}, f);
    mk("feMergeNode", { in: "b" }, fm);
    mk("feMergeNode", { in: "SourceGraphic" }, fm);

    mk("circle", { class: "mcp-ring", cx: C, cy: C, r: RAD });
    mk("circle", { class: "mcp-ring", cx: C, cy: C, r: 130, "stroke-dasharray": "2 6" });

    const edgeG = mk("g"), packetG = mk("g"), nodeG = mk("g");
    const nodes = D.mcp.map((n, i) => {
      const a = (i / D.mcp.length) * Math.PI * 2 - Math.PI / 2;
      const x = C + Math.cos(a) * RAD, y = C + Math.sin(a) * RAD;
      const edge = mk("line", { class: "mcp-edge", x1: C, y1: C, x2: x, y2: y }, edgeG);
      const g = mk("g", { class: "mcp-node", tabindex: "0", role: "button", "aria-label": `Call ${n.label}` }, nodeG);
      mk("circle", { cx: x, cy: y, r: 34 }, g);
      const t1 = mk("text", { x, y, "font-weight": "700" }, g);
      t1.textContent = n.short || n.label.slice(0, 2).toUpperCase();
      t1.style.fontSize = "16px";
      const above = y < C - 10;
      const t2 = mk("text", { x, y: y + (above ? -52 : 52) }, g);
      t2.textContent = n.label;
      t2.style.fill = "#8d8d9c";
      t2.style.fontSize = "14px";
      const node = { ...n, x, y, edge, g, busy: 0 };
      const fire = () => send(node, true);
      g.addEventListener("click", fire);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } });
      return node;
    });

    const hub = mk("g", { class: "mcp-hub" });
    mk("circle", { class: "halo", cx: C, cy: C, r: 58 }, hub);
    mk("circle", { class: "halo halo2", cx: C, cy: C, r: 58 }, hub);
    mk("circle", { class: "core", cx: C, cy: C, r: 58, filter: "url(#glow)" }, hub);
    const ht = mk("text", { x: C, y: C - 6 }, hub); ht.textContent = "LLM";
    const hs = mk("text", { class: "sub", x: C, y: C + 14 }, hub); hs.textContent = "agent · mcp";

    const packets = [];
    function addLog(html, cls) {
      const d = document.createElement("div");
      d.className = cls;
      d.innerHTML = html;
      log.appendChild(d);
      while (log.children.length > 9) log.firstElementChild.remove();
    }
    addLog(`$ mcp connect --servers ${nodes.length}`, "sys");
    addLog(`✓ ${nodes.length} tools registered · handshake ok`, "res");

    function send(node, manual) {
      const el = mk("circle", { r: 4.5, fill: CYAN, filter: "url(#glow)", cx: C, cy: C }, packetG);
      packets.push({ node, dir: 1, t: 0, sp: manual ? 0.03 : rand(0.012, 0.02), el });
      node.busy++;
      node.edge.classList.add("is-hot");
      addLog(`→ tools/call <b>${esc(node.call)}</b>()`, "req");
      if (reduce) step(performance.now());
    }

    let visible = false, raf = 0, lastAuto = 0;
    function step(now) {
      if (!visible && !reduce) { raf = 0; return; }
      if (now - lastAuto > 1300) { lastAuto = now; send(nodes[(Math.random() * nodes.length) | 0], false); }
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.t += reduce ? 1 : p.sp;
        const tt = clamp(p.t, 0, 1);
        const e = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
        const from = p.dir === 1 ? { x: C, y: C } : p.node, to = p.dir === 1 ? p.node : { x: C, y: C };
        p.el.setAttribute("cx", lerp(from.x, to.x, e));
        p.el.setAttribute("cy", lerp(from.y, to.y, e));
        if (p.t >= 1) {
          if (p.dir === 1) {
            p.dir = -1; p.t = 0;
            p.el.setAttribute("fill", LIME);
            p.node.g.classList.add("is-hot");
            setTimeout(() => p.node.g.classList.remove("is-hot"), 380);
            addLog(`← ${esc(p.node.id)} · 200 OK · ${(rand(18, 140)) | 0}ms`, "res");
          } else {
            p.el.remove();
            packets.splice(i, 1);
            if (--p.node.busy <= 0) { p.node.busy = 0; p.node.edge.classList.remove("is-hot"); }
          }
        }
      }
      if (!reduce) raf = requestAnimationFrame(step);
    }
    if (reduce) return;
    FX.onVisible(svg, (v) => { visible = v; if (v && !raf) raf = requestAnimationFrame(step); });
  }

  /* ================================================================
     SORTING VISUALISER (card loop + interactive modal demo)
     ================================================================ */
  function* bubble(a) {
    for (let i = 0; i < a.length; i++)
      for (let j = 0; j < a.length - i - 1; j++) {
        yield { cmp: [j, j + 1] };
        if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; yield { swap: [j, j + 1] }; }
      }
  }
  function* insertion(a) {
    for (let i = 1; i < a.length; i++)
      for (let j = i; j > 0; j--) {
        yield { cmp: [j - 1, j] };
        if (a[j - 1] > a[j]) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; yield { swap: [j - 1, j] }; } else break;
      }
  }
  function* selection(a) {
    for (let i = 0; i < a.length; i++) {
      let m = i;
      for (let j = i + 1; j < a.length; j++) { yield { cmp: [m, j] }; if (a[j] < a[m]) m = j; }
      if (m !== i) { [a[i], a[m]] = [a[m], a[i]]; yield { swap: [i, m] }; }
    }
  }
  function* quick(a, lo = 0, hi = a.length - 1) {
    if (lo >= hi) return;
    const p = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      yield { cmp: [j, hi] };
      if (a[j] < p) { [a[i], a[j]] = [a[j], a[i]]; yield { swap: [i, j] }; i++; }
    }
    [a[i], a[hi]] = [a[hi], a[i]];
    yield { swap: [i, hi] };
    yield* quick(a, lo, i - 1);
    yield* quick(a, i + 1, hi);
  }
  function* merge(a, lo = 0, hi = a.length - 1) {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    yield* merge(a, lo, mid);
    yield* merge(a, mid + 1, hi);
    const tmp = [];
    let i = lo, j = mid + 1;
    while (i <= mid && j <= hi) { yield { cmp: [i, j] }; tmp.push(a[i] <= a[j] ? a[i++] : a[j++]); }
    while (i <= mid) tmp.push(a[i++]);
    while (j <= hi) tmp.push(a[j++]);
    for (let k = 0; k < tmp.length; k++) { a[lo + k] = tmp[k]; yield { set: [lo + k] }; }
  }
  const ALGOS = { quick, bubble, merge, insertion, selection };

  class Sorter {
    constructor(cv, { n = 36, auto = false, label = true, onStats = null } = {}) {
      Object.assign(this, { cv, n, auto, label, onStats });
      this.order = Object.keys(ALGOS);
      this.ai = 0; this.speed = 2; this.acc = 0;
      this.visible = true; this.raf = 0; this.dead = false;
      this.algo = this.order[0];
      this.resize();
      this.reset();
    }
    resize() { Object.assign(this, sizeCanvas(this.cv)); this.draw(); }
    reset() {
      const a = Array.from({ length: this.n }, (_, i) => i + 1);
      for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
      Object.assign(this, { arr: a, gen: null, hl: null, sweep: -1, cmp: 0, sw: 0 });
      this.draw(); this.stats();
    }
    run(name = this.algo) {
      this.algo = name;
      // in auto (card) mode keep every algorithm's run to roughly 5 seconds
      if (this.auto) this.speed = ({ quick: 1.3, merge: 1.3, bubble: 4.5, insertion: 2.6, selection: 3.2 }[name] || 2) * (this.n / 44);
      this.reset();
      this.gen = ALGOS[name](this.arr);
      this.play();
    }
    play() { if (!this.raf && this.visible && !this.dead) this.raf = requestAnimationFrame(() => this.tick()); }
    tick() {
      this.raf = 0;
      if (this.dead || !this.visible) return;
      if (this.gen) {
        this.acc += reduce ? 9999 : this.speed;
        while (this.acc >= 1 && this.gen) {
          this.acc -= 1;
          const r = this.gen.next();
          if (r.done) { this.gen = null; this.hl = null; this.sweep = 0; break; }
          this.hl = r.value;
          if (r.value.cmp) this.cmp++; else this.sw++;
        }
        this.stats();
      } else if (this.sweep >= 0 && this.sweep < this.n) {
        this.sweep += Math.max(1, this.n / 28);
        if (this.sweep >= this.n && this.auto) {
          setTimeout(() => {
            if (this.dead) return;
            this.ai = (this.ai + 1) % this.order.length;
            this.run(this.order[this.ai]);
          }, 1300);
        }
      }
      this.draw();
      if (this.gen || (this.sweep >= 0 && this.sweep < this.n)) this.play();
    }
    draw() {
      const { ctx, w, h, n, arr } = this;
      if (!ctx || !arr) return;
      ctx.clearRect(0, 0, w, h);
      const top = this.label ? 40 : 12;
      const slot = w / n, gap = Math.max(1, slot * 0.2), bw = slot - gap;
      const hl = this.hl || {};
      for (let i = 0; i < n; i++) {
        const bh = (arr[i] / n) * (h - top - 4);
        let c = "rgba(255,255,255,0.2)";
        if (this.sweep >= 0 && i <= this.sweep) c = LIME;
        else if ((hl.swap && hl.swap.includes(i)) || (hl.set && hl.set.includes(i))) c = LIME;
        else if (hl.cmp && hl.cmp.includes(i)) c = VIOLET;
        ctx.fillStyle = c;
        ctx.fillRect(i * slot + gap / 2, h - bh, bw, bh);
      }
      if (this.label) {
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillStyle = LIME;
        ctx.fillText(`${this.algo.toUpperCase()} SORT`, 14, 24);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText(`cmp ${this.cmp} · writes ${this.sw}`, 14 + ctx.measureText(`${this.algo.toUpperCase()} SORT`).width + 14, 24);
      }
    }
    stats() { if (this.onStats) this.onStats(this.cmp, this.sw); }
    setVisible(v) { this.visible = v; if (v && (this.gen || (this.sweep >= 0 && this.sweep < this.n))) this.play(); }
    destroy() { this.dead = true; cancelAnimationFrame(this.raf); }
  }

  /* ---------- brain scan card visual ---------- */
  function initScan(cv) {
    let ctx, w, h, visible = false, raf = 0;
    const size = () => ({ ctx, w, h } = sizeCanvas(cv));
    size();
    addEventListener("resize", size);
    function frame(t) {
      if (!visible && !reduce) { raf = 0; return; }
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2 + 6, R = Math.min(w / 2.6, h) * 0.4;
      for (let k = 0; k < 7; k++) {
        const rk = R * (1 - k * 0.13);
        ctx.strokeStyle = `rgba(255,255,255,${0.07 + k * 0.025})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let a = 0; a <= 6.3; a += 0.07) {
          const rr = rk * (1 + 0.06 * Math.sin(5 * a + k * 0.7 + t * 0.0005) + 0.035 * Math.sin(11 * a - k));
          const x = cx + Math.cos(a) * rr * 1.3, y = cy + Math.sin(a) * rr * 0.95;
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath(); ctx.moveTo(cx, cy - R * 0.95); ctx.lineTo(cx, cy + R * 0.9); ctx.stroke();

      const cycle = (t * 0.00022) % 1.25;
      const sx = cx - R * 1.5 + Math.min(cycle, 1) * R * 3;
      const hx = cx + R * 0.48, hy = cy - R * 0.22;
      const g = ctx.createLinearGradient(sx - 40, 0, sx, 0);
      g.addColorStop(0, "rgba(34,211,238,0)"); g.addColorStop(1, "rgba(34,211,238,0.35)");
      ctx.fillStyle = g; ctx.fillRect(sx - 40, 0, 40, h);
      ctx.fillStyle = CYAN; ctx.fillRect(sx, 0, 1.5, h);

      if (sx > hx || cycle > 1) {
        const a = clamp(cycle > 1 ? 1 - (cycle - 1) * 4 : 1, 0, 1);
        const rg = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.28);
        rg.addColorStop(0, `rgba(255,77,141,${0.7 * a})`); rg.addColorStop(1, "rgba(255,77,141,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(hx, hy, R * 0.28, 0, 6.283); ctx.fill();
        const s = R * 0.36;
        ctx.strokeStyle = `rgba(212,255,63,${a})`; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
        ctx.strokeRect(hx - s / 2, hy - s / 2, s, s); ctx.setLineDash([]);
        ctx.font = '600 10px "JetBrains Mono", monospace'; ctx.fillStyle = `rgba(212,255,63,${a})`;
        ctx.fillText("ROI DETECTED", hx - s / 2, hy - s / 2 - 6);
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    if (reduce) { frame(4000); return; }
    FX.onVisible(cv, (v) => { visible = v; if (v && !raf) raf = requestAnimationFrame(frame); });
  }

  /* ================================================================
     WORK: filters, tilt cards, modal
     ================================================================ */
  const CAT = { all: "All", ai: "AI & Agents", ml: "ML", apps: "Apps", enterprise: "Enterprise", dev: "Dev", hackathon: "Hackathon" };

  function initWork() {
    const grid = $("#projects"), filters = $("#filters");
    const cats = ["all", ...Object.keys(CAT).filter((c) => c !== "all" && D.projects.some((p) => p.category === c))];
    filters.innerHTML = cats.map((c, i) => {
      const n = c === "all" ? D.projects.length : D.projects.filter((p) => p.category === c).length;
      return `<button class="filter${i === 0 ? " is-active" : ""}" role="tab" aria-selected="${i === 0}" data-cat="${c}">${CAT[c]}<sup>${n}</sup></button>`;
    }).join("");

    grid.innerHTML = D.projects.map((p, i) => {
      const visual = p.visual
        ? `<canvas data-visual="${p.visual}"></canvas>${p.visual === "scan" ? '<span class="card__visual-label">scan · inference</span>' : ""}`
        : `<div class="card__visual-grid"></div><div class="card__glyph">${esc(p.glyph || "◆")}</div>`;
      const blurb = p.blurb
        ? `<p class="card__blurb">${esc(p.blurb)}</p>`
        : `<p class="card__blurb is-soon">// case study compiling…</p>`;
      return `
        <article class="card${p.featured ? " card--featured" : ""}" data-cat="${p.category}" data-id="${p.id}" tabindex="0" role="button" aria-label="Open ${esc(p.title)}">
          <div class="card__visual">${visual}</div>
          <span class="card__arrow" aria-hidden="true">↗</span>
          <div class="card__body">
            <div class="card__meta"><span>${String(i + 1).padStart(2, "0")} / ${CAT[p.category] || ""}</span><span class="card__status">${esc(p.status || "")}</span></div>
            <h3>${esc(p.title)}</h3>
            <p class="card__sub">${esc(p.subtitle || "")}</p>
            ${blurb}
            <ul class="chips">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          </div>
        </article>`;
    }).join("");

    const cards = $$(".card", grid);
    cards.forEach((card) => {
      const p = D.projects.find((x) => x.id === card.dataset.id);
      card.addEventListener("click", () => openProject(p.id));
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProject(p.id); } });
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty("--mx", x + "px");
        card.style.setProperty("--my", y + "px");
        if (!fine || reduce) return;
        card.classList.add("is-tilting");
        card.style.setProperty("--rx", (0.5 - y / r.height) * 7 + "deg");
        card.style.setProperty("--ry", (x / r.width - 0.5) * 9 + "deg");
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilting");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });

      const cv = $("canvas[data-visual]", card);
      if (!cv) return;
      if (cv.dataset.visual === "scan") initScan(cv);
      if (cv.dataset.visual === "sorter") {
        const s = new Sorter(cv, { n: p.featured ? 44 : 28, auto: true });
        addEventListener("resize", () => s.resize());
        let started = false;
        FX.onVisible(cv, (v) => {
          s.setVisible(v);
          if (v && !started) { started = true; s.run("quick"); }
        });
      }
    });

    // staggered entrance the first time the grid scrolls into view
    if (!reduce) {
      grid.classList.add("pre");
      const io = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting) return;
        grid.classList.remove("pre");
        cards.forEach((card, i) => { card.style.animationDelay = Math.min(i, 8) * 0.07 + "s"; card.classList.add("is-entering"); });
        io.disconnect();
      }, { rootMargin: "0px 0px -10% 0px" });
      io.observe(grid);
    }

    filters.addEventListener("click", (e) => {
      const b = e.target.closest(".filter");
      if (!b) return;
      $$(".filter", filters).forEach((f) => { f.classList.toggle("is-active", f === b); f.setAttribute("aria-selected", f === b); });
      const c = b.dataset.cat;
      let k = 0;
      cards.forEach((card) => {
        const show = c === "all" || card.dataset.cat === c;
        card.classList.toggle("is-hidden", !show);
        card.classList.remove("is-entering");
        if (show) {
          void card.offsetWidth;
          card.style.animationDelay = k++ * 0.05 + "s";
          card.classList.add("is-entering");
        }
      });
      requestAnimationFrame(() => dispatchEvent(new Event("resize")));
    });
  }

  /* ---------- modal ---------- */
  let modalSorter = null, lastFocus = null;
  function openProject(id) {
    const p = D.projects.find((x) => x.id === id);
    if (!p) return;
    const modal = $("#modal"), content = $("#modalContent");
    const details = Array.isArray(p.details) && p.details.length;
    const links = Array.isArray(p.links) ? p.links : [];
    content.innerHTML = `
      <p class="m__eyebrow">${esc(CAT[p.category] || "")} · ${esc(p.status || "")}</p>
      <h3 class="m__title" id="modalTitle">${esc(p.title)}</h3>
      <p class="m__sub">${esc(p.subtitle || "")}</p>
      ${p.blurb ? `<p class="m__blurb">${esc(p.blurb)}</p>` : ""}
      ${details ? p.details.map((d) => `<p class="m__blurb">${esc(d)}</p>`).join("") : ""}
      <ul class="chips">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      ${p.demo === "sorter" ? `
        <div class="sorter">
          <canvas id="modalSorter"></canvas>
          <div class="sorter__ctrl">
            ${Object.keys(ALGOS).map((a, i) => `<button data-algo="${a}" class="${i === 0 ? "is-active" : ""}">${a}</button>`).join("")}
            <button data-shuffle>shuffle ⟳</button>
            <label>speed <input type="range" min="1" max="30" value="6" id="sortSpeed"></label>
          </div>
          <div class="sorter__stats"><span>comparisons <b id="sCmp">0</b></span><span>writes <b id="sSw">0</b></span></div>
        </div>` : ""}
      ${links.length ? `<div class="m__links">${links.map((l) => `<a class="btn btn--ghost btn--sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}</div>` : ""}
      ${details ? "" : `<div class="m__soon"><i></i>Full case study (stack, architecture & results) dropping soon.</div>`}`;

    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => $(".modal__close", modal).focus({ preventScroll: true }), 50);

    if (p.demo === "sorter") {
      requestAnimationFrame(() => {
        const cmp = $("#sCmp"), sw = $("#sSw");
        modalSorter = new Sorter($("#modalSorter"), { n: 60, onStats: (c, s) => { cmp.textContent = c; sw.textContent = s; } });
        const speed = $("#sortSpeed");
        const setSpeed = () => (modalSorter.speed = Math.pow(+speed.value, 1.6) / 4);
        setSpeed();
        speed.addEventListener("input", setSpeed);
        $(".sorter__ctrl", content).addEventListener("click", (e) => {
          const b = e.target.closest("button");
          if (!b) return;
          if (b.dataset.shuffle !== undefined) { modalSorter.reset(); return; }
          $$(".sorter__ctrl button[data-algo]", content).forEach((x) => x.classList.toggle("is-active", x === b));
          modalSorter.run(b.dataset.algo);
        });
        setTimeout(() => modalSorter && modalSorter.run("quick"), 400);
      });
    }
  }
  function closeModal() {
    const modal = $("#modal");
    if (!modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (modalSorter) { modalSorter.destroy(); modalSorter = null; }
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  function initModal() {
    const modal = $("#modal");
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  }

  /* ================================================================
     ACHIEVEMENTS & CONTACT
     ================================================================ */
  function initCerts() {
    const grid = $("#certsGrid");
    const list = D.certificates || [];
    grid.innerHTML = list.length
      ? list.map((c, i) => `
          <article class="cert" data-reveal style="--d:${i * 0.06}s">
            <div class="cert__icon">🏅</div>
            <h3>${esc(c.title)}</h3>
            <p>${esc(c.issuer || "")}${c.date ? " · " + esc(c.date) : ""}</p>
            ${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">verify credential ↗</a>` : ""}
          </article>`).join("")
      : [1, 2, 3].map((i) => `
          <article class="cert cert--locked" data-reveal style="--d:${i * 0.06}s">
            <div class="cert__icon">🔒</div>
            <h3>Locked achievement</h3>
            <p class="mono">certificate_0${i}.unlock() in progress…</p>
            <div class="cert__bar"><i></i></div>
          </article>`).join("");
    $$(".cert", grid).forEach(FX.observeReveal);
  }

  function initContact() {
    const cta = $("#contactCta"), links = $("#contactLinks");
    const tel = D.phone ? "tel:" + D.phone.replace(/[^\d+]/g, "") : "";
    if (D.email) cta.href = "mailto:" + D.email;
    else if (D.linkedin) { cta.href = D.linkedin; cta.target = "_blank"; cta.rel = "noopener"; }
    else if (tel) cta.href = tel;
    else cta.addEventListener("click", (e) => { e.preventDefault(); FX.toast("Almost there", "Contact links are being wired up. Check back soon!", "📡"); });

    const items = [];
    if (D.linkedin) items.push(`<a href="${esc(D.linkedin)}" target="_blank" rel="noopener" data-magnetic>LinkedIn ↗</a>`);
    if (D.github) items.push(`<a href="${esc(D.github)}" target="_blank" rel="noopener" data-magnetic>GitHub ↗</a>`);
    if (D.email) items.push(`<button data-copy-email data-magnetic>${esc(D.email)} ⧉</button>`);
    if (tel) items.push(`<a href="${esc(tel)}" data-magnetic>${esc(D.phone)} ☎</a>`);
    items.push(`<a href="${esc(D.resume)}" target="_blank" rel="noopener" data-magnetic>Resume ↓</a>`);
    items.push(`<button data-open-terminal data-magnetic>Open terminal &gt;_</button>`);
    links.innerHTML = items.join("");
    $("#year").textContent = new Date().getFullYear();
  }

  window.Sections = {
    init() {
      initAbout();
      initJourney();
      initStack();
      initMCP();
      initWork();
      initModal();
      initCerts();
      initContact();
    },
    openProject,
    closeModal
  };
})();
