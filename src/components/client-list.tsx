"use client";

import { useEffect, useState } from "react";

type ClientRow = {
  id: number;
  name: string;
  arc: string;
  routing_mode: string;
  alertacall_contact: string;
  notes: string | null;
  site_count: number;
  live_count: number;
};

export function ClientList() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {clients.map((client) => (
        <div
          key={client.id}
          className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 hover:border-zinc-700/60 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-zinc-100">
                {client.name}
              </h2>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-zinc-500">
                <span>
                  ARC:{" "}
                  <span className="text-zinc-300">{client.arc}</span>
                </span>
                <span>
                  Routing:{" "}
                  <span className="text-zinc-300">
                    {client.routing_mode.replace(/_/g, " ")}
                  </span>
                </span>
                <span>
                  Contact:{" "}
                  <span className="text-zinc-300">
                    {client.alertacall_contact}
                  </span>
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-6">
              <p className="text-2xl font-display font-bold text-zinc-100">
                {client.site_count}
              </p>
              <p className="text-xs text-zinc-500">
                {client.live_count} live
              </p>
            </div>
          </div>
          {client.notes && (
            <p className="mt-3 text-sm text-zinc-500 border-t border-zinc-800/60 pt-3">
              {client.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
