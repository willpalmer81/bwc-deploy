"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnDanger, btnSecondary } from "./modal";
import { SelectWithCreate } from "./select-with-create";

type OrgRow = {
  id: number;
  name: string;
  type: string;
  notes: string | null;
  // Client-specific (from org_client_details join)
  arc_org_id: number | null;
  arc_name: string | null;
  routing_mode: string | null;
  contact_id: number | null;
  contact_name: string | null;
  site_count: number;
  live_count: number;
};

type PersonOption = { id: number; name: string };

const ORG_TYPES = [
  { value: "alertacall", label: "Alertacall" },
  { value: "arc", label: "ARC" },
  { value: "client", label: "Client" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  name: "",
  type: "other",
  notes: "",
  arc_org_id: "",
  routing_mode: "TBC",
  contact_id: "",
};

const typeBadgeStyles: Record<string, string> = {
  alertacall: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  arc: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  client: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  manufacturer: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  other: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

export function OrgList() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OrgRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<OrgRow | null>(null);

  const arcOrgs = orgs.filter((o) => o.type === "arc");

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/organisations").then((r) => r.json()),
      fetch("/api/people").then((r) => r.json()),
    ]).then(([o, p]) => { setOrgs(o); setPeople(p); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(org: OrgRow) {
    setEditing(org);
    setForm({
      name: org.name,
      type: org.type,
      notes: org.notes ?? "",
      arc_org_id: org.arc_org_id ? String(org.arc_org_id) : "",
      routing_mode: org.routing_mode ?? "TBC",
      contact_id: org.contact_id ? String(org.contact_id) : "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const payload = {
      ...form,
      arc_org_id: form.arc_org_id ? parseInt(form.arc_org_id) : null,
      contact_id: form.contact_id ? parseInt(form.contact_id) : null,
    };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/organisations/${editing.id}` : "/api/organisations";
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
    await fetch(`/api/organisations/${deleting.id}`, { method: "DELETE" });
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
        <p className="text-sm text-zinc-500">{orgs.length} organisations</p>
        <button onClick={openCreate} className={btnPrimary}>+ Add Organisation</button>
      </div>

      {orgs.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-12 text-center">
          <p className="text-zinc-500 mb-4">No organisations yet</p>
          <button onClick={openCreate} className={btnPrimary}>Add your first organisation</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {orgs.map((org) => (
            <div
              key={org.id}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/60 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-lg font-semibold text-zinc-100">{org.name}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeBadgeStyles[org.type] ?? typeBadgeStyles.other}`}>
                      {org.type}
                    </span>
                  </div>
                  {org.type === "client" && (
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-zinc-500">
                      <span>ARC: <span className="text-zinc-300">{org.arc_name ?? "Not set"}</span></span>
                      <span>Routing: <span className="text-zinc-300">{(org.routing_mode ?? "TBC").replace(/_/g, " ")}</span></span>
                      <span>Contact: <span className="text-zinc-300">{org.contact_name ?? "Not set"}</span></span>
                      <span>Sites: <span className="text-zinc-300">{org.site_count} ({org.live_count} live)</span></span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                  <button
                    onClick={() => openEdit(org)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700/60 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(org)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-600/10 hover:bg-rose-600/20 rounded-md border border-rose-600/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {org.notes && (
                <p className="mt-2 text-sm text-zinc-500 border-t border-zinc-800/60 pt-2">{org.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Organisation" : "New Organisation"}>
        <FormField label="Name">
          <input className={inputClass} value={form.name} onChange={set("name")} placeholder="e.g. Abbeyfield, Appello" />
        </FormField>
        <FormField label="Type">
          <select className={selectClass} value={form.type} onChange={set("type")}>
            {ORG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </FormField>

        {form.type === "client" && (
          <>
            <div className="mt-4 mb-3 border-t border-zinc-800/60 pt-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Client Config</p>
            </div>
            <FormField label="ARC Provider">
              <SelectWithCreate
                value={form.arc_org_id}
                onChange={(v) => setForm((f) => ({ ...f, arc_org_id: v }))}
                options={arcOrgs}
                placeholder="Select ARC..."
                entityName="Organisation"
                apiEndpoint="/api/organisations"
                quickFields={[
                  { key: "name", label: "Name", placeholder: "e.g. Appello" },
                ]}
                extraPayload={{ type: "arc" }}
                onCreated={load}
              />
            </FormField>
            <FormField label="Routing Mode">
              <select className={selectClass} value={form.routing_mode} onChange={set("routing_mode")}>
                <option value="direct_to_arc">Direct to ARC</option>
                <option value="via_skyresponse">Via Skyresponse</option>
                <option value="TBC">TBC</option>
              </select>
            </FormField>
            <FormField label="Primary Contact">
              <SelectWithCreate
                value={form.contact_id}
                onChange={(v) => setForm((f) => ({ ...f, contact_id: v }))}
                options={people}
                entityName="Person"
                apiEndpoint="/api/people"
                quickFields={[
                  { key: "name", label: "Name", placeholder: "e.g. Kerry Surman" },
                  { key: "role", label: "Role", placeholder: "e.g. Project Manager" },
                ]}
                onCreated={() => fetch("/api/people").then((r) => r.json()).then(setPeople)}
              />
            </FormField>
          </>
        )}

        <FormField label="Notes">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional..." />
        </FormField>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary} disabled={!form.name}>
            {editing ? "Save Changes" : "Create Organisation"}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Organisation">
        <p className="text-sm text-zinc-400 mb-2">
          Are you sure you want to delete <strong className="text-zinc-200">{deleting?.name}</strong>?
        </p>
        {deleting?.type === "client" && (
          <p className="text-xs text-rose-400 mb-2">This will also delete all cohorts and sites for this client.</p>
        )}
        <p className="text-xs text-zinc-500 mb-6">People linked to this organisation will be unlinked.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleting(null)} className={btnSecondary}>Cancel</button>
          <button onClick={handleDelete} className={btnDanger}>Delete</button>
        </div>
      </Modal>
    </>
  );
}
