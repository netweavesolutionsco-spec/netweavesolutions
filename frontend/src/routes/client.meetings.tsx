import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, ExternalLink, Video } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton, PortalStatus } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, type Meeting, useCreateMeeting, usePortalCollection } from "@/lib/portal-api";

export const Route = createFileRoute("/client/meetings")({
  head: () => ({
    meta: [{ title: "Meetings — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const meetings = usePortalCollection<Meeting>("meetings", { pageSize: 100 });
  const createMeeting = useCreateMeeting();
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const now = Date.now();
  const upcoming = (meetings.data?.data ?? []).filter((meeting) => new Date(meeting.scheduledAt).getTime() >= now && meeting.status !== "cancelled");
  const past = (meetings.data?.data ?? []).filter((meeting) => new Date(meeting.scheduledAt).getTime() < now || meeting.status === "completed");

  const submit = async () => {
    try {
      await createMeeting.mutateAsync({
        title,
        agenda,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: 30,
      });
      setTitle("");
      setAgenda("");
      setScheduledAt("");
      toast.success("Meeting requested");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Meeting could not be requested");
    }
  };

  return (
    <ClientPortalShell title="Meetings">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <PortalPanel icon={Calendar} title="Upcoming Meetings">
            {meetings.isLoading && <PortalSkeleton rows={3} />}
            {meetings.isError && <PortalError message={(meetings.error as Error).message} />}
            {meetings.data && upcoming.length === 0 && <PortalEmpty title="No upcoming meetings" description="Schedule kickoff, planning, progress review, and support meetings here." />}
            <MeetingList meetings={upcoming} />
          </PortalPanel>
          <PortalPanel icon={Video} title="Past Meetings">
            {meetings.data && past.length === 0 ? (
              <PortalEmpty title="No past meetings" description="Completed meeting notes and links will appear here." />
            ) : (
              <MeetingList meetings={past} />
            )}
          </PortalPanel>
        </div>

        <PortalPanel icon={Calendar} title="Request Meeting">
          <div className="space-y-4">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Meeting title" />
            <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            <Textarea rows={5} value={agenda} onChange={(event) => setAgenda(event.target.value)} placeholder="Agenda or notes" />
            <Button className="w-full" disabled={!title.trim() || !scheduledAt || createMeeting.isPending} onClick={submit}>
              {createMeeting.isPending ? "Requesting..." : "Request Meeting"}
            </Button>
          </div>
        </PortalPanel>
      </div>
    </ClientPortalShell>
  );
}

function MeetingList({ meetings }: { meetings: Meeting[] }) {
  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="rounded-lg border border-border/70 bg-background/45 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{meeting.title}</h2>
            <PortalStatus value={meeting.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(meeting.scheduledAt)} · {meeting.durationMinutes} min</p>
          {meeting.agenda && <p className="mt-2 text-sm leading-6">{meeting.agenda}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {meeting.googleMeetUrl && <Button asChild variant="outline" size="sm"><a href={meeting.googleMeetUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Google Meet</a></Button>}
            {meeting.zoomUrl && <Button asChild variant="outline" size="sm"><a href={meeting.zoomUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Zoom</a></Button>}
          </div>
          {meeting.notes && <p className="mt-3 rounded-md bg-card/70 p-3 text-sm leading-6">{meeting.notes}</p>}
        </div>
      ))}
    </div>
  );
}
