export function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label: Record<string, string> = {
    active: "Ativa",
    canceled: "Cancelada",
    cancelled: "Cancelada",
    pending: "Pendente",
    expired: "Expirada",
    failed: "Falhou",
    inactive: "Inativa",
  };
  return <span className={`status-pill status-${normalized}`}>{label[normalized] || status}</span>;
}
