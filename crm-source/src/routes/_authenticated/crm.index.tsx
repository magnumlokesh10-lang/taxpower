import { createFileRoute } from "@tanstack/react-router";

import { CrmWorkspace } from "@/components/crm/crm-workspace";

export const Route = createFileRoute("/_authenticated/crm/")({
  head: () => ({ meta: [
    { title: "TaxPower CRM — Dashboard" },
    { name: "description", content: "Internal TaxPower CRM dashboard." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "TaxPower CRM — Dashboard" },
    { property: "og:description", content: "Internal TaxPower CRM dashboard." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <CrmWorkspace view="dashboard" />,
});