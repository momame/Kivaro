"use client";

import { useRef } from "react";
import { updateRestaurantName, inviteStaff } from "./actions";
import { Mail, User } from "lucide-react";

type Staff = { id: string; clerkId: string; role: string; createdAt: Date };
type Invite = { id: string; email: string; token: string; createdAt: Date };

interface Props {
  currentName: string;
  staff: Staff[];
  pendingInvites: Invite[];
  isOwner: boolean;
}

export function SettingsForm({ currentName, staff, pendingInvites, isOwner }: Props) {
  const nameRef = useRef<HTMLFormElement>(null);
  const inviteRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-8">
      <section className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">Restaurant Name</h2>
        <form ref={nameRef} action={updateRestaurantName} className="flex gap-2">
          <input
            name="name"
            defaultValue={currentName}
            required
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">
            Save
          </button>
        </form>
      </section>

      {isOwner && (
        <section className="bg-white border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Invite Staff</h2>
          <form ref={inviteRef} action={async (fd) => { await inviteStaff(fd); inviteRef.current?.reset(); }} className="flex gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="staff@email.com"
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
            <button type="submit" className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">
              Send Invite
            </button>
          </form>

          {staff.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Team</p>
              <div className="space-y-2">
                {staff.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-slate-400" />
                    <span className="text-slate-700">{s.clerkId}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${s.role === "owner" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-600"}`}>
                      {s.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingInvites.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Pending Invites</p>
              <div className="space-y-2">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-slate-700">{inv.email}</span>
                    <span className="ml-auto text-xs text-slate-400">pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
