import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SubscriptionDetailActions } from '@/app/dashboard/subscriptions/[id]/subscription-detail-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getBillingHistoryBySubscriptionId,
  getCategories,
  getSubscriptionById,
} from '@/lib/subscriptions/queries';
import { generarBillingHistoryInicial } from '@/lib/billing';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import type { BillingHistory, Subscription } from '@/types';

type SubscriptionDetailPageProps = {
  params: {
    id: string;
  };
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const statusClassName: Record<Subscription['estado'], string> = {
  activa: 'border-green-200 bg-green-50 text-green-700',
  pausada: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  cancelada: 'border-slate-200 bg-slate-100 text-slate-600',
};

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

function statusLabel(status: Subscription['estado']): string {
  const labels = {
    activa: 'Activa',
    pausada: 'Pausada',
    cancelada: 'Cancelada',
  };

  return labels[status];
}

function frecuenciaLabel(frecuencia: Subscription['frecuencia']): string {
  const labels = {
    mensual: 'Mensual',
    anual: 'Anual',
    semanal: 'Semanal',
  };

  return labels[frecuencia];
}

function buildDisplayBillingHistory(
  subscription: Subscription,
  billingHistory: BillingHistory[],
): BillingHistory[] {
  if (billingHistory.length > 0) {
    return billingHistory;
  }

  return generarBillingHistoryInicial(
    new Date(`${subscription.fecha_inicio}T00:00:00.000Z`),
    subscription.frecuencia,
    subscription.costo,
  )
    .map((billing) => ({
      id: `${subscription.id}-${billing.fecha}`,
      subscription_id: subscription.id,
      ...billing,
    }))
    .reverse();
}

export default async function SubscriptionDetailPage({
  params,
}: SubscriptionDetailPageProps) {
  const supabase = createClient();
  const subscription = await getSubscriptionById(supabase, params.id);

  if (!subscription) {
    notFound();
  }

  const [billingHistory, categories] = await Promise.all([
    getBillingHistoryBySubscriptionId(supabase, params.id),
    getCategories(supabase),
  ]);
  const displayBillingHistory = buildDisplayBillingHistory(
    subscription,
    billingHistory,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{subscription.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            Detalle de la suscripcion y cobros registrados.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/subscriptions">Volver al listado</Link>
          </Button>
          <SubscriptionDetailActions
            categories={categories}
            subscription={subscription}
          />
        </div>
      </div>

      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Costo</p>
            <p className="font-medium">
              {currencyFormatter.format(subscription.costo)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Frecuencia</p>
            <p className="font-medium">
              {frecuenciaLabel(subscription.frecuencia)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Categoria</p>
            {subscription.category ? (
              <Badge
                variant="outline"
                style={{
                  borderColor: subscription.category.color,
                  color: subscription.category.color,
                }}
              >
                {subscription.category.nombre}
              </Badge>
            ) : (
              <Badge variant="outline">Sin categoria</Badge>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <Badge
              variant="outline"
              className={cn(statusClassName[subscription.estado])}
            >
              {statusLabel(subscription.estado)}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fecha de inicio</p>
            <p className="font-medium">
              {formatDate(subscription.fecha_inicio)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Proximo cobro</p>
            <p className="font-medium">
              {formatDate(subscription.proximo_cobro)}
            </p>
          </div>
        </div>

        {subscription.notas && (
          <div>
            <p className="text-sm text-muted-foreground">Notas</p>
            <p>{subscription.notas}</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historial de cobros</h2>
        {displayBillingHistory.length === 0 ? (
          <p className="rounded-lg border p-4 text-sm text-muted-foreground">
            {'Todav\u00eda no hay cobros registrados para esta suscripci\u00f3n'}
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayBillingHistory.map((billing) => (
                  <TableRow key={billing.id}>
                    <TableCell>{formatDate(billing.fecha)}</TableCell>
                    <TableCell>{currencyFormatter.format(billing.monto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
