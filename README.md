# Pastvra PWA PoC (Ganado Bovino)

PoC completo de PWA para administración ganadera con foco en wizard de pesaje offline-first.

## Stack
- Next.js App Router + TypeScript
- TailwindCSS + componentes estilo shadcn/ui
- Supabase (Postgres/Auth/Storage) con RLS
- PWA (manifest + service worker)
- Scanner QR con `html5-qrcode` + fallback manual
- Offline mínimo para pesajes con IndexedDB (Dexie)

## Estructura
- `/apps/web`: frontend Next.js
- `/supabase/migrations`: SQL de esquema y políticas
- `/supabase/seed.sql`: datos de ejemplo
- `/supabase/policies.sql`: políticas RLS (también duplicadas en migración)

## Variables de entorno
Crear `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # opcional para invitar usuarios desde /admin/usuarios
NEXT_PUBLIC_APP_NAME=Pastvra
```

## Setup Supabase
1. Crear proyecto en Supabase.
2. Ejecutar SQL en orden:
   1. `supabase/migrations/001_init.sql`
   2. `supabase/migrations/002_policies.sql`
   3. `supabase/seed.sql`
3. En `seed.sql`, reemplazar `user_id` demo por UUIDs reales de `auth.users`.
4. Crear bucket de Storage (ej. `animal-photos`) si usarás fotos de bovinos.

## Correr local
```bash
cd /Users/MacBook/Develop/pastvra/apps/web
npm install
npm run dev
```

Abrir: [http://localhost:3000](http://localhost:3000)

## Build
```bash
cd /Users/MacBook/Develop/pastvra/apps/web
npm run lint
npm run build
```

## Deploy
### Vercel (frontend)
1. Importar repo en Vercel.
2. Configurar Root Directory: `apps/web`.
3. Cargar env vars de producción.
4. Deploy.

### Supabase (backend)
- Mantener migraciones SQL del directorio `/supabase`.
- Aplicarlas en cada entorno (dev/staging/prod).

## Funcionalidad MVP incluida
- Login con email/password (Supabase Auth SSR con `@supabase/ssr`)
- Roles `admin`, `supervisor`, `operador` por finca
- Admin separado (`/admin/*`) y operación (`/app/*`)
- CRUD finca, potreros (+ soil tests), bovinos, memberships
- Wizard de pesaje 5 pasos con:
  - QR scan y entrada manual chip/arete
  - último peso/fecha
  - guardado online/offline
  - ADG, tendencia mensual, proyección simple, tags
- Offline mínimo real para pesajes:
  - `pending_weights` en IndexedDB
  - botón sincronizar + auto-sync al reconectar
  - idempotencia por `client_generated_id` (unique en DB)
- Animal detail con gráfica (Recharts), tabla de pesajes, eventos
- Genealogía interactiva con React Flow (padres, externos, hijos, profundidad configurable)
- Scaffolding de fase 2 en DB (`products`, `paddock_treatments`)

## Notas
- El proxy de auth/session está en `apps/web/proxy.ts`.
- La PWA base usa `apps/web/app/manifest.ts` y `apps/web/public/sw.js`.
