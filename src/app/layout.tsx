import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control Educativo",
  description:
    "MVP de control educativo: estudiantes, cursos, asistencia y calificaciones.",
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
    >
      {label}
    </Link>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm font-semibold">
                Control Educativo
              </Link>
              <nav className="hidden items-center gap-1 md:flex">
                <NavLink href="/dashboard" label="Dashboard" />
                <NavLink href="/students" label="Estudiantes" />
                <NavLink href="/courses" label="Cursos" />
                <NavLink href="/protom" label="Protom" />
              </nav>
            </div>
            <div className="text-xs text-slate-500">MVP • Drizzle + Postgres</div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

