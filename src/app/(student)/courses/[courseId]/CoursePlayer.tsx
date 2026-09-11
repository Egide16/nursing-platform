"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Module = { id: string; title: string; body: string };
type Option = { id: string; text: string };
type Question = { id: string; prompt: string; options: Option[] };

export default function CoursePlayer({
  courseId,
  courseTitle,
  modules,
  questions,
}: {
  courseId: string;
  courseTitle: string;
  modules: Module[];
  questions: Question[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ passed: boolean; score: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const inQuiz = step === modules.length;
  const module = modules[step];
  const allAnswered = questions.every((q) => answers[q.id]);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body.error || "Something went wrong submitting your answers.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setResult(data);
      if (data.passed) {
        router.push(`/certificates/${courseId}`);
      }
    } catch {
      setSubmitError("Network error — please try again.");
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <Link href="/dashboard" className="text-sm text-slate">
        &larr; Back to dashboard
      </Link>

      <p className="text-xs text-teal tracking-wide mt-6">{courseTitle.toUpperCase()}</p>

      {!inQuiz ? (
        <>
          <h1 className="serif text-2xl text-ink mt-1">{module.title}</h1>
          <p className="text-sm text-ink mt-4 leading-7 max-w-lg">{module.body}</p>

          <label className="flex items-center gap-2 mt-8 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={reviewed.has(step)}
              onChange={() => setReviewed((prev) => new Set(prev).add(step))}
            />
            I&apos;ve reviewed this section
          </label>

          <div className="flex items-center gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="text-sm px-4 py-2 border border-line">
                Previous
              </button>
            )}
            <button
              disabled={!reviewed.has(step)}
              onClick={() => setStep(step + 1)}
              className="text-sm px-4 py-2 disabled:bg-line disabled:text-slate bg-teal text-white"
            >
              {step === modules.length - 1 ? "Go to quiz" : "Next section"}
            </button>
            <span className="text-xs text-slate">
              Section {step + 1} of {modules.length}
            </span>
          </div>
        </>
      ) : (
        <>
          <h1 className="serif text-2xl text-ink mt-1">Knowledge check</h1>
          <p className="text-sm text-slate mt-2">
            Answer at least 70% correctly to complete this course.
          </p>

          <div className="mt-6 flex flex-col gap-7">
            {questions.map((q, qi) => (
              <div key={q.id}>
                <p className="text-sm text-ink font-medium">
                  {qi + 1}. {q.prompt}
                </p>
                <div className="mt-2.5 flex flex-col gap-2">
                  {q.options.map((opt) => {
                    const chosen = answers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        disabled={!!result}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                        className="text-left text-sm px-3.5 py-2.5 border"
                        style={{
                          borderColor: chosen ? "#2F6F62" : "#DAD4C4",
                          background: chosen ? "#E4EEEA" : "#fff",
                        }}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {submitError && <p className="text-sm text-clay mt-4">{submitError}</p>}

          {!result ? (
            <button
              disabled={!allAnswered || submitting}
              onClick={handleSubmit}
              className="text-sm px-4 py-2.5 mt-8 disabled:bg-line disabled:text-slate bg-teal text-white"
            >
              {submitting ? "Submitting…" : "Submit answers"}
            </button>
          ) : !result.passed ? (
            <div className="mt-8">
              <p className="text-sm text-clay">
                You scored {result.score} of {result.total}. Review the material and try again.
              </p>
              <button
                onClick={() => {
                  setAnswers({});
                  setResult(null);
                }}
                className="text-sm px-4 py-2.5 mt-3 border border-ink text-ink"
              >
                Retake quiz
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
