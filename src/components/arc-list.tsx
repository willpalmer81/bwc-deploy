"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, FormField, inputClass, btnPrimary, btnDanger, btnSecondary } from "./modal";

type ArcRow = {
  id: number;
  name: string;
  notes: string | null;
};

const emptyForm = { name: "", notes: "" };

export function ArcList() {
  const [arcs, setArcs] = useState<ArcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ArcRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<ArcRow | null>(null);

  const load = useCallback(() => {
    fetch("/api/arcs")
      .then((r) => r.json())
      .then((data) => { setArcs(data); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(arc: ArcRow) {
    setEditing(arc);
    setForm({ name: arc.name, notes: arc.notes ?? "" });
    setModalOpen(true);
  }

  async function handleSave() {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/arcs/${editing.id}` : "/api/arcs";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleting) return;
    await fetch(`/api/arcs/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
        <p className="text-sm text-zinc-500">{arcs.length} providers</p>
        <button onClick={openCreate} className={btnPrimary}>+ Add ARC</button>
      </div>

      {arcs.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-12 text-center">
          <p className="text-zinc-500 mb-4">No ARC providers yet</p>
          <button onClick={openCreate} className={btnPrimary}>Add your first ARC</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {arcs.map((arc) => (
            <div
              key={arc.id}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/60 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-zinc-100">{arc.name}</h2>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(arc)}
                    className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700/60 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(arc)}
                    className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-600/10 hover:bg-rose-600/20 rounded-md border border-rose-600/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {arc.notes && (
                <p className="mt-2 text-sm text-zinc-500 border-t border-zinc-800/60 pt-2">{arc.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit ARC" : "New ARC"}>
        <FormField label="Name">
          <input className={inputClass} value={form.name} onChange={set("name")} placeholder="e.g. Appello, Skyresponse" />
        </FormField>
        <FormField label="Notes">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional..." />
        </FormField>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary} disabled={!form.name}>
            {editing ? "Save Changes" : "Create ARC"}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete ARC">
        <p className="text-sm text-zinc-400 mb-2">
          Are you sure you want to delete <strong className="text-zinc-200">{deleting?.name}</strong>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">Clients and cohorts using this ARC will be unlinked.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleting(null)} className={btnSecondary}>Cancel</button>
          <button onClick={handleDelete} className={btnDanger}>Delete</button>
        </div>
      </Modal>
    </>
  );
}
