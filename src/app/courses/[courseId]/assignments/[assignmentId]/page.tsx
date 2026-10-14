import { db } from "@/db";
import {
  assignments,
  courses,
  enrollments,
  grades,
  students,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function saveGrades(formData: FormData) {
  "use server";

  const courseId = String(formData.get("courseId") ?? "");
  const assignmentId = String(formData.get("assignmentId") ?? "");

  if (!courseId || !assignmentId) redirect("/courses");

  const studentIds = formData.getAll("studentId").map(String);
  const values = studentIds.map((studentId) => {
    const pointsRaw = String(formData.get(`points_${studentId}`) ?? "").trim();
    const feedback = String(formData.get(`feedback_${studentId}`) ?? "").trim();
    const points = pointsRaw === "" ? null : Number(pointsRaw);

    return {
      assignmentId,
      studentId,
      points: points !== null && Number.isFinite(points) ? points : null,
      feedback: feedback || null,
    };
  });

  if (values.length > 0) {
    await db
      .insert(grades)
      .values(values)
      .onConflictDoUpdate({
        target: [grades.assignmentId, grades.studentId],
        set: {
          points: sql`excluded.points`,
          feedback: sql`excluded.feedback`,
        },
      });
  }

  revalidatePath(`/courses/${courseId}/assignments/${assignmentId}`);
  redirect(`/courses/${courseId}/assignments/${assignmentId}?saved=1`);
}

export default async function AssignmentGradesPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { courseId, assignmentId } = await params;
  const sp = await searchParams;
  const saved = sp.saved === "1";

  const [[course], [assignment]] = await Promise.all([
    db.select().from(courses).where(eq(courses.id, courseId)).limit(1),
    db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.courseId, courseId)))
      .limit(1),
  ]);

  if (!course || !assignment) notFound();

  const enrolled = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.courseId, courseId));

  const existing = await db
    .select()
    .from(grades)
    .where(eq(grades.assignmentId, assignmentId));

  const existingMap = new Map(
    existing.map((g) => [g.studentId, { points: g.points, feedback: g.feedback }])
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm text-slate-500">Calificaciones</div>
          <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tarea: <span className="font-medium">{assignment.title}</span>
            {assignment.dueOn ? ` • Entrega: ${assignment.dueOn}` : ""} • Máx: {assignment.maxPoints}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${courseId}`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Volver al curso
          </Link>
        </div>
      </header>

      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Calificaciones guardadas.
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold">Captura</h2>
        </div>

        <form action={saveGrades} className="p-6">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="assignmentId" value={assignmentId} />

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Estudiante</th>
                  <th className="px-4 py-3">Puntos</th>
                  <th className="px-4 py-3">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrolled.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-slate-600">
                      No hay estudiantes inscritos en este curso.
                    </td>
                  </tr>
                ) : (
                  enrolled
                    .sort((a, b) => a.lastName.localeCompare(b.lastName))
                    .map((s) => {
                      const current = existingMap.get(s.id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">
                            {s.lastName}, {s.firstName}
                            <input type="hidden" name="studentId" value={s.id} />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name={`points_${s.id}`}
                              defaultValue={current?.points ?? ""}
                              placeholder="(vacío)"
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              name={`feedback_${s.id}`}
                              defaultValue={current?.feedback ?? ""}
                              placeholder="(opcional)"
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Guardar calificaciones
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
