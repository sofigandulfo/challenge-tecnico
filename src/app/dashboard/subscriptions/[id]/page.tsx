import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';

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
  activa:
    '[border-color:hsl(var(--success)/0.22)] [background-color:hsl(var(--success)/0.08)] [color:hsl(var(--success))]',
  pausada:
    '[border-color:hsl(var(--warning)/0.26)] [background-color:hsl(var(--warning)/0.1)] [color:hsl(var(--warning))]',
  cancelada:
    '[border-color:hsl(var(--neutral-badge)/0.2)] [background-color:hsl(var(--neutral-badge)/0.08)] [color:hsl(var(--neutral-badge))]',
};

function categoryBadgeStyle(color?: string): CSSProperties {
  if (!color) {
    return {};
  }

  return {
    borderColor: `${color}2E`,
    backgroundColor: `${color}12`,
    color,
  };
}

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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">{subscription.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            Detalle de la suscripción y cobros registrados.
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

      <section className="rounded-xl border bg-card p-5 shadow-[0_1px_2px_rgba(31,41,55,0.04)] sm:p-6">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Costo</p>
            <p className="font-medium tabular-nums">
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
            <p className="text-sm text-muted-foreground">Categoría</p>
            {subscription.category ? (
              <Badge
                variant="outline"
                style={categoryBadgeStyle(subscription.category.color)}
              >
                {subscription.category.nombre}
              </Badge>
            ) : (
              <Badge variant="outline">Sin categoría</Badge>
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
            <p className="text-sm text-muted-foreground">Próximo cobro</p>
            <p className="font-medium tabular-nums">
              {formatDate(subscription.proximo_cobro)}
            </p>
          </div>
        </div>

        {subscription.notas && (
          <div>
            <p className="text-sm text-muted-foreground">Notas</p>
            <p className="text-sm leading-6">{subscription.notas}</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Historial de cobros</h2>
        {displayBillingHistory.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-muted/40 p-5 text-sm text-muted-foreground">
            {'Todav\u00eda no hay cobros registrados para esta suscripci\u00f3n'}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(31,41,55,0.04)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayBillingHistory.map((billing) => (
                  <TableRow key={billing.id}>
                    <TableCell>{formatDate(billing.fecha)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {currencyFormatter.format(billing.monto)}
                    </TableCell>
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
