import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { CertBadge } from "@/components/StatusBadge";

export default async function CertificatePage({ params }: { params: { courseId: string } }) {
  const session = await requireRole(["STUDENT"]);

  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) notFound();

  const progress = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (!progress || progress.status !== "COMPLETED" || !progress.completedAt || !progress.expiresAt) {
    redirect("/dashboard");
  }

  const dateFmt = (d: Date) =>
    d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard" className="text-sm text-slate">
          &larr; Back to dashboard
        </Link>
        <a
          href={`/api/certificates/${course.id}/pdf`}
          className="text-sm px-3.5 py-1.5 bg-teal text-white inline-block"
        >
          Download PDF
        </a>
      </div>

      <div className="bg-white border border-line px-10 py-12">
        <div className="border border-gold px-8 py-9">
          <p className="text-center text-xs text-slate tracking-wide">MERIDIAN NURSING CONSULTANTS</p>
          <p className="text-center text-xs text-slate mt-6 tracking-wide">CERTIFICATE OF COMPLETION</p>
          <p className="text-center text-sm text-slate mt-6">This certifies that</p>
          <h1 className="serif text-center text-3xl text-ink mt-2">{session.user.name}</h1>
          <p className="text-center text-sm text-slate mt-4">has successfully completed</p>
          <h2 className="serif text-center text-xl text-tealdark mt-2">{course.title}</h2>

          <div className="flex items-center justify-center gap-10 mt-10">
            <div className="text-center">
              <p className="text-xs text-slate">ISSUED</p>
              <p className="text-sm text-ink mt-1">{dateFmt(progress.completedAt)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate">EXPIRES</p>
              <p className="text-sm text-ink mt-1">{dateFmt(progress.expiresAt)}</p>
            </div>
          </div>

          <p className="text-center text-xs text-slate mt-8">Certificate ID {progress.certId}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <CertBadge expiresAt={progress.expiresAt} />
      </div>
    </div>
  );
}
