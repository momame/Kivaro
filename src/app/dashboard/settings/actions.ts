"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, users, invites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { randomUUID } from "crypto";

async function getOwnerTenant() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
    with: { tenant: true },
  });
  if (!dbUser || dbUser.role !== "owner") throw new Error("Unauthorized");
  return dbUser;
}

export async function updateRestaurantName(formData: FormData) {
  const dbUser = await getOwnerTenant();
  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Name required");
  await db.update(tenants).set({ name: name.trim() }).where(eq(tenants.id, dbUser.tenantId));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

export async function inviteStaff(formData: FormData) {
  const dbUser = await getOwnerTenant();
  const email = formData.get("email") as string;
  if (!email?.trim()) throw new Error("Email required");

  const token = randomUUID();
  await db.insert(invites).values({ tenantId: dbUser.tenantId, email: email.trim(), token });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await resend.emails.send({
    from: "Kivaro <onboarding@resend.dev>",
    to: email.trim(),
    subject: `You're invited to join ${dbUser.tenant.name} on Kivaro`,
    html: `
      <p>Hi,</p>
      <p><strong>${dbUser.tenant.name}</strong> has invited you to join their team on Kivaro.</p>
      <p><a href="${appUrl}/join?token=${token}" style="background:#0f172a;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Accept Invite</a></p>
      <p style="color:#9ca3af;font-size:12px">This link expires after use.</p>
    `,
  });

  revalidatePath("/dashboard/settings");
}

export async function getStaffMembers() {
  const dbUser = await getOwnerTenant();
  return db.select().from(users).where(eq(users.tenantId, dbUser.tenantId));
}

export async function getPendingInvites() {
  const dbUser = await getOwnerTenant();
  return db.select().from(invites)
    .where(eq(invites.tenantId, dbUser.tenantId))
    .then(rows => rows.filter(r => !r.usedAt));
}
