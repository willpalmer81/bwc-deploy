"use client";

import { useEffect, useState } from "react";
import { StatCard } from "./stat-card";
import { StatusBadge } from "./status-badge";
import Link from "next/link";

type Stats = {
  totalClients: number;
  totalSites: number;
  byStatus: { status: string; count: number }[];
};

type OrgRow = {
  id: number;
  name: string;
  type: string;
  arc_name: string | null;
  routing_mode: string | null;
  contact_name: string | null;
  site_count: number;
  live_count: number;
};

type SiteRow = {
  id: number;
  name: string;
  building_name: string | null;
  postcode: string | null;
  status: string;
  client_name: string;
  cohort_name: string | null;
  residential_units: number | null;
  communal_units: number | null;
};

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [clients, setClients] = useState<OrgRow[]>([]);
  const [recentSites, setRecentSites] = useState<SiteRow[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/organisations").then((r) => r.json()).then((orgs: OrgRow[]) => orgs.filter((o) => o.type === "client")),
      fetch("/api/sites?status=in_progress").then((r) => r.json()),
    ]).then(([s, c, sites]) => {
      setStats(s);
      setClients(c);
      setRecentSites(sites);
    });
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  const liveCount =
    stats.byStatus.find((s) => s.status === "live")?.count ?? 0;
  const inProgressCount =
    stats.byStatus.find((s) => s.status === "in_progress")?.count ?? 0;
  const planningCount =
    stats.byStatus.find((s) => s.status === "planning")?.count ?? 0;

  return (
    <div className="space-y-10">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Clients" value={stats.totalClients} />
        <StatCard
          label="Total Sites"
          value={stats.totalSites}
          sub={`${liveCount} live`}
        />
        <StatCard label="In Progress" value={inProgressCount} />
        <StatCard label="Planning" value={planningCount} />
      </div>

      {/* Status bar */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Rollout Progress
        </p>
        <div className="flex rounded-full h-3 overflow-hidden bg-zinc-800">
          {liveCount > 0 && (
            <div
              className="bg-emerald-500 transition-all duration-700"
              style={{
                width: `${(liveCount / stats.totalSites) * 100}%`,
              }}
            />
          )}
          {inProgressCount > 0 && (
            <div
              className="bg-amber-500 transition-all duration-700"
              style={{
                width: `${(inProgressCount / stats.totalSites) * 100}%`,
              }}
            />
          )}
          {planningCount > 0 && (
            <div
              className="bg-sky-500 transition-all duration-700"
              style={{
                width: `${(planningCount / stats.totalSites) * 100}%`,
              }}
            />
          )}
        </div>
        <div className="flex gap-6 mt-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Live ({liveCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            In Progress ({inProgressCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Planning ({planningCount})
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Clients */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
            <h2 className="font-display font-semibold text-zinc-100">
              Clients
            </h2>
            <Link
              href="/organisations"
              className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {clients.map((client) => (
              <div
                key={client.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-zinc-800/20 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {client.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    ARC: {client.arc_name ?? "—"} &middot; {(client.routing_mode ?? "TBC").replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-zinc-300">
                    {client.site_count}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {client.live_count} live
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In-progress sites */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
            <h2 className="font-display font-semibold text-zinc-100">
              In Progress
            </h2>
            <Link
              href="/sites"
              className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              All sites
            </Link>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {recentSites.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-500 text-center">
                No sites currently in progress
              </p>
            ) : (
              recentSites.map((site) => (
                <div
                  key={site.id}
                  className="px-5 py-3 hover:bg-zinc-800/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-200">
                      {site.name}
                    </p>
                    <StatusBadge status={site.status} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {site.client_name}
                    {site.cohort_name && ` \u00b7 ${site.cohort_name}`}
                    {site.postcode && ` \u00b7 ${site.postcode}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
