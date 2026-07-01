import { EmptyDashboard } from '@/features/dashboard/EmptyDashboard';
import { GastoPorCategoriaChart } from '@/features/dashboard/GastoPorCategoriaChart';
import { ProximosVencimientos } from '@/features/dashboard/ProximosVencimientos';
import {
  calcularGastoMensualTotal,
  calcularGastoPorCategoria,
} from '@/features/dashboard/calculations';
import {
  getSubscriptions,
  getUpcomingSubscriptions,
} from '@/features/dashboard/queries';
import { createClient } from '@/lib/supabase/server';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default async function DashboardPage() {
  const supabase = createClient();
  const [subscriptions, upcomingSubscriptions] = await Promise.all([
    getSubscriptions(supabase),
    getUpcomingSubscriptions(supabase),
  ]);

  if (subscriptions.length === 0) {
    return <EmptyDashboard />;
  }

  const gastoMensualTotal = calcularGastoMensualTotal(subscriptions);
  const gastoPorCategoria = calcularGastoPorCategoria(subscriptions);

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tus suscripciones, categorías y próximos cobros.
        </p>
      </div>

      <section>
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Gasto mensual estimado
        </p>
        <p className="text-6xl font-bold tracking-tight text-foreground">
          {currencyFormatter.format(gastoMensualTotal)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Basado en tus suscripciones activas
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <GastoPorCategoriaChart data={gastoPorCategoria} />
        <ProximosVencimientos subscriptions={upcomingSubscriptions} />
      </section>
    </div>
  );
}
