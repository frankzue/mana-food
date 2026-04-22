# 🍔 Maná Fast Food · App de pedidos online

App web/móvil premium para pedidos online del restaurante **Maná Fast Food**
(Ciudad Bolívar, Venezuela). Menú por categorías, carrito en vivo, checkout con
cálculo de IVA + zonas de envío + multimoneda USD/Bs, y panel administrativo en
**tiempo real** con contacto directo por WhatsApp al encargado.

**100% gratis en Vercel + Supabase.**

---

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) · TypeScript |
| Estilos | Tailwind CSS + paleta personalizada Maná |
| Componentes | shadcn-style + Framer Motion + Lucide icons |
| Estado carrito | Zustand (persistencia `localStorage`) |
| Base de datos | Supabase (Postgres) + Realtime + Auth |
| Validación | Zod (cliente + API) |
| Fuentes | Poppins (display) + Inter (body) vía `next/font` |
| Despliegue | Vercel Hobby (free) |

### Flujos clave

- **Cliente**: menú por categorías → carrito drawer → checkout con IVA 16% +
  envío por zona + total en USD/Bs → pantalla de éxito elegante.
- **Encargado**: login → tarjetas de pedido en vivo (sin refrescar) → botón
  **"Contactar cliente"** que abre WhatsApp del encargado con mensaje
  pre-escrito conteniendo el detalle completo del pedido.
- **Nunca** se abre WhatsApp desde el lado del cliente al enviar el pedido.

---

## 🚀 Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Entra a <https://supabase.com> y crea un proyecto nuevo (plan Free).
2. En **SQL Editor**, ejecuta en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
3. En **Authentication → Users**, crea el usuario admin (email + contraseña).
4. En **Project Settings → API**, copia:
   - `Project URL`
   - `anon public key`
   - `service_role key` (secreta)

### 3. Variables de entorno

Copia `.env.local.example` a `.env.local` y rellena:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

- Menú del cliente: <http://localhost:3000>
- Panel admin: <http://localhost:3000/admin> (login en `/admin/login`)

---

## 🎨 Paleta Maná

Derivada directamente del logo:

| Rol | Color | HEX |
|---|---|---|
| Rojo primario | `mana-red` | `#C8102E` |
| Amarillo acento | `mana-yellow` | `#FFC72C` |
| Negro | `mana-black` | `#0A0A0A` |
| Crema (fondo) | `mana-cream` | `#FFF8EC` |
| Éxito | `mana-success` | `#4CAF50` |

Definida en `tailwind.config.ts` como `colors.mana.*`.

---

## 🗄️ Esquema de base de datos

```
categorias  ──┐
              ├── productos ──┐
              │               │
zonas_delivery ─┐             │
              │               │
              └── pedidos ────┴── pedido_items

configuracion (key/value): tasa_bs, iva, whatsapp_encargado, horario, etc.
```

Ver detalle en `supabase/migrations/001_initial_schema.sql`.

### Datos precargados (seed)

- **34 productos** reales de Maná Food en 8 categorías.
- **10 zonas de delivery** de Ciudad Bolívar.
- **Configuración** inicial: tasa Bs, IVA 16%, horario, dirección.

---

## ☁️ Despliegue en Vercel (5 minutos)

### 1. Sube el código a GitHub

```bash
git init
git add .
git commit -m "Initial commit: Mana Food MVP"
git branch -M main
git remote add origin https://github.com/<tu-user>/mana-food.git
git push -u origin main
```

### 2. Importa en Vercel

1. Entra a <https://vercel.com> → **Add New → Project**.
2. Selecciona el repo `mana-food`.
3. Framework: **Next.js** (auto-detectado).
4. En **Environment Variables**, agrega las 3 variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Clic en **Deploy** → listo. URL tipo `mana-food.vercel.app`.

### 3. (Opcional) Dominio personalizado

En Vercel → **Settings → Domains** puedes añadir un dominio propio.

---

## 🧪 Probar el flujo completo

1. Abre la home, agrega productos al carrito.
2. Verifica que el carrito muestra totales con IVA + envío al elegir zona.
3. Completa el checkout → debe redirigir a `/success/<id>` (NUNCA abrir WhatsApp).
4. Entra al panel `/admin` en otra ventana — la nueva tarjeta aparece sola.
5. Pulsa **Contactar cliente** → se abre WhatsApp del encargado.

---

## 🛠️ Configuración en caliente desde Supabase

Mientras no hay UI de settings, puedes editar estos valores en la tabla
`public.configuracion` vía Supabase Dashboard → Table Editor:

| key | descripción |
|---|---|
| `tasa_bs` | Tasa USD→Bs aplicada a todos los totales mostrados |
| `iva` | Tasa IVA (ej: `0.16` para 16%) |
| `whatsapp_encargado` | Número WhatsApp del encargado (con `+` y código país) |
| `horario`, `direccion`, `ciudad` | Info del local |

> 📌 **Pendiente**: reemplazar `whatsapp_encargado` del seed (`+584120000000`)
> por el número real del encargado.

---

## 📂 Estructura

```
app/
├── page.tsx                  # Menú del cliente
├── checkout/                 # Formulario de checkout
├── success/[id]/             # Pantalla de éxito
├── admin/                    # Panel privado
│   ├── login/
│   └── page.tsx              # Tablero realtime
└── api/orders/route.ts       # API serverless: crear pedido

components/
├── menu/                     # Hero, Header, CategoryTabs, MenuGrid, ProductCard, Footer
├── cart/CartDrawer.tsx       # Carrito deslizable
├── checkout/CheckoutForm.tsx
└── admin/                    # OrdersBoard (realtime), OrderCard

lib/
├── supabase/                 # Clients (browser, server, admin, middleware)
├── store/cart-store.ts       # Zustand
├── utils/
│   ├── calculations.ts       # IVA + totales
│   └── whatsapp.ts           # Mensaje + link wa.me
├── validators/order.ts       # Zod
└── queries.ts                # Fetchers del servidor

types/database.ts
supabase/migrations/          # SQL: schema + seed
```

---

## 📝 Próximos pasos sugeridos

- [ ] Reemplazar placeholders de Unsplash por fotos IA reales desde panel admin.
- [ ] Agregar `/admin/settings` (UI) para editar tasa Bs, IVA, WhatsApp, zonas.
- [ ] Agregar `/admin/menu` (UI) para gestionar categorías/productos.
- [ ] Notificaciones push en el panel (Service Worker) para alertar al encargado
      incluso con la pestaña en segundo plano.
- [ ] Reporte de ventas diarias/semanales.

---

© Maná Fast Food — Ciudad Bolívar, Venezuela.
