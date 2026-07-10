export function PublicationStatus({ status }: Readonly<{ status: string }>) {
  return (
    <span className="publication-status" data-status={status}>
      {status}
    </span>
  );
}
