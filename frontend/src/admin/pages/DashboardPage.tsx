import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Briefcase,
  FolderKanban,
  Inbox,
  Loader2,
  Newspaper,
  Sparkles,
  Users,
  UserRoundSearch,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { PageHeader } from "@/admin/components/PageHeader";
import { StatCard } from "@/admin/components/StatCard";
import { ChartCard } from "@/admin/components/ChartCard";
import { AnimatedCounter } from "@/admin/hooks/useAnimatedNumber";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { fetchAdminMetrics } from "@/admin/data/adminMetrics";

const PIE_COLORS = ["#4F46E5", "#8B5CF6", "#06B6D4", "#22c55e", "#f59e0b"];

export function DashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: fetchAdminMetrics,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" description="Live website and business overview." />
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          Failed to load dashboard data.
          <Button variant="outline" size="sm" className="ml-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live website and business overview from your database."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Refresh data
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          gradient
          label="Clients"
          delta={0}
          icon={<Users className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.clients} />}
        />
        <StatCard
          label="Leads"
          delta={0}
          icon={<Inbox className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.leads} />}
        />
        <StatCard
          label="Projects"
          delta={0}
          icon={<FolderKanban className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.projects} />}
        />
        <StatCard
          gradient
          label="Team Members"
          delta={0}
          icon={<Users className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.team} />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Blog Posts"
          delta={0}
          icon={<Newspaper className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.blogs} />}
        />
        <StatCard
          label="Services"
          delta={0}
          icon={<Briefcase className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.services} />}
        />
        <StatCard
          label="Open Leads"
          delta={0}
          icon={<UserRoundSearch className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.openLeads} />}
        />
        <StatCard
          label="Content Views"
          delta={0}
          icon={<Sparkles className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.totalContentViews} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Lead inquiries by month"
          description="Actual lead records from the database"
          className="lg:col-span-2"
        >
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={data.leadTrend}>
                <defs>
                  <linearGradient id="leadTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} stroke="currentColor" opacity={0.5} />
                <YAxis fontSize={11} stroke="currentColor" opacity={0.5} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4F46E5"
                  fill="url(#leadTrend)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Lead status mix" description="Current pipeline state">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.leadStatusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {data.leadStatusBreakdown.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Top blog posts" description="Ranked by actual view_count">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.blogViews} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" fontSize={11} stroke="currentColor" opacity={0.5} />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={11}
                  stroke="currentColor"
                  opacity={0.5}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Project status" description="Current project lifecycle">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.projectStatusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} stroke="currentColor" opacity={0.5} />
                <YAxis fontSize={11} stroke="currentColor" opacity={0.5} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Recent leads"
          description="Latest enquiries from the database"
          className="lg:col-span-1"
        >
          <ul className="divide-y divide-border/60">
            {data.recentLeads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">
                    {lead.name} <span className="text-muted-foreground">· {lead.company || "No company"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{lead.email}</div>
                </div>
                <StatusBadge status={lead.status ?? "new"} />
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Recent activity"
          description="Latest real database changes"
          action={<Activity className="h-4 w-4 text-muted-foreground" />}
        >
          <ul className="space-y-3">
            {data.recentActivity.map((item) => (
              <li key={item.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" />
                <div className="flex-1">
                  <div>
                    <span className="font-medium">{item.title}</span>{" "}
                    <span className="text-muted-foreground">{item.detail}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
