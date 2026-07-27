// Production-safe admin seed data. The admin panel now starts empty until real content exists.

export type Trend = { name: string; value: number; value2?: number };

export const monthlyVisitors: Trend[] = [];
export const monthlyLeads: Trend[] = [];
export const monthlyRevenue: Trend[] = [];
export const topServices: Trend[] = [];
export const trafficSources: Trend[] = [];

export type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  status: "New" | "Contacted" | "Qualified" | "Won" | "Lost";
  createdAt: string;
};

export const leads: Lead[] = [];

export type Project = {
  id: string;
  title: string;
  client: string;
  category: string;
  status: "Draft" | "Published" | "Archived";
  updatedAt: string;
};

export const projects: Project[] = [];

export type BlogPost = {
  id: string;
  title: string;
  author: string;
  category: string;
  status: "Draft" | "Published";
  views: number;
  publishedAt: string;
};

export const blogPosts: BlogPost[] = [];

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  status: "Active" | "On Leave";
  avatar: string;
};

export const team: TeamMember[] = [];

export type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Contract" | "Intern";
  applicants: number;
  status: "Open" | "Closed";
};

export const jobs: Job[] = [];

export type Service = {
  id: string;
  name: string;
  category: string;
  price: string;
  active: boolean;
};

export const services: Service[] = [];

export type Testimonial = {
  id: string;
  name: string;
  company: string;
  quote: string;
  rating: number;
  approved: boolean;
};

export const testimonials: Testimonial[] = [];

export type Plan = {
  id: string;
  name: string;
  price: string;
  interval: "month" | "one-time";
  featured: boolean;
  active: boolean;
};

export const plans: Plan[] = [];

export type MediaFile = {
  id: string;
  name: string;
  type: "image" | "video" | "doc";
  size: string;
  url: string;
  uploadedAt: string;
};

export const media: MediaFile[] = [];

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  status: "Active" | "Invited" | "Suspended";
  lastActive: string;
};

export const adminUsers: AdminUser[] = [];

export type AdminNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "info" | "success" | "warning" | "lead";
  read: boolean;
};

export const notifications: AdminNotification[] = [];

export const activities = [];

