import { db } from "@/db";
import { courses, enrollments, students } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) notFound();

  const enrolled = await db
    .select({
      courseId: enrollments.courseId,
      status: enrollments.status,
      name: courses.name,
      startsOn: courses.startsOn,
      endsOn: courses.endsOn,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(and(eq(enrollments.studentId, studentId)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">Estudiante</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {student.firstName} {student.lastName}
          </h1>
          <div className="mt-1 text-sm text-slate-600">
            {student.email ?? "Sin email"}
            {student.phone ? ` • ${student.phone}` : ""}
          </div>
        </div>
        <Link
          href="/students"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Volver
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold">Cursos inscritos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-6 py-3">Curso</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {enrolled.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-slate-600" colSpan={3}>
                    Aún no está inscrito a cursos.
                  </td>
                </tr>
              ) : (
                enrolled.map((c) => (
                  <tr key={c.courseId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{c.name}</td>
                    <td className="px-6 py-4 capitalize text-slate-700">
                      {c.status}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/courses/${c.courseId}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                      >
                        Ir al curso
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
