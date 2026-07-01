"use client";

import { DonutChart } from '@tremor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GastoPorCategoria } from './calculations';

type GastoPorCategoriaChartProps = {
  data: GastoPorCategoria[];
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const COLOR_MAP: Record<string, string> = {
  '#E50914': 'red',
  '#0078D4': 'blue',
  '#6366F1': 'indigo',
  '#10B981': 'emerald',
  '#F59E0B': 'amber',
  '#EC4899': 'pink',
  '#94A3B8': 'slate',
};

// Mapa inverso: 'red' → '#E50914'
const TREMOR_TO_HEX: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_MAP).map(([hex, name]) => [name, hex]),
);

type CustomTooltipProps = {
  payload?: Array<{
    value: number;
    name: string;
    payload: GastoPorCategoria;
  }>;
  active?: boolean;
};

function CustomTooltip({ payload, active }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  // item.payload.color viene como 'red', 'blue', etc. — lo revertimos al hex
  const hex = TREMOR_TO_HEX[item.payload.color] ?? item.payload.color;

  return (
    <div className="rounded-lg z-10 border border-border bg-popover px-3 py-2 shadow-md">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: hex }}
        />
        <span className="font-medium text-popover-foreground">{item.name}</span>
        <span className="ml-2 tabular-nums text-popover-foreground">
          {currencyFormatter.format(item.value)}
        </span>
      </div>
    </div>
  );
}

export function GastoPorCategoriaChart({ data }: GastoPorCategoriaChartProps) {
  const total = data.reduce((acc, item) => acc + item.total, 0);

  return (
    <Card className="h-full border border-border bg-transparent p-6 shadow-none">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-semibold text-foreground">
          Gasto por categoría
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        {data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
            No hay gasto activo para mostrar por categoría.
          </p>
        ) : (
          <div className="space-y-5">
  <DonutChart
    className="h-64"
    data={data}
    category="total"
    index="nombre"
    colors={data.map((item) => COLOR_MAP[item.color] ?? 'slate')}
    valueFormatter={(value) => currencyFormatter.format(value)}
    customTooltip={CustomTooltip}
    label={currencyFormatter.format(total)}
    showLabel={true}
    showAnimation
  />

            <ul className="space-y-2.5">
              {data.map((item) => (
                <li
                  key={`${item.nombre}-${item.color}`}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-muted-foreground">{item.nombre}</span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {currencyFormatter.format(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
