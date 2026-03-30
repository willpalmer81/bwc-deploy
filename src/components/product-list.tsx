"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnDanger, btnSecondary } from "./modal";
import { SelectWithCreate } from "./select-with-create";

type ProductProperty = {
  id: number;
  product_id: number;
  name: string;
  label: string;
  unit: string | null;
  sort_order: number;
};

type ProductRow = {
  id: number;
  model_name: string;
  type: string | null;
  manufacturer_org_id: number | null;
  manufacturer_name: string | null;
  notes: string | null;
  properties: ProductProperty[];
};

type OrgOption = { id: number; name: string; type: string };

type PropertyForm = { name: string; label: string; unit: string };

const PRODUCT_TYPES = [
  "Dispersed alarm",
  "Pendant",
  "Hub",
  "Sensor",
  "Door entry",
  "Touchscreen",
  "WiFi",
  "Pull cord",
  "Warden call",
  "Other",
];

const emptyForm = { model_name: "", type: "", manufacturer_org_id: "", notes: "" };
const emptyProp: PropertyForm = { name: "", label: "", unit: "" };

export function ProductList() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [props, setProps] = useState<PropertyForm[]>([]);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/organisations").then((r) => r.json()),
    ]).then(([p, o]) => { setProducts(p); setOrgs(o); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const manufacturerOrgs = orgs.filter((o) => o.type === "manufacturer");

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setProps([{ name: "quantity", label: "Quantity", unit: "units" }]);
    setModalOpen(true);
  }

  function openEdit(product: ProductRow) {
    setEditing(product);
    setForm({
      model_name: product.model_name,
      type: product.type ?? "",
      manufacturer_org_id: product.manufacturer_org_id ? String(product.manufacturer_org_id) : "",
      notes: product.notes ?? "",
    });
    setProps(
      product.properties.map((p) => ({
        name: p.name,
        label: p.label,
        unit: p.unit ?? "",
      }))
    );
    setModalOpen(true);
  }

  function addProperty() {
    setProps((p) => [...p, { ...emptyProp }]);
  }

  function removeProperty(index: number) {
    setProps((p) => p.filter((_, i) => i !== index));
  }

  function updateProperty(index: number, field: keyof PropertyForm, value: string) {
    setProps((p) => p.map((prop, i) => {
      if (i !== index) return prop;
      const updated = { ...prop, [field]: value };
      // Auto-generate name from label
      if (field === "label") {
        updated.name = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
      }
      return updated;
    }));
  }

  async function handleSave() {
    const payload = {
      ...form,
      manufacturer_org_id: form.manufacturer_org_id ? parseInt(form.manufacturer_org_id) : null,
      properties: props.filter((p) => p.label.trim()),
    };

    if (editing) {
      // Update product
      await fetch(`/api/products/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      // Create product with properties
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleting) return;
    await fetch(`/api/products/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
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
        <p className="text-sm text-zinc-500">{products.length} products</p>
        <button onClick={openCreate} className={btnPrimary}>+ Add Product</button>
      </div>

      {products.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-16 text-center">
          <p className="text-zinc-500 mb-1">No products yet</p>
          <p className="text-xs text-zinc-600 mb-4">Add products and define what quantities to track for each.</p>
          <button onClick={openCreate} className={btnPrimary}>Add your first product</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/60 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-lg font-semibold text-zinc-100">{product.model_name}</h2>
                    {product.type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-800 text-zinc-400 border-zinc-700">
                        {product.type}
                      </span>
                    )}
                  </div>
                  {product.manufacturer_name && (
                    <p className="text-sm text-zinc-500 mt-1">
                      by <span className="text-zinc-400">{product.manufacturer_name}</span>
                    </p>
                  )}
                  {product.properties.length > 0 && (
                    <p className="text-xs text-zinc-600 mt-1">
                      Tracks: {product.properties.map((p) => p.label).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(product)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700/60 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(product)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-600/10 hover:bg-rose-600/20 rounded-md border border-rose-600/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {product.notes && (
                <p className="mt-2 text-sm text-zinc-500 border-t border-zinc-800/60 pt-2">{product.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Product" : "New Product"}>
        <FormField label="Model Name">
          <input className={inputClass} value={form.model_name} onChange={set("model_name")} placeholder="e.g. Anya Cariss Unit" />
        </FormField>
        <FormField label="Type">
          <select className={selectClass} value={form.type} onChange={set("type")}>
            <option value="">Select type...</option>
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Manufacturer">
          <SelectWithCreate
            value={form.manufacturer_org_id}
            onChange={(v) => setForm((f) => ({ ...f, manufacturer_org_id: v }))}
            options={manufacturerOrgs}
            entityName="Organisation"
            apiEndpoint="/api/organisations"
            quickFields={[
              { key: "name", label: "Name", placeholder: "e.g. Anya" },
            ]}
            extraPayload={{ type: "manufacturer" }}
            onCreated={load}
          />
        </FormField>

        {/* Quantity fields this product tracks */}
        <div className="mt-2 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Quantity fields
            </span>
            <button
              type="button"
              onClick={addProperty}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              + Add field
            </button>
          </div>
          <p className="text-xs text-zinc-600 mb-3">
            Define what quantities to track when this product is assigned to a site.
          </p>
          {props.length === 0 && (
            <p className="text-xs text-zinc-500 italic">No fields. Click &quot;+ Add field&quot; above.</p>
          )}
          <div className="space-y-2">
            {props.map((prop, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  className={`${inputClass} flex-1`}
                  value={prop.label}
                  onChange={(e) => updateProperty(i, "label", e.target.value)}
                  placeholder="Label, e.g. Residential"
                />
                <input
                  className={`${inputClass} w-28`}
                  value={prop.unit}
                  onChange={(e) => updateProperty(i, "unit", e.target.value)}
                  placeholder="Unit"
                />
                <button
                  type="button"
                  onClick={() => removeProperty(i)}
                  className="text-rose-400 hover:text-rose-300 text-xs px-2 py-2 transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <FormField label="Notes">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional..." />
        </FormField>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary} disabled={!form.model_name}>
            {editing ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Product">
        <p className="text-sm text-zinc-400 mb-2">
          Are you sure you want to delete <strong className="text-zinc-200">{deleting?.model_name}</strong>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">This will remove it from all site product assignments.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleting(null)} className={btnSecondary}>Cancel</button>
          <button onClick={handleDelete} className={btnDanger}>Delete</button>
        </div>
      </Modal>
    </>
  );
}
