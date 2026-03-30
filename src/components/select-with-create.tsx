"use client";

import { useState } from "react";
import { Modal, inputClass, btnPrimary, btnSecondary } from "./modal";
import { selectClass } from "./modal";

type Option = { id: number; name: string };

type QuickField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select";
  options?: { value: string; label: string }[];
};

export function SelectWithCreate({
  value,
  onChange,
  options,
  placeholder,
  entityName,
  apiEndpoint,
  quickFields,
  extraPayload,
  onCreated,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  entityName: string;
  apiEndpoint: string;
  quickFields?: QuickField[];
  extraPayload?: Record<string, unknown>;
  onCreated?: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fields: QuickField[] = quickFields ?? [
    { key: "name", label: "Name", placeholder: `New ${entityName} name...` },
  ];

  function openCreate() {
    const empty: Record<string, string> = {};
    for (const f of fields) empty[f.key] = "";
    setForm(empty);
    setCreating(true);
  }

  async function handleCreate() {
    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...extraPayload, ...form }),
    });
    const created = await res.json();
    setCreating(false);
    onChange(String(created.id));
    onCreated?.();
  }

  return (
    <>
      <div className="flex gap-2">
        <select
          className={selectClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder ?? `Select ${entityName}...`}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={openCreate}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 rounded-lg border border-zinc-700/60 transition-colors text-lg font-bold"
          title={`New ${entityName}`}
        >
          +
        </button>
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={`New ${entityName}`}
      >
        {fields.map((field) => (
          <label key={field.key} className="block mb-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 block">
              {field.label}
            </span>
            {field.type === "select" && field.options ? (
              <select
                className={selectClass}
                value={form[field.key] ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [field.key]: e.target.value }))
                }
              >
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={inputClass}
                value={form[field.key] ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder ?? ""}
                autoFocus={field.key === fields[0].key}
              />
            )}
          </label>
        ))}
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setCreating(false)} className={btnSecondary}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className={btnPrimary}
            disabled={!form[fields[0].key]}
          >
            Create
          </button>
        </div>
      </Modal>
    </>
  );
}
