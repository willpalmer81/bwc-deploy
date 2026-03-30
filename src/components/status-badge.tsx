const statusStyles: Record<string, string> = {
  live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  complete: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  planning: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700";
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === "live" || status === "complete"
            ? "bg-emerald-400"
            : status === "in_progress"
            ? "bg-amber-400"
            : "bg-sky-400"
        }`}
      />
      {label}
    </span>
  );
}
