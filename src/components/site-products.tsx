"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, FormField, inputClass, btnPrimary, btnDanger, btnSecondary } from "./modal";
import { SelectWithCreate } from "./select-with-create";

type PropertyValue = {
  property_id: number;
  name: string;
  label: string;
  unit: string | null;
  value: string;
};

type SiteProductRow = {
  id: number;
  site_id: number;
  product_id: number;
  product_name: string;
  product_type: string | null;
  notes: string | null;
  values: PropertyValue[];
};

type ProductProperty = {
  id: number;
  product_id: number;
  name: string;
  label: string;
  unit: string | null;
  sort_order: number;
};

type ProductRaw = {
  id: number;
  model_name: string;
  properties: ProductProperty[];
};
type ProductOption = { id: number; name: string };

export function SiteProducts({ siteId }: { siteId: number }) {
  const [items, setItems] = useState<SiteProductRow[]>([]);
  const [products, setProducts] = useState<ProductRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SiteProductRow | null>(null);
  const [formProductId, setFormProductId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formValues, setFormValues] = useState<Record<number, string>>({});
  const [deleting, setDeleting] = useState<SiteProductRow | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/site-products?site_id=${siteId}`).then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([sp, p]) => { setItems(sp); setProducts(p); setLoading(false); });
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  const selectedProduct = products.find((p) => p.id === parseInt(formProductId));
  const productOptions: ProductOption[] = products.map((p) => ({ id: p.id, name: p.model_name }));

  function openAdd() {
    setEditing(null);
    setFormProductId("");
    setFormNotes("");
    setFormValues({});
    setModalOpen(true);
  }

  function openEdit(item: SiteProductRow) {
    setEditing(item);
    setFormProductId(String(item.product_id));
    setFormNotes(item.notes ?? "");
    const vals: Record<number, string> = {};
    for (const v of item.values) {
      vals[v.property_id] = v.value;
    }
    setFormValues(vals);
    setModalOpen(true);
  }

  function handleProductChange(productId: string) {
    setFormProductId(productId);
    // Reset values when product changes (properties are different)
    if (!editing) setFormValues({});
  }

  async function handleSave() {
    const product = products.find((p) => p.id === parseInt(formProductId));
    const values = (product?.properties ?? []).map((prop) => ({
      property_id: prop.id,
      value: formValues[prop.id] ?? "0",
    }));

    const payload = {
      site_id: siteId,
      product_id: parseInt(formProductId),
      values,
      notes: formNotes,
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

  if (loading) {
    return <div className="text-xs text-zinc-500 py-2">Loading products...</div>;
  }

  // Summary line: aggregate all values across all items
  const totalsByLabel: Record<string, number> = {};
  for (const item of items) {
    for (const v of item.values) {
      const num = parseInt(v.value) || 0;
      if (num > 0) {
        totalsByLabel[v.label] = (totalsByLabel[v.label] ?? 0) + num;
      }
    }
  }
  const summaryParts = Object.entries(totalsByLabel).map(([label, total]) => `${total} ${label}`);

  return (
    <>
      <div className="mt-4 border-t border-zinc-800/60 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Products
            {summaryParts.length > 0 && (
              <span className="text-zinc-600 ml-2 normal-case">
                ({summaryParts.join(" \u00b7 ")})
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
                  {item.values.length > 0 && (
                    <span className="text-xs text-zinc-500 ml-3 font-mono">
                      {item.values
                        .filter((v) => parseInt(v.value) > 0)
                        .map((v) => `${v.value} ${v.label}`)
                        .join(" \u00b7 ")}
                    </span>
                  )}
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
            value={formProductId}
            onChange={handleProductChange}
            options={productOptions}
            entityName="Product"
            apiEndpoint="/api/products"
            quickFields={[
              { key: "model_name", label: "Model Name", placeholder: "e.g. Anya Cariss Unit" },
            ]}
            onCreated={() => fetch("/api/products").then((r) => r.json()).then(setProducts)}
          />
        </FormField>

        {selectedProduct && selectedProduct.properties.length > 0 && (
          <div className={`grid gap-3 ${selectedProduct.properties.length <= 3 ? `grid-cols-${selectedProduct.properties.length}` : "grid-cols-3"}`}>
            {selectedProduct.properties.map((prop) => (
              <FormField key={prop.id} label={`${prop.label}${prop.unit ? ` (${prop.unit})` : ""}`}>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={formValues[prop.id] ?? "0"}
                  onChange={(e) => setFormValues((v) => ({ ...v, [prop.id]: e.target.value }))}
                />
              </FormField>
            ))}
          </div>
        )}

        {selectedProduct && selectedProduct.properties.length === 0 && (
          <p className="text-xs text-zinc-500 mb-4">
            This product has no properties defined. Edit the product to add quantity fields.
          </p>
        )}

        <FormField label="Notes">
          <textarea
            className={inputClass}
            rows={2}
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Optional..."
          />
        </FormField>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary} disabled={!formProductId}>
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
