import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { submitInspection } from "../actions";

export default async function InspectionDetail({ params }: { params: { id: string } }) {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);

  const inspection = await prisma.inspection.findUnique({
    where: { id: params.id },
    include: {
      groupHome: { include: { company: true } },
      inspector: true,
      items: { orderBy: { order: "asc" } },
    },
  });
  if (!inspection) notFound();

  const readOnly = inspection.status === "SUBMITTED";
  const submitWithId = submitInspection.bind(null, inspection.id);

  const categories = Array.from(new Set(inspection.items.map((i) => i.category)));

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="serif text-2xl text-ink">
        {inspection.groupHome.name} <span className="text-slate text-lg">&middot; {inspection.groupHome.company.name}</span>
      </h1>
      <p className="text-sm text-slate mt-1">
        {inspection.visitDate.toLocaleDateString()} &middot; Inspector: {inspection.inspector.name} &middot;{" "}
        {readOnly ? `Submitted \u00b7 Score ${inspection.score}%` : "Draft"}
      </p>

      <form action={submitWithId} className="mt-8 flex flex-col gap-8">
        {categories.map((category) => (
          <div key={category}>
            <h2 className="text-sm text-slate tracking-wide mb-3">{category.toUpperCase()}</h2>
            <div className="flex flex-col gap-4">
              {inspection.items
                .filter((i) => i.category === category)
                .map((item) => (
                  <div key={item.id} className="px-4 py-3 border border-line bg-white">
                    <p className="text-sm text-ink">{item.label}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {(["PASS", "FAIL", "NA"] as const).map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-slate">
                          <input
                            type="radio"
                            name={`result-${item.id}`}
                            value={opt}
                            defaultChecked={item.result === opt}
                            disabled={readOnly}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                    <input
                      name={`notes-${item.id}`}
                      defaultValue={item.notes ?? ""}
                      disabled={readOnly}
                      placeholder="Notes (optional)"
                      className="mt-2 w-full px-3 py-2 border border-line text-xs disabled:bg-paper"
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}

        {!readOnly && (
          <button className="text-sm px-4 py-2.5 bg-teal text-white self-start">Submit inspection</button>
        )}
      </form>
    </div>
  );
}
