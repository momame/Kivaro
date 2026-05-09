"use client";

import { toggleMenuItem, deleteMenuItem } from "./actions";
import { Trash2 } from "lucide-react";

type Item = { id: string; name: string; description: string | null; price: string; category: string; active: boolean };

export function MenuGrid({ items }: { items: Item[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-400">No items yet.</p>;

  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{category}</h3>
          <div className="bg-white border rounded-lg divide-y">
            {catItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1">
                  <p className={`font-medium text-sm ${!item.active ? "line-through text-slate-400" : "text-slate-800"}`}>{item.name}</p>
                  {item.description && <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>}
                </div>
                <span className="text-sm font-medium text-slate-700 mx-4">${item.price}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMenuItem(item.id, !item.active)}
                    className={`text-xs font-medium px-2 py-1 rounded-full ${item.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {item.active ? "Active" : "Off"}
                  </button>
                  <button onClick={() => deleteMenuItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
