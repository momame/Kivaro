import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { inventoryItems, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { ShoppingCart } from "lucide-react";

export default async function ShoppingListPage() {
  const user = await currentUser();
  if (!user) return null;
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id), with: { tenant: true } });
  if (!dbUser) return null;

  const items = await db.select().from(inventoryItems)
    .where(eq(inventoryItems.tenantId, dbUser.tenantId))
    .then(all => all.filter(i => parseFloat(i.currentStock) <= parseFloat(i.minThreshold)));

  return (
    <div>
      <Topbar title="Shopping List" restaurantName={dbUser.tenant.name} />
      <div className="p-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ShoppingCart size={32} className="mb-3" />
            <p className="text-sm">Nothing to restock — all items are above threshold.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg divide-y">
            {items.map((item) => {
              const needed = (parseFloat(item.minThreshold) - parseFloat(item.currentStock)).toFixed(2);
              return (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Current: {item.currentStock} {item.unit} · Min: {item.minThreshold} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">+{needed}</p>
                    <p className="text-xs text-slate-400">{item.unit} needed</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
