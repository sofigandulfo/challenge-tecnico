import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { DashboardSubscription } from './calculations';

type ProximosVencimientosProps = {
  subscriptions: DashboardSubscription[];
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function ProximosVencimientos({
  subscriptions,
}: ProximosVencimientosProps) {
  const proximos = subscriptions.slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Proximos vencimientos</CardTitle>
      </CardHeader>
      <CardContent>
        {proximos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            No hay cobros próximos en los próximos 7 días
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {proximos.map((subscription) => (
              <li
                key={subscription.id}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">
                    {subscription.nombre}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {subscription.category?.nombre ?? 'Sin categoria'} ·{' '}
                    {dateFormatter.format(new Date(subscription.proximo_cobro))}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {currencyFormatter.format(subscription.costo)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
