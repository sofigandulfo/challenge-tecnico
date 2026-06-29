"use client";

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { Ban, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';

import {
  createSubscription,
  deleteSubscription,
  updateSubscription,
  updateSubscriptionStatus,
} from '@/app/dashboard/subscriptions/actions';
import { SubscriptionForm } from '@/app/dashboard/subscriptions/subscription-form';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Suscripciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona altas, cambios de estado y bajas de tus servicios.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Nueva suscripcion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva suscripcion</DialogTitle>
              <DialogDescription>
                Carga los datos principales del servicio.
              </DialogDescription>
            </DialogHeader>
            <SubscriptionForm
              action={createSubscription}
              categories={categories}
              submitLabel="Crear suscripcion"
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
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
        >
          <option value="todas">Todos los estados</option>
          <option value="activa">Activas</option>
          <option value="pausada">Pausadas</option>
          <option value="cancelada">Canceladas</option>
        </Select>
        <Select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="todas">Todas las categorias</option>
          <option value="sin-categoria">Sin categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </Select>
      </div>

      {actionMessage && (
        <p className="text-sm text-red-500" role="alert">
          {actionMessage}
        </p>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Frecuencia</TableHead>
              <TableHead>Proximo cobro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay suscripciones para los filtros actuales.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => {
                const nextToggleStatus =
                  subscription.estado === 'activa' ? 'pausada' : 'activa';

                return (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/subscriptions/${subscription.id}`}
                        className="hover:underline"
                      >
                        {subscription.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      {currencyFormatter.format(subscription.costo)}
                    </TableCell>
                    <TableCell>
                      {frecuenciaLabel(subscription.frecuencia)}
                    </TableCell>
                    <TableCell>{formatDate(subscription.proximo_cobro)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(statusClassName[subscription.estado])}
                      >
                        {statusLabel(subscription.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(subscription)}
                          title="Editar"
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={isPending}
                          onClick={() =>
                            runStatusUpdate(subscription.id, nextToggleStatus)
                          }
                          title={
                            subscription.estado === 'activa'
                              ? 'Pausar'
                              : 'Reactivar'
                          }
                        >
                          {subscription.estado === 'activa' ? (
                            <Pause className="size-4" />
                          ) : (
                            <Play className="size-4" />
                          )}
                          <span className="sr-only">
                            {subscription.estado === 'activa'
                              ? 'Pausar'
                              : 'Reactivar'}
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={
                            isPending || subscription.estado === 'cancelada'
                          }
                          onClick={() =>
                            runStatusUpdate(subscription.id, 'cancelada')
                          }
                          title="Cancelar"
                        >
                          <Ban className="size-4" />
                          <span className="sr-only">Cancelar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={isPending}
                              title="Eliminar"
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Eliminar suscripcion
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta accion no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                className={alertDialogCancelClassName}
                              >
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
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar suscripcion</DialogTitle>
            <DialogDescription>
              Actualiza los datos del servicio seleccionado.
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
