import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export default async function AdminOverview() {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);

  const [companyCount, groupHomeCount, studentCount, expiringSoon] = await Promise.all([
    prisma.company.count(),
    prisma.groupHome.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.courseProgress.findMany({
      where: {
        status: "COMPLETED",
        expiresAt: { lte: new Date(Date.now() + 60 * 86400000) },
      },
      include: { user: { include: { company: true } }, course: true },
      orderBy: { expiresAt: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="serif text-2xl text-ink mb-8">Overview</h1>

      <div className="flex gap-8 mb-12">
        <Stat label="Companies" value={companyCount} />
        <Stat label="Group homes" value={groupHomeCount} />
        <Stat label="Students" value={studentCount} />
      </div>

      <h2 className="text-sm text-slate tracking-wide mb-4">CERTIFICATIONS EXPIRING WITHIN 60 DAYS</h2>
      <div className="flex flex-col gap-2">
        {expiringSoon.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border border-line bg-white text-sm">
            <span className="text-ink">
              {p.user.name} &middot; {p.course.title}
            </span>
            <span className="text-slate">
              {p.user.company?.name ?? "—"} &middot; expires {p.expiresAt?.toLocaleDateString()}
            </span>
          </div>
        ))}
        {expiringSoon.length === 0 && <p className="text-sm text-slate">Nothing expiring soon.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="serif text-3xl text-ink">{value}</p>
      <p className="text-xs text-slate mt-1">{label}</p>
    </div>
  );
}
