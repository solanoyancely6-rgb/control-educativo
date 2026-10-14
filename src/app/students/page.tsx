import { db } from "@/db";
import { students } from "@/db/schema";
import { desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createStudent(formData: FormData) {
  "use server";

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();

  if (!firstName || !lastName) {
    redirect("/students?error=missing_name");
  }

  const email = emailRaw || null;
  const phone = phoneRaw || null;

  await db.insert(students).values({
    id: randomUUID(),
    firstName,
    lastName,
    email,
    phone,
  });

  revalidatePath("/students");
  redirect("/students?created=1");
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const created = sp.created === "1";
  const error = sp.error;

  const rows = await db
    .select()
    .from(students)
    .orderBy(desc(students.createdAt), desc(students.lastName));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estudiantes</h1>
          <p className="mt-1 text-sm text-slate-600">
            Alta, consulta y control básico de estudiantes.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Nuevo estudiante</h2>
        {created ? (
          <p className="mt-2 text-sm text-emerald-700">Estudiante creado.</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-rose-700">
            No se pudo crear: {error}
          </p>
        ) : null}
        <form action={createStudent} className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            name="firstName"
            placeholder="Nombre"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            required
          />
          <input
            name="lastName"
            placeholder="Apellido"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            required
          />
          <input
            name="email"
            placeholder="Email (opcional)"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <input
            name="phone"
            placeholder="Teléfono (opcional)"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <button
            className="md:col-span-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            type="submit"
          >
            Crear estudiante
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
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Contacto</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-slate-600" colSpan={3}>
                    Aún no hay estudiantes. Crea el primero arriba.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">
                      {s.lastName}, {s.firstName}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>{s.email ?? "—"}</div>
                      <div className="text-xs text-slate-500">{s.phone ?? ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                        href={`/students/${s.id}`}
                      >
                        Ver detalle
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
