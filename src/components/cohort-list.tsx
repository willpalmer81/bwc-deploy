"use client";

import { useEffect, useState, useCallback } from "react";
import { StatusBadge } from "./status-badge";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnDanger, btnSecondary } from "./modal";

type CohortRow = {
  id: number;
  client_id: number;
  name: string;
  status: string;
  notes: string | null;
  client_name: string;
  site_count: number;
};

type ClientOption = { id: number; name: string };

const emptyCohort = { client_id: "", name: "", status: "planning", notes: "" };

export function CohortList() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CohortRow | null>(null);
  const [form, setForm] = useState(emptyCohort);
  const [deleting, setDeleting] = useState<CohortRow | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/cohorts").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]).then(([co, cl]) => {
      setCohorts(co);
      setClients(cl);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyCohort);
    setModalOpen(true);
  }

  function openEdit(cohort: CohortRow) {
    setEditing(cohort);
    setForm({
      client_id: String(cohort.client_id),
      name: cohort.name,
      status: cohort.status,
      notes: cohort.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const payload = { ...form, client_id: parseInt(form.client_id) };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/cohorts/${editing.id}` : "/api/cohorts";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleting) return;
    await fetch(`/api/cohorts/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-zinc-500">{cohorts.length} cohorts</p>
        <button onClick={openCreate} className={btnPrimary}>+ Add Cohort</button>
      </div>

      {cohorts.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-12 text-center">
          <p className="text-zinc-500 mb-4">No cohorts yet</p>
          <button onClick={openCreate} className={btnPrimary}>Add your first cohort</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {cohorts.map((cohort) => (
            <div
              key={cohort.id}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/60 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-lg font-semibold text-zinc-100">{cohort.name}</h2>
                    <StatusBadge status={cohort.status} />
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    {cohort.client_name} &middot; {cohort.site_count} sites
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(cohort)}
                    className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700/60 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(cohort)}
                    className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-600/10 hover:bg-rose-600/20 rounded-md border border-rose-600/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {cohort.notes && (
                <p className="mt-2 text-sm text-zinc-500 border-t border-zinc-800/60 pt-2">{cohort.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Cohort" : "New Cohort"}>
        <FormField label="Client">
          <select className={selectClass} value={form.client_id} onChange={set("client_id")}>
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Name">
          <input className={inputClass} value={form.name} onChange={set("name")} placeholder="e.g. Cohort 1" />
        </FormField>
        <FormField label="Status">
          <select className={selectClass} value={form.status} onChange={set("status")}>
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </FormField>
        <FormField label="Notes">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional..." />
        </FormField>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary} disabled={!form.name || !form.client_id}>
            {editing ? "Save Changes" : "Create Cohort"}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Cohort">
        <p className="text-sm text-zinc-400 mb-2">
          Are you sure you want to delete <strong className="text-zinc-200">{deleting?.name}</strong>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">Sites in this cohort will be unlinked (not deleted).</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleting(null)} className={btnSecondary}>Cancel</button>
          <button onClick={handleDelete} className={btnDanger}>Delete</button>
        </div>
      </Modal>
    </>
  );
}
