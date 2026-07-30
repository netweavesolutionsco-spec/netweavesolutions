import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Send } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton, PortalStatus } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDate,
  type Priority,
  type SupportRequest,
  useCreateSupport,
  usePortalCollection,
} from "@/lib/portal-api";

export const Route = createFileRoute("/client/support")({
  head: () => ({
    meta: [{ title: "Support — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: SupportPage,
});

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function SupportPage() {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [details, setDetails] = useState("");
  const createSupport = useCreateSupport();
  const requests = usePortalCollection<SupportRequest>("support", { pageSize: 100 });

  const submit = async () => {
    try {
      await createSupport.mutateAsync({ subject, message: details, priority });
      setSubject("");
      setPriority("normal");
      setDetails("");
      toast.success("Support request submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Support request could not be sent");
    }
  };

  return (
    <ClientPortalShell title="Support">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PortalPanel icon={LifeBuoy} title="New Support Request">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="support-subject">Subject</Label>
              <Input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support-priority">Priority</Label>
              <select
                id="support-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PRIORITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support-details">Message</Label>
              <Textarea id="support-details" rows={7} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Describe what you need help with" />
            </div>
            <Button disabled={!subject.trim() || !details.trim() || createSupport.isPending} onClick={submit}>
              <Send className="h-4 w-4" />
              {createSupport.isPending ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </PortalPanel>
        <PortalPanel icon={LifeBuoy} title="Your Support Requests">
          {requests.isLoading && <PortalSkeleton rows={3} />}
          {requests.isError && <PortalError message={(requests.error as Error).message} />}
          {requests.data && requests.data.data.length === 0 && (
            <PortalEmpty title="No support requests yet" description="Submit a request and our team will get back to you." />
          )}
          <div className="space-y-3">
            {(requests.data?.data ?? []).map((request) => (
              <div key={request.id} className="rounded-lg border border-border/70 bg-background/45 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">{request.subject}</h2>
                  <PortalStatus value={request.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(request.createdAt)} · Priority: {request.priority}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{request.message}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/client/messages">Open Messages</Link>
          </Button>
        </PortalPanel>
      </div>
    </ClientPortalShell>
  );
}
