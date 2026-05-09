import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { invites, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) return null;
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
    with: { tenant: true },
  });
  if (!dbUser) return null;

  const [staff, pendingInvites] = await Promise.all([
    db.select().from(users).where(eq(users.tenantId, dbUser.tenantId)),
    db.select().from(invites).where(eq(invites.tenantId, dbUser.tenantId))
      .then(rows => rows.filter(r => !r.usedAt)),
  ]);

  return (
    <div>
      <Topbar title="Settings" restaurantName={dbUser.tenant.name} />
      <div className="p-6 max-w-xl space-y-8">
        <SettingsForm
          currentName={dbUser.tenant.name}
          staff={staff}
          pendingInvites={pendingInvites}
          isOwner={dbUser.role === "owner"}
        />
      </div>
    </div>
  );
}
