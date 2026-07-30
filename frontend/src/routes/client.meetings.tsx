import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, ExternalLink, Video } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton, PortalStatus } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDate,
  type Meeting,
  type MeetingPlatform,
  useCreateMeeting,
  usePortalCollection,
} from "@/lib/portal-api";

export const Route = createFileRoute("/client/meetings")({
  head: () => ({
    meta: [{ title: "Meetings — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: MeetingsPage,
});

const PLATFORMS: { value: MeetingPlatform; label: string }[] = [
  { value: "google_meet", label: "Google Meet" },
  { value: "microsoft_teams", label: "Microsoft Teams" },
];

const PLATFORM_LABELS: Record<string, string> = {
  google_meet: "Google Meet",
  microsoft_teams: "Microsoft Teams",
  zoom: "Zoom",
  other: "Other",
};

function MeetingsPage() {
  const meetings = usePortalCollection<Meeting>("meetings", { pageSize: 100 });
  const createMeeting = useCreateMeeting();
  const [platform, setPlatform] = useState<MeetingPlatform>("google_meet");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const now = Date.now();
  const upcoming = (meetings.data?.data ?? []).filter((meeting) => new Date(meeting.scheduledAt).getTime() >= now && meeting.status !== "cancelled" && meeting.status !== "rejected");
  const past = (meetings.data?.data ?? []).filter((meeting) => new Date(meeting.scheduledAt).getTime() < now || meeting.status === "completed");

  const submit = async () => {
    const scheduledAt = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error("Please choose a valid date and time");
      return;
    }
    try {
      await createMeeting.mutateAsync({
        platform,
        title,
        agenda: description,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: 30,
      });
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setPlatform("google_meet");
      toast.success("Meeting request submitted — status: Pending");
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

        <PortalPanel icon={Calendar} title="Schedule Meeting">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="meeting-platform">Meeting Platform</Label>
              <select
                id="meeting-platform"
                value={platform}
                onChange={(event) => setPlatform(event.target.value as MeetingPlatform)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PLATFORMS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="meeting-date">Date</Label>
                <Input id="meeting-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meeting-time">Time</Label>
                <Input id="meeting-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting-topic">Topic</Label>
              <Input id="meeting-topic" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What is this meeting about?" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting-description">Description (optional)</Label>
              <Textarea id="meeting-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add any context or agenda" />
            </div>
            <Button className="w-full" disabled={!title.trim() || !date || !time || createMeeting.isPending} onClick={submit}>
              {createMeeting.isPending ? "Scheduling..." : "Schedule Meeting"}
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
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(meeting.scheduledAt)}
            {" · "}
            {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {meeting.platform && ` · ${PLATFORM_LABELS[meeting.platform] ?? meeting.platform}`}
          </p>
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
