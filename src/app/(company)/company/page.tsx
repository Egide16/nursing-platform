import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { CertBadge } from "@/components/StatusBadge";

export default async function CompanyOverview() {
  const session = await requireRole(["COMPANY_ADMIN"]);
  const companyId = session.user.companyId!;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { groupHomes: { include: { clients: true } } },
  });

  const students = await prisma.user.findMany({
    where: { companyId, role: "STUDENT" },
    include: { progress: { include: { course: true }, orderBy: { course: { order: "asc" } } } },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="serif text-2xl text-ink">{company?.name}</h1>

      <section className="mt-10">
        <h2 className="text-sm text-slate tracking-wide mb-4">GROUP HOMES</h2>
        <div className="flex flex-col gap-3">
          {company?.groupHomes.map((h) => (
            <Link
              key={h.id}
              href={`/company/group-homes/${h.id}`}
              className="flex items-center justify-between px-4 py-3 border border-line bg-white"
            >
              <div>
                <p className="text-sm text-ink">{h.name}</p>
                <p className="text-xs text-slate">{h.address}</p>
              </div>
              <span className="text-xs text-slate">{h.clients.length} residents</span>
            </Link>
          ))}
          {company?.groupHomes.length === 0 && (
            <p className="text-sm text-slate">No group homes yet. Add your first one from the top nav.</p>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm text-slate tracking-wide mb-4">STAFF TRAINING STATUS</h2>
        <div className="flex flex-col gap-4">
          {students.map((s) => (
            <div key={s.id} className="px-4 py-3 border border-line bg-white">
              <p className="text-sm text-ink">{s.name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {s.progress.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <span className="text-xs text-slate">{p.course.title}:</span>
                    {p.status === "COMPLETED" && p.expiresAt ? (
                      <CertBadge expiresAt={p.expiresAt} />
                    ) : (
                      <span className="text-xs text-slate">{p.status.toLowerCase()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <p className="text-sm text-slate">No staff added yet. Add your first one from the top nav.</p>
          )}
        </div>
      </section>
    </div>
  );
}
