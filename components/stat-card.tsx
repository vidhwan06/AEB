export function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="panel rounded-2xl p-5">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-[11px] text-zinc-500">{note}</div>
    </div>
  );
}