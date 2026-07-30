import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, Eye, MousePointerClick, Clock } from "lucide-react";
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
import { ChartCard } from "@/admin/components/ChartCard";
import { StatCard } from "@/admin/components/StatCard";
import { AnimatedCounter } from "@/admin/hooks/useAnimatedNumber";
import { fetchAdminMetrics } from "@/admin/data/adminMetrics";

const PIE_COLORS = ["#4F46E5", "#8B5CF6", "#06B6D4", "#22c55e", "#f59e0b"];

export function AnalyticsPage() {
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
        <PageHeader title="Analytics" description="Live analytics from your database." />
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          Failed to load analytics data.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Live analytics from your database."
        actions={
          <button
            className="rounded-md border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing..." : "Refresh data"}
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          gradient
          label="Total Leads"
          delta={0}
          icon={<Users className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.leads} />}
        />
        <StatCard
          label="Content Views"
          delta={0}
          icon={<Eye className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.totalContentViews} />}
        />
        <StatCard
          label="Published Blogs"
          delta={0}
          icon={<MousePointerClick className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.publishedBlogs} />}
        />
        <StatCard
          label="Active Projects"
          delta={0}
          icon={<Clock className="h-5 w-5" />}
          value={<AnimatedCounter value={data.counts.activeProjects} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly activity" description="Lead, project and blog creations from the database">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={data.activityTrend}>
                <defs>
                  <linearGradient id="activityTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.45} />
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
                  fill="url(#activityTrend)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Lead status distribution" description="Current pipeline state">
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
        <ChartCard title="Top blog posts by views" description="Actual blog view_count values">
          <div className="h-72">
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

        <ChartCard title="Project status distribution" description="Current project lifecycle">
          <div className="h-72">
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
    </div>
  );
}
