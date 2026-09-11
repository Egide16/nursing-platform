import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { createInspection } from "../actions";

export default async function NewInspection() {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);

  const [companies, templates] = await Promise.all([
    prisma.company.findMany({
      include: { groupHomes: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.checklistTemplate.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="serif text-xl text-ink mb-6">Start a new inspection</h1>
      <form action={createInspection} className="flex flex-col gap-3">
        <select name="groupHomeId" required className="px-4 py-3 border border-line text-sm bg-white">
          <option value="">Select a group home&hellip;</option>
          {companies.map((c) =>
            c.groupHomes.length > 0 ? (
              <optgroup key={c.id} label={c.name}>
                {c.groupHomes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </optgroup>
            ) : null
          )}
        </select>
        <select name="templateId" required className="px-4 py-3 border border-line text-sm bg-white">
          <option value="">Select a checklist&hellip;</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button className="px-4 py-3 bg-teal text-white text-sm">Start inspection</button>
      </form>
    </div>
  );
}
