import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { menuItems, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { AddMenuItemForm } from "./add-form";
import { MenuGrid } from "./menu-grid";

export default async function MenuPage() {
  const user = await currentUser();
  if (!user) return null;
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id), with: { tenant: true } });
  if (!dbUser) return null;
  const items = await db.select().from(menuItems).where(eq(menuItems.tenantId, dbUser.tenantId)).orderBy(menuItems.category, menuItems.name);

  return (
    <div>
      <Topbar title="Menu" restaurantName={dbUser.tenant.name} />
      <div className="p-6 space-y-6">
        <AddMenuItemForm />
        <MenuGrid items={items} />
      </div>
    </div>
  );
}
