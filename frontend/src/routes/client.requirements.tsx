import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Printer, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton, PortalStatus } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatMoney, type Quotation, usePortalCollection, useRespondQuotation } from "@/lib/portal-api";

export const Route = createFileRoute("/client/requirements")({
  head: () => ({
    meta: [
      { title: "Quotations — Netweavesolutions Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuotationsPage,
});

function QuotationsPage() {
  const quotations = usePortalCollection<Quotation>("quotations", { pageSize: 100 });
  const respond = useRespondQuotation();
  const [revisionNote, setRevisionNote] = useState("");

  const act = async (quotation: Quotation, status: "accepted" | "rejected" | "revision_requested") => {
    try {
      await respond.mutateAsync({ id: quotation.id, status, revisionNote: status === "revision_requested" ? revisionNote : undefined });
      setRevisionNote("");
      toast.success("Quotation updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quotation could not be updated");
    }
  };

  return (
    <ClientPortalShell title="Quotations">
      <PortalPanel icon={FileText} title="Project Quotations">
        {quotations.isLoading && <PortalSkeleton rows={3} />}
        {quotations.isError && <PortalError message={(quotations.error as Error).message} />}
        {quotations.data && quotations.data.data.length === 0 && (
          <PortalEmpty title="No quotations" description="Prepared quotations will appear here with accept, reject, revision, PDF download, and print actions." />
        )}
        <div className="grid gap-4">
          {quotations.data?.data.map((quotation) => (
            <div key={quotation.id} className="rounded-xl border border-border/70 bg-background/45 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{quotation.quotationNumber}</span>
                    <PortalStatus value={quotation.status} />
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">{quotation.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Expires {formatDate(quotation.expiresAt)}</p>
                  <p className="mt-3 text-2xl font-semibold">{formatMoney(quotation.amount, quotation.currency)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quotation.pdfUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={quotation.pdfUrl} target="_blank" rel="noreferrer">
                        <FileText className="h-4 w-4" />
                        PDF
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
              {quotation.status === "pending" && (
                <div className="mt-4 border-t border-border/70 pt-4">
                  <Textarea rows={3} value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} placeholder="Revision notes for scope, timeline, or pricing" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => act(quotation, "accepted")} disabled={respond.isPending}>
                      <ThumbsUp className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(quotation, "rejected")} disabled={respond.isPending}>
                      <ThumbsDown className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(quotation, "revision_requested")} disabled={respond.isPending || !revisionNote.trim()}>
                      <RefreshCw className="h-4 w-4" />
                      Request Revision
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </PortalPanel>
    </ClientPortalShell>
  );
}
