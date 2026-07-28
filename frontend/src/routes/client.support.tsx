import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Send } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalPanel } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateMessage } from "@/lib/portal-api";

export const Route = createFileRoute("/client/support")({
  head: () => ({
    meta: [{ title: "Support — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: SupportPage,
});

function SupportPage() {
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const createMessage = useCreateMessage();

  const submit = async () => {
    try {
      await createMessage.mutateAsync({ body: `Support request: ${subject}\n\n${details}` });
      setSubject("");
      setDetails("");
      toast.success("Support request sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Support request could not be sent");
    }
  };

  return (
    <ClientPortalShell title="Support">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <PortalPanel icon={LifeBuoy} title="New Support Request">
          <div className="space-y-4">
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
            <Textarea rows={8} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Describe what you need help with" />
            <Button disabled={!subject.trim() || !details.trim() || createMessage.isPending} onClick={submit}>
              <Send className="h-4 w-4" />
              {createMessage.isPending ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </PortalPanel>
        <PortalPanel title="Conversation History">
          <p className="text-sm leading-6 text-muted-foreground">
            Support requests are stored in Messages so your team has one continuous conversation.
          </p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/client/messages">Open Messages</Link>
          </Button>
        </PortalPanel>
      </div>
    </ClientPortalShell>
  );
}
