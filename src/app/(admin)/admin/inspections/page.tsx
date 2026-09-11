import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export default async function InspectionsList() {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);

  const inspections = await prisma.inspection.findMany({
    include: { groupHome: { include: { company: true } }, inspector: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-2xl text-ink">Inspections</h1>
        <Link href="/admin/inspections/new" className="text-sm px-3.5 py-1.5 bg-teal text-white">
          New inspection
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {inspections.map((i) => (
          <Link
            key={i.id}
            href={`/admin/inspections/${i.id}`}
            className="flex items-center justify-between px-4 py-3 border border-line bg-white"
          >
            <div>
              <p className="text-sm text-ink">
                {i.groupHome.name} &middot; {i.groupHome.company.name}
              </p>
              <p className="text-xs text-slate">
                {i.visitDate.toLocaleDateString()} &middot; {i.inspector.name}
              </p>
            </div>
            <span className="text-xs text-slate">
              {i.status === "SUBMITTED" ? `Score: ${i.score}%` : "Draft"}
            </span>
          </Link>
        ))}
        {inspections.length === 0 && <p className="text-sm text-slate">No inspections yet.</p>}
      </div>
    </div>
  );
}
