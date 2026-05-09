import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { reservations, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { AddReservationForm } from "./add-form";
import { ReservationList } from "./reservation-list";

export default async function ReservationsPage() {
  const user = await currentUser();
  if (!user) return null;
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id), with: { tenant: true } });
  if (!dbUser) return null;
  const items = await db.select().from(reservations)
    .where(eq(reservations.tenantId, dbUser.tenantId))
    .orderBy(desc(reservations.datetime));

  return (
    <div>
      <Topbar title="Reservations" restaurantName={dbUser.tenant.name} />
      <div className="p-6 space-y-6">
        <AddReservationForm />
        <ReservationList items={items} />
      </div>
    </div>
  );
}
