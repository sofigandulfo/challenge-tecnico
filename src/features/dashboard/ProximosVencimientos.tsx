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

function daysUntil(date: string): number {
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const target = new Date(`${date}T00:00:00Z`).getTime();

  return Math.ceil((target - todayUtc) / 86_400_000);
}

export function ProximosVencimientos({
  subscriptions,
}: ProximosVencimientosProps) {
  const proximos = subscriptions.slice(0, 5);
  const totalProximos = proximos.reduce(
    (total, subscription) => total + subscription.costo,
    0,
  );

  return (
    <Card className="h-full border border-border bg-transparent p-6 shadow-none">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-semibold text-foreground">
          Próximos vencimientos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        {proximos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
            No hay cobros próximos en los próximos 7 días.
          </p>
        ) : (
          <div className="space-y-4">
            <ul className="divide-y divide-border">
              {proximos.map((subscription) => {
                const urgent = daysUntil(subscription.proximo_cobro) <= 7;

                return (
                  <li
                    key={subscription.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {subscription.nombre}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {subscription.category?.nombre ?? 'Sin categoría'} ·{' '}
                        <span className={urgent ? 'text-warning' : undefined}>
                          {dateFormatter.format(
                            new Date(subscription.proximo_cobro),
                          )}
                        </span>
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                      {currencyFormatter.format(subscription.costo)}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Total a pagar este mes
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {currencyFormatter.format(totalProximos)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
