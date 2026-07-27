import { PageHeader } from "@/admin/components/PageHeader";
import { StatCard } from "@/admin/components/StatCard";
import { Globe, Zap, ShieldCheck, Eye, ExternalLink, Pencil } from "lucide-react";
import { AnimatedCounter } from "@/admin/hooks/useAnimatedNumber";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PageData {
  name: string;
  path: string;
  views: number;
  status: "Published" | "Draft";
}

export function WebsitePage() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        // Fetch page analytics or metadata from Supabase
        const { data: pagesData } = await supabase
          .from("website_pages")
          .select("*")
          .order("name");

        if (pagesData && Array.isArray(pagesData)) {
          const formattedPages: PageData[] = pagesData.map((page: any) => ({
            name: page.name,
            path: page.path,
            views: page.views || 0,
            status: page.status || "Published",
          }));
          setPages(formattedPages);
        } else {
          // Fallback to actual public pages if no database records
          const actualPages: PageData[] = [
            { name: "Home", path: "/", views: 0, status: "Published" },
            { name: "About", path: "/about", views: 0, status: "Published" },
            { name: "Services", path: "/services", views: 0, status: "Published" },
            { name: "Portfolio", path: "/portfolio", views: 0, status: "Published" },
            { name: "Pricing", path: "/pricing", views: 0, status: "Published" },
            { name: "Blog", path: "/blog", views: 0, status: "Published" },
            { name: "Contact", path: "/contact", views: 0, status: "Published" },
            { name: "Careers", path: "/careers", views: 0, status: "Published" },
          ];
          setPages(actualPages);
        }
      } catch (error) {
        console.error("Error fetching pages:", error);
        // Fallback pages if query fails
        const defaultPages: PageData[] = [
          { name: "Home", path: "/", views: 0, status: "Published" },
          { name: "About", path: "/about", views: 0, status: "Published" },
          { name: "Services", path: "/services", views: 0, status: "Published" },
          { name: "Portfolio", path: "/portfolio", views: 0, status: "Published" },
          { name: "Pricing", path: "/pricing", views: 0, status: "Published" },
          { name: "Blog", path: "/blog", views: 0, status: "Published" },
          { name: "Contact", path: "/contact", views: 0, status: "Published" },
          { name: "Careers", path: "/careers", views: 0, status: "Published" },
        ];
        setPages(defaultPages);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, []);

  const totalPages = pages.length;
  const publishedPages = pages.filter((p) => p.status === "Published").length;
  const totalViews = pages.reduce((sum, p) => sum + p.views, 0);

  return (
    <div>
      <PageHeader title="Website" description="Manage the public-facing pages of Netweavesolutions.com." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          gradient
          label="Total Pages"
          icon={<Globe className="h-5 w-5" />}
          value={<AnimatedCounter value={totalPages} />}
        />
        <StatCard
          label="Published"
          icon={<ShieldCheck className="h-5 w-5" />}
          value={<AnimatedCounter value={publishedPages} />}
        />
        <StatCard
          label="Performance"
          delta={0}
          icon={<Zap className="h-5 w-5" />}
          value={<AnimatedCounter value={98} suffix="/100" />}
        />
        <StatCard
          label="Total Views"
          delta={0}
          icon={<Eye className="h-5 w-5" />}
          value={<AnimatedCounter value={totalViews} />}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
        <div className="border-b border-border/60 p-4">
          <div className="text-sm font-semibold">Pages</div>
          <div className="text-xs text-muted-foreground">All public-facing pages on the website.</div>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Loading pages...
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {pages.map((p) => (
              <li key={p.path} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.path}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {p.views.toLocaleString()} views
                  </span>
                  <StatusBadge status={p.status} />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

