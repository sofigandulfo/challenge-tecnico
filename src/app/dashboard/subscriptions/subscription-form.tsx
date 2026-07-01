"use client";

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Category, ActionResult } from '@/types';
import type { SubscriptionWithCategory } from '@/lib/subscriptions/queries';

type SubscriptionFormProps = {
  action: (
    prevState: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  categories: Category[];
  subscription?: SubscriptionWithCategory;
  submitLabel: string;
  onSuccess?: () => void;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : label}
    </Button>
  );
}

export function SubscriptionForm({
  action,
  categories,
  subscription,
  submitLabel,
  onSuccess,
}: SubscriptionFormProps) {
  const [state, formAction] = useFormState(action, null);

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
    }
  }, [onSuccess, state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={subscription?.nombre ?? ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="costo">Costo</Label>
            <Input
              id="costo"
              name="costo"
              type="number"
              min="0"
              step="0.01"
              defaultValue={subscription?.costo ?? ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frecuencia">Frecuencia</Label>
            <Select
              id="frecuencia"
              name="frecuencia"
              defaultValue={subscription?.frecuencia ?? 'mensual'}
              required
            >
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
              <option value="semanal">Semanal</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria_id">Categoría</Label>
            <Select
              id="categoria_id"
              name="categoria_id"
              defaultValue={subscription?.categoria_id ?? ''}
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
            <Input
              id="fecha_inicio"
              name="fecha_inicio"
              type="date"
              defaultValue={subscription?.fecha_inicio ?? ''}
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              name="notas"
              defaultValue={subscription?.notas ?? ''}
            />
          </div>
        </div>
      </div>

      {state?.success === false && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
