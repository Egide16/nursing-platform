import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { createCompanyAdmin, createGroupHomeAdmin } from "../actions";

export default async function CompanyDetail({ params }: { params: { id: string } }) {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      groupHomes: { include: { clients: true } },
      users: true,
    },
  });
  if (!company) notFound();

  const createAdminWithId = createCompanyAdmin.bind(null, company.id);
  const createGroupHomeWithId = createGroupHomeAdmin.bind(null, company.id);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="serif text-2xl text-ink">{company.name}</h1>

      <h2 className="text-sm text-slate tracking-wide mt-10 mb-3">GROUP HOMES</h2>
      <div className="flex flex-col gap-2">
        {company.groupHomes.map((h) => (
          <Link
            key={h.id}
            href={`/admin/group-homes/${h.id}`}
            className="px-4 py-2.5 border border-line bg-white text-sm text-ink flex justify-between"
          >
            <span>{h.name}</span>
            <span className="text-slate text-xs">{h.clients.length} residents</span>
          </Link>
        ))}
        {company.groupHomes.length === 0 && <p className="text-sm text-slate">None yet.</p>}
      </div>

      <form action={createGroupHomeWithId} className="flex gap-2 mt-3 max-w-sm">
        <input
          name="name"
          required
          placeholder="e.g. 12 Birch St"
          className="flex-1 px-3.5 py-2 border border-line text-sm"
        />
        <input name="address" placeholder="Full address (optional)" className="flex-1 px-3.5 py-2 border border-line text-sm" />
        <button className="px-3.5 py-2 bg-teal text-white text-sm whitespace-nowrap">Add home</button>
      </form>

      <h2 className="text-sm text-slate tracking-wide mt-10 mb-3">USERS</h2>
      <div className="flex flex-col gap-2 mb-6">
        {company.users.map((u) => (
          <div key={u.id} className="px-4 py-2.5 border border-line bg-white text-sm text-ink flex justify-between">
            <span>{u.name}</span>
            <span className="text-slate text-xs">{u.role}</span>
          </div>
        ))}
      </div>

      <h2 className="text-sm text-slate tracking-wide mb-3">ADD A COMPANY ADMIN</h2>
      <form action={createAdminWithId} className="flex flex-col gap-3 max-w-sm">
        <input name="name" required placeholder="Full name" className="px-4 py-2.5 border border-line text-sm" />
        <input name="email" type="email" required placeholder="Email" className="px-4 py-2.5 border border-line text-sm" />
        <input name="tempPassword" required placeholder="Temporary password" className="px-4 py-2.5 border border-line text-sm" />
        <button className="px-4 py-2.5 bg-teal text-white text-sm">Add company admin</button>
      </form>
    </div>
  );
}
