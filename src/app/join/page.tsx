import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { invites, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) redirect("/");

  const invite = await db.query.invites.findFirst({ where: eq(invites.token, token) });
  if (!invite || invite.usedAt) redirect("/");

  const user = await currentUser();
  if (!user) redirect(`/sign-up?redirect_url=/join?token=${token}`);

  const existing = await db.query.users.findFirst({ where: eq(users.clerkId, user.id) });
  if (existing) redirect("/dashboard");

  await db.insert(users).values({ tenantId: invite.tenantId, clerkId: user.id, role: "staff" });
  await db.update(invites).set({ usedAt: new Date() }).where(eq(invites.token, token));

  redirect("/dashboard");
}
