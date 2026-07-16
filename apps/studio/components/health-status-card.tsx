export function HealthStatusCard({ label, message, status }: Readonly<{ label: string; message: string; status: string }>) {
  return (
    <article className="health-status-card" data-status={status}>
      <p>{label}</p>
      <strong>{status}</strong>
      <span>{message}</span>
    </article>
  );
}
