import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm uppercase tracking-wide text-slate-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        No encontramos esa página
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Revisa la URL o vuelve al dashboard.
      </p>
      <div className="mt-6">
        <Link
          href="/dashboard"
          className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Ir al Dashboard
        </Link>
      </div>
    </div>
  );
}
