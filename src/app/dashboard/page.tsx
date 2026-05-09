import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, users, inventoryItems, reservations } from "@/lib/db/schema";
import { eq, lte, sql } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import Link from "next/link";
import { AlertTriangle, CalendarDays, ShoppingCart } from "lucide-react";

async function getOrCreateTenant(clerkId: string, name: string) {
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    with: { tenant: true },
  });
  if (existing) return existing.tenant;
  const [tenant] = await db.insert(tenants).values({ name, ownerId: clerkId }).returning();
  await db.insert(users).values({ tenantId: tenant.id, clerkId, role: "owner" });
  return tenant;
}

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.emailAddresses[0]?.emailAddress;
  const tenant = await getOrCreateTenant(user.id, name);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [lowStock, todayReservations] = await Promise.all([
    db.select().from(inventoryItems).where(
      eq(inventoryItems.tenantId, tenant.id)
    ).then(items => items.filter(i => parseFloat(i.currentStock) <= parseFloat(i.minThreshold))),
    db.select().from(reservations).where(eq(reservations.tenantId, tenant.id))
      .then(res => res.filter(r => {
        const d = new Date(r.datetime);
        return d >= todayStart && d <= todayEnd && r.status === "confirmed";
      })),
  ]);

  return (
    <div>
      <Topbar title="Overview" restaurantName={tenant.name} />
      <div className="p-6 space-y-4">
        <p className="text-slate-600">Welcome back, {user.firstName ?? "there"} 👋</p>

        {lowStock.length > 0 && (
          <Link href="/dashboard/inventory/shopping-list">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors cursor-pointer">
              <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} low on stock
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  {lowStock.slice(0, 3).map(i => i.name).join(", ")}
                  {lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ""} — tap to view shopping list
                </p>
              </div>
            </div>
          </Link>
        )}

        {todayReservations.length > 0 && (
          <Link href="/dashboard/reservations">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer">
              <CalendarDays size={18} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  {todayReservations.length} reservation{todayReservations.length !== 1 ? "s" : ""} today
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {todayReservations.slice(0, 2).map(r => `${r.guestName} (${new Date(r.datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`).join(" · ")}
                  {todayReservations.length > 2 ? ` +${todayReservations.length - 2} more` : ""}
                </p>
              </div>
            </div>
          </Link>
        )}

        {lowStock.length === 0 && todayReservations.length === 0 && (
          <p className="text-sm text-slate-400">All clear — no alerts today.</p>
        )}
      </div>
    </div>
  );
}
