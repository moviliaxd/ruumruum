# Ruum Ruum

Aplicación de traslado vehicular con conductores certificados, construida con Next.js, TypeScript, Supabase y Tailwind CSS.

## Descripción

Ruum Ruum conecta clientes con conductores certificados para servicios de traslado vehicular. Incluye funcionalidades para gestión de viajes, documentos, gastos y soporte.

## Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Estilos**: Tailwind CSS
- **Despliegue**: Vercel

## Instalación

1. Clona el repositorio:
   ```bash
   git clone <repo-url>
   cd ruum-ruum
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Configura variables de entorno en `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Ejecuta la base de datos:
   - Aplica el esquema en `supabase/schema.sql` a tu proyecto Supabase.

5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts

- `npm run dev`: Inicia servidor de desarrollo
- `npm run build`: Construye para producción
- `npm run start`: Inicia servidor de producción
- `npm run lint`: Ejecuta ESLint

## Estructura del Proyecto

- `app/`: Páginas Next.js (App Router)
- `components/`: Componentes reutilizables
- `lib/`: Utilidades y configuración (Supabase)
- `src/hooks/`: Hooks personalizados
- `supabase/`: Esquema de base de datos

## Contribución

1. Crea una rama para tu feature
2. Realiza commits descriptivos
3. Abre un Pull Request

## Licencia

Propiedad de MoviliaX.
