import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { inventoryItems, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { AddInventoryForm } from "./add-form";
import { InventoryTable } from "./inventory-table";

export default async function InventoryPage() {
  const user = await currentUser();
  if (!user) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
    with: { tenant: true },
  });
  if (!dbUser) return null;

  const items = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.tenantId, dbUser.tenantId))
    .orderBy(inventoryItems.name);

  return (
    <div>
      <Topbar title="Inventory" restaurantName={dbUser.tenant.name} />
      <div className="p-6 space-y-6">
        <AddInventoryForm />
        <InventoryTable items={items} />
      </div>
    </div>
  );
}
