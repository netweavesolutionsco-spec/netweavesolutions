import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Download } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton, PortalStatus } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney, type Invoice, type Payment, usePortalCollection } from "@/lib/portal-api";

export const Route = createFileRoute("/client/payments")({
  head: () => ({
    meta: [{ title: "Payments — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const payments = usePortalCollection<Payment>("payments", { pageSize: 100 });
  const invoices = usePortalCollection<Invoice>("invoices", { status: "sent", pageSize: 100 });
  const outstanding = (invoices.data?.data ?? []).reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);

  return (
    <ClientPortalShell title="Payments">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">Outstanding balance</p>
            <p className="mt-2 text-3xl font-semibold">{formatMoney(outstanding)}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">Stripe architecture</p>
            <p className="mt-2 text-sm leading-6">Payment provider IDs and receipt URLs are stored per transaction; checkout creation can be attached server-side without hardcoding keys in the browser.</p>
          </div>
        </div>

        <PortalPanel icon={CreditCard} title="Payment History">
          {payments.isLoading && <PortalSkeleton rows={4} />}
          {payments.isError && <PortalError message={(payments.error as Error).message} />}
          {payments.data && payments.data.data.length === 0 && (
            <PortalEmpty title="No payments" description="Transactions, receipt downloads, payment status, upcoming payments, and outstanding balances will appear here." />
          )}
          <div className="grid gap-4">
            {payments.data?.data.map((payment) => (
              <div key={payment.id} className="rounded-xl border border-border/70 bg-background/45 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <PortalStatus value={payment.status} />
                      <span className="text-xs text-muted-foreground">{payment.provider}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Paid {formatDate(payment.paidAt ?? payment.createdAt)}</p>
                    {payment.providerPaymentId && <p className="mt-1 text-xs text-muted-foreground">{payment.providerPaymentId}</p>}
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xl font-semibold">{formatMoney(payment.amount, payment.currency)}</p>
                    {payment.receiptUrl && (
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <a href={payment.receiptUrl} target="_blank" rel="noreferrer"><Download className="h-4 w-4" />Receipt</a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PortalPanel>
      </div>
    </ClientPortalShell>
  );
}
