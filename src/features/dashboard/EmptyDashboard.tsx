import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SampleDataButton } from './SampleDataButton';

export function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          Todavía no agregaste ninguna suscripción
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Empezá agregando Netflix, Spotify o cualquier otro servicio que
          pagues cada mes para entender tu gasto mensual.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/dashboard/subscriptions">
            <Plus className="size-4" />
            Agregar suscripción
          </Link>
        </Button>
        <SampleDataButton />
      </div>
    </div>
  );
}