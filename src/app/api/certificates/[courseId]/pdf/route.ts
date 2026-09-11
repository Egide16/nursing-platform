import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateCertificatePdf } from "@/lib/certificate-pdf";

export async function GET(_req: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const progress = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (!progress || progress.status !== "COMPLETED" || !progress.completedAt || !progress.expiresAt || !progress.certId) {
    return NextResponse.json({ error: "No certificate for this course" }, { status: 404 });
  }

  const pdfBytes = await generateCertificatePdf({
    studentName: session.user.name ?? "Student",
    courseTitle: course.title,
    issuedAt: progress.completedAt,
    expiresAt: progress.expiresAt,
    certId: progress.certId,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${course.slug}-certificate.pdf"`,
    },
  });
}
