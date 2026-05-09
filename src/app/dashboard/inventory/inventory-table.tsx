"use client";

import { useState } from "react";
import { updateStock, deleteInventoryItem } from "./actions";
import { AlertTriangle, Trash2 } from "lucide-react";

type Item = {
  id: string;
  name: string;
  unit: string;
  currentStock: string;
  minThreshold: string;
};

export function InventoryTable({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No items yet. Add one above.</p>;
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Item</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Unit</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Stock</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Min</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <InventoryRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryRow({ item }: { item: Item }) {
  const [stock, setStock] = useState(item.currentStock);
  const [editing, setEditing] = useState(false);
  const isLow = parseFloat(stock) <= parseFloat(item.minThreshold);

  async function handleUpdate() {
    await updateStock(item.id, stock);
    setEditing(false);
  }

  return (
    <tr className={isLow ? "bg-red-50" : ""}>
      <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
        {isLow && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
        {item.name}
      </td>
      <td className="px-4 py-3 text-slate-500">{item.unit}</td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="border rounded px-2 py-1 w-24 text-sm"
              autoFocus
            />
            <button onClick={handleUpdate} className="text-xs text-green-600 font-medium">Save</button>
            <button onClick={() => { setStock(item.currentStock); setEditing(false); }} className="text-xs text-slate-400">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="hover:underline text-slate-700">
            {stock}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-slate-500">{item.minThreshold}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => deleteInventoryItem(item.id)}
          className="text-slate-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
