import { createFileRoute, redirect } from "@tanstack/react-router";

// The site is served from the original taxpower.org static files in /public.
// Redirect / to the original index.html so the preview shows the untouched site.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/index.html" });
  },
  component: () => null,
});
