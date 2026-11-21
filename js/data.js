/* =====================================================================
   PORTFOLIO CONTENT. Edit this file to update the whole site.
   Fields marked TODO are waiting on details (see todo.md).
   ===================================================================== */
window.PORTFOLIO = {
  name: "Krrishna Gulati",
  first: "KRRISHNA",
  last: "GULATI",
  role: "Software Engineer II",
  company: "Americana Restaurants",

  email: "",        // TODO: personal email, e.g. "you@gmail.com"
  phone: "+91 88726 86825",
  linkedin: "",     // TODO: "https://www.linkedin.com/in/..."
  github: "",       // TODO (optional)
  resume: "assets/resume.pdf", // TODO: drop your resume PDF at this path

  roles: [
    "Software Engineer II",
    "ML Enthusiast",
    "App Developer",
    "MCP & API Integrator",
    "AI-native Builder"
  ],

  status: "Building the loyalty platform for KFC, Pizza Hut & Hardee's",

  // Words wrapped in *asterisks* glow lime as the visitor scrolls
  about:
    "I build software that *thinks.* From an internship at *Airbus* to engineering *loyalty platforms* for some of the world's most-loved food brands at *Americana,* I turn *machine learning, AI tools, APIs and MCP connections* into products that make everyday work *effortless.*",

  stats: [
    { value: 4,  suffix: "",  label: "Roles in 2 years" },
    { value: 2,  suffix: "",  label: "Internships: Airbus & Americana" },
    { value: 10, suffix: "+", label: "Projects built" },
    { value: 3,  suffix: "",  label: "QSR brands on my current platform" }
  ],

  /* Career progression, shown as levels in the "Level-Up Log" */
  journey: [
    {
      level: 0,
      badge: "Spawn point",
      title: "B.Tech, Electronics Engineering",
      org: "Punjab Engineering College",
      place: "Chandigarh",
      period: "2022 – 2026",            // TODO confirm start year
      points: [
        "Electronics Engineering · Class of 2026",
        "From circuits to code: crossed over into software, ML & AI"
      ]
    },
    {
      level: 1,
      badge: "Side quest",
      title: "Intern",
      org: "Airbus",
      place: "Bengaluru",
      period: "Jan 2025 – Jul 2025",
      points: [
        "6th-semester internship at one of the world's largest aerospace companies",
        "First taste of engineering at global scale"   // TODO: team & what you built
      ]
    },
    {
      level: 2,
      badge: "New region unlocked",
      title: "Intern",
      org: "Americana Restaurants",
      place: "",
      period: "Jan 2026 – May 2026",
      points: [
        "8th-semester internship",
        "Converted to a full-time engineering role"
      ]
    },
    {
      level: 3,
      badge: "Class upgrade",
      title: "Software Engineer I",
      org: "Americana Restaurants",
      place: "",
      period: "Jun 2026 – Oct 2026",     // TODO confirm
      points: [
        "Built on Azure services with Zoho Creator as the backend",
        "App development for Peet's & Krispy Kreme"
      ]
    },
    {
      level: 4,
      badge: "Current level",
      title: "Software Engineer II",
      org: "Americana Restaurants",
      place: "",
      period: "Nov 2026 – Present",
      current: true,
      points: [
        "Working on the loyalty platform for KFC, Pizza Hut & Hardee's",
        "Bringing AI tools, MCP connections & APIs into day-to-day engineering"
      ]
    }
  ],

  /* Skills. TODO: tune to your exact stack */
  skills: {
    ml:  { title: "Machine Learning", blurb: "From MRI scans to LLM agents: models that solve real problems.", chips: ["Python", "Machine Learning", "Deep Learning", "Computer Vision", "NLP", "LLM Agents"] },
    dev: { title: "Software Development", blurb: "Clean, scalable systems from API to UI.", chips: ["JavaScript", "Python", "REST APIs", "SQL", "Git", "Azure"] },
    app: { title: "App Development", blurb: "Customer-facing apps for global brands.", chips: ["Mobile Apps", "Zoho Creator", "Low-code", "UI Engineering"] },
    ai:  { title: "AI-native Workflow", blurb: "I stay current on AI tools and use them every day to make work faster.", chips: ["MCP", "Claude", "ChatGPT", "GitHub Copilot", "Prompt Engineering", "API Integrations"] }
  },

  marquee: [
    "Python", "Machine Learning", "Deep Learning", "Computer Vision", "LLM Agents", "MCP",
    "REST APIs", "Azure Services", "Zoho Creator", "App Development", "JavaScript", "SQL",
    "Prompt Engineering", "Automation", "Git", "Loyalty Platforms"
  ],

  aiTools: ["Claude", "ChatGPT", "GitHub Copilot", "MCP Servers", "Custom Agents", "REST / Webhooks"],

  /* Nodes in the animated MCP graph */
  mcp: [
    { id: "zoho",    short: "ZC",  label: "Zoho Creator", call: "zoho.records.fetch" },
    { id: "azure",   short: "AZ",  label: "Azure",        call: "azure.functions.invoke" },
    { id: "mail",    short: "@",   label: "Mail",         call: "mail.inbox.triage" },
    { id: "power",   short: "⚡",  label: "Power Agent",  call: "power.flow.run" },
    { id: "loyalty", short: "★",   label: "Loyalty API",  call: "loyalty.points.accrue" },
    { id: "rest",    short: "{ }", label: "REST APIs",    call: "http.request" },
    { id: "db",      short: "DB",  label: "Databases",    call: "sql.query" },
    { id: "jobs",    short: "JP",  label: "Job Pilot",    call: "jobs.match" }
  ],

  /* Projects. TODO: add details / links as they come in.
     category: ai | ml | apps | enterprise | dev | hackathon
     visual:   "sorter" | "scan" | (omit to use the glyph)            */
  projects: [
    {
      id: "loyalty", title: "Loyalty Platform", subtitle: "KFC · Pizza Hut · Hardee's",
      category: "enterprise", status: "Now building", featured: true, glyph: "★",
      tags: ["Enterprise", "Loyalty", "APIs"],
      blurb: "Engineering the loyalty platform behind three of the world's most iconic quick-service brands."
    },
    {
      id: "sorting", title: "Sorting Visualiser", subtitle: "Watch algorithms think",
      category: "dev", status: "Live demo", featured: true, visual: "sorter", demo: "sorter",
      tags: ["Algorithms", "DSA", "Visualisation"],
      blurb: "An interactive visualiser for classic sorting algorithms. Open the card to run one."
    },
    {
      id: "brain", title: "Brain Tumour Detection", subtitle: "Deep learning × medical imaging",
      category: "ml", status: "ML", visual: "scan",
      tags: ["Deep Learning", "Computer Vision", "Medical AI"],
      blurb: "A deep learning model that detects brain tumours from MRI scans."
    },
    {
      id: "zoho-mcp", title: "Zoho MCP", subtitle: "LLMs ↔ Zoho, natively",
      category: "ai", status: "AI", glyph: "MCP", featured: true,
      tags: ["MCP", "Zoho", "LLM"],
      blurb: "An MCP server that lets AI assistants talk directly to Zoho apps."
    },
    {
      id: "triage", title: "Customer Complaint Triage", subtitle: "AI that reads the room",
      category: "ai", status: "AI", glyph: "⚑",
      tags: ["AI", "NLP", "Automation"],
      blurb: "AI-assisted triage that classifies and routes customer complaints."
    },
    {
      id: "mail-agent", title: "Mail Agent", subtitle: "Inbox on autopilot",
      category: "ai", status: "Agent", glyph: "@",
      tags: ["AI Agent", "Email", "Automation"],
      blurb: "An AI agent that automates email workflows."
    },
    {
      id: "power-agent", title: "Power Agent", subtitle: "Case study loading…",
      category: "ai", status: "Agent", glyph: "⚡",
      tags: ["AI Agent"],
      blurb: ""
    },
    {
      id: "job-pilot", title: "Job Pilot", subtitle: "Your job hunt, on autopilot",
      category: "ai", status: "Agent", glyph: "✈",
      tags: ["AI Agent", "Automation"],
      blurb: "An AI copilot for the job hunt."
    },
    {
      id: "peets-kk", title: "Peet's & Krispy Kreme App", subtitle: "Apps for global brands",
      category: "apps", status: "App", glyph: "◉",
      tags: ["App Development", "Mobile"],
      blurb: "App development for Peet's Coffee and Krispy Kreme."
    },
    {
      id: "cloud", title: "Azure × Zoho Creator", subtitle: "Cloud services + low-code backend",
      category: "enterprise", status: "Enterprise", glyph: "☁",
      tags: ["Azure", "Zoho Creator", "Backend"],
      blurb: "Enterprise solutions on Azure services, with Zoho Creator as the backend."
    },
    {
      id: "united", title: "United Airlines Hackathon", subtitle: "Hackathon build",
      category: "hackathon", status: "Hackathon", glyph: "✦",
      tags: ["Hackathon", "Aviation"],
      blurb: ""
    }
  ],

  /* Certificates. TODO. Format:
     { title: "…", issuer: "…", date: "2025", url: "https://…" }
     While this list is empty, the site shows "locked achievement" slots. */
  certificates: []
};
