import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Pin, Search, Send } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, type ProjectMessage, useCreateMessage, usePortalCollection } from "@/lib/portal-api";

export const Route = createFileRoute("/client/messages")({
  head: () => ({
    meta: [{ title: "Messages — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const messages = usePortalCollection<ProjectMessage>("messages", { pageSize: 100 });
  const createMessage = useCreateMessage();
  const filtered = (messages.data?.data ?? []).filter((message) =>
    `${message.senderName} ${message.body}`.toLowerCase().includes(search.toLowerCase()),
  );

  const send = async () => {
    try {
      await createMessage.mutateAsync({ body });
      setBody("");
      toast.success("Message sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message could not be sent");
    }
  };

  return (
    <ClientPortalShell title="Messages">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PortalPanel icon={MessageSquare} title="Conversation">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages" />
          </div>
          {messages.isLoading && <PortalSkeleton rows={4} />}
          {messages.isError && <PortalError message={(messages.error as Error).message} />}
          {messages.data && filtered.length === 0 && (
            <PortalEmpty title="No messages" description="Send a message to the Netweavesolutions team and replies will stay searchable here." />
          )}
          <div className="space-y-3">
            {filtered.map((message) => (
              <div key={message.id} className="rounded-lg border border-border/70 bg-background/45 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {message.pinned && <Pin className="h-4 w-4 text-primary" />}
                    {message.senderName}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                {message.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <a key={attachment.url} href={attachment.url} className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                        {attachment.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </PortalPanel>

        <PortalPanel icon={Send} title="Contact Team">
          <Textarea rows={8} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your update, question, or support request..." />
          <Button className="mt-4 w-full" disabled={body.trim().length === 0 || createMessage.isPending} onClick={send}>
            <Send className="h-4 w-4" />
            {createMessage.isPending ? "Sending..." : "Send Message"}
          </Button>
        </PortalPanel>
      </div>
    </ClientPortalShell>
  );
}
