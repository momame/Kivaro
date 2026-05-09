"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { menuItems, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getTenantId() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id) });
  if (!dbUser) throw new Error("User not found");
  return dbUser.tenantId;
}

export async function addMenuItem(formData: FormData) {
  const tenantId = await getTenantId();
  await db.insert(menuItems).values({
    tenantId,
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
    price: formData.get("price") as string,
    category: formData.get("category") as string,
  });
  revalidatePath("/dashboard/menu");
}

export async function toggleMenuItem(id: string, active: boolean) {
  const tenantId = await getTenantId();
  await db.update(menuItems).set({ active }).where(and(eq(menuItems.id, id), eq(menuItems.tenantId, tenantId)));
  revalidatePath("/dashboard/menu");
}

export async function deleteMenuItem(id: string) {
  const tenantId = await getTenantId();
  await db.delete(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.tenantId, tenantId)));
  revalidatePath("/dashboard/menu");
}
