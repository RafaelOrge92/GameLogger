<p align="center">
  <img src="public/globe.svg" alt="GameLogger Logo" width="120px" style="filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.4));" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16%2B-0f0f10?style=for-the-badge&logo=nextdotjs&logoColor=10B981" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-0f0f10?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-0f0f10?style=for-the-badge&logo=typescript&logoColor=3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-0f0f10?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Supabase-BaaS-0f0f10?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-15%2B-0f0f10?style=for-the-badge&logo=postgresql&logoColor=4169E1" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-0f0f10?style=for-the-badge&logo=google&logoColor=10B981" alt="Gemini AI" />
</p>

<h1 align="center">🎮 GameLogger</h1>

<p align="center">
  Plataforma full-stack de catalogación y gestión de colecciones de videojuegos retro con auditoría mediante IA multimodal, mercado P2P e historial analítico de valoración de copias físicas.
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#stack-tecnológico">Stack</a> ·
  <a href="#arquitectura">Arquitectura</a> ·
  <a href="#base-de-datos">Base de Datos</a> ·
  <a href="#seguridad">Seguridad</a> ·
  <a href="#guía-de-arranque">Quick Start</a>
</p>

---

## 📋 Tabla de Contenidos

- [Features](#features)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura de Datos](#arquitectura-de-datos)
- [Base de Datos](#base-de-datos)
- [Seguridad y Políticas RLS](#seguridad-y-políticas-rls)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Guía de Arranque](#guía-de-arranque)

---

## Features

✨ **Catalogación Detallada de Formato Físico**
- Registro pormenorizado del estado de conservación de los juegos (Loose, CIB, Sealed).
- Selección de regiones de distribución física (PAL-ES, NTSC-U, NTSC-J, etc.) y precios de compra.
- Distinción entre colección activa y lista de deseados (*wishlist*).

🤖 **Auditoría e Identificación con IA Multimodal**
- Subida de fotos de artículos físicos reales directamente al servidor.
- Pipeline de auditoría con **Google Gemini 2.5 Flash** para verificar autenticidad y seguridad.
- Reconocimiento automático del título del videojuego y plataforma directamente de la carátula o cartucho.
- Procesamiento y optimización asíncrona de imágenes en memoria usando **Sharp** con conversión automatizada a WebP.

📊 **Analítica e Historial de Precios de Mercado**
- Obtención concurrente de transacciones históricas en mercados internacionales (APIs de eBay ES/US).
- Tratamiento y filtrado estadístico robusto de precios mediante el algoritmo **IQR (Rango Intercuartílico)** para descartar *outliers* y subastas infladas.
- Gráficas interactivas del valor estimado de la colección a través del tiempo mediante **Recharts**.

🤝 **Mercado de Intercambio P2P**
- Panel de publicaciones para venta, intercambio o ambas modalidades.
- Sistema de ofertas directas entre coleccionistas.
- Bandeja de notificaciones en tiempo real para propuestas entrantes.

👥 **Comparador de Colecciones en Tiempo Real**
- Cruce y comparación del catálogo con otros usuarios.
- Identificación instantánea de juegos coincidentes, exclusivos del usuario A, del usuario B, y cruce de deseados.
- Algoritmo de comparación normalizada Unicode con complejidad temporal lineal **$O(N)$** mediante indexación por `Set`.

---

## Stack Tecnológico

| Capa | Tecnología | Versión / Tipo |
|------|-----------|----------------|
| **Backend & Frontend** | Next.js (App Router, Server Actions) | 16.2.4 |
| **Framework UI** | React | 19.2.4 |
| **Lenguaje** | TypeScript | 5.x |
| **Estilos** | TailwindCSS + PostCSS | 4.x |
| **Base de Datos & Auth** | Supabase (PostgreSQL, GoTrue Auth) | - |
| **Almacenamiento** | Supabase Storage (WebP optimizados) | - |
| **Motor de IA** | Google Generative AI (Gemini 2.5 Flash) | - |
| **Tratamiento de Imagen** | Sharp | 0.34.5 |
| **Visualización** | Recharts | 3.8.1 |
| **Manejo de Estado** | React Query (TanStack Query) | 5.100.9 |

---

## Arquitectura de Datos

El flujo del proyecto se divide en una capa cliente interactiva y una capa de servidor serverless que garantiza el procesamiento seguro de datos:

```
[ Navegador (Cliente) ]
       │
       ├─► (Base64 Image) ────► [ API Route /api/ai/image-audit ]
       │                                 │
       │                        (Gemini 2.5 Flash Audit & Sharp WebP)
       │                                 │
       │                                 ▼
       ├─◄── (URL de Foto WebP) ◄─ [ Supabase Storage Bucket ]
       │
       ├─► (Compare Request) ─► [ API Route /api/users/compare ] ──► (O(N) Set Crossing)
       │
       └─► (Stats Query) ─────► [ Server Actions / Promise.all ] ──► (eBay APIs ES/US + Postgres)
```

---

## Base de Datos

El esquema relacional está estructurado para soportar transiciones rápidas y escalabilidad a nivel de fila. Los archivos SQL principales se ubican en la raíz del proyecto:
- `schema.sql`: Definición de perfiles de usuario (`profiles`), colección (`collections`), mercado P2P (`marketplace_offers`) e índices de rendimiento.
- `schema_market.sql`: Extensiones relacionales para las transacciones de intercambio y wishlist.
- `schema_stats_fn.sql`: Procedimientos almacenados SQL internos y triggers relacionales.

### Tipos Personalizados (ENUMs)
```sql
CREATE TYPE collection_status AS ENUM ('playing', 'completed', 'plan_to_play', 'dropped', 'owned');
CREATE TYPE item_condition AS ENUM ('sealed', 'cib', 'box_and_game', 'loose', 'digital');
CREATE TYPE offer_type_enum AS ENUM ('sell', 'trade', 'both');
```

---

## Seguridad y Políticas RLS

Toda la base de datos de PostgreSQL cuenta con políticas de seguridad a nivel de fila (**Row Level Security - RLS**) activas, garantizando que un usuario autenticado solo pueda manipular sus propias colecciones y datos privados, mientras que el mercado y perfiles públicos permanecen accesibles para lectura en todo el dominio.

Ejemplo de política RLS para colecciones:
```sql
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections."
  ON public.collections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own collections."
  ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Estructura del Proyecto

```
gamelogger/
├── public/                 Iconos, avatares y recursos estáticos
├── schema.sql              Esquemas iniciales y tablas base
├── schema_market.sql       Tablas adicionales para mercado P2P
├── schema_stats_fn.sql     Triggers y funciones de base de datos
├── src/
│   ├── app/                Server-side routes, API endpoints y páginas
│   │   ├── api/            Endpoints (image-audit, compare, stats, etc.)
│   │   ├── marketplace/    Vistas del mercado P2P e inserción de ofertas
│   │   ├── stats/          Visualización analítica e historial
│   │   └── user/           Páginas de colecciones públicas y perfiles
│   ├── components/         Dashboard, modales, componentes y diagramas UI
│   ├── context/            Contexto de toasts globales y autenticación
│   ├── features/           Acciones del servidor y lógica de APIs externas
│   │   ├── collection/     Acciones de borrado, inserción y catálogo
│   │   └── market/         Scraping de eBay, CheapShark y cálculo IQR
│   ├── hooks/              Hooks reactivos customizados (useDebounce)
│   └── lib/                Configuraciones cliente/servidor de Supabase
├── tsconfig.json           Configuración de TypeScript
└── package.json            Dependencias del proyecto
```

---

## Guía de Arranque

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm o yarn
- Cuenta y proyecto activo en Supabase
- Google Gemini API Key

### Instalación de dependencias
```bash
npm install
```

### Configuración del entorno
Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-admin-de-supabase
GEMINI_API_KEY=tu-clave-de-api-de-gemini
EBAY_CLIENT_ID=tu-client-id-de-ebay
EBAY_CLIENT_SECRET=tu-client-secret-de-ebay
```

### Modo de desarrollo
```bash
npm run dev
```

### Compilación para producción
```bash
npm run build
npm run start
```
