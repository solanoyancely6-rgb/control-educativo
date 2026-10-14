import { db } from "@/db";
import {
  assignments,
  classSessions,
  courses,
  enrollments,
  students,
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function enrollStudent(formData: FormData) {
  "use server";

  const courseId = String(formData.get("courseId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!courseId || !studentId) redirect(`/courses/${courseId}?error=enroll_missing`);

  await db
    .insert(enrollments)
    .values({ courseId, studentId, status: "active" })
    .onConflictDoNothing();

  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}?enrolled=1`);
}

async function createSession(formData: FormData) {
  "use server";

  const courseId = String(formData.get("courseId") ?? "");
  const sessionDate = String(formData.get("sessionDate") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();

  if (!courseId || !sessionDate) redirect(`/courses/${courseId}?error=session_missing`);

  await db.insert(classSessions).values({
    id: randomUUID(),
    courseId,
    sessionDate,
    topic: topic || null,
  });

  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}?session_created=1`);
}

async function createAssignment(formData: FormData) {
  "use server";

  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dueOnRaw = String(formData.get("dueOn") ?? "").trim();
  const maxPointsRaw = String(formData.get("maxPoints") ?? "").trim();

  if (!courseId || !title) redirect(`/courses/${courseId}?error=assignment_missing`);

  const maxPoints = maxPointsRaw ? Number(maxPointsRaw) : 100;

  await db.insert(assignments).values({
    id: randomUUID(),
    courseId,
    title,
    dueOn: dueOnRaw || null,
    maxPoints: Number.isFinite(maxPoints) ? maxPoints : 100,
  });

  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}?assignment_created=1`);
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { courseId } = await params;
  const sp = await searchParams;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) notFound();

  const [allStudents, enrolledStudents, sessions, courseAssignments] =
    await Promise.all([
      db
        .select()
        .from(students)
        .orderBy(desc(students.lastName), desc(students.firstName)),
      db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          email: students.email,
          status: enrollments.status,
        })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(and(eq(enrollments.courseId, courseId))),
      db
        .select()
        .from(classSessions)
        .where(eq(classSessions.courseId, courseId))
        .orderBy(desc(classSessions.sessionDate)),
      db
        .select()
        .from(assignments)
        .where(eq(assignments.courseId, courseId))
        .orderBy(desc(assignments.createdAt)),
    ]);

  const error = sp.error;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm text-slate-500">Curso</div>
          <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
          <div className="mt-1 text-sm text-slate-600">
            {course.description ?? "Sin descripción"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Volver
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Error: {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Inscribir estudiante</h2>
          <p className="mt-1 text-sm text-slate-600">
            Selecciona un estudiante existente para inscribirlo en este curso.
          </p>
          <form action={enrollStudent} className="mt-4 flex gap-2">
            <input type="hidden" name="courseId" value={courseId} />
            <select
              name="studentId"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Selecciona estudiante...
              </option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.lastName}, {s.firstName}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Inscribir
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-slate-200">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
              Inscritos ({enrolledStudents.length})
            </div>
            <ul className="divide-y divide-slate-200">
              {enrolledStudents.length === 0 ? (
                <li className="px-4 py-4 text-sm text-slate-600">
                  Aún no hay estudiantes inscritos.
                </li>
              ) : (
                enrolledStudents.map((s) => (
                  <li key={s.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {s.lastName}, {s.firstName}
                        </div>
                        <div className="text-xs text-slate-500">{s.email ?? ""}</div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700">
                        {s.status}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Nueva sesión (clase)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Crea una sesión para luego registrar la asistencia.
            </p>
            <form action={createSession} className="mt-4 grid gap-3">
              <input type="hidden" name="courseId" value={courseId} />
              <label className="grid gap-1 text-xs text-slate-600">
                Fecha
                <input
                  type="date"
                  name="sessionDate"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </label>
              <input
                name="topic"
                placeholder="Tema (opcional)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Crear sesión
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
                Sesiones ({sessions.length})
              </div>
              <ul className="divide-y divide-slate-200">
                {sessions.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-slate-600">
                    Aún no hay sesiones.
                  </li>
                ) : (
                  sessions.map((s) => (
                    <li key={s.id} className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{s.sessionDate}</div>
                          <div className="text-xs text-slate-500">{s.topic ?? ""}</div>
                        </div>
                        <Link
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                          href={`/courses/${courseId}/sessions/${s.id}`}
                        >
                          Asistencia
                        </Link>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Nueva tarea / evaluación</h2>
            <p className="mt-1 text-sm text-slate-600">
              Crea una tarea para capturar calificaciones.
            </p>
            <form action={createAssignment} className="mt-4 grid gap-3">
              <input type="hidden" name="courseId" value={courseId} />
              <input
                name="title"
                placeholder="Título"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs text-slate-600">
                  Fecha entrega (opcional)
                  <input
                    type="date"
                    name="dueOn"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </label>
                <label className="grid gap-1 text-xs text-slate-600">
                  Puntaje máximo
                  <input
                    type="number"
                    name="maxPoints"
                    defaultValue={100}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Crear tarea
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
                Tareas ({courseAssignments.length})
              </div>
              <ul className="divide-y divide-slate-200">
                {courseAssignments.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-slate-600">
                    Aún no hay tareas.
                  </li>
                ) : (
                  courseAssignments.map((a) => (
                    <li key={a.id} className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{a.title}</div>
                          <div className="text-xs text-slate-500">
                            Máx: {a.maxPoints}
                            {a.dueOn ? ` • Entrega: ${a.dueOn}` : ""}
                          </div>
                        </div>
                        <Link
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                          href={`/courses/${courseId}/assignments/${a.id}`}
                        >
                          Calificaciones
                        </Link>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
