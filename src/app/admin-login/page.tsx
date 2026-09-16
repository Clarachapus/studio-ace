"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/** Password page of the online editor. */
export default function AdminLoginPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "wrong" | "error">("idle");
  const router = useRouter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setStatus(res.status === 401 ? "wrong" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="theme-light-scope flex min-h-screen items-center justify-center bg-cream px-5 text-ink">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <p className="font-display text-2xl">studio a.c.e · éditeur</p>
        <label htmlFor="password" className="mt-10 block text-[0.7rem] uppercase tracking-[0.28em] text-fg-soft">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg outline-none focus:border-terracotta"
        />
        {status === "wrong" && <p className="mt-3 text-sm text-menu" role="alert">Mot de passe incorrect.</p>}
        {status === "error" && <p className="mt-3 text-sm text-menu" role="alert">Connexion impossible pour le moment, réessayez.</p>}
        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-8 w-full rounded-full bg-terracotta px-8 py-4 text-sm uppercase tracking-[0.22em] text-cream disabled:opacity-60"
        >
          {status === "sending" ? "Connexion…" : "Entrer"}
        </button>
      </form>
    </main>
  );
}
