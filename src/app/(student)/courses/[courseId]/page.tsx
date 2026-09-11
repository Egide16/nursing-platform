import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import CoursePlayer from "./CoursePlayer";

export default async function CoursePage({ params }: { params: { courseId: string } }) {
  const session = await requireRole(["STUDENT"]);

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      modules: { orderBy: { order: "asc" } },
      questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
      progress: { where: { userId: session.user.id } },
    },
  });

  if (!course) notFound();

  const progress = course.progress[0];
  if (!progress || progress.status === "LOCKED") {
    redirect("/dashboard");
  }
  if (progress.status === "COMPLETED") {
    redirect(`/certificates/${course.id}`);
  }

  // Strip which option is correct before sending to the client — the quiz
  // is graded server-side in the submit route, never trusting the client.
  const safeQuestions = course.questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
  }));

  return (
    <CoursePlayer
      courseId={course.id}
      courseTitle={course.title}
      modules={course.modules.map((m) => ({ id: m.id, title: m.title, body: m.body }))}
      questions={safeQuestions}
    />
  );
}
