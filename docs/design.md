# SubTrack Design

## Objetivo

Construir SubTrack, una aplicacion web simple y robusta para registrar, gestionar y visualizar suscripciones recurrentes en USD. El foco del challenge es mostrar arquitectura clara, buena UX, uso real de Supabase, TypeScript estricto, commits incrementales y una implementacion completa sin funcionalidades innecesarias.

## Alcance

La aplicacion tendra cuatro pantallas:

1. Login / registro con Supabase Auth usando email y password.
2. Dashboard con gasto mensual total, grafico de torta por categoria y proximos vencimientos de los siguientes 7 dias.
3. Gestion de suscripciones con tabla, busqueda, filtros y CRUD completo.
4. Detalle de suscripcion con informacion individual e historial de cobros.

Tambien incluira un boton "Cargar datos de ejemplo" visible cuando el usuario autenticado no tenga suscripciones. Este boton insertara aproximadamente 8 suscripciones realistas asociadas al usuario actual.

Queda fuera del alcance: multiples monedas, conversion de divisas, planes compartidos, notificaciones, integraciones externas, pagos reales y analiticas avanzadas. La moneda unica USD es una decision consciente de producto para priorizar robustez y claridad.

## Stack

- Next.js 14+ con App Router.
- TypeScript estricto.
- Tailwind CSS.
- shadcn/ui para componentes de interfaz.
- Tremor para graficos del dashboard.
- Supabase Auth, Postgres y Row Level Security.
- date-fns para calculos de fechas.
- Vitest para tests unitarios.
- Vercel como destino de deploy.

## Arquitectura

La estructura buscara mantener unidades pequenas y testeables:

- `src/app`: rutas, layouts y composicion de pantallas.
- `src/lib/billing`: logica pura de negocio.
- `src/lib/supabase`: clientes Supabase para server/browser y helpers de sesion.
- `src/features/subscriptions`: acciones, queries, tipos y componentes especificos de suscripciones.
- `src/features/dashboard`: componentes y calculos de presentacion del dashboard.
- `src/components/ui`: componentes shadcn/ui.
- `supabase/migrations`: esquema SQL, politicas RLS y catalogos base.
- `src/test`: configuracion y utilidades de Vitest si fueran necesarias.

La logica de negocio clave no dependera de Supabase ni de React. Las pantallas consumiran datos ya preparados desde funciones server-side y server actions.

## Modelo De Datos

Se usara el modelo provisto:

- `categories`: catalogo publico de lectura.
- `subscriptions`: suscripciones del usuario autenticado, protegidas por RLS.
- `billing_history`: historial de cobros vinculado a `subscriptions`.

Las migraciones incluiran:

- Creacion de tablas.
- Checks de `frecuencia` y `estado`.
- RLS en `subscriptions`.
- Politicas `select_own`, `insert_own`, `update_own` y `delete_own`.
- Politicas para proteger `billing_history` mediante la relacion con `subscriptions`, de modo que un usuario solo acceda a historiales de sus propias suscripciones.
- Insercion inicial del catalogo de categorias.

Categorias base:

- Streaming
- Servicios Cloud
- Productividad
- Bienestar
- Software
- Entretenimiento

El catalogo de categorias existira desde el dia uno para que el boton de datos de ejemplo pueda resolver `categoria_id` de forma confiable.

## Autenticacion Y Proteccion De Rutas

Supabase Auth manejara login, registro y sesion con email y password.

El middleware de Next.js con Supabase SSR tendra dos responsabilidades:

1. Refrescar la sesion para mantener cookies actualizadas.
2. Proteger activamente las rutas privadas.

Reglas:

- Usuario no autenticado que intenta entrar a `/dashboard`, `/suscripciones` o `/suscripciones/[id]`: redireccion a `/login`.
- Usuario autenticado que intenta entrar a `/login`: redireccion a `/dashboard`.
- Rutas publicas: `/login`.

La app no renderizara pantallas privadas sin usuario autenticado.

## Server Actions Y Manejo De Errores

Las mutaciones principales se implementaran con server actions:

- Crear suscripcion.
- Editar suscripcion.
- Pausar suscripcion.
- Cancelar suscripcion.
- Eliminar suscripcion.
- Cargar datos de ejemplo.

Las server actions no expondran errores crudos de Supabase a la UI. Usaran un contrato uniforme:

```ts
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

Los componentes cliente podran usar este resultado para mostrar toasts o alertas legibles sin romper la interfaz.

## Logica De Negocio

La logica pura vivira en `src/lib/billing` y sera cubierta con Vitest.

Funciones:

```ts
calcularProximoCobro(fechaInicio: Date, frecuencia: string): Date
```

Devuelve la proxima fecha de cobro a partir de hoy usando `date-fns`. Soporta:

- `mensual`
- `anual`
- `semanal`

Si la frecuencia no es valida, devolvera un error controlado mediante excepcion explicita o validacion previa en el llamador.

```ts
normalizarAMensual(costo: number, frecuencia: string): number
```

Convierte costos a equivalente mensual:

- mensual: `costo`
- anual: `costo / 12`
- semanal: `costo * 4.33`

## Pantalla De Login / Registro

La pantalla tendra dos modos simples: iniciar sesion y crear cuenta.

Comportamiento:

- Email y password obligatorios.
- Mensajes de error legibles.
- Redireccion a `/dashboard` al autenticar correctamente.
- Si ya hay sesion activa, el middleware redirecciona automaticamente al dashboard.

## Dashboard

El dashboard sera la primera pantalla privada y seguira un patron visual inspirado en Rocket Money sin copiar branding:

- KPI grande de gasto mensual total.
- Grafico de torta por categoria usando Tremor.
- Lista de proximos vencimientos de los siguientes 7 dias.
- Items con icono circular, nombre, categoria, fecha y monto destacado.
- Badges de estado con color consistente.
- Estado vacio con boton secundario "Cargar datos de ejemplo" cuando no haya suscripciones.

El gasto mensual total se calculara con `normalizarAMensual` sobre suscripciones activas. El grafico por categoria tambien usara valores normalizados mensuales.

## Gestion De Suscripciones

La pantalla de gestion tendra:

- Tabla de suscripciones.
- Busqueda por nombre.
- Filtro por categoria.
- Filtro por estado.
- Accion para agregar suscripcion.
- Acciones por fila: editar, pausar, cancelar y eliminar.

Los formularios usaran componentes shadcn/ui y validacion simple:

- Nombre requerido.
- Costo mayor o igual a 0.
- Frecuencia requerida.
- Fecha de inicio requerida.
- Estado valido.

`proximo_cobro` se calculara desde la fecha de inicio y frecuencia usando la funcion pura, no con logica duplicada en el formulario.

## Detalle De Suscripcion

La vista individual mostrara:

- Nombre.
- Costo.
- Frecuencia.
- Categoria.
- Estado.
- Fecha de inicio.
- Proximo cobro.
- Notas.
- Historial de cobros.

Si no hay historial, se mostrara un estado vacio claro. El historial estara protegido por las politicas de Supabase.

## Datos De Ejemplo

El boton "Cargar datos de ejemplo" aparecera solo cuando el usuario autenticado no tenga suscripciones.

Insertara ejemplos realistas en USD, asociados al `auth.uid()` actual:

- Netflix
- Spotify
- AWS
- ChatGPT Plus
- Gimnasio
- Figma
- Notion
- Disney+

Cada ejemplo mapeara su categoria por nombre desde el catalogo semilla. Si falta una categoria esperada, la accion devolvera `{ success: false, error: "..." }` en vez de fallar silenciosamente.

## UI Y Estilo Visual

Paleta:

- Fondo principal: `slate-50` (`#f8fafc`).
- Cards: blanco (`#ffffff`), borde `slate-200`, `shadow-sm`.
- Texto principal: `slate-900` (`#0f172a`).
- Acciones primarias: `blue-600` o `indigo-600`.
- Boton de datos de ejemplo: fondo `blue-50`, texto `blue-700`.

La UI sera sobria y operativa, con densidad suficiente para gestionar suscripciones sin sentirse como landing page. No habra hero marketing ni secciones decorativas innecesarias.

## Testing

Vitest cubrira como minimo:

- `normalizarAMensual` para frecuencias mensual, anual y semanal.
- `calcularProximoCobro` para frecuencias mensual, anual y semanal.
- Casos donde la fecha de inicio ya paso.
- Casos donde la fecha de inicio todavia no llego.
- Frecuencia invalida.

Los tests se escribiran antes de la implementacion de la logica pura.

## Documentacion

El README documentara:

- Que resuelve SubTrack.
- Stack usado.
- Variables de entorno necesarias.
- Como correr el proyecto localmente.
- Como correr tests.
- Como aplicar migraciones/seed de Supabase.
- Decision de scope: una sola moneda, USD.
- Credenciales o pasos sugeridos para probar la demo desplegada.

## Fases De Implementacion

Cada fase debe compilar y mantener lo anterior funcionando antes de pasar a la siguiente.

1. Setup base del proyecto Next.js, Tailwind, shadcn/ui, Tremor, Vitest y estructura inicial.
2. Supabase: migraciones, seed de categorias, clientes, middleware y auth.
3. Logica pura de billing con Vitest.
4. Layout privado y dashboard con datos reales.
5. CRUD de suscripciones.
6. Detalle de suscripcion e historial.
7. Datos de ejemplo.
8. Pulido visual, README, verificacion final y preparacion para deploy.

Los commits deben ser frecuentes y claros, con formato en espanol: `tipo: descripcion corta`.
