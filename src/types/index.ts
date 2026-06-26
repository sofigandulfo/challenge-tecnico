export type Category = {
  id: string;
  nombre: string;
  color: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  nombre: string;
  costo: number;
  frecuencia: "mensual" | "anual" | "semanal";
  categoria_id: string | null;
  fecha_inicio: string;
  proximo_cobro: string;
  estado: "activa" | "pausada" | "cancelada";
  notas: string | null;
  created_at: string;
};

export type BillingHistory = {
  id: string;
  subscription_id: string;
  fecha: string;
  monto: number;
};

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
