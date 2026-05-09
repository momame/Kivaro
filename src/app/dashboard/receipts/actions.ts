"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptLineItems, expenses, users, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getDbUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id) });
  if (!dbUser) throw new Error("User not found");
  return dbUser;
}

export async function checkScanLimit(): Promise<{ allowed: boolean; used: number; limit: number }> {
  const dbUser = await getDbUser();
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, dbUser.tenantId) });
  if (!tenant) throw new Error("Tenant not found");

  const now = new Date();
  const resetDate = new Date(tenant.scanResetDate);
  const needsReset = now.getFullYear() > resetDate.getFullYear() ||
    now.getMonth() > resetDate.getMonth();

  if (needsReset) {
    await db.update(tenants).set({ scanCountMonth: 0, scanResetDate: now }).where(eq(tenants.id, tenant.id));
    return { allowed: true, used: 0, limit: 40 };
  }

  return { allowed: tenant.scanCountMonth < 40, used: tenant.scanCountMonth, limit: 40 };
}

export async function incrementScanCount() {
  const dbUser = await getDbUser();
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, dbUser.tenantId) });
  if (!tenant) return;
  await db.update(tenants).set({ scanCountMonth: tenant.scanCountMonth + 1 }).where(eq(tenants.id, tenant.id));
}

export async function confirmReceipt(data: {
  imageUrl: string;
  vendor: string;
  total: string;
  lineItems: { name: string; quantity: string; unitPrice: string }[];
}) {
  const dbUser = await getDbUser();

  const [receipt] = await db.insert(receipts).values({
    tenantId: dbUser.tenantId,
    scannedBy: dbUser.clerkId,
    imageUrl: data.imageUrl,
    vendor: data.vendor || null,
    total: data.total || null,
    status: "confirmed",
  }).returning();

  if (data.lineItems.length > 0) {
    await db.insert(receiptLineItems).values(
      data.lineItems.map((item) => ({
        receiptId: receipt.id,
        name: item.name,
        quantity: item.quantity || null,
        unitPrice: item.unitPrice || null,
      }))
    );
  }

  await db.insert(expenses).values({
    tenantId: dbUser.tenantId,
    receiptId: receipt.id,
    vendor: data.vendor || null,
    total: data.total || "0",
  });

  revalidatePath("/dashboard/receipts");
}

export async function getReceipts() {
  const dbUser = await getDbUser();
  return db.select().from(receipts)
    .where(and(eq(receipts.tenantId, dbUser.tenantId), eq(receipts.status, "confirmed")))
    .orderBy(receipts.createdAt);
}
