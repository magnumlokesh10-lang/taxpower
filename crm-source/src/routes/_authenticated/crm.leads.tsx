import { createFileRoute } from "@tanstack/react-router";

import { CrmWorkspace } from "@/components/crm/crm-workspace";

export const Route = createFileRoute("/_authenticated/crm/leads")({
  head: () => ({ meta: [
    { title: "TaxPower CRM — Leads" },
    { name: "description", content: "Protected TaxPower lead directory and follow-up workspace." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "TaxPower CRM — Leads" },
    { property: "og:description", content: "Protected TaxPower lead directory and follow-up workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <CrmWorkspace view="leads" />,
});