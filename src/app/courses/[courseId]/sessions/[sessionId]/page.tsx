import { db } from "@/db";
import {
  attendance,
  classSessions,
  courses,
  enrollments,
  students,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function saveAttendance(formData: FormData) {
  "use server";

  const courseId = String(formData.get("courseId") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");

  if (!courseId || !sessionId) redirect("/courses");

  const studentIds = formData.getAll("studentId").map(String);
  const values = studentIds.map((studentId) => {
    const status = String(formData.get(`status_${studentId}`) ?? "present");
    const note = String(formData.get(`note_${studentId}`) ?? "").trim();
    return {
      sessionId,
      studentId,
      status: status as "present" | "absent" | "late" | "excused",
      note: note || null,
    };
  });

  if (values.length > 0) {
    await db
      .insert(attendance)
      .values(values)
      .onConflictDoUpdate({
        target: [attendance.sessionId, attendance.studentId],
        set: {
          status: sql`excluded.status`,
          note: sql`excluded.note`,
        },
      });
  }

  revalidatePath(`/courses/${courseId}/sessions/${sessionId}`);
  redirect(`/courses/${courseId}/sessions/${sessionId}?saved=1`);
}

export default async function SessionAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { courseId, sessionId } = await params;
  const sp = await searchParams;
  const saved = sp.saved === "1";

  const [[course], [session]] = await Promise.all([
    db.select().from(courses).where(eq(courses.id, courseId)).limit(1),
    db
      .select()
      .from(classSessions)
      .where(and(eq(classSessions.id, sessionId), eq(classSessions.courseId, courseId)))
      .limit(1),
  ]);

  if (!course || !session) notFound();

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
    .from(attendance)
    .where(eq(attendance.sessionId, sessionId));

  const existingMap = new Map(
    existing.map((a) => [a.studentId, { status: a.status, note: a.note }])
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm text-slate-500">Asistencia</div>
          <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sesión: <span className="font-medium">{session.sessionDate}</span>
            {session.topic ? ` • ${session.topic}` : ""}
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
          Asistencia guardada.
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold">Lista</h2>
        </div>

        <form action={saveAttendance} className="p-6">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="sessionId" value={sessionId} />

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Estudiante</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Nota</th>
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
                      const status = current?.status ?? "present";
                      const note = current?.note ?? "";
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">
                            {s.lastName}, {s.firstName}
                            <input type="hidden" name="studentId" value={s.id} />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              name={`status_${s.id}`}
                              defaultValue={status}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                            >
                              <option value="present">Presente</option>
                              <option value="absent">Ausente</option>
                              <option value="late">Tarde</option>
                              <option value="excused">Justificado</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              name={`note_${s.id}`}
                              defaultValue={note ?? ""}
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
              Guardar asistencia
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
