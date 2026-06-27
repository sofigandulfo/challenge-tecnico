# Bitácora de uso de IA (notas de trabajo)

## Etapa 0 — Setup inicial
- Pedí: scaffold de Next.js + Tailwind + shadcn/ui + Tremor + Supabase
- Generó bien: estructura de carpetas, package.json, componentes shadcn
- Tuve que corregir: globals.css tenía un import roto que no existe. Rompía la generación de CSS sin tirar error explícito, solo un 404 silencioso en /_next/static/css. Lo detecté revisando la consola del navegador y el log del dev server, y lo saqué del archivo.
- Otro ajuste manual: `shadcn` quedó en dependencies en vez de devDependencies. Lo moví.

## Etapa 1 — Supabase + Auth
- Pedí: schema SQL con RLS, clientes de Supabase, middleware de rutas protegidas, pantalla de login
- Generó bien: políticas RLS correctas, contrato ActionResult consistente
- Tuve que verificar: signOut devolvía Promise<ActionResult> pero Next.js espera void en form actions. Cambié el tipo y saqué el return. Encoding roto en strings con tildes y eñes en varios archivos.
- Faltaba: ruta /auth/callback para intercambiar el code de Supabase por sesión. Sin esto el registro redirigía a /?code=... en vez de al dashboard
- Tuve que corregir adicionalmente: los componentes de shadcn generados usaban sintaxis de Tailwind v4 (data-active:, group-data-horizontal/) incompatible con v3 instalado. Intenté migrar a v4 pero generó conflictos de versiones en node_modules. Solución final: mantener Tailwind v3 y reemplazar el componente Tabs por una implementación manual simple con clases estándar de Tailwind.

## Etapa 2 — Lógica de billing + Vitest + CI
- Pedí: funciones puras calcularProximoCobro y normalizarAMensual, tests con Vitest, workflow de CI con GitHub Actions
- Generó bien: estructura de funciones puras sin dependencias externas, CI con checkout/Node 20/lint/test, configuración de vitest.config.ts
- Tuve que corregir: los tests originales solo verificaban "es una fecha futura" con Date.now(), lo cual no detectaría bugs en el cálculo real. Los reescribí usando vi.setSystemTime() para fijar una fecha conocida y verificar el resultado exacto esperado. Por ejemplo, dado hoy 15/03/2025 y fecha inicio 01/01/2025 mensual, el resultado debe ser exactamente 01/04/2025
- 9/9 tests pasando en verde

## Etapa 3 — Dashboard con datos reales

- Pedí: queries server-side para obtener suscripciones y próximos vencimientos, funciones puras de cálculo, componentes de presentación (KPI, gráfico, próximos vencimientos y estado vacío), integración con Supabase y tests unitarios.
- Generó bien: buena separación entre queries, lógica de negocio y componentes; dashboard implementado como Server Component; funciones puras reutilizando `normalizarAMensual`; tests unitarios para los cálculos con casos borde.
- Tuve que corregir: al integrar el dashboard apareció un error `permission denied for table subscriptions`. El problema no estaba en el código generado sino en el esquema SQL: la migración habilitaba RLS y creaba las policies, pero faltaban los `GRANT` para el rol `authenticated`. Agregué los `GRANT` correspondientes a la migración para que el proyecto pueda recrearse correctamente desde cero.
- Verifiqué manualmente: cargué datos de prueba en Supabase y confirmé que el KPI, el gráfico por categorías, los próximos vencimientos y el estado vacío funcionan con datos reales.
- Mejora pendiente: `DonutChart` de Tremor utiliza nombres de la paleta de Tailwind para la prop `colors`, mientras que las categorías almacenan colores hexadecimales en la base. El gráfico funciona correctamente, pero el mapeo entre ambos formatos quedó identificado como una mejora visual para una etapa posterior.

## Etapa 4 — CRUD de suscripciones

- Pedí: queries de lectura, server actions (crear/editar/cambiar estado/eliminar),
  pantalla con tabla, búsqueda, filtros y formulario reutilizable para alta y edición.
- Generó bien: separación clara entre queries/actions/UI, reutilización de
  calcularProximoCobro() sin duplicar lógica, validaciones de formulario,
  AlertDialog de confirmación antes de eliminar, ActionResult consistente en
  las 4 acciones.
- Tuve que corregir (UI rota): el modal de "Nueva suscripción" se veía sin
  overlay oscuro de fondo y con el contenido transparente mezclado con la
  tabla detrás. Mismo origen que el problema de Tabs en la Etapa 1: sintaxis
  de Tailwind v4 en el componente Dialog generado, incompatible con v3
  instalado. Corregido migrando las clases de variantes a sintaxis v3 con
  corchetes y agregando background sólido + z-index correcto al
  DialogContent/DialogOverlay.
- Tuve que corregir (regresión de auth): el problema de la ruta /auth/callback
  que ya había aparecido en la Etapa 1 volvió a manifestarse — un usuario
  registrado de nuevo terminaba en /?code=... en lugar de /dashboard, y al
  intentar leer subscriptions sin sesión real recibía
  "permission denied for table subscriptions" (Postgres trataba la request
  como rol anon, no authenticated). Confirmé que la ruta Route Handler
  para exchangeCodeForSession() faltaba en el código actual y la agregué,
  apuntando la redirectTo de signUp() a esa ruta.
- Tuve que corregir (performance/UX): la búsqueda en la tabla de suscripciones
  estaba implementada disparando una Server Action en cada tecla escrita
  (confirmado en los logs del servidor: decenas de POST /dashboard/subscriptions
  consecutivos), lo cual generaba un salto visible de layout mientras se
  tipeaba. La instrucción original pedía filtrado client-side; lo corregí
  moviendo el filtro a un useState + .filter() sobre los datos ya cargados,
  sin ningún request adicional al servidor.
- Tuve que corregir (warnings de React): "Function components cannot be given
  refs" en Button y luego en DialogOverlay al usarse con asChild dentro de
  Dialog/AlertDialog (Radix necesita pasar refs a través de Slot). En vez de
  parchear componente por componente cada vez que aparecía el warning en una
  pantalla nueva, pedí una revisión completa de todos los componentes en
  src/components/ui/ que usan Slot/asChild, envolviéndolos en
  React.forwardRef de forma consistente.
- Verifiqué manualmente: CRUD completo de punta a punta (crear, editar,
  pausar, reactivar, cancelar, eliminar), validaciones de formulario
  (nombre vacío, costo negativo, fecha vacía), búsqueda y filtros combinados,
  y consistencia entre la tabla de suscripciones y los cálculos del dashboard
  (el gasto mensual excluye correctamente las pausadas/canceladas).
- Verifiqué seguridad: registré un segundo usuario y confirmé que no puede
  ver ni modificar las suscripciones del primero, ni crear las propias se
  mezcla con las del otro usuario. RLS aislando correctamente por
  auth.uid() en ambos sentidos.