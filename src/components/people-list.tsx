"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnDanger, btnSecondary } from "./modal";
import { SelectWithCreate } from "./select-with-create";

type PersonRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  org_id: number | null;
  org_name: string | null;
  org_type: string | null;
  notes: string | null;
};

type OrgOption = { id: number; name: string };

const emptyForm = { name: "", email: "", phone: "", role: "", org_id: "", notes: "" };

export function PeopleList() {
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PersonRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<PersonRow | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/people").then((r) => r.json()),
      fetch("/api/organisations").then((r) => r.json()),
    ]).then(([p, o]) => { setPeople(p); setOrgs(o); setLoading(false); });
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
      org_id: person.org_id ? String(person.org_id) : "",
      notes: person.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const payload = {
      ...form,
      org_id: form.org_id ? parseInt(form.org_id) : null,
    };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/people/${editing.id}` : "/api/people";
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
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Organisation</th>
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
                  <td className="px-5 py-3 text-zinc-400">
                    {person.org_name ? (
                      <span>
                        {person.org_name}
                        <span className="text-zinc-600 ml-1.5 text-xs">({person.org_type})</span>
                      </span>
                    ) : "\u2014"}
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{person.role ?? "\u2014"}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{person.email ?? "\u2014"}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{person.phone ?? "\u2014"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(person)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700/60 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(person)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-600/10 hover:bg-rose-600/20 rounded border border-rose-600/20 transition-colors"
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
        <FormField label="Organisation">
          <SelectWithCreate
            value={form.org_id}
            onChange={(v) => setForm((f) => ({ ...f, org_id: v }))}
            options={orgs}
            entityName="Organisation"
            apiEndpoint="/api/organisations"
            quickFields={[
              { key: "name", label: "Name", placeholder: "e.g. Alertacall, Appello" },
              { key: "type", label: "Type", type: "select", options: [
                { value: "alertacall", label: "Alertacall" },
                { value: "arc", label: "ARC" },
                { value: "client", label: "Client" },
                { value: "other", label: "Other" },
              ]},
            ]}
            onCreated={() => fetch("/api/organisations").then((r) => r.json()).then(setOrgs)}
          />
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
