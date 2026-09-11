import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { addClientAdmin } from "../actions";

export default async function AdminGroupHomeDetail({ params }: { params: { id: string } }) {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);

  const home = await prisma.groupHome.findUnique({
    where: { id: params.id },
    include: { company: true, clients: { orderBy: { createdAt: "asc" } } },
  });
  if (!home) notFound();

  const addClientWithId = addClientAdmin.bind(null, home.id);

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <Link href={`/admin/companies/${home.company.id}`} className="text-sm text-slate">
        &larr; Back to {home.company.name}
      </Link>

      <h1 className="serif text-xl text-ink mt-6">{home.name}</h1>
      <p className="text-sm text-slate">{home.address}</p>

      <h2 className="text-sm text-slate tracking-wide mt-10 mb-3">RESIDENTS</h2>
      <div className="flex flex-col gap-2">
        {home.clients.map((c) => (
          <div key={c.id} className="px-4 py-2.5 border border-line bg-white text-sm text-ink">
            {c.name}
          </div>
        ))}
        {home.clients.length === 0 && <p className="text-sm text-slate">No residents recorded yet.</p>}
      </div>

      <form action={addClientWithId} className="flex gap-2 mt-4">
        <input name="name" required placeholder="Resident name" className="flex-1 px-4 py-2.5 border border-line text-sm" />
        <button className="px-4 py-2.5 bg-teal text-white text-sm">Add</button>
      </form>
    </div>
  );
}
