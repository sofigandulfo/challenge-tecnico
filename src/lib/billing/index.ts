import { addMonths, addWeeks, addYears } from 'date-fns';

export type FrecuenciaBilling = 'mensual' | 'anual' | 'semanal';

export type BillingHistoryInicial = {
  fecha: string;
  monto: number;
};

function validarFrecuencia(
  frecuencia: FrecuenciaBilling,
  contexto: 'cobro' | 'facturacion',
): void {
  if (
    frecuencia !== 'mensual' &&
    frecuencia !== 'anual' &&
    frecuencia !== 'semanal'
  ) {
    const tipoMensaje = contexto === 'cobro' ? 'cobro' : 'facturacion';
    throw new Error(`Frecuencia de ${tipoMensaje} invalida: ${frecuencia}`);
  }
}

function avanzarFecha(fecha: Date, frecuencia: FrecuenciaBilling): Date {
  switch (frecuencia) {
    case 'mensual':
      return addMonths(fecha, 1);
    case 'anual':
      return addYears(fecha, 1);
    case 'semanal':
      return addWeeks(fecha, 1);
    default:
      throw new Error(`Frecuencia de cobro invalida: ${frecuencia}`);
  }
}

function redondearADosDecimales(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function calcularProximoCobro(
  fechaInicio: Date,
  frecuencia: FrecuenciaBilling,
): Date {
  validarFrecuencia(frecuencia, 'cobro');

  let proximoCobro = new Date(fechaInicio);
  const hoy = new Date();

  while (proximoCobro.getTime() <= hoy.getTime()) {
    proximoCobro = avanzarFecha(proximoCobro, frecuencia);
  }

  return proximoCobro;
}

export function generarBillingHistoryInicial(
  fechaInicio: Date,
  frecuencia: FrecuenciaBilling,
  monto: number,
  hoy = new Date(),
): BillingHistoryInicial[] {
  validarFrecuencia(frecuencia, 'facturacion');

  const filas: BillingHistoryInicial[] = [];
  let fechaCiclo = new Date(fechaInicio);

  while (fechaCiclo.getTime() <= hoy.getTime()) {
    filas.push({
      fecha: toDateOnly(fechaCiclo),
      monto,
    });
    fechaCiclo = avanzarFecha(fechaCiclo, frecuencia);
  }

  return filas;
}

export function normalizarAMensual(
  costo: number,
  frecuencia: FrecuenciaBilling,
): number {
  validarFrecuencia(frecuencia, 'facturacion');

  switch (frecuencia) {
    case 'mensual':
      return redondearADosDecimales(costo);
    case 'anual':
      return redondearADosDecimales(costo / 12);
    case 'semanal':
      return redondearADosDecimales(costo * 4.33);
    default:
      throw new Error(`Frecuencia de facturacion invalida: ${frecuencia}`);
  }
}
