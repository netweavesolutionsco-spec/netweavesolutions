import stenomaniaImg from "@/assets/proj-stenomania.jpg";
import aetherpayImg from "@/assets/proj-aetherpay.jpg";
import zenithImg from "@/assets/proj-zenith.jpg";
import carepulseImg from "@/assets/proj-carepulse.jpg";
import cognibotImg from "@/assets/proj-cognibot.jpg";
import stenomaniaLive from "@/assets/stenomania-preview.svg";

export type Project = {
  slug: string;
  title: string;
  category: "Web" | "Mobile" | "Software" | "Design";
  categoryLabel?: string;
  summary: string;
  description: string;
  tech: string[];
  metric: string;
  gradient: string;
  image?: string;
  livePreview?: string;
  liveUrl?: string;
  isLive?: boolean;
  client?: string;
  industry?: string;
  problem?: string;
  solution?: string;
  outcomes?: string[];
  stats?: { label: string; value: string }[];
};

export const projects: Project[] = [
  {
    slug: "stenomania-dictations",
    title: "Stenomania Dictations",
    category: "Web",
    categoryLabel: "WEB",
    summary:
      "India's premier shorthand dictation & transcription learning portal for SSC, High Court, and Railway stenography exams.",
    description:
      "India's premier online shorthand dictation platform engineered by Netweavesolutions. Designed for SSC, High Court, and Railway stenography aspirants with 60–120 WPM audio controls, real-time typing evaluation, and subscription billing.",
    tech: ["React", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "Razorpay"],
    metric: "25,000+ learners",
    gradient: "from-indigo-600 via-violet-600 to-cyan-500",
    image: stenomaniaImg,
    livePreview: stenomaniaLive.url,
    liveUrl: "https://www.stenomaniadictations.com",
    isLive: true,
    client: "Stenomania Institute",
    industry: "Education & Stenography",
    problem:
      "Aspirants had no unified digital platform for shorthand practice with variable WPM controls, live evaluation, and structured batches. Existing tools were fragmented, offline, and had no subscription or progress tracking.",
    solution:
      "A full-stack learning portal with 60–120 WPM audio playback, real-time typing accuracy engine, batch-based courses, live classes, PDF materials, and subscription billing via Razorpay.",
    outcomes: [
      "25,000+ active learners across India within 12 months",
      "150,000+ mock tests taken with 99.2% engine accuracy",
      "60% increase in paid subscriptions QoQ",
    ],
    stats: [
      { label: "Active Learners", value: "25,000+" },
      { label: "Tests Taken", value: "150,000+" },
      { label: "Accuracy", value: "99.2%" },
    ],
  },
  {
    slug: "aetherpay-saas",
    title: "AetherPay Global SaaS",
    category: "Web",
    categoryLabel: "WEB",
    summary:
      "Next-generation cross-border payment platform with real-time multi-currency settlement dashboards.",
    description:
      "A cross-border payments SaaS handling FX, compliance, and reconciliation across 40+ currencies with real-time settlement analytics.",
    tech: ["Next.js", "React", "TypeScript", "Node.js", "Kafka", "ClickHouse"],
    metric: "Multi-currency dashboard",
    gradient: "from-cyan-500 via-sky-500 to-indigo-600",
    image: aetherpayImg,
    liveUrl: "https://demo.aetherpay.io",
    isLive: true,
    client: "AetherPay Ltd",
    industry: "Fintech",
    problem:
      "Legacy cross-border rails were slow, opaque, and had no unified settlement view for finance teams.",
    solution:
      "Event-driven ledger with real-time FX quotes, automated compliance checks and a treasury dashboard.",
    outcomes: [
      "Real-time FX quote workspace",
      "Unified settlement dashboard",
      "Automated reconciliation queue",
    ],
    stats: [
      { label: "Dashboard", value: "Live" },
      { label: "Currencies", value: "Multi" },
      { label: "Workflow", value: "Automated" },
    ],
  },
  {
    slug: "zenith-erp",
    title: "Zenith EduTech School ERP",
    category: "Software",
    categoryLabel: "SOFTWARE/ERP",
    summary:
      "All-in-one Cloud ERP managing 15 campuses, 25,000 students, fee collections, and automated report cards.",
    description:
      "A multi-tenant School ERP handling admissions, attendance, exams, fees, transport, and parent communication across 15 campuses.",
    tech: ["React", "Express", "Node.js", "PostgreSQL", "Redis", "AWS"],
    metric: "25,000 students",
    gradient: "from-violet-600 via-fuchsia-500 to-indigo-600",
    image: zenithImg,
    liveUrl: "https://demo.zenitherp.com",
    isLive: true,
    client: "Zenith EduTech Group",
    industry: "Education",
    problem: "15 campuses used disconnected spreadsheets for admissions, fees and academics.",
    solution:
      "One multi-tenant ERP with role-based dashboards, automated report cards, and parent app.",
    outcomes: ["25,000 students managed", "₹80Cr fees collected online", "-45% admin overhead"],
    stats: [
      { label: "Campuses", value: "15" },
      { label: "Students", value: "25,000" },
      { label: "Fees Online", value: "₹80Cr" },
    ],
  },
  {
    slug: "carepulse-telehealth",
    title: "CarePulse Telehealth Mobile App",
    category: "Mobile",
    categoryLabel: "MOBILE APP",
    summary:
      "Cross-platform Flutter application enabling instant video consultations and e-prescriptions.",
    description:
      "A HIPAA-aware telehealth app for instant doctor consultations, digital prescriptions, and integrated pharmacy delivery.",
    tech: ["Flutter", "Dart", "Firebase", "WebRTC", "Node.js"],
    metric: "4.8 ★ stores",
    gradient: "from-emerald-500 via-cyan-500 to-sky-500",
    image: carepulseImg,
    liveUrl: "https://carepulse.health",
    isLive: true,
    client: "CarePulse Health",
    industry: "Healthcare",
    problem: "Patients waited days for consultations; clinics lacked a modern virtual care stack.",
    solution:
      "Cross-platform mobile app with sub-2s video connect, e-Rx, and pharmacy fulfillment.",
    outcomes: ["4.8 ★ on both stores", "120k consultations", "Avg wait time 3 min"],
    stats: [
      { label: "Rating", value: "4.8 ★" },
      { label: "Consultations", value: "120k" },
      { label: "Wait", value: "3 min" },
    ],
  },
  {
    slug: "cognibot-ai",
    title: "CogniBot Enterprise AI Assistant",
    category: "Software",
    categoryLabel: "AI & CLOUD",
    summary:
      "Gemini AI-powered customer concierge resolving shipment, billing, and support queries autonomously.",
    description:
      "An enterprise AI assistant that reads knowledge bases, ticket history, and shipment APIs to resolve 78% of queries without human handoff.",
    tech: ["Python", "FastAPI", "Gemini", "LangChain", "Pinecone", "GCP"],
    metric: "78% auto-resolved",
    gradient: "from-fuchsia-500 via-violet-500 to-orange-400",
    image: cognibotImg,
    liveUrl: "https://cognibot.ai",
    isLive: true,
    client: "Global Logistics Co.",
    industry: "AI & Cloud",
    problem: "Support team of 40 was overwhelmed by repetitive shipment and billing queries.",
    solution: "RAG-based AI agent with tool use across shipment, CRM, and billing APIs.",
    outcomes: ["78% queries auto-resolved", "CSAT +22 pts", "$1.2M annual savings"],
    stats: [
      { label: "Auto-resolve", value: "78%" },
      { label: "CSAT", value: "+22" },
      { label: "Savings", value: "$1.2M/yr" },
    ],
  },
];
