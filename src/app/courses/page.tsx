import { db } from "@/db";
import { courses } from "@/db/schema";
import { desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createCourse(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsOnRaw = String(formData.get("startsOn") ?? "").trim();
  const endsOnRaw = String(formData.get("endsOn") ?? "").trim();

  if (!name) redirect("/courses?error=missing_name");

  await db.insert(courses).values({
    id: randomUUID(),
    name,
    description: description || null,
    startsOn: startsOnRaw || null,
    endsOn: endsOnRaw || null,
  });

  revalidatePath("/courses");
  redirect("/courses?created=1");
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const created = sp.created === "1";
  const error = sp.error;

  const rows = await db
    .select()
    .from(courses)
    .orderBy(desc(courses.createdAt), desc(courses.name));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Cursos</h1>
        <p className="text-sm text-slate-600">
          Crea cursos, inscribe estudiantes, registra asistencia y calificaciones.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Nuevo curso</h2>
        {created ? (
          <p className="mt-2 text-sm text-emerald-700">Curso creado.</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-rose-700">No se pudo crear: {error}</p>
        ) : null}
        <form action={createCourse} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            placeholder="Nombre del curso"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            required
          />
          <input
            name="description"
            placeholder="Descripción (opcional)"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <label className="grid gap-1 text-xs text-slate-600">
            Fecha inicio (opcional)
            <input
              type="date"
              name="startsOn"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </label>
          <label className="grid gap-1 text-xs text-slate-600">
            Fecha fin (opcional)
            <input
              type="date"
              name="endsOn"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </label>
          <button
            className="md:col-span-2 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            type="submit"
          >
            Crear curso
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold">Listado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-6 py-3">Curso</th>
                <th className="px-6 py-3">Fechas</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-slate-600" colSpan={3}>
                    Aún no hay cursos. Crea el primero arriba.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{c.name}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>{c.startsOn ?? "—"}</div>
                      <div className="text-xs text-slate-500">{c.endsOn ?? ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                        href={`/courses/${c.id}`}
                      >
                        Abrir
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
