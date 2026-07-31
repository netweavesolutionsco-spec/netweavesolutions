import stenomaniaImg from "@/assets/proj-stenomania.jpg";
import crmImg from "@/assets/CRM.png";
import zenithImg from "@/assets/proj-zenith.jpg";
import cognibotImg from "@/assets/proj-cognibot.jpg";
import inspectxImg from "@/assets/inspectx.jpg";
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
    slug: "properties-professor-crm",
    title: "Properties Professor CRM",
    category: "Web",
    categoryLabel: "WEB · REAL ESTATE CRM",
    summary: "Advanced Real Estate CRM & Lead Management Platform",
    description:
      "Properties Professor CRM is a production-grade real estate management platform developed to streamline property listing operations, broker management, lead handling, inventory management, customer relationships, and media storage workflows. The platform provides a modern responsive dashboard for real estate companies with role-based access, inventory management, employee management, lead tracking, document management, image uploads, task management, analytics, and reporting. It is designed to simplify complete real estate business operations through a scalable cloud-based architecture.",
    tech: [
      "React",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "Node.js",
      "Express.js",
      "Supabase",
      "PostgreSQL",
      "JWT",
      "REST API",
      "Cloud Storage",
      "Vercel",
      "Render",
    ],
    metric: "Production-grade CRM",
    gradient: "from-cyan-500 via-sky-500 to-indigo-600",
    image: crmImg,
    liveUrl: "https://dashboard.propertiesprofessor.com/login",
    isLive: true,
    client: "Properties Professor",
    industry: "Real Estate",
    problem:
      "Real estate companies managed listings, brokers, leads, inventory, customer relationships, and media across disconnected tools — with no unified, role-based system to run day-to-day operations at scale.",
    solution:
      "A production-grade real estate CRM with a modern, responsive dashboard: role-based access, property and inventory management, broker and employee management, lead tracking, customer CRM, document and image management, task and attendance management, plus analytics and reporting — built on a scalable, cloud-based architecture that simplifies complete real estate business operations.",
    outcomes: [
      "Developed a production-ready Real Estate CRM platform.",
      "Built scalable dashboard architecture.",
      "Implemented secure authentication.",
      "Designed role-based management system.",
      "Developed inventory and lead management modules.",
      "Integrated cloud storage for media uploads.",
      "Created responsive admin dashboard.",
    ],
    stats: [
      { label: "Platform", value: "Production" },
      { label: "Access", value: "Role-Based" },
      { label: "Media", value: "Cloud" },
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
    slug: "inspectx",
    title: "InspectX",
    category: "Mobile",
    categoryLabel: "MOBILE APPLICATION",
    summary: "Inspection Management & Digital Reporting Platform",
    description:
      "InspectX is a modern inspection management platform designed to digitize inspection workflows for organizations, inspectors, and administrators. The platform enables users to create inspections, record observations, upload supporting media, generate structured reports, monitor inspection history, and manage inspection data from a centralized dashboard. InspectX replaces traditional paper-based inspection processes with a secure, cloud-based solution that improves operational efficiency, transparency, and data accuracy. The application includes role-based authentication, real-time database synchronization, responsive dashboards, secure document management, and scalable backend services suitable for enterprise inspection workflows.",
    tech: [
      "React",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "Node.js",
      "Express.js",
      "Supabase",
      "PostgreSQL",
      "JWT",
      "REST API",
      "Cloud Storage",
      "Responsive Design",
      "Dashboard",
      "Role Based Access",
      "Web Application",
    ],
    metric: "Digitized inspections",
    gradient: "from-emerald-500 via-cyan-500 to-sky-500",
    image: inspectxImg,
    client: "InspectX",
    industry: "Inspection & Compliance",
    problem:
      "Organizations relied on manual, paper-based inspection processes that were slow, error-prone, and hard to audit — with no centralized way to record observations, attach media, or track inspection history.",
    solution:
      "A modern, cloud-based inspection management platform that digitizes inspection workflows for organizations, inspectors, and administrators. Users can create and schedule inspections, record observations, upload supporting media, generate structured reports, and monitor inspection history from a centralized, responsive dashboard — backed by role-based authentication, real-time database sync, secure document management, and scalable backend services for enterprise inspection workflows.",
    outcomes: [
      "Developed a production-ready inspection management platform.",
      "Digitized manual inspection workflows.",
      "Built responsive dashboard interfaces.",
      "Implemented secure authentication.",
      "Enabled structured inspection reporting.",
      "Designed scalable cloud architecture.",
      "Improved inspection data management.",
    ],
    stats: [
      { label: "Platform", value: "Production" },
      { label: "Access", value: "Role-Based" },
      { label: "Sync", value: "Real-Time" },
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
