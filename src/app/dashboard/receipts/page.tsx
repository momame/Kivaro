import { Topbar } from "@/components/nav/topbar";
import { db } from "@/lib/db";
import { receipts, users } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { ScanFlow } from "./scan-flow";

export default async function ReceiptsPage() {
  const user = await currentUser();
  if (!user) return null;
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id), with: { tenant: true } });
  if (!dbUser) return null;

  const history = await db.select().from(receipts)
    .where(eq(receipts.tenantId, dbUser.tenantId))
    .orderBy(desc(receipts.createdAt))
    .limit(20);

  const tenant = dbUser.tenant;

  return (
    <div>
      <Topbar title="Receipts" restaurantName={tenant.name} />
      <div className="p-6 space-y-6">
        <ScanFlow
          scanUsed={tenant.scanCountMonth}
          scanLimit={40}
          scanResetDate={tenant.scanResetDate.toISOString()}
        />
        {history.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-800 mb-3">History</h2>
            <div className="bg-white border rounded-lg divide-y">
              {history.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.vendor ?? "Unknown vendor"}</p>
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.total && <span className="text-sm font-medium text-slate-700">${r.total}</span>}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
