export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }

  if (normalized.includes("user already registered")) {
    return "Ya existe una cuenta con este email.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Revisá tu email para confirmar la cuenta.";
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("short") || normalized.includes("least"))
  ) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  if (normalized.includes("invalid email")) {
    return "Ingresá un email válido.";
  }

  if (normalized.includes("signup is disabled")) {
    return "El registro no está habilitado en este momento.";
  }

  if (normalized.includes("rate limit")) {
    return "Demasiados intentos. Probá de nuevo en unos minutos.";
  }

  return "Ocurrió un error. Intentá de nuevo.";
}
