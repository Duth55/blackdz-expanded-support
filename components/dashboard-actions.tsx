"use client";

import { useState } from "react";

export function DashboardActions({ canCancel }: { canCancel: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function cancel() {
    if (!confirm("Deseja cancelar sua assinatura? O cargo de apoiador será removido.")) return;
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/subscription/cancel", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(data.error || "Não foi possível cancelar.");
    else window.location.reload();
    setLoading(false);
  }

  return (
    <div className="action-row">
      <a className="btn btn-secondary" href="/apoie">Ver planos</a>
      {canCancel && <button className="btn btn-danger" onClick={cancel} disabled={loading}>{loading ? "Cancelando..." : "Cancelar assinatura"}</button>}
      {message && <span className="inline-error">{message}</span>}
    </div>
  );
}
