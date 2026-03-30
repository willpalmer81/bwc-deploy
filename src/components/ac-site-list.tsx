"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Modal, FormField, inputClass, btnPrimary, btnDanger, btnSecondary } from "./modal";

type AcSiteRow = {
  id: number;
  name: string;
  address: string | null;
  postcode: string | null;
  notes: string | null;
};

const emptyForm = { name: "", address: "", postcode: "", notes: "" };

export function AcSiteList() {
  const [sites, setSites] = useState<AcSiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AcSiteRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<AcSiteRow | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function copyAddress(site: AcSiteRow) {
    const parts = [site.name, site.address, site.postcode].filter(Boolean);
    navigator.clipboard.writeText(parts.join("\n"));
    setCopiedId(site.id);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedId(null), 1500);
  }

  const load = useCallback(() => {
    fetch("/api/ac-sites")
      .then((r) => r.json())
      .then((data) => { setSites(data); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(site: AcSiteRow) {
    setEditing(site);
    setForm({
      name: site.name,
      address: site.address ?? "",
      postcode: site.postcode ?? "",
      notes: site.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/ac-sites/${editing.id}` : "/api/ac-sites";
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
    await fetch(`/api/ac-sites/${deleting.id}`, { method: "DELETE" });
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
        <p className="text-sm text-zinc-500">{sites.length} sites</p>
        <button onClick={openCreate} className={btnPrimary}>+ Add Site</button>
      </div>

      {sites.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-12 text-center">
          <p className="text-zinc-500 mb-4">No Alertacall sites yet</p>
          <button onClick={openCreate} className={btnPrimary}>Add your first site</button>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Address</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Postcode</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Notes</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-5 py-3 font-medium text-zinc-200">{site.name}</td>
                  <td className="px-5 py-3 text-zinc-400">{site.address ?? "\u2014"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-400">{site.postcode ?? "\u2014"}</td>
                  <td className="px-5 py-3 text-zinc-500 text-xs">{site.notes ?? "\u2014"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyAddress(site)}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          copiedId === site.id
                            ? "text-emerald-400 bg-emerald-600/10 border-emerald-600/20"
                            : "text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border-zinc-700/60"
                        }`}
                      >
                        {copiedId === site.id ? "Copied" : "Addr"}
                      </button>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Alertacall Site" : "New Alertacall Site"}>
        <FormField label="Name">
          <input className={inputClass} value={form.name} onChange={set("name")} placeholder="e.g. Warehouse, Head Office" />
        </FormField>
        <FormField label="Address">
          <input className={inputClass} value={form.address} onChange={set("address")} placeholder="Full address" />
        </FormField>
        <FormField label="Postcode">
          <input className={inputClass} value={form.postcode} onChange={set("postcode")} placeholder="e.g. B1 1AA" />
        </FormField>
        <FormField label="Notes">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional..." />
        </FormField>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary} disabled={!form.name}>
            {editing ? "Save Changes" : "Create Site"}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Alertacall Site">
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
