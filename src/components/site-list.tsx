"use client";

import { useEffect, useState, useCallback } from "react";
import { StatusBadge } from "./status-badge";

type SiteRow = {
  id: number;
  name: string;
  building_name: string | null;
  address: string | null;
  postcode: string | null;
  status: string;
  client_name: string;
  cohort_name: string | null;
  residential_units: number | null;
  communal_units: number | null;
  dmp_group_name: string | null;
};

type ClientOption = {
  id: number;
  name: string;
};

export function SiteList() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    client_id: "",
    status: "",
    search: "",
  });

  const fetchSites = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.client_id) params.set("client_id", filters.client_id);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);

    fetch(`/api/sites?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSites(data);
        setLoading(false);
      });
  }, [filters]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchSites, 300);
    return () => clearTimeout(timer);
  }, [fetchSites]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search sites..."
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-4 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 w-64 transition-colors"
        />
        <select
          value={filters.client_id}
          onChange={(e) =>
            setFilters((f) => ({ ...f, client_id: e.target.value }))
          }
          className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/40 transition-colors"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/40 transition-colors"
        >
          <option value="">All statuses</option>
          <option value="live">Live</option>
          <option value="in_progress">In Progress</option>
          <option value="planning">Planning</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-zinc-500">
        {loading ? "Loading..." : `${sites.length} sites`}
      </p>

      {/* Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Cohort
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Postcode
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Units
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  DMP Group
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : sites.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-zinc-500"
                  >
                    No sites found
                  </td>
                </tr>
              ) : (
                sites.map((site) => (
                  <tr
                    key={site.id}
                    className="hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-zinc-200">{site.name}</p>
                      {site.building_name && (
                        <p className="text-xs text-zinc-500">
                          {site.building_name}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {site.client_name}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {site.cohort_name ?? "\u2014"}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                      {site.postcode ?? "\u2014"}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-xs text-zinc-400">
                      {site.residential_units ?? "\u2014"}
                      {site.communal_units
                        ? ` + ${site.communal_units}c`
                        : ""}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                      {site.dmp_group_name ?? "\u2014"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={site.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
