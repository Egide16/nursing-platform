import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

// Read-only for company admins — they can see what an inspector found,
// but never edit results. Editing only happens on the admin side
// (see (admin)/admin/inspections/[id]).
export default async function CompanyInspectionDetail({ params }: { params: { id: string } }) {
  const session = await requireRole(["COMPANY_ADMIN"]);

  const inspection = await prisma.inspection.findUnique({
    where: { id: params.id },
    include: {
      groupHome: { include: { company: true } },
      inspector: true,
      items: { orderBy: { order: "asc" } },
    },
  });
  if (!inspection || inspection.groupHome.companyId !== session.user.companyId) notFound();

  const categories = Array.from(new Set(inspection.items.map((i) => i.category)));

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/company" className="text-sm text-slate">
        &larr; Back to overview
      </Link>

      <h1 className="serif text-2xl text-ink mt-6">{inspection.groupHome.name}</h1>
      <p className="text-sm text-slate mt-1">
        {inspection.visitDate.toLocaleDateString()} &middot; Inspector: {inspection.inspector.name} &middot;{" "}
        {inspection.status === "SUBMITTED" ? `Score ${inspection.score}%` : "In progress"}
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {categories.map((category) => (
          <div key={category}>
            <h2 className="text-sm text-slate tracking-wide mb-3">{category.toUpperCase()}</h2>
            <div className="flex flex-col gap-3">
              {inspection.items
                .filter((i) => i.category === category)
                .map((item) => (
                  <div key={item.id} className="px-4 py-3 border border-line bg-white">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-ink">{item.label}</p>
                      <span
                        className="text-xs px-2 py-0.5"
                        style={{
                          background:
                            item.result === "PASS" ? "#E4EEEA" : item.result === "FAIL" ? "#F3E0DA" : "#F0EEE7",
                          color: item.result === "PASS" ? "#1F4B41" : item.result === "FAIL" ? "#A8452F" : "#6B7378",
                        }}
                      >
                        {item.result ?? "Not recorded"}
                      </span>
                    </div>
                    {item.notes && <p className="text-xs text-slate mt-1.5">{item.notes}</p>}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
