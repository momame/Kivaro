"use client";

import { updateReservationStatus, deleteReservation } from "./actions";
import { Trash2 } from "lucide-react";

type Reservation = {
  id: string; guestName: string; phone: string | null;
  partySize: number; datetime: Date; status: string;
  notes: string | null; noShowScore: string | null;
};

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  seated: "bg-green-100 text-green-700",
  no_show: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export function ReservationList({ items }: { items: Reservation[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-400">No reservations yet.</p>;

  return (
    <div className="bg-white border rounded-lg divide-y">
      {items.map((r) => (
        <div key={r.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-slate-800">{r.guestName}</p>
              {r.noShowScore !== null && (
                <span className="text-xs text-slate-400">
                  No-show risk: {(parseFloat(r.noShowScore) * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(r.datetime).toLocaleString()} · {r.partySize} guests
              {r.phone && ` · ${r.phone}`}
            </p>
            {r.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{r.notes}</p>}
          </div>
          <div className="flex items-center gap-2">
            <select
              defaultValue={r.status}
              onChange={(e) => updateReservationStatus(r.id, e.target.value as "confirmed" | "seated" | "no_show" | "cancelled")}
              className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[r.status]}`}
            >
              <option value="confirmed">Confirmed</option>
              <option value="seated">Seated</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={() => deleteReservation(r.id)} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
