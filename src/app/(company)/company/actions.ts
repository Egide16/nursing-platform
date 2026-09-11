"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function createGroupHome(formData: FormData) {
  const session = await requireRole(["COMPANY_ADMIN"]);
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  if (!name || !session.user.companyId) return;

  const home = await prisma.groupHome.create({
    data: { companyId: session.user.companyId, name, address: address || null },
  });

  revalidatePath("/company");
  redirect(`/company/group-homes/${home.id}`);
}

export async function addClient(groupHomeId: string, formData: FormData) {
  const session = await requireRole(["COMPANY_ADMIN"]);
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  // Confirm this group home actually belongs to the admin's own company.
  const home = await prisma.groupHome.findUnique({ where: { id: groupHomeId } });
  if (!home || home.companyId !== session.user.companyId) return;

  await prisma.client.create({ data: { groupHomeId, name } });
  revalidatePath(`/company/group-homes/${groupHomeId}`);
}

export async function createStudent(formData: FormData) {
  const session = await requireRole(["COMPANY_ADMIN"]);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const tempPassword = String(formData.get("tempPassword") || "").trim();
  if (!name || !email || !tempPassword || !session.user.companyId) return;

  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const student = await prisma.user.create({
    data: { name, email, passwordHash, role: "STUDENT", companyId: session.user.companyId },
  });

  const firstCourse = await prisma.course.findFirst({ orderBy: { order: "asc" } });
  const courses = await prisma.course.findMany({ orderBy: { order: "asc" } });

  await prisma.courseProgress.createMany({
    data: courses.map((c) => ({
      userId: student.id,
      courseId: c.id,
      status: c.id === firstCourse?.id ? "UNLOCKED" : "LOCKED",
    })),
  });

  revalidatePath("/company");
  redirect("/company");
}
