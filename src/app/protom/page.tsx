import { db } from "@/db";
import { vibePrompts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CopyButton } from "./CopyButton";

export const dynamic = "force-dynamic";

const templates: Array<{ title: string; content: string }> = [
  {
    title: "Prompt maestro (PRD + tareas)",
    content: `Actúa como un experto fullstack (Next.js App Router + PostgreSQL + Drizzle).

Contexto:
Estoy construyendo un Control Educativo con módulos: Estudiantes, Cursos, Inscripciones, Sesiones, Asistencia, Tareas y Calificaciones.

Objetivo de esta iteración:
[DESCRIBE AQUÍ LA FUNCIÓN]

Requisitos:
- Mantener UX simple (formularios + tablas)
- Server Actions para crear/editar
- Drizzle para BD (sin raw SQL salvo necesidad)
- Validación básica en servidor
- Revalidar rutas afectadas

Entrega:
1) Lista de cambios por archivo
2) Código completo de los archivos nuevos/modificados
3) Pasos para validar (typegen, tsc, build)

Criterios de aceptación:
- [LISTA]
`,
  },
  {
    title: "Iteración: reportes", 
    content: `Implementa reportes por curso:
- % asistencia por estudiante
- promedio de calificaciones por tarea y promedio final
- tabla resumen en /courses/[courseId]/report

Incluye:
- queries Drizzle eficientes
- UI con tablas y totales
- export CSV (sin librerías externas si se puede)
`,
  },
  {
    title: "Iteración: autenticación (básica)",
    content: `Agrega autenticación simple (email + password) con roles (admin, profesor).
- Tablas users/roles
- Login/logout
- Proteger rutas /dashboard, /students, /courses
- Mantener secretos server-side
`,
  },
];

async function createPrompt(formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !content) redirect("/protom?error=missing");

  await db.insert(vibePrompts).values({
    id: randomUUID(),
    title,
    content,
  });

  revalidatePath("/protom");
  redirect("/protom?created=1");
}

export default async function ProtomPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const created = sp.created === "1";
  const error = sp.error;

  const saved = await db
    .select()
    .from(vibePrompts)
    .orderBy(desc(vibePrompts.createdAt));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Protom</h1>
        <p className="text-sm text-slate-600">
          Aquí guardas prompts (instrucciones) para vibecoding y puedes copiarlos
          rápido.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Nuevo prompt</h2>
        {created ? (
          <p className="mt-2 text-sm text-emerald-700">Prompt guardado.</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-rose-700">Error: {error}</p>
        ) : null}

        <form action={createPrompt} className="mt-4 grid gap-3">
          <input
            name="title"
            placeholder="Título (ej. Reporte por curso)"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            required
          />
          <textarea
            name="content"
            placeholder="Escribe el prompt aquí..."
            rows={8}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-slate-400"
            required
          />
          <button
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            type="submit"
          >
            Guardar prompt
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold">Plantillas rápidas</h2>
        </div>
        <div className="grid gap-4 p-6 lg:grid-cols-3">
          {templates.map((t) => (
            <article
              key={t.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{t.title}</h3>
                <CopyButton text={t.content} />
              </div>
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs leading-5 text-slate-700">
                {t.content}
              </pre>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold">Tus prompts guardados</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {saved.length === 0 ? (
            <div className="px-6 py-6 text-sm text-slate-600">
              Aún no tienes prompts guardados.
            </div>
          ) : (
            saved.map((p) => (
              <article key={p.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{p.title}</h3>
                    <div className="mt-1 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleString("es-MX")}
                    </div>
                  </div>
                  <CopyButton text={p.content} />
                </div>
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                  {p.content}
                </pre>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
