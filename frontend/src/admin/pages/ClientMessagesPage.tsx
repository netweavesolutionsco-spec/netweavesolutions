import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/admin/components/PageHeader";
import { DataTable, type Column } from "@/admin/components/DataTable";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { Navigate } from "@tanstack/react-router";

interface MessageRow {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  createdAt: string;
  adminReadAt: string | null;
}

export function ClientMessagesPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<MessageRow | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    async function load() {
      try {
        // Client-authored messages: sender_id equals the owning client_id.
        const { data, error } = await supabase
          .from("project_messages")
          .select("id, sender_name, sender_email, subject, body, created_at, admin_read_at, sender_id, client_id")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (cancelled) return;

        setMessages(
          (data ?? [])
            .filter((m) => !m.sender_id || m.sender_id === m.client_id)
            .map((m) => ({
              id: m.id,
              senderName: m.sender_name || "—",
              senderEmail: m.sender_email || "",
              subject: m.subject || "",
              body: m.body || "",
              createdAt: m.created_at || new Date().toISOString(),
              adminReadAt: m.admin_read_at ?? null,
            })),
        );
      } catch (e) {
        console.error("Error loading client messages:", e);
        toast.error(e instanceof Error ? e.message : "Failed to load messages");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const markRead = async (row: MessageRow) => {
    if (row.adminReadAt) return;
    const stamp = new Date().toISOString();
    setMessages((rows) => rows.map((r) => (r.id === row.id ? { ...r, adminReadAt: stamp } : r)));
    const { error } = await supabase
      .from("project_messages")
      .update({ admin_read_at: stamp })
      .eq("id", row.id);
    if (error) {
      setMessages((rows) => rows.map((r) => (r.id === row.id ? { ...r, adminReadAt: null } : r)));
      toast.error(error.message || "Could not mark as read");
    }
  };

  const openMessage = (row: MessageRow) => {
    setActive(row);
    void markRead(row);
  };

  const columns: Column<MessageRow>[] = useMemo(
    () => [
      {
        key: "senderName",
        header: "Sender",
        render: (r) => (
          <div className="min-w-40">
            <div className={r.adminReadAt ? "font-medium" : "font-semibold"}>{r.senderName}</div>
            <div className="text-xs text-muted-foreground">{r.senderEmail}</div>
          </div>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        render: (r) => r.subject || <span className="text-muted-foreground">—</span>,
      },
      {
        key: "body",
        header: "Message",
        render: (r) => <span className="line-clamp-2 block max-w-72 text-muted-foreground">{r.body}</span>,
      },
      {
        key: "createdAt",
        header: "Date & Time",
        render: (r) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {new Date(r.createdAt).toLocaleDateString()}{" "}
            {new Date(r.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (r) => <StatusBadge status={r.adminReadAt ? "Read" : "Unread"} />,
      },
      {
        key: "actions",
        header: "",
        render: (r) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="View message"
              onClick={() => openMessage(r)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Reply by email">
              <a href={`mailto:${r.senderEmail}`}>
                <Mail className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        ),
        className: "text-right",
      },
    ],
    [messages],
  );

  const unreadCount = messages.filter((m) => !m.adminReadAt).length;

  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin" />;

  return (
    <div>
      <PageHeader
        title="Client Messages"
        description={
          messages.length
            ? `${messages.length} message${messages.length === 1 ? "" : "s"} · ${unreadCount} unread.`
            : "Messages sent by clients from the client portal."
        }
      />
      <DataTable
        rows={messages}
        columns={columns}
        searchKeys={["senderName", "senderEmail", "subject", "body"]}
        emptyMessage="No client messages yet"
      />

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-[min(95vw,38rem)]">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5">
                  {active.subject || "Message"}
                  <StatusBadge status={active.adminReadAt ? "Read" : "Unread"} />
                </DialogTitle>
                <DialogDescription>
                  From {active.senderName} · {new Date(active.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                {(
                  [
                    ["Name", active.senderName],
                    ["Email", active.senderEmail],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="col-span-2 grid grid-cols-[6rem_1fr] gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-words font-medium">
                      {value || <span className="font-normal text-muted-foreground">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>

              <div>
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Message
                </div>
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3.5 text-sm leading-relaxed">
                  {active.body || "—"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm">
                  <a href={`mailto:${active.senderEmail}`}>
                    <Mail className="h-3.5 w-3.5" /> Reply by email
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
