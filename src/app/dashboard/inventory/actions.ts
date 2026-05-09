"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { inventoryItems, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getTenantId() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
    with: { tenant: true },
  });
  if (!dbUser) throw new Error("User not found");
  return dbUser.tenantId;
}

export async function addInventoryItem(formData: FormData) {
  const tenantId = await getTenantId();
  await db.insert(inventoryItems).values({
    tenantId,
    name: formData.get("name") as string,
    unit: formData.get("unit") as string,
    currentStock: formData.get("currentStock") as string,
    minThreshold: formData.get("minThreshold") as string,
  });
  revalidatePath("/dashboard/inventory");
}

export async function updateStock(id: string, newStock: string) {
  const tenantId = await getTenantId();
  await db
    .update(inventoryItems)
    .set({ currentStock: newStock })
    .where(eq(inventoryItems.id, id) && eq(inventoryItems.tenantId, tenantId));
  revalidatePath("/dashboard/inventory");
}

export async function deleteInventoryItem(id: string) {
  const tenantId = await getTenantId();
  await db
    .delete(inventoryItems)
    .where(eq(inventoryItems.id, id) && eq(inventoryItems.tenantId, tenantId));
  revalidatePath("/dashboard/inventory");
}
