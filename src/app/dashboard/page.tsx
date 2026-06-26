import { EmptyDashboard } from '@/features/dashboard/EmptyDashboard';
import { GastoPorCategoriaChart } from '@/features/dashboard/GastoPorCategoriaChart';
import { KpiCard } from '@/features/dashboard/KpiCard';
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tus suscripciones y proximos cobros.
        </p>
      </div>

      <KpiCard
        label="Gasto mensual"
        value={currencyFormatter.format(gastoMensualTotal)}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <GastoPorCategoriaChart data={gastoPorCategoria} />
        <ProximosVencimientos subscriptions={upcomingSubscriptions} />
      </section>
    </div>
  );
}
