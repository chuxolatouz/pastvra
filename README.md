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
   3. `supabase/migrations/003_inventory_monthly_users.sql`
   4. `supabase/migrations/004_policies_inventory_monthly_users.sql`
   5. `supabase/migrations/005_animals_rubro.sql`
   6. `supabase/seed.sql`
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

## URLs / Rutas actuales
Asumiendo base local `http://localhost:3000` (en prod reemplaza dominio):

- `/`
- `/login`
- `/unauthorized`
- `/app`
- `/app/pesar`
- `/app/buscar`
- `/app/help`
- `/admin`
- `/admin/finca`
- `/admin/fincas`
- `/admin/fincas/[id]`
- `/admin/fincas/nueva`
- `/admin/potreros`
- `/admin/potreros/[id]`
- `/admin/potreros/nuevo`
- `/admin/bovinos`
- `/admin/animales`
- `/admin/animales/[id]`
- `/admin/animales/[id]/genealogia`
- `/admin/animales/nuevo`
- `/admin/inventario`
- `/admin/pesaje-mensual`
- `/admin/usuarios`
- `/animal/[id]`
- `/animal/[id]/genealogia`
- `/app/animales/[id]`
- `/app/animales/[id]/genealogia`
- `/api/admin/invite` (POST)
- `/api/admin/farms` (POST)
- `/api/admin/users/invite` (POST)
- `/api/admin/users/role` (PATCH)
- `/api/admin/users/active` (PATCH)
- `/manifest.webmanifest`
- `/sw.js`

## Análisis de planillas (xlsx)
### Planilla 8
Archivo: `/Users/MacBook/Downloads/Planilla 8 - Control de Inventario de Bovinos KG ORIGINAL.xlsx`

- Sheet confirmada: `Control de Inventario`
- Fila de encabezados: `5`
- Inicio de data: `6`
- Mapeo principal detectado:
  - `B`: Fecha
  - `C`: Vendedor/Comprador
  - `D`: Saldo Inicial
  - `E`: Compras
  - `F`: Ventas
  - `G`: Traslados/muertes/Nacimientos/Defunciones
  - `H`: Saldo Final
  - `I`: Valor
  - `J`: Obs. Peso
  - `K`: Ventas USD
  - `L`: Compras USD
  - `M`: Transferencias USD
  - `N`: Flete USD
  - `O`: Comisiones USD
  - `P`: Costo Total de Adquisición USD
  - `Q`: Destino
  - `R`: Categoria
  - `S`: Precio por Kg.
  - `T`: Kg negociada

### Planilla 9
Archivo: `/Users/MacBook/Downloads/Planilla 9 -Controle-de-Pesaje ORIGINAL (1).xlsx`

- Sheet confirmada: `Controle de pesaje`
- Encabezados de meses: fila `6`
- Identificador: columna `B` (`PENDIENTE/Identificación`)
- Meses detectados: `ENE..DIC` + `TOTAL`
- Cálculo replicado:
  - `aumento_mes = peso_mes - peso_mes_anterior`
  - `GMD_mes = aumento_mes / 30`
  - `total_anual = DIC - ENE`
  - `GMD_anual = total_anual / 365`

## Control de Inventario
- Tabla nueva: `inventory_movements`
- Ruta: `/admin/inventario`
- Incluye:
  - filtros por fecha/destino/categoría
  - totales agregados
  - ledger con saldo inicial/final acumulado
  - formulario de nuevos movimientos
- Regla de saldo usada:
  - `closing_balance = opening_balance + purchases_qty - sales_qty - transfers_qty`
- Regla de traslados:
  - valor positivo = salida
  - valor negativo = entrada

## Control de Pesaje Mensual
- Ruta: `/admin/pesaje-mensual`
- Matriz por animal con columnas `ENE..DIC + TOTAL + GMD anual`
- Cada celda muestra:
  - peso mensual (último pesaje del mes)
  - aumento mensual
  - GMD mensual
- Marca `Pendiente mes actual` cuando falta pesaje del mes en curso
- Click en celda: abre modal para cargar peso y guardar en `animal_weights`

## Gestión de Usuarios y Roles
- `farm_memberships` ahora incluye `active boolean`
- Tabla nueva `profiles` sincronizada desde `auth.users` (trigger)
- Ruta: `/admin/usuarios`
  - `admin`: invitar, cambiar rol, activar/desactivar
  - `supervisor`: lectura
  - `operador`: sin acceso al módulo admin
- Endpoints server (sin exponer service role al cliente):
  - `POST /api/admin/users/invite`
  - `PATCH /api/admin/users/role`
  - `PATCH /api/admin/users/active`

## Importadores XLSX
Scripts en `apps/web/scripts`:

1. Inventario (Planilla 8)
```bash
cd /Users/MacBook/Develop/pastvra/apps/web
npm run import:inventario -- \
  --file \"/Users/MacBook/Downloads/Planilla 8 - Control de Inventario de Bovinos KG ORIGINAL.xlsx\" \
  --farm \"FARM_UUID\" \
  --user \"USER_UUID_ADMIN\"
```

2. Pesaje mensual (Planilla 9)
```bash
cd /Users/MacBook/Develop/pastvra/apps/web
npm run import:pesaje-mensual -- \
  --file \"/Users/MacBook/Downloads/Planilla 9 -Controle-de-Pesaje ORIGINAL (1).xlsx\" \
  --farm \"FARM_UUID\" \
  --user \"USER_UUID_ADMIN\" \
  --year 2025
```

Idempotencia:
- Inventario: `unique(farm_id, source_row_hash)` en `inventory_movements`
- Pesaje: `unique(farm_id, source_row_hash)` en `animal_weights`

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
- Detalle animal separado por contexto (`/admin/animales/*` y `/app/animales/*`)
- Estándar de alta separado por módulo (`.../nuevo` o `.../nueva` para fincas, animales y potreros)
- CRUD finca, potreros (+ análisis de suelo), animales, membresías
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
- `SUPABASE_SERVICE_ROLE_KEY` se usa solo en backend (route handlers/scripts). Nunca se expone al cliente.
