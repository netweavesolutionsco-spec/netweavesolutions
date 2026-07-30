import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type BlogRow = Database["public"]["Tables"]["blog_posts"]["Row"];

export type MetricPoint = { name: string; value: number };
export type ActivityItem = { id: string; title: string; detail: string; when: string; stamp: number };

export type AdminMetrics = {
  counts: {
    clients: number;
    leads: number;
    projects: number;
    blogs: number;
    services: number;
    team: number;
    openLeads: number;
    publishedBlogs: number;
    activeProjects: number;
    totalContentViews: number;
  };
  leadTrend: MetricPoint[];
  activityTrend: MetricPoint[];
  leadStatusBreakdown: MetricPoint[];
  projectStatusBreakdown: MetricPoint[];
  blogViews: MetricPoint[];
  recentLeads: LeadRow[];
  recentActivity: ActivityItem[];
};

function monthKey(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(
    new Date(value),
  );
}

function humanize(value: string | null | undefined) {
  const text = (value || "uncategorized").replace(/[_-]+/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function groupByMonth<T>(rows: T[], getDate: (row: T) => string | null | undefined, limit = 12) {
  const buckets = new Map<string, number>();
  rows.forEach((row) => {
    const stamp = getDate(row);
    if (!stamp) return;
    const key = monthKey(stamp);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  return Array.from(buckets.entries())
    .map(([name, value]) => ({ name, value }))
    .slice(-limit);
}

function groupByStatus<T>(rows: T[], getStatus: (row: T) => string | null | undefined) {
  const buckets = new Map<string, number>();
  rows.forEach((row) => {
    const key = humanize(getStatus(row));
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  return Array.from(buckets.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function sortRecent<T>(rows: T[], getDate: (row: T) => string | null | undefined) {
  return [...rows]
    .filter((row) => !!getDate(row))
    .sort((a, b) => new Date(getDate(b)!).getTime() - new Date(getDate(a)!).getTime());
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const [
    leadsResult,
    projectsResult,
    blogsResult,
    servicesResult,
    profilesResult,
    rolesResult,
  ] = await Promise.all([
    supabase.from("leads").select("id,name,email,company,message,status,replied_at,created_at,updated_at"),
    supabase.from("projects").select("id,title,description,status,featured,created_at,updated_at"),
    supabase.from("blog_posts").select("id,title,slug,status,published_at,view_count,created_at,updated_at"),
    supabase.from("services").select("id,title,created_at,updated_at"),
    supabase.from("profiles").select("id,display_name,company_name,created_at,updated_at"),
    supabase.from("user_roles").select("id,user_id,role,created_at"),
  ]);

  if (leadsResult.error) throw new Error(leadsResult.error.message);
  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (blogsResult.error) throw new Error(blogsResult.error.message);
  if (servicesResult.error) throw new Error(servicesResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (rolesResult.error) throw new Error(rolesResult.error.message);

  const leads = leadsResult.data ?? [];
  const projects = projectsResult.data ?? [];
  const blogs = blogsResult.data ?? [];
  const services = servicesResult.data ?? [];
  const profiles = profilesResult.data ?? [];
  const roles = rolesResult.data ?? [];

  const teamRoles = roles.filter((role) => role.role === "admin" || role.role === "editor");
  const publishedBlogs = blogs.filter((blog) => (blog.status ?? "").toLowerCase() === "published");
  const activeProjects = projects.filter((project) => {
    const status = (project.status ?? "").toLowerCase();
    return ["active", "live", "published", "completed"].includes(status);
  });

  const leadTrend = groupByMonth(leads, (lead) => lead.created_at);
  const activityTrend = groupByMonth(
    [...leads, ...projects, ...blogs],
    (row) => row.created_at,
  );
  const leadStatusBreakdown = groupByStatus(leads, (lead) => lead.status);
  const projectStatusBreakdown = groupByStatus(projects, (project) => project.status);
  const blogViews = blogs
    .filter((blog) => typeof blog.view_count === "number")
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 6)
    .map((blog) => ({
      name: blog.title.length > 28 ? `${blog.title.slice(0, 28)}...` : blog.title,
      value: blog.view_count ?? 0,
    }));

  const recentLeads = sortRecent(leads, (lead) => lead.created_at).slice(0, 6);
  const recentActivity = [
    ...sortRecent(leads, (lead) => lead.updated_at).slice(0, 3).map((lead) => ({
      id: `lead-${lead.id}`,
      title: lead.name,
      detail: `Lead status ${humanize(lead.status)}`,
      when: relativeTime(lead.updated_at),
      stamp: new Date(lead.updated_at).getTime(),
    })),
    ...sortRecent(projects, (project) => project.updated_at).slice(0, 3).map((project) => ({
      id: `project-${project.id}`,
      title: project.title,
      detail: `Project ${humanize(project.status)}`,
      when: relativeTime(project.updated_at),
      stamp: new Date(project.updated_at).getTime(),
    })),
    ...sortRecent(blogs, (blog) => blog.updated_at).slice(0, 3).map((blog) => ({
      id: `blog-${blog.id}`,
      title: blog.title,
      detail: `Blog ${humanize(blog.status)} · ${blog.view_count ?? 0} views`,
      when: relativeTime(blog.updated_at),
      stamp: new Date(blog.updated_at).getTime(),
    })),
  ]
    .sort((a, b) => b.stamp - a.stamp)
    .slice(0, 8);

  const totalContentViews = blogs.reduce((sum, blog) => sum + (blog.view_count ?? 0), 0);

  return {
    counts: {
      clients: profiles.length,
      leads: leads.length,
      projects: projects.length,
      blogs: blogs.length,
      services: services.length,
      team: teamRoles.length,
      openLeads: leads.filter((lead) => {
        const status = (lead.status ?? "").toLowerCase();
        return ["new", "open", "pending", "unread"].includes(status);
      }).length,
      publishedBlogs: publishedBlogs.length,
      activeProjects: activeProjects.length,
      totalContentViews,
    },
    leadTrend,
    activityTrend,
    leadStatusBreakdown,
    projectStatusBreakdown,
    blogViews,
    recentLeads,
    recentActivity,
  };
}
