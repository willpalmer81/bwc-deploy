"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnDanger, btnSecondary } from "./modal";
import { SelectWithCreate } from "./select-with-create";

type ClientRow = {
  id: number;
  name: string;
  arc_id: number | null;
  arc_name: string | null;
  routing_mode: string;
  alertacall_contact: string;
  notes: string | null;
  site_count: number;
  live_count: number;
};

type ArcOption = { id: number; name: string };

const emptyClient = {
  name: "",
  arc_id: "",
  routing_mode: "direct_to_arc",
  alertacall_contact: "",
  notes: "",
};

export function ClientList() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [arcs, setArcs] = useState<ArcOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [deleting, setDeleting] = useState<ClientRow | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/arcs").then((r) => r.json()),
    ]).then(([c, a]) => {
      setClients(c);
      setArcs(a);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyClient);
    setModalOpen(true);
  }

  function openEdit(client: ClientRow) {
    setEditing(client);
    setForm({
      name: client.name,
      arc_id: client.arc_id ? String(client.arc_id) : "",
      routing_mode: client.routing_mode,
      alertacall_contact: client.alertacall_contact,
      notes: client.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const payload = {
      ...form,
      arc_id: form.arc_id ? parseInt(form.arc_id) : null,
    };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/clients/${editing.id}` : "/api/clients";
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
    await fetch(`/api/clients/${deleting.id}`, { method: "DELETE" });
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
        <p className="text-sm text-zinc-500">{clients.length} clients</p>
        <button onClick={openCreate} className={btnPrimary}>
          + Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-12 text-center">
          <p className="text-zinc-500 mb-4">No clients yet</p>
          <button onClick={openCreate} className={btnPrimary}>
            Add your first client
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 hover:border-zinc-700/60 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl font-semibold text-zinc-100">
                    {client.name}
                  </h2>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-zinc-500">
                    <span>
                      ARC: <span className="text-zinc-300">{client.arc_name ?? "Not set"}</span>
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
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right mr-2">
                    <p className="text-2xl font-display font-bold text-zinc-100">
                      {client.site_count}
                    </p>
                    <p className="text-xs text-zinc-500">{client.live_count} live</p>
                  </div>
                  <button
                    onClick={() => openEdit(client)}
                    className="opacity-0 group-hover:opacity-100 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700/60 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(client)}
                    className="opacity-0 group-hover:opacity-100 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-600/10 hover:bg-rose-600/20 rounded-md border border-rose-600/20 transition-all"
                  >
                    Delete
                  </button>
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
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Client" : "New Client"}
      >
        <FormField label="Name">
          <input className={inputClass} value={form.name} onChange={set("name")} placeholder="e.g. Abbeyfield" />
        </FormField>
        <FormField label="ARC Provider">
          <SelectWithCreate
            value={form.arc_id}
            onChange={(v) => setForm((f) => ({ ...f, arc_id: v }))}
            options={arcs}
            entityName="ARC"
            apiEndpoint="/api/arcs"
            onCreated={() => fetch("/api/arcs").then((r) => r.json()).then(setArcs)}
          />
        </FormField>
        <FormField label="Routing Mode">
          <select className={selectClass} value={form.routing_mode} onChange={set("routing_mode")}>
            <option value="direct_to_arc">Direct to ARC</option>
            <option value="via_skyresponse">Via Skyresponse</option>
            <option value="TBC">TBC</option>
          </select>
        </FormField>
        <FormField label="Alertacall Contact">
          <input className={inputClass} value={form.alertacall_contact} onChange={set("alertacall_contact")} placeholder="e.g. Kerry Surman" />
        </FormField>
        <FormField label="Notes">
          <textarea className={inputClass} rows={3} value={form.notes} onChange={set("notes")} placeholder="Optional notes..." />
        </FormField>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>
            Cancel
          </button>
          <button onClick={handleSave} className={btnPrimary} disabled={!form.name}>
            {editing ? "Save Changes" : "Create Client"}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Client"
      >
        <p className="text-sm text-zinc-400 mb-2">
          Are you sure you want to delete <strong className="text-zinc-200">{deleting?.name}</strong>?
        </p>
        <p className="text-xs text-rose-400 mb-6">
          This will also delete all cohorts and sites associated with this client.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleting(null)} className={btnSecondary}>
            Cancel
          </button>
          <button onClick={handleDelete} className={btnDanger}>
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}
