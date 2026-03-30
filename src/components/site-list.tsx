"use client";

import { useEffect, useState, useCallback } from "react";
import { StatusBadge } from "./status-badge";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnDanger, btnSecondary } from "./modal";

type SiteRow = {
  id: number;
  client_id: number;
  cohort_id: number | null;
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
  dmp_group_uuid: string | null;
  notes: string | null;
  effective_arc: string;
  effective_routing_mode: string;
  effective_contact: string;
};

type ClientOption = { id: number; name: string };
type CohortOption = { id: number; name: string; client_id: number };

const emptySite = {
  client_id: "",
  cohort_id: "",
  name: "",
  building_name: "",
  address: "",
  postcode: "",
  residential_units: "",
  communal_units: "",
  dmp_group_name: "",
  dmp_group_uuid: "",
  status: "planning",
  notes: "",
};

export function SiteList() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ client_id: "", status: "", search: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SiteRow | null>(null);
  const [form, setForm] = useState(emptySite);
  const [deleting, setDeleting] = useState<SiteRow | null>(null);

  const fetchSites = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.client_id) params.set("client_id", filters.client_id);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    fetch(`/api/sites?${params}`)
      .then((r) => r.json())
      .then((data) => { setSites(data); setLoading(false); });
  }, [filters]);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/cohorts").then((r) => r.json()),
    ]).then(([c, co]) => { setClients(c); setCohorts(co); });
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchSites, 300);
    return () => clearTimeout(timer);
  }, [fetchSites]);

  function openCreate() {
    setEditing(null);
    setForm(emptySite);
    setModalOpen(true);
  }

  function openEdit(site: SiteRow) {
    setEditing(site);
    setForm({
      client_id: String(site.client_id),
      cohort_id: site.cohort_id ? String(site.cohort_id) : "",
      name: site.name,
      building_name: site.building_name ?? "",
      address: site.address ?? "",
      postcode: site.postcode ?? "",
      residential_units: site.residential_units != null ? String(site.residential_units) : "",
      communal_units: site.communal_units != null ? String(site.communal_units) : "",
      dmp_group_name: site.dmp_group_name ?? "",
      dmp_group_uuid: site.dmp_group_uuid ?? "",
      status: site.status,
      notes: site.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const payload = {
      ...form,
      client_id: parseInt(form.client_id),
      cohort_id: form.cohort_id ? parseInt(form.cohort_id) : null,
      residential_units: form.residential_units ? parseInt(form.residential_units) : null,
      communal_units: form.communal_units ? parseInt(form.communal_units) : null,
    };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/sites/${editing.id}` : "/api/sites";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setModalOpen(false);
    fetchSites();
  }

  async function handleDelete() {
    if (!deleting) return;
    await fetch(`/api/sites/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    fetchSites();
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const filteredCohorts = form.client_id
    ? cohorts.filter((c) => c.client_id === parseInt(form.client_id))
    : cohorts;

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search sites..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className={`${inputClass} w-64`}
          />
          <select
            value={filters.client_id}
            onChange={(e) => setFilters((f) => ({ ...f, client_id: e.target.value }))}
            className={selectClass}
          >
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="live">Live</option>
            <option value="in_progress">In Progress</option>
            <option value="planning">Planning</option>
          </select>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          + Add Site
        </button>
      </div>

      <p className="text-xs text-zinc-500 mb-3">
        {loading ? "Loading..." : `${sites.length} sites`}
      </p>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Site</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Cohort</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Postcode</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Units</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">DMP Group</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">ARC / Routing</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : sites.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-zinc-500">
                    No sites found
                  </td>
                </tr>
              ) : (
                sites.map((site) => (
                  <tr key={site.id} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-5 py-3">
                      <p className="font-medium text-zinc-200">{site.name}</p>
                      {site.building_name && <p className="text-xs text-zinc-500">{site.building_name}</p>}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{site.client_name}</td>
                    <td className="px-5 py-3 text-zinc-500">{site.cohort_name ?? "\u2014"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-400">{site.postcode ?? "\u2014"}</td>
                    <td className="px-5 py-3 text-center font-mono text-xs text-zinc-400">
                      {site.residential_units ?? "\u2014"}
                      {site.communal_units ? ` + ${site.communal_units}c` : ""}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-400">{site.dmp_group_name ?? "\u2014"}</td>
                    <td className="px-5 py-3 text-xs">
                      <p className="text-zinc-400">{site.effective_arc}</p>
                      <p className="text-zinc-600">{site.effective_routing_mode?.replace(/_/g, " ")}</p>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={site.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(site)}
                          className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700/60 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(site)}
                          className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-600/10 hover:bg-rose-600/20 rounded border border-rose-600/20 transition-colors"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Site" : "New Site"}>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Site Name">
            <input className={inputClass} value={form.name} onChange={set("name")} placeholder="e.g. Settle" />
          </FormField>
          <FormField label="Building Name">
            <input className={inputClass} value={form.building_name} onChange={set("building_name")} placeholder="Optional" />
          </FormField>
          <FormField label="Client">
            <select className={selectClass} value={form.client_id} onChange={set("client_id")}>
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Cohort">
            <select className={selectClass} value={form.cohort_id} onChange={set("cohort_id")}>
              <option value="">None</option>
              {filteredCohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Address">
            <input className={inputClass} value={form.address} onChange={set("address")} placeholder="Optional" />
          </FormField>
          <FormField label="Postcode">
            <input className={inputClass} value={form.postcode} onChange={set("postcode")} placeholder="e.g. BD24 9RB" />
          </FormField>
          <FormField label="Residential Units">
            <input className={inputClass} type="number" value={form.residential_units} onChange={set("residential_units")} />
          </FormField>
          <FormField label="Communal Units">
            <input className={inputClass} type="number" value={form.communal_units} onChange={set("communal_units")} />
          </FormField>
          <FormField label="DMP Group Name">
            <input className={inputClass} value={form.dmp_group_name} onChange={set("dmp_group_name")} />
          </FormField>
          <FormField label="DMP Group UUID">
            <input className={inputClass} value={form.dmp_group_uuid} onChange={set("dmp_group_uuid")} />
          </FormField>
          <FormField label="Status">
            <select className={selectClass} value={form.status} onChange={set("status")}>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="live">Live</option>
            </select>
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional notes..." />
        </FormField>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary} disabled={!form.name || !form.client_id}>
            {editing ? "Save Changes" : "Create Site"}
          </button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Site">
        <p className="text-sm text-zinc-400 mb-6">
          Are you sure you want to delete <strong className="text-zinc-200">{deleting?.name}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleting(null)} className={btnSecondary}>Cancel</button>
          <button onClick={handleDelete} className={btnDanger}>Delete</button>
        </div>
      </Modal>
    </>
  );
}
