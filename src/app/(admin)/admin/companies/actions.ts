"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function createCompany(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const company = await prisma.company.create({ data: { name } });
  revalidatePath("/admin/companies");
  redirect(`/admin/companies/${company.id}`);
}

export async function createCompanyAdmin(companyId: string, formData: FormData) {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const tempPassword = String(formData.get("tempPassword") || "").trim();
  if (!name || !email || !tempPassword) return;

  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "COMPANY_ADMIN", companyId },
  });

  revalidatePath(`/admin/companies/${companyId}`);
}
