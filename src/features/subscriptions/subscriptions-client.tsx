"use client";

import Link from 'next/link';
import { useMemo, useState, useTransition, useEffect } from 'react';
import { Ban, Pause, Pencil, Play, Plus, Trash2, MoreVertical } from 'lucide-react';

import {
  createSubscription,
  deleteSubscription,
  updateSubscription,
  updateSubscriptionStatus,
} from '@/app/dashboard/subscriptions/actions';
import { SubscriptionForm } from "@/features/subscriptions/subscription-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  alertDialogActionClassName,
  alertDialogCancelClassName,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SubscriptionWithCategory } from '@/lib/subscriptions/queries';
import type { Category, Subscription } from '@/types';

type StatusFilter = 'todas' | Subscription['estado'];

type SubscriptionsClientProps = {
  subscriptions: SubscriptionWithCategory[];
  categories: Category[];
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
  activa: 'border-transparent bg-emerald-100 text-emerald-700',
  pausada: 'border-transparent bg-amber-100 text-amber-700',
  cancelada: 'border-transparent bg-red-100 text-red-700',
};

const categoryClassNameByColor: Record<string, string> = {
  '#E50914': 'border-transparent bg-red-100 text-red-700',
  '#0078D4': 'border-transparent bg-blue-100 text-blue-700',
  '#6366F1': 'border-transparent bg-indigo-100 text-indigo-700',
  '#10B981': 'border-transparent bg-emerald-100 text-emerald-700',
  '#F59E0B': 'border-transparent bg-amber-100 text-amber-700',
  '#EC4899': 'border-transparent bg-pink-100 text-pink-700',
  '#94A3B8': 'border-transparent bg-slate-100 text-slate-700',
  '#2563eb': 'border-transparent bg-blue-100 text-blue-700',
};

function categoryBadgeClassName(color?: string): string {
  const fallback = 'border-transparent bg-slate-100 text-slate-700';
  return color ? categoryClassNameByColor[color] ?? fallback : fallback;
}

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

function statusLabel(status: Subscription['estado']): string {
  const labels = { activa: 'Activa', pausada: 'Pausada', cancelada: 'Cancelada' };
  return labels[status];
}

function frecuenciaLabel(frecuencia: Subscription['frecuencia']): string {
  const labels = { mensual: 'Mensual', anual: 'Anual', semanal: 'Semanal' };
  return labels[frecuencia];
}

export function SubscriptionsClient({
  subscriptions,
  categories,
}: SubscriptionsClientProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todas');
  const [categoryId, setCategoryId] = useState('todas');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionWithCategory | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredSubscriptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return subscriptions.filter((subscription) => {
      const matchesSearch = subscription.nombre
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesStatus =
        status === 'todas' || subscription.estado === status;
      const matchesCategory =
        categoryId === 'todas' ||
        (categoryId === 'sin-categoria' && !subscription.categoria_id) ||
        subscription.categoria_id === categoryId;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryId, search, status, subscriptions]);

  function runStatusUpdate(
    id: string,
    nextStatus: Subscription['estado'],
  ): void {
    setActionMessage(null);
    startTransition(async () => {
      const result = await updateSubscriptionStatus(id, nextStatus);
      if (!result.success) {
        setActionMessage(result.error);
      }
    });
  }

  function runDelete(id: string): void {
    setActionMessage(null);
    startTransition(async () => {
      const result = await deleteSubscription(id);
      if (!result.success) {
        setActionMessage(result.error);
      }
    });
  }

  function ActionsMenu({
    subscription,
  }: {
    subscription: SubscriptionWithCategory;
  }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          disabled
        >
          <MoreVertical className="size-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      );
    }

  const nextToggleStatus =
    subscription.estado === 'activa' ? 'pausada' : 'activa';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(subscription)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isPending}
            onClick={() =>
              runStatusUpdate(subscription.id, nextToggleStatus)
            }
          >
            {subscription.estado === 'activa' ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
            {subscription.estado === 'activa' ? 'Pausar' : 'Reactivar'}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isPending || subscription.estado === 'cancelada'}
            onClick={() => runStatusUpdate(subscription.id, 'cancelada')}
          >
            <Ban className="size-4" />
            Cancelar
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                disabled={isPending}
                onSelect={(event) => event.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar suscripción</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className={alertDialogCancelClassName}>
                  Volver
                </AlertDialogCancel>
                <AlertDialogAction
                  className={alertDialogActionClassName}
                  onClick={() => runDelete(subscription.id)}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Suscripciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestioná tus servicios y mantené claro cuánto pagás cada mes.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Nueva suscripción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva suscripción</DialogTitle>
              <DialogDescription>
                Cargá los datos principales del servicio.
              </DialogDescription>
            </DialogHeader>
            <SubscriptionForm
              action={createSubscription}
              categories={categories}
              submitLabel="Crear suscripción"
              onSuccess={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre"
          className="h-10 rounded-md border-border"
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="h-10 rounded-md border-border"
        >
          <option value="todas">Todos los estados</option>
          <option value="activa">Activas</option>
          <option value="pausada">Pausadas</option>
          <option value="cancelada">Canceladas</option>
        </Select>
        <Select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="h-10 rounded-md border-border"
        >
          <option value="todas">Todas las categorías</option>
          <option value="sin-categoria">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </Select>
      </div>

      {actionMessage && (
        <p className="text-sm text-destructive" role="alert">
          {actionMessage}
        </p>
      )}

      {filteredSubscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No encontramos suscripciones con esos filtros.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: tabla */}
          <div className="hidden border-t border-border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Próximo cobro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/subscriptions/${subscription.id}`}
                        className="text-foreground transition-colors hover:text-primary"
                      >
                        {subscription.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'px-2.5 py-0.5 text-xs font-normal',
                          subscription.category
                            ? categoryBadgeClassName(subscription.category.color)
                            : 'border-transparent bg-slate-100 text-slate-700',
                        )}
                      >
                        {subscription.category?.nombre ?? 'Sin categoría'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {currencyFormatter.format(subscription.costo)}
                    </TableCell>
                    <TableCell>
                      {frecuenciaLabel(subscription.frecuencia)}
                    </TableCell>
                    <TableCell>
                      {formatDate(subscription.proximo_cobro)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'px-2.5 py-0.5 text-xs font-normal',
                          statusClassName[subscription.estado],
                        )}
                      >
                        {statusLabel(subscription.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <ActionsMenu subscription={subscription} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {filteredSubscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/dashboard/subscriptions/${subscription.id}`}
                      className="block truncate font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {subscription.nombre}
                    </Link>
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-2 py-0 text-[11px] font-normal',
                        subscription.category
                          ? categoryBadgeClassName(subscription.category.color)
                          : 'border-transparent bg-slate-100 text-slate-700',
                      )}
                    >
                      {subscription.category?.nombre ?? 'Sin categoría'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {currencyFormatter.format(subscription.costo)}
                    </p>
                    <ActionsMenu subscription={subscription} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>
                    {frecuenciaLabel(subscription.frecuencia)} · Próximo cobro:{' '}
                    {formatDate(subscription.proximo_cobro)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'px-2 py-0 text-[11px] font-normal',
                      statusClassName[subscription.estado],
                    )}
                  >
                    {statusLabel(subscription.estado)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar suscripción</DialogTitle>
            <DialogDescription>
              Actualizá los datos del servicio seleccionado.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <SubscriptionForm
              key={editing.id}
              action={updateSubscription.bind(null, editing.id)}
              categories={categories}
              subscription={editing}
              submitLabel="Guardar cambios"
              onSuccess={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}