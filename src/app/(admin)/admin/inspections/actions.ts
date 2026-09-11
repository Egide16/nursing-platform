"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function createInspection(formData: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "INSPECTOR"]);
  const groupHomeId = String(formData.get("groupHomeId") || "");
  const templateId = String(formData.get("templateId") || "");
  if (!groupHomeId || !templateId) return;

  const template = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!template) return;

  const inspection = await prisma.inspection.create({
    data: {
      groupHomeId,
      templateId,
      inspectorId: session.user.id,
      items: {
        create: template.items.map((i) => ({
          category: i.category,
          label: i.label,
          order: i.order,
        })),
      },
    },
  });

  revalidatePath("/admin/inspections");
  redirect(`/admin/inspections/${inspection.id}`);
}

export async function submitInspection(inspectionId: string, formData: FormData) {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);

  const items = await prisma.inspectionItem.findMany({ where: { inspectionId } });

  let scored = 0;
  let applicable = 0;

  await prisma.$transaction(
    items.map((item) => {
      const result = String(formData.get(`result-${item.id}`) || "") as "PASS" | "FAIL" | "NA" | "";
      const notes = String(formData.get(`notes-${item.id}`) || "").trim();

      if (result === "PASS") {
        scored += 1;
        applicable += 1;
      } else if (result === "FAIL") {
        applicable += 1;
      }

      return prisma.inspectionItem.update({
        where: { id: item.id },
        data: { result: result || null, notes: notes || null },
      });
    })
  );

  const score = applicable > 0 ? Math.round((scored / applicable) * 100) : null;

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: { status: "SUBMITTED", score },
  });

  revalidatePath(`/admin/inspections/${inspectionId}`);
  redirect(`/admin/inspections/${inspectionId}`);
}
