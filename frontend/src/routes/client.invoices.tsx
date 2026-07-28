import { createFileRoute } from "@tanstack/react-router";
import { Download, Receipt } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton, PortalStatus } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney, type Invoice, usePortalCollection } from "@/lib/portal-api";

export const Route = createFileRoute("/client/invoices")({
  head: () => ({
    meta: [{ title: "Invoices — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const invoices = usePortalCollection<Invoice>("invoices", { pageSize: 100 });

  return (
    <ClientPortalShell title="Invoices">
      <PortalPanel icon={Receipt} title="Invoice History">
        {invoices.isLoading && <PortalSkeleton rows={4} />}
        {invoices.isError && <PortalError message={(invoices.error as Error).message} />}
        {invoices.data && invoices.data.data.length === 0 && (
          <PortalEmpty title="No invoices" description="Invoices, outstanding balances, due dates, PDFs, and receipt download links will appear here." />
        )}
        <div className="grid gap-4">
          {invoices.data?.data.map((invoice) => (
            <div key={invoice.id} className="rounded-xl border border-border/70 bg-background/45 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{invoice.invoiceNumber}</span>
                    <PortalStatus value={invoice.status} />
                  </div>
                  <h2 className="mt-2 font-semibold">{invoice.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Due {formatDate(invoice.dueAt)}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xl font-semibold">{formatMoney(invoice.amount, invoice.currency)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 md:justify-end">
                    {invoice.pdfUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={invoice.pdfUrl} target="_blank" rel="noreferrer"><Download className="h-4 w-4" />Invoice</a>
                      </Button>
                    )}
                    {invoice.receiptUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={invoice.receiptUrl} target="_blank" rel="noreferrer"><Download className="h-4 w-4" />Receipt</a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PortalPanel>
    </ClientPortalShell>
  );
}
