"use client";

import { useRef } from "react";
import { addMenuItem } from "./actions";

export function AddMenuItemForm() {
  const ref = useRef<HTMLFormElement>(null);
  async function handleSubmit(formData: FormData) {
    await addMenuItem(formData);
    ref.current?.reset();
  }
  return (
    <form ref={ref} action={handleSubmit} className="bg-white border rounded-lg p-4 space-y-3">
      <h2 className="font-semibold text-slate-800">Add Menu Item</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <input name="name" required placeholder="Item name" className="border rounded-md px-3 py-2 text-sm col-span-2 md:col-span-1" />
        <input name="category" required placeholder="Category" className="border rounded-md px-3 py-2 text-sm" />
        <input name="price" type="number" step="0.01" required placeholder="Price" className="border rounded-md px-3 py-2 text-sm" />
        <input name="description" placeholder="Description (optional)" className="border rounded-md px-3 py-2 text-sm col-span-2 md:col-span-1" />
      </div>
      <button type="submit" className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">
        Add Item
      </button>
    </form>
  );
}
