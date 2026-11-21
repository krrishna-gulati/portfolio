/* =====================================================================
   TERMINAL: a tiny interactive shell
   ===================================================================== */
(function () {
  const { $, esc } = FX;
  const D = window.PORTFOLIO;
  let out, input, body;
  const hist = [];
  let hi = 0;

  const pad = (s, n) => s + " ".repeat(Math.max(1, n - s.length));
  const link = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label || url)}</a>`;

  function print(html, cls = "") {
    const d = document.createElement("div");
    d.className = "o " + cls;
    d.innerHTML = html;
    out.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }

  const SECTIONS = { about: "#about", journey: "#journey", stack: "#stack", mcp: "#mcp", work: "#work", projects: "#work", achievements: "#certs", certs: "#certs", contact: "#contact", top: "#top" };

  const HELP = [
    ["whoami", "who's behind this site?"],
    ["about", "the short story"],
    ["experience", "the level-up log"],
    ["projects", "things I've built"],
    ["open <n>", "open project #n"],
    ["skills", "the stack"],
    ["ai", "my AI toolbelt & MCP setup"],
    ["contact", "how to reach me"],
    ["resume", "open my resume"],
    ["goto <section>", "jump to a section"],
    ["sudo hire-me", "you know you want to"],
    ["matrix", "follow the white rabbit"],
    ["clear", "clean slate"]
  ];

  const cmds = {
    help() {
      print(`<span class="hl">Available commands</span>\n` + HELP.map(([c, d]) => `  <span class="vi">${esc(pad(c, 16))}</span>${esc(d)}`).join("\n"));
    },
    whoami() {
      print(`<span class="hl">${esc(D.name)}</span>
${esc(D.role)} @ ${esc(D.company)}
B.Tech Electronics Engineering · PEC (Punjab Engineering College) · Class of 2026
ML enthusiast · software developer · app developer · MCP & API integrator`);
    },
    about() { print(esc(D.about.replace(/\*/g, ""))); },
    experience() {
      print(D.journey.map((j) =>
        `<span class="vi">[LVL ${j.level}]</span> <span class="hl">${esc(j.title)}</span>, ${esc(j.org)}  <span class="dim">${esc(j.period)}</span>${j.current ? '  <span class="hl">◀ you are here</span>' : ""}`
      ).join("\n"));
    },
    projects() {
      print(D.projects.map((p, i) => `  <span class="vi">${String(i + 1).padStart(2, "0")}</span>  ${esc(pad(p.title, 28))}<span class="dim">${esc(p.subtitle || "")}</span>`).join("\n") +
        `\n\n<span class="dim">tip: type</span> <span class="hl">open 2</span> <span class="dim">to open a project.</span>`);
    },
    open(args) {
      const n = parseInt(args[0], 10);
      const p = D.projects[n - 1];
      if (!p) return print(`usage: open &lt;1-${D.projects.length}&gt;`, "err");
      print(`opening <span class="hl">${esc(p.title)}</span>…`, "ok");
      setTimeout(() => window.Sections.openProject(p.id), 250);
    },
    skills() {
      print(Object.values(D.skills).map((s) => `<span class="hl">${esc(s.title)}</span>\n  ${s.chips.map(esc).join(" · ")}`).join("\n"));
    },
    ai() {
      print(`<span class="hl">AI toolbelt</span> (used daily)\n  ${D.aiTools.map(esc).join(" · ")}\n\n<span class="hl">MCP servers</span>\n` +
        D.mcp.map((m) => `  <span class="ok">●</span> ${esc(pad(m.label, 14))}<span class="dim">${esc(m.call)}()</span>`).join("\n"));
    },
    contact() {
      const lines = [];
      if (D.email) lines.push(`email     ${link("mailto:" + D.email, D.email)}`);
      if (D.phone) lines.push(`phone     <a href="tel:${esc(D.phone.replace(/[^\d+]/g, ""))}">${esc(D.phone)}</a>`);
      if (D.linkedin) lines.push(`linkedin  ${link(D.linkedin)}`);
      if (D.github) lines.push(`github    ${link(D.github)}`);
      print(lines.length ? lines.join("\n") : `<span class="dim">contact links dropping soon. Meanwhile:</span> <span class="hl">sudo hire-me</span>`);
    },
    linkedin() {
      if (!D.linkedin) return print("LinkedIn link coming soon 🔗", "dim");
      print("opening LinkedIn…", "ok");
      window.open(D.linkedin, "_blank", "noopener");
    },
    resume() {
      print(`opening ${link(D.resume, "resume.pdf")}…`, "ok");
      window.open(D.resume, "_blank", "noopener");
    },
    goto(args) {
      const sel = SECTIONS[(args[0] || "").toLowerCase()];
      if (!sel) return print(`usage: goto &lt;${Object.keys(SECTIONS).join("|")}&gt;`, "err");
      print(`→ ${esc(args[0])}`, "ok");
      setTimeout(() => $(sel).scrollIntoView({ behavior: FX.reduce ? "auto" : "smooth" }), 200);
    },
    sudo(args) {
      const what = args.join(" ").toLowerCase();
      if (/^hire(-?me)?$|^hire krrishna$/.test(what)) {
        print(`[sudo] password for recruiter: ********`, "dim");
        setTimeout(() => {
          print(`✓ access granted. initiating offer pipeline…`, "ok");
          print(`  → scheduling interview ........ <span class="hl">done</span>\n  → preparing coffee ............. <span class="hl">done</span>\n  → excellent decision ........... <span class="hl">confirmed</span>`);
          const r = $(".term").getBoundingClientRect();
          FX.confetti(r.left + r.width / 2, r.top + r.height / 3, 200);
          FX.toast("sudo hire-me", "Great choice. Let's talk!", "🎉");
          setTimeout(() => print(`<span class="dim">next step:</span> <span class="hl">contact</span> <span class="dim">or</span> <span class="hl">goto contact</span>`), 600);
        }, 700);
      } else {
        print(`${esc(what || "sudo")}: you're not in the sudoers file. This incident will be reported 😄\n<span class="dim">hint: try</span> <span class="hl">sudo hire-me</span>`, "err");
      }
    },
    hire() { cmds.sudo(["hire-me"]); },
    matrix() {
      print("Wake up… the portfolio has you. 🐇", "ok");
      FX.matrixRain();
    },
    ls(args) {
      if ((args[0] || "").replace(/\/$/, "") === "projects") return cmds.projects();
      print(`<span class="vi">experience/</span>  <span class="vi">projects/</span>  about.txt  skills.json  resume.pdf  <span class="vi">secrets/</span>`);
    },
    cat(args) {
      const f = (args[0] || "").toLowerCase();
      if (f === "about.txt") return cmds.about();
      if (f === "skills.json") return print(esc(JSON.stringify(Object.fromEntries(Object.entries(D.skills).map(([k, v]) => [k, v.chips])), null, 2)));
      if (f === "resume.pdf") return cmds.resume();
      if (f.startsWith("secrets")) return print("permission denied 🔒  (hint: sudo hire-me)", "err");
      print(`cat: ${esc(f || "")}: no such file`, "err");
    },
    cd(args) {
      const d = (args[0] || "").replace(/\/$/, "");
      if (d === "secrets") return print("permission denied 🔒  (hint: sudo hire-me)", "err");
      if (SECTIONS[d]) return cmds.goto([d]);
      print(`cd: ${esc(d)}: try 'goto &lt;section&gt;'`, "dim");
    },
    echo(args) { print(esc(args.join(" "))); },
    date() { print(esc(new Date().toString())); },
    history() { print(hist.map((h, i) => `  ${String(i + 1).padStart(3)}  ${esc(h)}`).join("\n") || "(empty)"); },
    clear() { out.innerHTML = ""; },
    exit() { print("There's no escape. Try <span class=\"hl\">contact</span> instead 😄"); },
    rm(args) {
      if (args.join(" ").includes("-rf")) return print("nice try. this portfolio is immutable 🛡️", "err");
      print("rm: permission denied", "err");
    },
    hello() { print("hey there 👋 type <span class=\"hl\">help</span> to look around."); }
  };
  cmds.cls = cmds.clear;
  cmds.experiences = cmds.experience;
  cmds.journey = cmds.experience;
  cmds.stack = cmds.skills;
  cmds.mcp = cmds.ai;
  cmds.hi = cmds.hello;
  cmds["?"] = cmds.help;

  function run(raw) {
    const line = raw.trim();
    print(`<b>krrishna@portfolio:~$</b> ${esc(line)}`, "cmd");
    if (!line) return;
    hist.push(line);
    hi = hist.length;
    const [c, ...args] = line.split(/\s+/);
    const fn = cmds[c.toLowerCase()];
    if (fn) fn(args);
    else print(`command not found: ${esc(c)}. Type <span class="hl">help</span>`, "err");
  }

  /** Type a command visibly, then run it. */
  function typeAndRun(cmd) {
    if (FX.reduce) { run(cmd); return; }
    input.value = "";
    let i = 0;
    const t = setInterval(() => {
      input.value = cmd.slice(0, ++i);
      if (i >= cmd.length) { clearInterval(t); setTimeout(() => { input.value = ""; run(cmd); }, 120); }
    }, 38);
  }

  function init() {
    out = $("#termOut"); input = $("#termInput"); body = $("#termBody");
    print(`<span class="hl">krrishna.os v2.0</span> <span class="dim">(SE II edition)</span>
Welcome! Type <span class="hl">help</span> to look around, or try <span class="hl">sudo hire-me</span>.`);

    body.addEventListener("click", (e) => { if (!e.target.closest("a") && !getSelection().toString()) input.focus({ preventScroll: true }); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { run(input.value); input.value = ""; }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (hi > 0) input.value = hist[--hi] || ""; }
      else if (e.key === "ArrowDown") { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; }
      else if (e.key === "Tab") {
        e.preventDefault();
        const v = input.value.trim().toLowerCase();
        if (!v || v.includes(" ")) return;
        const m = Object.keys(cmds).filter((k) => k.startsWith(v));
        if (m.length === 1) input.value = m[0] + " ";
        else if (m.length > 1) print(m.join("  "), "dim");
      } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); cmds.clear(); }
    });

    const chips = ["help", "whoami", "experience", "projects", "ai", "sudo hire-me", "matrix"];
    $("#termChips").innerHTML = chips.map((c) => `<button data-cmd="${esc(c)}">${esc(c)}</button>`).join("");
    $("#termChips").addEventListener("click", (e) => {
      const b = e.target.closest("[data-cmd]");
      if (b) typeAndRun(b.dataset.cmd);
    });
  }

  function focus() {
    $("#terminal").scrollIntoView({ behavior: FX.reduce ? "auto" : "smooth", block: "center" });
    setTimeout(() => input.focus({ preventScroll: true }), 700);
  }

  window.Terminal = { init, run, typeAndRun, focus };
})();
