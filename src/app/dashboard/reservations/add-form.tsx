"use client";

import { useRef } from "react";
import { addReservation } from "./actions";

export function AddReservationForm() {
  const ref = useRef<HTMLFormElement>(null);
  async function handleSubmit(formData: FormData) {
    await addReservation(formData);
    ref.current?.reset();
  }
  return (
    <form ref={ref} action={handleSubmit} className="bg-white border rounded-lg p-4 space-y-3">
      <h2 className="font-semibold text-slate-800">New Reservation</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <input name="guestName" required placeholder="Guest name" className="border rounded-md px-3 py-2 text-sm" />
        <input name="phone" placeholder="Phone" className="border rounded-md px-3 py-2 text-sm" />
        <input name="partySize" type="number" min="1" required placeholder="Party size" className="border rounded-md px-3 py-2 text-sm" />
        <input name="datetime" type="datetime-local" required className="border rounded-md px-3 py-2 text-sm col-span-2 md:col-span-1" />
        <input name="notes" placeholder="Notes (optional)" className="border rounded-md px-3 py-2 text-sm col-span-2" />
      </div>
      <button type="submit" className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">
        Book
      </button>
    </form>
  );
}
