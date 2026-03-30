"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, FormField, inputClass, btnPrimary, btnDanger, btnSecondary } from "./modal";

type PersonRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
};

const emptyForm = { name: "", email: "", phone: "", role: "", notes: "" };

export function PeopleList() {
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PersonRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<PersonRow | null>(null);

  const load = useCallback(() => {
    fetch("/api/people")
      .then((r) => r.json())
      .then((data) => { setPeople(data); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(person: PersonRow) {
    setEditing(person);
    setForm({
      name: person.name,
      email: person.email ?? "",
      phone: person.phone ?? "",
      role: person.role ?? "",
      notes: person.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/people/${editing.id}` : "/api/people";
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
    await fetch(`/api/people/${deleting.id}`, { method: "DELETE" });
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
        <p className="text-sm text-zinc-500">{people.length} people</p>
        <button onClick={openCreate} className={btnPrimary}>+ Add Person</button>
      </div>

      {people.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-12 text-center">
          <p className="text-zinc-500 mb-4">No people yet</p>
          <button onClick={openCreate} className={btnPrimary}>Add your first person</button>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {people.map((person) => (
                <tr key={person.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-5 py-3 font-medium text-zinc-200">{person.name}</td>
                  <td className="px-5 py-3 text-zinc-400">{person.role ?? "\u2014"}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{person.email ?? "\u2014"}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{person.phone ?? "\u2014"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(person)}
                        className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700/60 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(person)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Person" : "New Person"}>
        <FormField label="Name">
          <input className={inputClass} value={form.name} onChange={set("name")} placeholder="e.g. Kerry Surman" />
        </FormField>
        <FormField label="Role / Title">
          <input className={inputClass} value={form.role} onChange={set("role")} placeholder="e.g. Project Manager" />
        </FormField>
        <FormField label="Email">
          <input className={inputClass} type="email" value={form.email} onChange={set("email")} placeholder="Optional" />
        </FormField>
        <FormField label="Phone">
          <input className={inputClass} value={form.phone} onChange={set("phone")} placeholder="Optional" />
        </FormField>
        <FormField label="Notes">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional..." />
        </FormField>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary} disabled={!form.name}>
            {editing ? "Save Changes" : "Create Person"}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Person">
        <p className="text-sm text-zinc-400 mb-2">
          Are you sure you want to delete <strong className="text-zinc-200">{deleting?.name}</strong>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">Clients and cohorts referencing this person will be unlinked.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleting(null)} className={btnSecondary}>Cancel</button>
          <button onClick={handleDelete} className={btnDanger}>Delete</button>
        </div>
      </Modal>
    </>
  );
}
