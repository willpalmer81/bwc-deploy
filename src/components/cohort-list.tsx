"use client";

import { useEffect, useState, useCallback } from "react";
import { StatusBadge } from "./status-badge";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnDanger, btnSecondary } from "./modal";
import { SelectWithCreate } from "./select-with-create";

type CohortRow = {
  id: number;
  client_id: number;
  name: string;
  status: string;
  arc_id: number | null;
  arc_name: string | null;
  routing_mode: string | null;
  alertacall_contact: string | null;
  notes: string | null;
  client_name: string;
  client_arc_name: string | null;
  client_routing_mode: string;
  client_alertacall_contact: string;
  site_count: number;
};

type ClientOption = { id: number; name: string; arc_id: number | null; arc_name: string | null; routing_mode: string; alertacall_contact: string };
type ArcOption = { id: number; name: string };

const emptyCohort = {
  client_id: "",
  name: "",
  status: "planning",
  arc_id: "",
  routing_mode: "",
  alertacall_contact: "",
  notes: "",
};

export function CohortList() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [arcs, setArcs] = useState<ArcOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CohortRow | null>(null);
  const [form, setForm] = useState(emptyCohort);
  const [deleting, setDeleting] = useState<CohortRow | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/cohorts").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/arcs").then((r) => r.json()),
    ]).then(([co, cl, a]) => {
      setCohorts(co);
      setClients(cl);
      setArcs(a);
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
      arc_id: cohort.arc_id ? String(cohort.arc_id) : "",
      routing_mode: cohort.routing_mode ?? "",
      alertacall_contact: cohort.alertacall_contact ?? "",
      notes: cohort.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const payload = {
      ...form,
      client_id: parseInt(form.client_id),
      arc_id: form.arc_id ? parseInt(form.arc_id) : null,
    };
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

  const selectedClient = clients.find((c) => c.id === parseInt(form.client_id));

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
          {cohorts.map((cohort) => {
            const hasOverrides = cohort.arc_name || cohort.routing_mode || cohort.alertacall_contact;
            return (
              <div
                key={cohort.id}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/60 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="font-display text-lg font-semibold text-zinc-100">{cohort.name}</h2>
                      <StatusBadge status={cohort.status} />
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {cohort.client_name} &middot; {cohort.site_count} sites
                    </p>
                    {hasOverrides && (
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs">
                        {cohort.arc_name && (
                          <span className="text-amber-400/80">
                            ARC: {cohort.arc_name}
                            {cohort.client_arc_name && (
                              <span className="text-zinc-600 ml-1">(overrides {cohort.client_arc_name})</span>
                            )}
                          </span>
                        )}
                        {cohort.routing_mode && (
                          <span className="text-amber-400/80">
                            Routing: {cohort.routing_mode.replace(/_/g, " ")}
                            <span className="text-zinc-600 ml-1">(overrides {cohort.client_routing_mode.replace(/_/g, " ")})</span>
                          </span>
                        )}
                        {cohort.alertacall_contact && (
                          <span className="text-amber-400/80">
                            Contact: {cohort.alertacall_contact}
                            <span className="text-zinc-600 ml-1">(overrides {cohort.client_alertacall_contact})</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
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
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Cohort" : "New Cohort"}>
        <FormField label="Client">
          <SelectWithCreate
            value={form.client_id}
            onChange={(v) => setForm((f) => ({ ...f, client_id: v }))}
            options={clients}
            entityName="Client"
            apiEndpoint="/api/clients"
            quickFields={[
              { key: "name", label: "Name", placeholder: "e.g. Abbeyfield" },
              { key: "routing_mode", label: "Routing Mode", type: "select", options: [
                { value: "direct_to_arc", label: "Direct to ARC" },
                { value: "via_skyresponse", label: "Via Skyresponse" },
                { value: "TBC", label: "TBC" },
              ]},
              { key: "alertacall_contact", label: "Contact", placeholder: "e.g. Kerry Surman" },
            ]}
            onCreated={() => fetch("/api/clients").then((r) => r.json()).then(setClients)}
          />
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

        <div className="mt-6 mb-4 border-t border-zinc-800/60 pt-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
            Config Overrides
          </p>
          <p className="text-xs text-zinc-600 mb-4">
            Leave blank to inherit from client{selectedClient ? ` (${selectedClient.name})` : ""}
          </p>
        </div>

        <FormField label="ARC Provider">
          <SelectWithCreate
            value={form.arc_id}
            onChange={(v) => setForm((f) => ({ ...f, arc_id: v }))}
            options={arcs}
            placeholder={selectedClient?.arc_name ? `Inherited: ${selectedClient.arc_name}` : "Inherit from client"}
            entityName="ARC"
            apiEndpoint="/api/arcs"
            onCreated={() => fetch("/api/arcs").then((r) => r.json()).then(setArcs)}
          />
        </FormField>
        <FormField label="Routing Mode">
          <select className={selectClass} value={form.routing_mode} onChange={set("routing_mode")}>
            <option value="">
              {selectedClient ? `Inherited: ${selectedClient.routing_mode.replace(/_/g, " ")}` : "Inherit from client"}
            </option>
            <option value="direct_to_arc">Direct to ARC</option>
            <option value="via_skyresponse">Via Skyresponse</option>
            <option value="TBC">TBC</option>
          </select>
        </FormField>
        <FormField label="Alertacall Contact">
          <input
            className={inputClass}
            value={form.alertacall_contact}
            onChange={set("alertacall_contact")}
            placeholder={selectedClient ? `Inherited: ${selectedClient.alertacall_contact}` : "Select a client first"}
          />
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
