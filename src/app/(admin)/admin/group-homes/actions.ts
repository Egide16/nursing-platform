"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function addClientAdmin(groupHomeId: string, formData: FormData) {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  await prisma.client.create({ data: { groupHomeId, name } });
  revalidatePath(`/admin/group-homes/${groupHomeId}`);
}
