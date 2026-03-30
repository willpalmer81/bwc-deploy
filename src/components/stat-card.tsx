export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/60 transition-colors group">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className="text-3xl font-display font-bold text-zinc-100 tracking-tight">
        {value}
      </p>
      {sub && (
        <p className="text-sm text-zinc-500 mt-1">{sub}</p>
      )}
    </div>
  );
}
