import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function POST(req: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { answers } = parsed.data;

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: { questions: { include: { options: true } } },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const progress = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });

  // Server-side gate: never trust the client on lock state or on the score.
  if (!progress || progress.status === "LOCKED") {
    return NextResponse.json({ error: "This course is locked" }, { status: 403 });
  }
  if (progress.status === "COMPLETED") {
    return NextResponse.json({ error: "This course is already complete" }, { status: 400 });
  }

  let correct = 0;
  for (const q of course.questions) {
    const chosenOptionId = answers[q.id];
    const correctOption = q.options.find((o) => o.isCorrect);
    if (chosenOptionId && correctOption && chosenOptionId === correctOption.id) correct += 1;
  }
  const total = course.questions.length;
  const passThreshold = Math.ceil(total * 0.7);
  const passed = correct >= passThreshold;

  if (!passed) {
    return NextResponse.json({ passed: false, score: correct, total });
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + course.validityMonths);
  const certId = `NCC-${course.slug.slice(0, 4).toUpperCase()}-${now.getTime().toString(36).toUpperCase()}`;

  await prisma.$transaction(async (tx) => {
    await tx.courseProgress.update({
      where: { id: progress.id },
      data: { status: "COMPLETED", completedAt: now, expiresAt, certId },
    });

    const nextCourse = await tx.course.findFirst({
      where: { order: { gt: course.order } },
      orderBy: { order: "asc" },
    });

    if (nextCourse) {
      await tx.courseProgress.upsert({
        where: { userId_courseId: { userId: session.user.id, courseId: nextCourse.id } },
        update: { status: "UNLOCKED" },
        create: { userId: session.user.id, courseId: nextCourse.id, status: "UNLOCKED" },
      });
    }
  });

  return NextResponse.json({ passed: true, score: correct, total });
}
