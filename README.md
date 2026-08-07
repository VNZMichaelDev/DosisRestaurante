# DOSIS — Cachapas, Burgers & Parrilla 🍔🌽

Aplicación de pedidos en línea para el restaurante **Dosis**. Next.js (App
Router) + Supabase (Auth, PostgreSQL, Realtime). Diseño migrado fielmente del
prototipo HTML original.

## Funcionalidades

- **Autenticación**: registro e inicio de sesión con Supabase Auth (correo y
  contraseña).
- **Carrito de compras**: añadir productos, cambiar cantidades, sumar totales y
  vaciar el carrito (persistido en `localStorage`).
- **Pago Móvil**: al pagar, el cliente ingresa su **teléfono emisor** y los
  **últimos 6 dígitos** de la referencia. El pedido nace con estado
  **"Pendiente por verificar"**.
- **Panel de Administración** (`/admin`): protegido, recibe los pedidos **en
  tiempo real** (Supabase Realtime) sin recargar la página, muestra los datos
  del pago móvil y permite cambiar el estado del pedido
  (Pendiente → En preparación → En camino → Entregado / Cancelado).
- **Actualización al cliente**: el cliente ve en `pedido/[id]` cómo cambia el
  estado de su pedido en vivo.

## 1. Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor** y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).
   Esto crea las tablas `profiles` y `orders`, los triggers, las políticas RLS
   y activa **Realtime** para la tabla `orders`.
3. En **Project Settings → API** copia la URL y la clave `anon`.
4. Crea el archivo `.env.local` (usa `.env.example` como plantilla):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON
   ```

5. **Hacer administrador al dueño**: regístrate en la app con tu correo y luego
   ejecuta en el SQL Editor:

   ```sql
   update public.profiles
   set is_admin = true
   where email = 'correo-del-dueno@gmail.com';
   ```

   > Alternativa: registra al dueño con `admin@dosis.com` y el trigger lo
   > promoverá automáticamente (edita el correo en `schema.sql`).

## 2. Ejecutar localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

- Tienda: `/`
- Iniciar sesión / Registro: `/auth`
- Carrito y pago: `/carrito`
- Seguimiento del pedido: `/pedido/[id]`
- Panel de administración: `/admin`

## 3. Desplegar en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel: **Import Project** y elige el repositorio.
3. En la configuración del proyecto añade las variables de entorno
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Deploy**. Vercel detecta Next.js automáticamente.

> **Importante para Realtime en producción:** la tabla `orders` ya está en la
> publicación `supabase_realtime` (se ejecuta en `schema.sql`). Verifica en
> **Database → Replication** que la tabla `orders` esté marcada.
