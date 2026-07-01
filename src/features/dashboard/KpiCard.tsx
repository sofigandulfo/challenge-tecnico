import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type KpiCardProps = {
  label: string;
  value: string;
};

export function KpiCard({ label, value }: KpiCardProps) {
  return (
    <Card className="border-primary/15 bg-[hsl(var(--primary)/0.045)] shadow-[0_8px_24px_rgba(52,92,114,0.08)]">
      <CardHeader className="pb-3">
        <CardTitle className='tracking-widest text-xs'>{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-6xl font-semibold tracking-normal text-foreground tabular-nums">
          {value}
        </p>
        <p className="text-sm text-muted-foreground">
          Estimado según suscripciones activas.
        </p>
      </CardContent>
    </Card>
  );
}
