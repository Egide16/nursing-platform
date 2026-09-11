import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export default async function CompaniesList() {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);
  const companies = await prisma.company.findMany({
    include: { groupHomes: true, users: { where: { role: "STUDENT" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-2xl text-ink">Companies</h1>
        <Link href="/admin/companies/new" className="text-sm px-3.5 py-1.5 bg-teal text-white">
          Add company
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {companies.map((c) => (
          <Link
            key={c.id}
            href={`/admin/companies/${c.id}`}
            className="flex items-center justify-between px-4 py-3 border border-line bg-white"
          >
            <span className="text-sm text-ink">{c.name}</span>
            <span className="text-xs text-slate">
              {c.groupHomes.length} group homes &middot; {c.users.length} students
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
