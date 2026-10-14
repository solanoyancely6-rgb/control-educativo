import { db } from "@/db";
import {
  assignments,
  classSessions,
  courses,
  students,
} from "@/db/schema";
import { sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getCount(table: unknown) {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(table as any);
  return Number(rows[0]?.count ?? 0);
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
    >
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-3 text-xs font-medium text-slate-500 group-hover:text-slate-700">
        Ver detalle →
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const [studentsCount, coursesCount, sessionsCount, assignmentsCount] =
    await Promise.all([
      getCount(students),
      getCount(courses),
      getCount(classSessions),
      getCount(assignments),
    ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Este MVP está pensado para llevar control de estudiantes, cursos,
          asistencia y calificaciones.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estudiantes" value={studentsCount} href="/students" />
        <StatCard label="Cursos" value={coursesCount} href="/courses" />
        <StatCard
          label="Sesiones (clases)"
          value={sessionsCount}
          href="/courses"
        />
        <StatCard label="Tareas" value={assignmentsCount} href="/courses" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Flujo recomendado (vibecoding)</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Crea estudiantes.</li>
          <li>Crea un curso.</li>
          <li>Inscribe estudiantes al curso.</li>
          <li>Crea una sesión de clase y registra asistencia.</li>
          <li>Crea una tarea y captura calificaciones.</li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/students"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Empezar por estudiantes
          </Link>
          <Link
            href="/courses"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Ir a cursos
          </Link>
        </div>
      </section>
    </div>
  );
}
