"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, FormField, inputClass, btnPrimary, btnDanger, btnSecondary } from "./modal";
import { SelectWithCreate } from "./select-with-create";

type SiteProductRow = {
  id: number;
  site_id: number;
  product_id: number;
  product_name: string;
  product_category: string | null;
  residential_qty: number;
  communal_qty: number;
  external_qty: number;
  notes: string | null;
};

type ProductOption = { id: number; name: string };

const emptyForm = {
  product_id: "",
  residential_qty: "0",
  communal_qty: "0",
  external_qty: "0",
  notes: "",
};

export function SiteProducts({ siteId }: { siteId: number }) {
  const [items, setItems] = useState<SiteProductRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SiteProductRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<SiteProductRow | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/site-products?site_id=${siteId}`).then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([sp, p]) => { setItems(sp); setProducts(p); setLoading(false); });
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item: SiteProductRow) {
    setEditing(item);
    setForm({
      product_id: String(item.product_id),
      residential_qty: String(item.residential_qty),
      communal_qty: String(item.communal_qty),
      external_qty: String(item.external_qty),
      notes: item.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const payload = {
      site_id: siteId,
      product_id: parseInt(form.product_id),
      residential_qty: parseInt(form.residential_qty) || 0,
      communal_qty: parseInt(form.communal_qty) || 0,
      external_qty: parseInt(form.external_qty) || 0,
      notes: form.notes,
    };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/site-products/${editing.id}` : "/api/site-products";
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
    await fetch(`/api/site-products/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  if (loading) {
    return <div className="text-xs text-zinc-500 py-2">Loading products...</div>;
  }

  const totalRes = items.reduce((s, i) => s + i.residential_qty, 0);
  const totalCom = items.reduce((s, i) => s + i.communal_qty, 0);
  const totalExt = items.reduce((s, i) => s + i.external_qty, 0);

  return (
    <>
      <div className="mt-4 border-t border-zinc-800/60 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Products
            {items.length > 0 && (
              <span className="text-zinc-600 ml-2 normal-case">
                ({totalRes}R {totalCom}C {totalExt}E = {totalRes + totalCom + totalExt} total)
              </span>
            )}
          </p>
          <button
            onClick={openAdd}
            className="px-2.5 py-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-600/10 hover:bg-emerald-600/20 rounded border border-emerald-600/20 transition-colors"
          >
            + Add
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-zinc-600">No products assigned</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-zinc-800/30 rounded-lg px-3 py-2 group"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-zinc-200">{item.product_name}</span>
                  <span className="text-xs text-zinc-500 ml-3 font-mono">
                    {item.residential_qty}R &middot; {item.communal_qty}C &middot; {item.external_qty}E
                  </span>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(item)}
                    className="px-1.5 py-0.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(item)}
                    className="px-1.5 py-0.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Product Assignment" : "Add Product"}>
        <FormField label="Product">
          <SelectWithCreate
            value={form.product_id}
            onChange={(v) => setForm((f) => ({ ...f, product_id: v }))}
            options={products}
            entityName="Product"
            apiEndpoint="/api/products"
            quickFields={[
              { key: "name", label: "Name", placeholder: "e.g. Anya Cariss Unit" },
              { key: "description", label: "Description", placeholder: "e.g. Dispersed alarm unit" },
            ]}
            onCreated={() => fetch("/api/products").then((r) => r.json()).then(setProducts)}
          />
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Residential">
            <input className={inputClass} type="number" min="0" value={form.residential_qty} onChange={set("residential_qty")} />
          </FormField>
          <FormField label="Communal">
            <input className={inputClass} type="number" min="0" value={form.communal_qty} onChange={set("communal_qty")} />
          </FormField>
          <FormField label="External">
            <input className={inputClass} type="number" min="0" value={form.external_qty} onChange={set("external_qty")} />
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional..." />
        </FormField>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary} disabled={!form.product_id}>
            {editing ? "Save" : "Add Product"}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Remove Product">
        <p className="text-sm text-zinc-400 mb-6">
          Remove <strong className="text-zinc-200">{deleting?.product_name}</strong> from this site?
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleting(null)} className={btnSecondary}>Cancel</button>
          <button onClick={handleDelete} className={btnDanger}>Remove</button>
        </div>
      </Modal>
    </>
  );
}
