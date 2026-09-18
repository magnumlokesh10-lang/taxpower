import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/crm/login")({
  head: () => ({
    meta: [
      { title: "Internal Login" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Internal access only." },
      { property: "og:title", content: "TaxPower CRM — Internal Login" },
      { property: "og:description", content: "Protected login for the TaxPower CRM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CrmLogin,
});

function CrmLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/crm", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError("Invalid email or password.");
      return;
    }
    navigate({ to: "/crm", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-foreground">Internal Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Authorised staff only.</p>

        <label className="mt-5 block text-sm font-medium text-foreground" htmlFor="crm-email">
          Email
        </label>
        <input
          id="crm-email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />

        <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="crm-password">
          Password
        </label>
        <input
          id="crm-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
