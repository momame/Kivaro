import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { customers, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";

export default async function CustomersPage() {
  const user = await currentUser();
  if (!user) return null;
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id), with: { tenant: true } });
  if (!dbUser) return null;
  const items = await db.select().from(customers)
    .where(eq(customers.tenantId, dbUser.tenantId))
    .orderBy(desc(customers.visitCount));

  return (
    <div>
      <Topbar title="Customers" restaurantName={dbUser.tenant.name} />
      <div className="p-6">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">Customers appear here after reservations are booked.</p>
        ) : (
          <div className="bg-white border rounded-lg divide-y">
            {items.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.phone ?? "No phone"} · {c.visitCount} visit{c.visitCount !== 1 ? "s" : ""}
                    {c.lastVisit && ` · Last: ${new Date(c.lastVisit).toLocaleDateString()}`}
                  </p>
                  {c.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{c.notes}</p>}
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                  {c.visitCount} visits
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
