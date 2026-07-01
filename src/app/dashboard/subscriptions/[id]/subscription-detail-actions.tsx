"use client";

import { useState } from 'react';
import { Pencil } from 'lucide-react';

import { updateSubscription } from '@/app/dashboard/subscriptions/actions';
import { SubscriptionForm } from '@/app/dashboard/subscriptions/subscription-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { SubscriptionWithCategory } from '@/lib/subscriptions/queries';
import type { Category } from '@/types';

type SubscriptionDetailActionsProps = {
  categories: Category[];
  subscription: SubscriptionWithCategory;
};

export function SubscriptionDetailActions({
  categories,
  subscription,
}: SubscriptionDetailActionsProps) {
  const [editingOpen, setEditingOpen] = useState(false);

  return (
    <Dialog open={editingOpen} onOpenChange={setEditingOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Pencil className="size-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar suscripción</DialogTitle>
          <DialogDescription>
            Actualizá los datos del servicio seleccionado.
          </DialogDescription>
        </DialogHeader>
        <SubscriptionForm
          action={updateSubscription.bind(null, subscription.id)}
          categories={categories}
          subscription={subscription}
          submitLabel="Guardar cambios"
          onSuccess={() => setEditingOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
