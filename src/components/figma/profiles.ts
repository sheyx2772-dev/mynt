// The catalogue is a design sample, not a directory of people.
//
// It shipped with thirteen invented officials: stock photographs of real,
// identifiable strangers, presented as named staff of real ministries and
// banks, carrying fabricated addresses on those bodies' own domains —
// j.tursunov@mf.uz, d.xolmatov@cbu.uz — and phone numbers in Tashkent's live
// range. Every one of those is gone. What is left is the organisation itself:
// its name, its sector, its published website, and nothing that belongs to a
// person. Real people reach this catalogue by claiming a handle and entering
// their own details, which is the product working rather than a demo pretending.

export interface Profile {
  id: string;
  category: "gov" | "ministry" | "bank" | "venture" | "corp";
  categoryLabel: string;
  name: string;
  fullName: string;      // the organisation — this demo carries no people
  position: string;
  positionRu: string;
  organization: string;
  orgShort: string;
  department?: string;
  website?: string;   // only when the organisation actually publishes one
  coverColor: string;
  coverAccent: string;
  logoText: string;
  socials: { type: string; handle: string }[];
  tags: string[];
  verified: boolean;
}

export const profiles: Profile[] = [
  // ── GOV ──────────────────────────────────────────────────
  {
    id: "tashkent-inn",
    category: "gov",
    categoryLabel: "Innovatsiya Markazi",
    name: "Toshkent Innovatsiya Markazi",
    fullName: "Toshkent Innovatsiya Markazi",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "Toshkent Innovatsiya Markazi",
    orgShort: "TIM",
    department: "Raqamli iqtisodiyot bo'limi",
    website: "tim.uz",
    coverColor: "#1a3a6b",
    coverAccent: "#c8973a",
    logoText: "TIM",
    socials: [{ type: "telegram", handle: "@tim_tashkent" }],
    tags: ["Innovatsiya", "Strategiya", "Raqamli iqtisodiyot"],
    verified: true,
  },
  {
    id: "yoshlar-agentligi",
    category: "gov",
    categoryLabel: "Davlat Agentligi",
    name: "Yoshlar ishlari agentligi",
    fullName: "Yoshlar ishlari agentligi",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "O'zbekiston Respublikasi Yoshlar ishlari agentligi",
    orgShort: "Yoshlar ishlari agentligi",
    department: "Yoshlar siyosati",
    // No website until the agency's own domain is confirmed. yoshlar.uz answers
    // with a "Coming Soon" page and yia.uz renders from script, so neither could
    // be verified as theirs — a wrong domain on a card shown to the agency is
    // worse than no domain at all.
    coverColor: "#0b2f4a",
    coverAccent: "#38bdf8",
    logoText: "YIA",
    socials: [],
    tags: ["Yoshlar siyosati", "Ta'lim", "Tadbirkorlik"],
    verified: true,
  },
  {
    id: "hokimiyat",
    category: "gov",
    categoryLabel: "Davlat Organi",
    name: "Toshkent Hokimiyati",
    fullName: "Toshkent Hokimiyati",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "Toshkent shahar Hokimiyati",
    orgShort: "Toshkent Hokimiyati",
    department: "Qurilish va kommunal xo'jalik",
    website: "tashkent.uz",
    coverColor: "#1e4d8c",
    coverAccent: "#e8a020",
    logoText: "TH",
    socials: [{ type: "telegram", handle: "@tashkent_hokimiyat" }],
    tags: ["Shahar boshqaruvi", "Qurilish", "Infratuzilma"],
    verified: true,
  },

  // ── MINISTRY ─────────────────────────────────────────────
  {
    id: "moliya",
    category: "ministry",
    categoryLabel: "Vazirlik",
    name: "Moliya Vazirligi",
    fullName: "Moliya Vazirligi",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "O'zbekiston Respublikasi Moliya Vazirligi",
    orgShort: "Moliya Vazirligi",
    department: "Byudjet siyosati departamenti",
    website: "mf.uz",
    coverColor: "#014421",
    coverAccent: "#4cbb77",
    logoText: "MV",
    socials: [
      { type: "telegram", handle: "@minfin_uz" },
      { type: "web", handle: "mf.uz" },
    ],
    tags: ["Byudjet", "Moliya siyosati", "Soliq"],
    verified: true,
  },
  {
    id: "iqtisodiyot",
    category: "ministry",
    categoryLabel: "Vazirlik",
    name: "ATKRV",
    fullName: "ATKRV",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "Axborot Texnologiyalari va Kommunikatsiyalarini Rivojlantirish Vazirligi",
    orgShort: "ATKRV",
    department: "Investitsiyalar bo'limi",
    website: "minict.uz",
    coverColor: "#1a237e",
    coverAccent: "#818cf8",
    logoText: "ATKRV",
    socials: [
      { type: "linkedin", handle: "sabohat-yusupova" },
      { type: "telegram", handle: "@minict_uz" },
    ],
    tags: ["IT", "Kommunikatsiya", "Investitsiya"],
    verified: true,
  },
  {
    id: "raqamli",
    category: "ministry",
    categoryLabel: "Vazirlik",
    name: "ATKRV",
    fullName: "ATKRV",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "Axborot Texnologiyalari va Kommunikatsiyalarini Rivojlantirish Vazirligi",
    orgShort: "ATKRV",
    department: "Raqamli infratuzilma",
    website: "minict.uz",
    coverColor: "#0f1646",
    coverAccent: "#38bdf8",
    logoText: "ATKRV",
    socials: [
      { type: "telegram", handle: "@minict_uz" },
      { type: "linkedin", handle: "bobur-musayev" },
    ],
    tags: ["IT", "Raqamlashtirish", "E-hukumat"],
    verified: true,
  },

  // ── BANK ─────────────────────────────────────────────────
  {
    id: "nbu",
    category: "bank",
    categoryLabel: "Bank",
    name: "Markaziy Bank",
    fullName: "Markaziy Bank",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "O'zbekiston Respublikasi Markaziy Banki",
    orgShort: "Markaziy Bank",
    department: "Pul-kredit siyosati",
    website: "cbu.uz",
    coverColor: "#002a0f",
    coverAccent: "#d4a84b",
    logoText: "MB",
    socials: [
      { type: "telegram", handle: "@cbu_uz_official" },
    ],
    tags: ["Markaziy Bank", "Pul siyosati", "Regulyatsiya"],
    verified: true,
  },
  {
    id: "agrobank",
    category: "bank",
    categoryLabel: "Bank",
    name: "Agrobank",
    fullName: "Agrobank",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "Agro'sanoat Banki AJ",
    orgShort: "Agrobank",
    department: "Korporativ xizmatlar",
    website: "agrobank.uz",
    coverColor: "#0a3c14",
    coverAccent: "#6ee7b7",
    logoText: "AG",
    socials: [
      { type: "telegram", handle: "@agrobank_uz" },
    ],
    tags: ["Agrosanoat", "Kredit", "Korporativ xizmat"],
    verified: true,
  },
  {
    id: "kapitalbank",
    category: "bank",
    categoryLabel: "Bank",
    name: "Kapital Bank",
    fullName: "Kapital Bank",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "Kapital Bank AJ",
    orgShort: "Kapital Bank",
    department: "Raqamli innovatsiyalar",
    website: "kapitalbank.uz",
    coverColor: "#5a0000",
    coverAccent: "#fca5a5",
    logoText: "KB",
    socials: [
      { type: "telegram", handle: "@kapitalbank_uz" },
      { type: "instagram", handle: "@kapitalbank" },
    ],
    tags: ["Fintech", "Raqamli bank", "Kartalar"],
    verified: true,
  },

  // ── VENTURE ──────────────────────────────────────────────
  {
    id: "uzv-fund",
    category: "venture",
    categoryLabel: "Venture Fond",
    name: "Yoshlar Ventures",
    fullName: "Yoshlar Ventures",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "Yoshlar Ventures Fund",
    orgShort: "Yoshlar Ventures",
    department: "Portfolio boshqaruvi",
    website: "yoshlar.vc",
    coverColor: "#1e0e00",
    coverAccent: "#fb923c",
    logoText: "YV",
    socials: [
      { type: "linkedin", handle: "kamola-nazarova" },
      { type: "telegram", handle: "@yoshlar_vc" },
    ],
    tags: ["Startup", "Investitsiya", "Yosh tadbirkor"],
    verified: true,
  },
  {
    id: "uzfar",
    category: "venture",
    categoryLabel: "Fond",
    name: "United Ventures",
    fullName: "United Ventures",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "United Ventures Uzbekistan",
    orgShort: "United Ventures",
    department: "Boshqaruv hamkorlik",
    website: "unitedventures.uz",
    coverColor: "#052614",
    coverAccent: "#6ee7b7",
    logoText: "UV",
    socials: [
      { type: "linkedin", handle: "timur-abdullayev" },
      { type: "twitter", handle: "@unitedventures_uz" },
    ],
    tags: ["Islohotlar", "Strategiya", "Taraqqiyot"],
    verified: true,
  },

  // ── CORP ─────────────────────────────────────────────────
  {
    id: "itpark",
    category: "corp",
    categoryLabel: "Tashkilot",
    name: "IT Park Uzbekistan",
    fullName: "IT Park Uzbekistan",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "O'zbekiston IT Park",
    orgShort: "IT Park",
    department: "Startaplar ekotizimi",
    website: "it-park.uz",
    coverColor: "#0e3006",
    coverAccent: "#a3e635",
    logoText: "ITP",
    socials: [
      { type: "telegram", handle: "@itpark_uz" },
      { type: "instagram", handle: "@itpark_uzbekistan" },
    ],
    tags: ["IT", "Startap", "Innovatsiya"],
    verified: true,
  },
  {
    id: "chamber",
    category: "corp",
    categoryLabel: "Tashkilot",
    name: "Startup Garage",
    fullName: "Startup Garage",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "Startup Garage Uzbekistan",
    orgShort: "Startup Garage",
    department: "Biznes akseleratsiya",
    website: "startupgarage.uz",
    coverColor: "#1c0c50",
    coverAccent: "#c4b5fd",
    logoText: "SG",
    socials: [
      { type: "telegram", handle: "@startup_garage_uz" },
      { type: "linkedin", handle: "startup-garage-uz" },
    ],
    tags: ["Akseleratsiya", "Mentorlik", "Biznes"],
    verified: true,
  },
  {
    id: "uzreport",
    category: "corp",
    categoryLabel: "Tashkilot",
    name: "ICT Week Uzbekistan",
    fullName: "ICT Week Uzbekistan",
    position: "Rasmiy tashkilot sahifasi",
    positionRu: "Официальная страница организации",
    organization: "ICT Week Uzbekistan",
    orgShort: "ICT Week",
    department: "Xalqaro hamkorlik",
    website: "ictweek.uz",
    coverColor: "#05123c",
    coverAccent: "#38bdf8",
    logoText: "ICT",
    socials: [
      { type: "telegram", handle: "@ictweek_uz" },
      { type: "instagram", handle: "@ictweek.uz" },
    ],
    tags: ["ICT", "Forum", "Raqamlashtirish"],
    verified: true,
  },
];
