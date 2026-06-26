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