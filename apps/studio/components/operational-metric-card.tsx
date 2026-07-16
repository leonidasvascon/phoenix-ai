export function OperationalMetricCard({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <article className="operational-metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
