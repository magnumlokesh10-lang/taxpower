import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "TaxPower CRM — Dashboard" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Internal TaxPower CRM dashboard." },
      { property: "og:title", content: "TaxPower CRM — Dashboard" },
      { property: "og:description", content: "Internal TaxPower CRM dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Outlet,
});
