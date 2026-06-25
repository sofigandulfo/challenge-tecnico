export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <section className="max-w-2xl space-y-4 text-center">
        <p className="text-sm font-medium uppercase text-slate-500">
          SaaS-Track
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Proyecto Next.js inicializado
        </h1>
        <p className="text-slate-600">
          Base lista con App Router, TypeScript, Tailwind CSS, shadcn/ui,
          Tremor, date-fns y Supabase.
        </p>
      </section>
    </main>
  );
}
