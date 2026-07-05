export function MetricCard({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
