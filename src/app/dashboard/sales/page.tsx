import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { expenses, reservations, users } from "@/lib/db/schema";
import { eq, gte, and, sql } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { TrendingUp, CalendarCheck, Receipt, AlertCircle } from "lucide-react";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export default async function SalesPage() {
  const user = await currentUser();
  if (!user) return null;
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id), with: { tenant: true } });
  if (!dbUser) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  const [allExpenses, allReservations] = await Promise.all([
    db.select().from(expenses).where(eq(expenses.tenantId, dbUser.tenantId)),
    db.select().from(reservations).where(eq(reservations.tenantId, dbUser.tenantId)),
  ]);

  const todayExpenses = allExpenses.filter(e => new Date(e.date) >= todayStart);
  const weekExpenses = allExpenses.filter(e => new Date(e.date) >= weekStart);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.total), 0);
  const weekTotal = weekExpenses.reduce((sum, e) => sum + parseFloat(e.total), 0);

  const todayRes = allReservations.filter(r => new Date(r.datetime) >= todayStart);
  const todaySeated = todayRes.filter(r => r.status === "seated").length;
  const todayNoShow = todayRes.filter(r => r.status === "no_show").length;
  const fillRate = todayRes.length > 0 ? Math.round((todaySeated / todayRes.length) * 100) : null;

  const weekRes = allReservations.filter(r => new Date(r.datetime) >= weekStart);
  const totalThisWeek = weekRes.length;

  const stats = [
    {
      label: "Expenses Today",
      value: `$${todayTotal.toFixed(2)}`,
      sub: `${todayExpenses.length} receipt${todayExpenses.length !== 1 ? "s" : ""}`,
      icon: Receipt,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Expenses This Week",
      value: `$${weekTotal.toFixed(2)}`,
      sub: `${weekExpenses.length} receipt${weekExpenses.length !== 1 ? "s" : ""}`,
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Reservations Today",
      value: String(todayRes.length),
      sub: `${todaySeated} seated · ${todayNoShow} no-show`,
      icon: CalendarCheck,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Fill Rate Today",
      value: fillRate !== null ? `${fillRate}%` : "N/A",
      sub: fillRate !== null ? "of reservations seated" : "No reservations today",
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  const vendorTotals = allExpenses.reduce<Record<string, number>>((acc, e) => {
    const vendor = e.vendor ?? "Unknown";
    acc[vendor] = (acc[vendor] ?? 0) + parseFloat(e.total);
    return acc;
  }, {});
  const topVendors = Object.entries(vendorTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div>
      <Topbar title="Sales & Overview" restaurantName={dbUser.tenant.name} />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white border rounded-lg p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon size={16} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {topVendors.length > 0 && (
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold text-slate-800 mb-4">Top Suppliers by Spend</h2>
            <div className="space-y-3">
              {topVendors.map(([vendor, total]) => {
                const grandTotal = Object.values(vendorTotals).reduce((a, b) => a + b, 0);
                const pct = Math.round((total / grandTotal) * 100);
                return (
                  <div key={vendor}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{vendor}</span>
                      <span className="text-slate-500">${total.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className="h-1.5 bg-slate-800 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allExpenses.length === 0 && (
          <p className="text-sm text-slate-400">No expense data yet. Scan receipts to populate this dashboard.</p>
        )}
      </div>
    </div>
  );
}
