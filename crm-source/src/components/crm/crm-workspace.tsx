import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { listLeads, updateLead } from "@/lib/crm.functions";
import { supabase } from "@/integrations/supabase/client";

export type CrmView = "dashboard" | "leads" | "clients";
type Status = "new" | "contacted" | "converted" | "closed";

type Lead = {
  id: string;
  submitted_at: string;
  submitted_at_text: string;
  name: string;
  company: string;
  mobile: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  product: string;
  purpose: string;
  page: string;
  status: Status;
  notes: string;
  followup_date: string | null;
  followup_note: string;
  converted_at: string | null;
  purchase_product: string;
  purchase_amount: number | string | null;
  invoice_no: string;
};

type Patch = {
  id: string;
  status?: Status;
  notes?: string;
  followup_date?: string | null;
  followup_note?: string;
  purchase_product?: string;
  purchase_amount?: number | null;
  invoice_no?: string;
  mark_converted?: boolean;
};

const STATUSES: Status[] = ["new", "contacted", "converted", "closed"];
const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  closed: "Closed",
};
const STATUS_CLASS: Record<Status, string> = {
  new: "bg-sky-soft text-sky-brand",
  contacted: "bg-brand-soft text-brand",
  converted: "bg-success-soft text-success",
  closed: "bg-muted text-muted-foreground",
};

function fmtDate(lead: Lead) {
  return lead.submitted_at_text || new Date(lead.submitted_at).toLocaleString("en-IN");
}

function dateKey(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function CrmWorkspace({ view }: { view: CrmView }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(listLeads);
  const saveLead = useServerFn(updateLead);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [followupOnly, setFollowupOnly] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-leads"],
    queryFn: () => fetchLeads(),
  });
  const mutation = useMutation({
    mutationFn: (vars: Patch) => saveLead({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm-leads"] }),
  });
  const leads = (data?.leads ?? []) as Lead[];
  const selectedLead = leads.find((lead) => lead.id === selectedId) ?? null;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const counts = useMemo(() => ({
    total: leads.length,
    today: leads.filter((lead) => dateKey(lead.submitted_at) === today).length,
    new: leads.filter((lead) => lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    converted: leads.filter((lead) => lead.status === "converted").length,
    closed: leads.filter((lead) => lead.status === "closed").length,
    followups: leads.filter((lead) => lead.followup_date && lead.status !== "converted").length,
    due: leads.filter((lead) => lead.followup_date && lead.status !== "converted" && lead.followup_date <= today).length,
  }), [leads, today]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/crm/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <CrmSidebar
        collapsed={collapsed}
        mobileOpen={sidebarOpen}
        onCollapse={() => setCollapsed((value) => !value)}
        onMobileClose={() => setSidebarOpen(false)}
        onSignOut={signOut}
      />
      <div className={`min-h-screen transition-[margin] duration-200 ${collapsed ? "md:ml-20" : "md:ml-64"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-foreground">
                {view === "dashboard" ? "Dashboard" : view === "leads" ? "Leads" : "Clients"}
              </h1>
              <p className="truncate text-xs text-muted-foreground">TaxPower enquiry management</p>
            </div>
          </div>
          <div className="rounded-md bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">Admin</div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {isLoading ? <LoadingState /> : error ? <ErrorState /> : view === "dashboard" ? (
            <DashboardView leads={leads} counts={counts} today={today} onOpen={setSelectedId} />
          ) : (
            <DirectoryView
              view={view}
              leads={leads}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              followupOnly={followupOnly}
              setFollowupOnly={setFollowupOnly}
              today={today}
              onOpen={setSelectedId}
              onUpdate={(patch) => mutation.mutate(patch)}
            />
          )}
        </main>
      </div>
      {selectedLead ? (
        <LeadDetailPanel
          lead={selectedLead}
          saving={mutation.isPending}
          onClose={() => setSelectedId(null)}
          onSave={(patch) => mutation.mutate(patch)}
        />
      ) : null}
    </div>
  );
}

function CrmSidebar({ collapsed, mobileOpen, onCollapse, onMobileClose, onSignOut }: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
  onSignOut: () => void;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const items = [
    { to: "/crm" as const, label: "Dashboard", icon: LayoutDashboard },
    { to: "/crm/leads" as const, label: "Leads", icon: Users },
    { to: "/crm/clients" as const, label: "Clients", icon: UserCheck },
  ];
  return (
    <>
      {mobileOpen ? <div className="fixed inset-0 z-30 bg-overlay md:hidden" onClick={onMobileClose} /> : null}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "md:w-20" : "md:w-64"} w-64 md:translate-x-0`}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">TP</div>
            {!collapsed ? <div><div className="font-semibold">TaxPower</div><div className="text-xs text-sidebar-muted">CRM Console</div></div> : null}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileClose} aria-label="Close menu"><X /></Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} onClick={onMobileClose} title={collapsed ? item.label : undefined} className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"}`}>
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" className={`w-full ${collapsed ? "px-0" : "justify-start"}`} onClick={onSignOut} title="Sign out">
            <LogOut />{!collapsed ? "Sign out" : null}
          </Button>
          <Button variant="ghost" size="icon" className="mt-2 hidden w-full md:inline-flex" onClick={onCollapse} aria-label={collapsed ? "Expand menu" : "Collapse menu"}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
      </aside>
    </>
  );
}

function DashboardView({ leads, counts, today, onOpen }: { leads: Lead[]; counts: { total: number; today: number; new: number; contacted: number; converted: number; closed: number; followups: number; due: number }; today: string; onOpen: (id: string) => void }) {
  const cards = [
    { label: "Today's leads", value: counts.today, icon: TrendingUp, tone: "bg-sky-soft text-sky-brand" },
    { label: "Total leads", value: counts.total, icon: Users, tone: "bg-brand-soft text-brand" },
    { label: "Pending follow-ups", value: counts.followups, icon: CalendarClock, tone: "bg-warning-soft text-warning" },
    { label: "Converted clients", value: counts.converted, icon: CheckCircle2, tone: "bg-success-soft text-success" },
  ];
  const bars = STATUSES.map((status) => ({ status, value: counts[status] ?? 0 }));
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const recent = leads.slice(0, 6);
  const due = leads.filter((lead) => lead.followup_date && lead.status !== "converted" && lead.followup_date <= today).slice(0, 5);
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <div key={card.label} className="rounded-md border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-2 text-3xl font-semibold text-card-foreground">{card.value}</p></div><div className={`grid h-11 w-11 place-items-center rounded-md ${card.tone}`}><card.icon className="h-5 w-5" /></div></div></div>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-md border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><h2 className="font-semibold text-card-foreground">Lead pipeline</h2></div>
          <div className="mt-6 space-y-5">
            {bars.map((bar) => <div key={bar.status}><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">{STATUS_LABEL[bar.status]}</span><span className="font-semibold text-foreground">{bar.value}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${bar.status === "converted" ? "bg-success" : bar.status === "contacted" ? "bg-warning" : bar.status === "closed" ? "bg-muted-foreground" : "bg-sky-brand"} ${barWidth(bar.value, max)}`} /></div></div>)}
          </div>
        </section>
        <section className="rounded-md border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-card-foreground">Follow-ups due</h2><span className="text-xs font-semibold text-destructive">{counts.due} due</span></div>
          <div className="mt-4 divide-y divide-border">
            {due.length ? due.map((lead) => <button key={lead.id} onClick={() => onOpen(lead.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-muted/50"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{lead.name || "Unnamed lead"}</p><p className="truncate text-xs text-muted-foreground">{lead.company || lead.mobile}</p></div><span className="shrink-0 text-xs font-medium text-destructive">{lead.followup_date}</span></button>) : <p className="py-8 text-center text-sm text-muted-foreground">No follow-ups due.</p>}
          </div>
        </section>
      </div>
      <section className="rounded-md border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="font-semibold text-card-foreground">Recent leads</h2><Link to="/crm/leads" className="text-sm font-medium text-primary hover:underline">View all</Link></div>
        <div className="divide-y divide-border">{recent.map((lead) => <button key={lead.id} onClick={() => onOpen(lead.id)} className="grid w-full gap-2 px-5 py-4 text-left hover:bg-muted/50 sm:grid-cols-[1.2fr_1fr_1fr_auto]"><div><p className="font-medium text-foreground">{lead.name || "Unnamed lead"}</p><p className="text-xs text-muted-foreground">{lead.company}</p></div><p className="text-sm text-foreground">{lead.mobile}</p><p className="text-sm text-muted-foreground">{lead.product || "—"}</p><span className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${STATUS_CLASS[lead.status]}`}>{STATUS_LABEL[lead.status]}</span></button>)}</div>
      </section>
    </div>
  );
}

function DirectoryView({ view, leads, search, setSearch, statusFilter, setStatusFilter, followupOnly, setFollowupOnly, today, onOpen, onUpdate }: {
  view: "leads" | "clients";
  leads: Lead[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: "all" | Status;
  setStatusFilter: (value: "all" | Status) => void;
  followupOnly: boolean;
  setFollowupOnly: (value: boolean) => void;
  today: string;
  onOpen: (id: string) => void;
  onUpdate: (patch: Patch) => void;
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (view === "clients" && lead.status !== "converted") return false;
      if (view === "leads" && statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (view === "leads" && followupOnly && (!lead.followup_date || lead.status === "converted")) return false;
      return !q || [lead.name, lead.company, lead.mobile, lead.email, lead.product, lead.purpose, lead.city, lead.state, lead.notes, lead.followup_note, lead.invoice_no, lead.purchase_product].join(" ").toLowerCase().includes(q);
    });
  }, [followupOnly, leads, search, statusFilter, view]);

  function exportCsv() {
    const headers = ["Submitted At", "Name", "Company", "Mobile", "Email", "GSTIN", "Address", "City", "State", "Product", "Purpose", "Status", "Follow-up date", "Follow-up note", "Converted at", "Purchased product", "Amount", "Invoice no", "Notes"];
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((lead) => [fmtDate(lead), lead.name, lead.company, lead.mobile, lead.email, lead.gstin, lead.address, lead.city, lead.state, lead.product, lead.purpose, lead.status, lead.followup_date ?? "", lead.followup_note, lead.converted_at ? new Date(lead.converted_at).toLocaleString("en-IN") : "", lead.purchase_product, lead.purchase_amount ?? "", lead.invoice_no, lead.notes].map(escape).join(","));
    const url = URL.createObjectURL(new Blob(["\uFEFF" + [headers.map(escape).join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `taxpower-${view}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><h2 className="text-2xl font-semibold text-foreground">{view === "leads" ? "All leads" : "Converted clients"}</h2><p className="mt-1 text-sm text-muted-foreground">{filtered.length} {view === "leads" ? "leads" : "clients"} shown</p></div>
        <Button variant="outline" onClick={exportCsv}><Download />Export CSV</Button>
      </div>
      <div className="mt-5 flex flex-col gap-3 rounded-md border border-border bg-card p-4 shadow-sm md:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, mobile, email, product or invoice" className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" /></label>
        {view === "leads" ? <><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | Status)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="all">All status</option>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select><Button variant={followupOnly ? "default" : "outline"} onClick={() => setFollowupOnly(!followupOnly)}><CalendarClock />Follow-ups</Button></> : null}
      </div>
      {!filtered.length ? <div className="mt-5 rounded-md border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">No records found.</div> : (
        <div className="mt-5 overflow-x-auto rounded-md border border-border bg-card shadow-sm">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-muted text-left text-xs font-semibold uppercase text-muted-foreground"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Name / Company</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Product</th>{view === "clients" ? <><th className="px-4 py-3">Purchased</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Invoice</th></> : <><th className="px-4 py-3">Follow-up</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Convert</th></>}</tr></thead>
            <tbody className="divide-y divide-border">{filtered.map((lead) => <tr key={lead.id} onClick={() => onOpen(lead.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(lead.id); }} className="cursor-pointer align-top transition-colors hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"><td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{fmtDate(lead)}</td><td className="px-4 py-3"><p className="font-medium text-foreground">{lead.name || "—"}</p><p className="mt-0.5 text-xs text-muted-foreground">{lead.company || "—"}</p></td><td className="px-4 py-3"><p className="text-foreground">{lead.mobile || "—"}</p><p className="mt-0.5 text-xs text-muted-foreground">{lead.email || "—"}</p></td><td className="px-4 py-3 text-foreground">{lead.product || "—"}</td>{view === "clients" ? <><td className="px-4 py-3">{lead.purchase_product || "—"}</td><td className="whitespace-nowrap px-4 py-3">{lead.purchase_amount ? `₹${lead.purchase_amount}` : "—"}</td><td className="px-4 py-3">{lead.invoice_no || "—"}</td></> : <><td className={`whitespace-nowrap px-4 py-3 ${lead.followup_date && lead.followup_date <= today ? "font-medium text-destructive" : "text-foreground"}`}>{lead.followup_date || "—"}</td><td className="px-4 py-3"><select value={lead.status} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate({ id: lead.id, status: event.target.value as Status })} className={`rounded-md border-0 px-2 py-1 text-xs font-semibold ${STATUS_CLASS[lead.status]}`}>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select></td><td className="px-4 py-3 text-right">{lead.status === "converted" ? <span className="inline-flex rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">Converted</span> : <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={(event) => { event.stopPropagation(); onUpdate({ id: lead.id, mark_converted: true }); }}><CheckCircle2 />Convert</Button>}</td></>}</tr>)}</tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Click any row to view and update complete details.</p>
    </div>
  );
}

function LeadDetailPanel({ lead, saving, onClose, onSave }: { lead: Lead; saving: boolean; onClose: () => void; onSave: (patch: Patch) => void }) {
  const [form, setForm] = useState({ status: lead.status, followup_date: lead.followup_date ?? "", followup_note: lead.followup_note ?? "", notes: lead.notes ?? "", purchase_product: lead.purchase_product ?? "", purchase_amount: lead.purchase_amount != null ? String(lead.purchase_amount) : "", invoice_no: lead.invoice_no ?? "" });
  useEffect(() => setForm({ status: lead.status, followup_date: lead.followup_date ?? "", followup_note: lead.followup_note ?? "", notes: lead.notes ?? "", purchase_product: lead.purchase_product ?? "", purchase_amount: lead.purchase_amount != null ? String(lead.purchase_amount) : "", invoice_no: lead.invoice_no ?? "" }), [lead]);
  function submit(markConverted: boolean) {
    const amount = form.purchase_amount.trim();
    onSave({ id: lead.id, status: form.status, followup_date: form.followup_date || null, followup_note: form.followup_note, notes: form.notes, purchase_product: form.purchase_product, purchase_amount: amount === "" ? null : Number(amount), invoice_no: form.invoice_no, ...(markConverted ? { mark_converted: true } : {}) });
  }
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-overlay" onClick={onClose}>
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4 sm:px-7"><div><p className="text-xs font-semibold uppercase text-primary">Lead enquiry</p><h2 className="mt-1 text-xl font-semibold text-foreground">{lead.name || "Lead details"}</h2><p className="text-sm text-muted-foreground">Received {fmtDate(lead)}</p></div><Button variant="outline" size="icon" onClick={onClose} aria-label="Close details"><X /></Button></div>
        <div className="p-5 sm:p-7">
          <FormSection title="Personal & company details"><div className="grid gap-4 sm:grid-cols-2"><DisplayField label="Full name" value={lead.name} /><DisplayField label="Company name" value={lead.company} /><DisplayField label="Mobile number" value={lead.mobile} /><DisplayField label="Email address" value={lead.email} /><DisplayField label="GSTIN" value={lead.gstin} /><DisplayField label="City" value={lead.city} /><DisplayField label="State" value={lead.state} /><DisplayField label="Address" value={lead.address} wide /></div></FormSection>
          <FormSection title="Enquiry details"><div className="grid gap-4 sm:grid-cols-2"><DisplayField label="Product interested" value={lead.product} /><DisplayField label="Purpose" value={lead.purpose} /><DisplayField label="Source page" value={lead.page} wide /></div></FormSection>
          <FormSection title="Follow-up details"><div className="grid gap-4 sm:grid-cols-2"><FormSelect label="Lead status" value={form.status} onChange={(value) => setForm({ ...form, status: value as Status })}>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</FormSelect><FormInput label="Next follow-up date" type="date" value={form.followup_date} onChange={(value) => setForm({ ...form, followup_date: value })} /><FormTextarea label="Follow-up remark" value={form.followup_note} onChange={(value) => setForm({ ...form, followup_note: value })} /><FormTextarea label="Internal notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} /></div></FormSection>
          <FormSection title="Purchase / conversion"><div className="grid gap-4 sm:grid-cols-2"><FormInput label="Purchased product" value={form.purchase_product} onChange={(value) => setForm({ ...form, purchase_product: value })} /><FormInput label="Amount (₹)" type="number" value={form.purchase_amount} onChange={(value) => setForm({ ...form, purchase_amount: value })} /><FormInput label="Invoice number" value={form.invoice_no} onChange={(value) => setForm({ ...form, invoice_no: value })} />{lead.converted_at ? <div className="rounded-md border border-success/30 bg-success-soft px-4 py-3"><p className="text-xs font-semibold uppercase text-success">Converted on</p><p className="mt-1 text-sm text-success">{new Date(lead.converted_at).toLocaleString("en-IN")}</p></div> : null}</div></FormSection>
          <div className="sticky bottom-0 -mx-5 mt-6 flex flex-wrap gap-2 border-t border-border bg-background px-5 py-4 sm:-mx-7 sm:px-7"><Button onClick={() => submit(false)} disabled={saving}>{saving ? "Saving…" : "Save details"}</Button>{lead.status !== "converted" ? <Button className="bg-success text-success-foreground hover:bg-success/90" onClick={() => submit(true)} disabled={saving}><CheckCircle2 />Save & convert</Button> : null}<Button variant="outline" onClick={onClose}>Cancel</Button></div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) { return <section className="mb-5 overflow-hidden rounded-md border border-border bg-card"><div className="border-b border-border bg-form-section px-5 py-3"><h3 className="text-sm font-semibold text-foreground">{title}</h3></div><div className="p-5">{children}</div></section>; }
function DisplayField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) { return <div className={wide ? "sm:col-span-2" : ""}><p className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</p><div className="min-h-10 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground break-words">{value || "—"}</div></div>; }
function FormInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="text-sm"><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span><input type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" /></label>; }
function FormSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) { return <label className="text-sm"><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">{children}</select></label>; }
function FormTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm"><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span><textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" /></label>; }
function LoadingState() { return <div className="grid min-h-[50vh] place-items-center"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" /><p className="mt-3 text-sm text-muted-foreground">Loading CRM…</p></div></div>; }
function ErrorState() { return <div className="rounded-md border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Could not load CRM data. Please sign in again or check your access.</div>; }

function barWidth(value: number, max: number) {
  if (value <= 0) return "w-0";
  const ratio = value / max;
  if (ratio <= 0.125) return "w-1/12";
  if (ratio <= 0.25) return "w-1/4";
  if (ratio <= 0.5) return "w-1/2";
  if (ratio <= 0.75) return "w-3/4";
  return "w-full";
}