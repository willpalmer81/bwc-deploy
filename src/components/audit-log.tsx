"use client";

import { useEffect, useState } from "react";

type AuditEntry = {
  id: number;
  user_email: string;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_name: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
};

const actionStyles: Record<string, string> = {
  create: "text-emerald-400",
  update: "text-amber-400",
  delete: "text-rose-400",
};

export function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((data) => { setLogs(data); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-12 text-center">
        <p className="text-zinc-500">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800/80">
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">When</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Who</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Entity</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors">
              <td className="px-5 py-3 text-xs text-zinc-500 font-mono whitespace-nowrap">
                {new Date(log.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-5 py-3 text-zinc-400">
                {log.user_name ?? log.user_email}
              </td>
              <td className="px-5 py-3">
                <span className={`font-medium ${actionStyles[log.action] ?? "text-zinc-400"}`}>
                  {log.action}
                </span>
              </td>
              <td className="px-5 py-3 text-zinc-500">
                {log.entity_type.replace(/_/g, " ")}
              </td>
              <td className="px-5 py-3 text-zinc-300">
                {log.entity_name ?? "\u2014"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
