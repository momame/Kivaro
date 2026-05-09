import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";

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

  return (
    <div>
      <Topbar title="Overview" restaurantName={tenant.name} />
      <div className="p-6">
        <p className="text-slate-600">Welcome back, {user.firstName ?? "there"} 👋</p>
        <p className="mt-4 text-sm text-slate-400">Features coming soon — use the menu to navigate.</p>
      </div>
    </div>
  );
}
