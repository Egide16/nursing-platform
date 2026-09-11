import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { CertBadge } from "@/components/StatusBadge";

export default async function Dashboard() {
  const session = await requireRole(["STUDENT"]);

  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: {
      progress: { where: { userId: session.user.id } },
    },
  });

  const completedCount = courses.filter((c) => c.progress[0]?.status === "COMPLETED").length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="serif text-2xl text-ink">Welcome back, {session.user.name?.split(" ")[0]}</h1>
      <p className="text-sm text-slate mt-1">
        {completedCount} of {courses.length} courses completed
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {courses.map((course) => {
          const rec = course.progress[0];
          const status = rec?.status ?? "LOCKED";
          return (
            <div key={course.id} className="flex gap-4">
              <div className="shrink-0 pt-1">
                <span
                  className="inline-flex w-8 h-8 rounded-full items-center justify-center text-xs"
                  style={{
                    background: status === "COMPLETED" ? "#2F6F62" : "transparent",
                    border: status === "LOCKED" ? "2px solid #DAD4C4" : "2px solid #2F6F62",
                    color: status === "COMPLETED" ? "#fff" : "#2F6F62",
                  }}
                >
                  {status === "COMPLETED" ? "\u2713" : status === "LOCKED" ? "\u{1F512}" : "\u25CF"}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="serif text-lg text-ink">{course.title}</h2>
                <p className="text-sm text-slate mt-1 max-w-md">{course.summary}</p>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  {status === "LOCKED" && (
                    <span className="text-xs text-slate">Complete the previous course to unlock</span>
                  )}
                  {status === "UNLOCKED" && (
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm px-3.5 py-1.5 bg-teal text-white inline-block"
                    >
                      Start course
                    </Link>
                  )}
                  {status === "COMPLETED" && rec?.expiresAt && (
                    <>
                      <CertBadge expiresAt={rec.expiresAt} />
                      <Link href={`/certificates/${course.id}`} className="text-sm text-teal">
                        View certificate
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
