import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyDashboard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Todavia no hay suscripciones</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Agrega tus servicios para ver el gasto mensual, la distribucion por
            categoria y los proximos cobros.
          </p>
        </div>
        <Button type="button" variant="secondary">
          Cargar datos de ejemplo
        </Button>
      </CardContent>
    </Card>
  );
}
