"use client";

import { useRef } from "react";
import { addInventoryItem } from "./actions";

export function AddInventoryForm() {
  const ref = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    await addInventoryItem(formData);
    ref.current?.reset();
  }

  return (
    <form ref={ref} action={handleSubmit} className="bg-white border rounded-lg p-4 space-y-3">
      <h2 className="font-semibold text-slate-800">Add Item</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <input
          name="name"
          required
          placeholder="Item name"
          className="border rounded-md px-3 py-2 text-sm col-span-2 md:col-span-1"
        />
        <input
          name="unit"
          required
          placeholder="Unit (kg, L, pcs…)"
          className="border rounded-md px-3 py-2 text-sm"
        />
        <input
          name="currentStock"
          type="number"
          step="0.01"
          required
          placeholder="Current stock"
          className="border rounded-md px-3 py-2 text-sm"
        />
        <input
          name="minThreshold"
          type="number"
          step="0.01"
          required
          placeholder="Min threshold"
          className="border rounded-md px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-700 transition-colors"
      >
        Add Item
      </button>
    </form>
  );
}
