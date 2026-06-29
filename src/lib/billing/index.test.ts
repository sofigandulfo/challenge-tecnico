import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  calcularProximoCobro,
  generarBillingHistoryInicial,
  normalizarAMensual,
} from './index';

describe('calcularProximoCobro', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calcula correctamente el proximo cobro mensual desde una fecha pasada conocida', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 15, 12));

    const fechaInicio = new Date(2025, 0, 1);
    const resultado = calcularProximoCobro(fechaInicio, 'mensual');

    expect(resultado).toEqual(new Date(2025, 3, 1));
  });

  it('calcula correctamente el proximo cobro anual desde una fecha pasada conocida', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 15, 12));

    const fechaInicio = new Date(2023, 0, 1);
    const resultado = calcularProximoCobro(fechaInicio, 'anual');

    expect(resultado).toEqual(new Date(2026, 0, 1));
  });

  it('calcula correctamente el proximo cobro semanal desde una fecha pasada conocida', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 15, 12));

    const fechaInicio = new Date(2025, 2, 1);
    const resultado = calcularProximoCobro(fechaInicio, 'semanal');

    expect(resultado).toEqual(new Date(2025, 2, 22));
  });

  it('lanza un Error para frecuencia invalida', () => {
    const fechaInicio = new Date(2025, 0, 1);

    expect(() =>
      calcularProximoCobro(fechaInicio, 'diaria' as 'mensual'),
    ).toThrow('Frecuencia de cobro invalida');
  });
});

describe('normalizarAMensual', () => {
  it('devuelve el mismo costo para frecuencia mensual', () => {
    expect(normalizarAMensual(25, 'mensual')).toBe(25);
  });

  it('divide por 12 correctamente para frecuencia anual', () => {
    expect(normalizarAMensual(120, 'anual')).toBe(10);
  });

  it('multiplica por 4.33 correctamente para frecuencia semanal', () => {
    expect(normalizarAMensual(10, 'semanal')).toBe(43.3);
  });

  it('devuelve cero cuando el costo es cero', () => {
    expect(normalizarAMensual(0, 'mensual')).toBe(0);
    expect(normalizarAMensual(0, 'anual')).toBe(0);
    expect(normalizarAMensual(0, 'semanal')).toBe(0);
  });

  it('lanza un Error para frecuencia invalida', () => {
    expect(() => normalizarAMensual(10, 'diaria' as 'mensual')).toThrow(
      'Frecuencia de facturacion invalida',
    );
  });
});

describe('generarBillingHistoryInicial', () => {
  it('genera una fila por cada ciclo mensual ya ocurrido desde la fecha de inicio', () => {
    const resultado = generarBillingHistoryInicial(
      new Date('2025-01-15T00:00:00.000Z'),
      'mensual',
      12.99,
      new Date('2025-05-15T12:00:00.000Z'),
    );

    expect(resultado).toEqual([
      { fecha: '2025-01-15', monto: 12.99 },
      { fecha: '2025-02-15', monto: 12.99 },
      { fecha: '2025-03-15', monto: 12.99 },
      { fecha: '2025-04-15', monto: 12.99 },
      { fecha: '2025-05-15', monto: 12.99 },
    ]);
  });

  it('no genera filas cuando la fecha de inicio todavia no ocurrio', () => {
    const resultado = generarBillingHistoryInicial(
      new Date('2025-06-01T00:00:00.000Z'),
      'mensual',
      20,
      new Date('2025-05-15T12:00:00.000Z'),
    );

    expect(resultado).toEqual([]);
  });

  it('genera filas semanales solo para ciclos ya vencidos', () => {
    const resultado = generarBillingHistoryInicial(
      new Date('2025-03-01T00:00:00.000Z'),
      'semanal',
      5,
      new Date('2025-03-15T12:00:00.000Z'),
    );

    expect(resultado).toEqual([
      { fecha: '2025-03-01', monto: 5 },
      { fecha: '2025-03-08', monto: 5 },
      { fecha: '2025-03-15', monto: 5 },
    ]);
  });
});
