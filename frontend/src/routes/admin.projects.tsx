import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/admin/pages/ProjectsPage";
import { z } from "zod";

// `?new=1` is set by the topbar "New Project" quick action so the page opens
// with the create dialog already visible.
const searchSchema = z
  .object({
    new: z.string().optional(),
  })
  .catch({});

export const Route = createFileRoute("/admin/projects")({
  validateSearch: searchSchema,
  component: ProjectsPage,
});
