"use client";

import { DonutChart } from '@tremor/react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { GastoPorCategoria } from './calculations';

type GastoPorCategoriaChartProps = {
  data: GastoPorCategoria[];
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

// TODO:
// categories.color almacena colores hexadecimales (#RRGGBB),
// mientras que DonutChart de Tremor espera nombres de la paleta
// de Tailwind (red, blue, emerald, etc.).
// Mapear ambos formatos en una mejora futura.

export function GastoPorCategoriaChart({
  data,
}: GastoPorCategoriaChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Gasto por categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            No hay gasto activo para mostrar por categoria.
          </p>
        ) : (
          <div className="space-y-5">
            <DonutChart
              className="h-64"
              data={data}
              category="total"
              index="nombre"
              colors={data.map((item) => item.color)}
              valueFormatter={(value) => currencyFormatter.format(value)}
              showAnimation
            />
            <ul className="space-y-2">
              {data.map((item) => (
                <li
                  key={`${item.nombre}-${item.color}`}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.nombre}</span>
                  </span>
                  <span className="font-medium">
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
