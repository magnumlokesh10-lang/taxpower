import { createFileRoute } from "@tanstack/react-router";

import { CrmWorkspace } from "@/components/crm/crm-workspace";

export const Route = createFileRoute("/_authenticated/crm/clients")({
  head: () => ({ meta: [
    { title: "TaxPower CRM — Clients" },
    { name: "description", content: "Protected TaxPower converted client directory." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "TaxPower CRM — Clients" },
    { property: "og:description", content: "Protected TaxPower converted client directory." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <CrmWorkspace view="clients" />,
});