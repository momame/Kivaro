"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { reservations, customers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getTenantId() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id) });
  if (!dbUser) throw new Error("User not found");
  return dbUser.tenantId;
}

export async function addReservation(formData: FormData) {
  const tenantId = await getTenantId();
  const guestName = formData.get("guestName") as string;
  const phone = formData.get("phone") as string || null;

  let customer = await db.query.customers.findFirst({
    where: and(eq(customers.tenantId, tenantId), eq(customers.phone, phone ?? "")),
  });

  if (!customer && phone) {
    [customer] = await db.insert(customers).values({ tenantId, name: guestName, phone }).returning();
  }

  const totalReservations = await db.select().from(reservations).where(eq(reservations.tenantId, tenantId));
  const guestHistory = totalReservations.filter(r => r.customerId === customer?.id);
  const noShows = guestHistory.filter(r => r.status === "no_show").length;
  const noShowScore = guestHistory.length >= 5
    ? String((noShows / guestHistory.length).toFixed(2))
    : null;

  await db.insert(reservations).values({
    tenantId,
    customerId: customer?.id ?? null,
    guestName,
    phone,
    partySize: parseInt(formData.get("partySize") as string),
    datetime: new Date(formData.get("datetime") as string),
    notes: formData.get("notes") as string || null,
    noShowScore,
  });

  revalidatePath("/dashboard/reservations");
}

export async function updateReservationStatus(id: string, status: "confirmed" | "seated" | "no_show" | "cancelled") {
  const tenantId = await getTenantId();
  await db.update(reservations).set({ status }).where(and(eq(reservations.id, id), eq(reservations.tenantId, tenantId)));

  if (status === "seated") {
    const res = await db.query.reservations.findFirst({ where: eq(reservations.id, id) });
    if (res?.customerId) {
      const customer = await db.query.customers.findFirst({ where: eq(customers.id, res.customerId) });
      if (customer) {
        await db.update(customers).set({
          visitCount: customer.visitCount + 1,
          lastVisit: new Date(),
        }).where(eq(customers.id, res.customerId));
      }
    }
  }

  revalidatePath("/dashboard/reservations");
}

export async function deleteReservation(id: string) {
  const tenantId = await getTenantId();
  await db.delete(reservations).where(and(eq(reservations.id, id), eq(reservations.tenantId, tenantId)));
  revalidatePath("/dashboard/reservations");
}
