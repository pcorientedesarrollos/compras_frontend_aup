# 🍯 Sistema de Trazabilidad de Miel - Oaxaca Miel / AUP

## 📋 Información del Proyecto

**Frontend:** Angular 19 + Tailwind CSS v3 (Standalone Components)
**Backend:** Node.js 22.3.0 + Express (Puerto 3000)
**Base de Datos:** MySQL + Prisma ORM
**Autenticación:** JWT (tokens de 7 días)

---

## 🎯 Objetivo del Sistema

Sistema para rastrear el origen y producción de miel en Oaxaca, México. Permite vincular apicultores con acopiadores/mieleras para garantizar la trazabilidad completa del producto desde la colmena hasta el consumidor final.

---

## 👥 Actores del Sistema

### 🏢 Proveedores (Ya existen en BD)
- **Acopiadores:** Empresas que compran miel a múltiples apicultores
- **Mieleras:** Plantas procesadoras de miel
- Tienen ubicación, tipo de miel que manejan, estado/municipio

### 👨‍🌾 Apicultores (Productores)
- Personas físicas que producen miel
- Tienen: código único, CURP, RFC, certificaciones (Senasica, IPP Siniga)
- Pueden trabajar con **varios proveedores simultáneamente** (N:N)
- Ubicados en estados/municipios de Oaxaca

### 🏞️ Apiarios (Ubicaciones de producción)
- Lugares físicos donde están las colmenas
- Un apicultor puede tener **múltiples apiarios** (1:N)
- Cada apiario tiene: nombre, cantidad de colmenas, geolocalización GPS

### 👤 Roles de Usuarios
- **Administrador:** Control total del sistema
- **Acopiador:** Gestiona sus apicultores vinculados
- **Apicultor:** Ve/edita solo sus propios apiarios
- **Mielera:** Solo consulta información

---

## 🔄 Flujo de Trazabilidad
```
1. Apicultor produce miel en sus Apiarios
                ↓
2. Proveedor (Acopiador) compra la miel
                ↓
3. Mielera procesa y envasa
                ↓
4. Consumidor final con código QR de trazabilidad
```

---

## 🗂️ Estructura del Frontend
```
src/app/
├── core/                    # Servicios fundamentales
│   ├── services/           # API, Auth, Storage
│   ├── guards/             # Autenticación y roles
│   ├── interceptors/       # HTTP, JWT, Errores
│   └── models/             # Interfaces TypeScript
│
├── shared/                  # Componentes reutilizables
│   ├── components/         # Navbar, Sidebar, Modals, etc.
│   ├── directives/         # Directivas personalizadas
│   └── pipes/              # Pipes de transformación
│
└── features/               # Módulos funcionales
    ├── auth/               # Login, recuperar password
    ├── dashboard/          # Dashboards por rol
    ├── apicultores/        # CRUD Apicultores
    ├── apiarios/           # CRUD Apiarios + Mapa GPS
    ├── proveedores/        # Gestión de proveedores
    ├── vinculacion/        # Vincular Proveedor-Apicultor
    └── reportes/           # Auditoría e informes
```

---

## 🎨 Diseño Visual

- **Estilo:** Formal, profesional, minimalista
- **Colores corporativos:** Tonos miel (amber/orange)
- **Tailwind config:**
  - `honey-primary: #F59E0B`
  - `honey-dark: #92400E`
- **Assets:** Logos y loaders propios (en `src/assets/`)

---

## 🗺️ Funcionalidad de Mapas

- **Librería:** Leaflet (OpenStreetMap)
- **Uso:** Mostrar ubicación GPS de apiarios
- **Funciones:**
  - Visualizar apiarios en mapa interactivo
  - Mostrar coordenadas GPS como texto
  - Ambas opciones disponibles

---

## 🔐 Autenticación y Seguridad

### JWT Token
- Duración: 7 días
- Almacenamiento: localStorage
- Interceptor HTTP para agregar token automáticamente

### Guards por Rol
- `AuthGuard`: Usuario autenticado
- `AdminGuard`: Solo administradores
- `AcopiadorGuard`: Solo acopiadores
- `ApicultorGuard`: Solo apicultores

---

## 📊 Reglas de Negocio Críticas

1. ❌ No se puede eliminar un apicultor si tiene apiarios activos
2. ✅ Un apicultor puede estar vinculado a varios proveedores simultáneamente (N:N)
3. 🔒 Los proveedores son datos históricos (no se crean desde el sistema nuevo)
4. 📝 Toda operación importante queda en historial de auditoría
5. 🗑️ Solo Admin puede eliminar registros definitivamente

---

## 🌐 Endpoints del Backend (Puerto 3000)
```
Base URL: http://localhost:3000/api/v1

📌 Los endpoints serán proporcionados conforme se vayan necesitando en el desarrollo.
```
---

## 📦 Certificaciones en Oaxaca

### Senasica
- Sanidad animal/vegetal
- Gobierno federal

### IPP Siniga
- Identificación de Predios Pecuarios
- Obligatorio para apicultores

---

## ✅ Estado Actual del Proyecto

### Completado
- ✅ Proyecto Angular 19 creado (standalone)
- ✅ Tailwind CSS v3 instalado y funcionando
- ✅ Estructura de carpetas creada
- ✅ Variables de entorno configuradas

### Pendiente
- ⏳ Servicios HTTP base (API, Auth)
- ⏳ Interceptores (JWT, Errores)
- ⏳ Guards de autenticación
- ⏳ Modelos TypeScript (interfaces)
- ⏳ Layout principal (Navbar, Sidebar)
- ⏳ Módulo de Login
- ⏳ Dashboards por rol
- ⏳ CRUD Apicultores
- ⏳ CRUD Apiarios + Mapa
- ⏳ Vinculación Proveedor-Apicultor
- ⏳ Sistema de reportes/auditoría

---

## 🚀 Próximos Pasos

1. Crear servicios core (HTTP, Auth, Storage)
2. Implementar interceptores HTTP
3. Crear guards de autenticación
4. Definir modelos TypeScript
5. Construir layout principal
6. Desarrollar módulo de login
7. Crear dashboards diferenciados por rol

---

## 📝 Notas Importantes

- **Node.js:** v22.3.0
- **Angular:** v19
- **Package Manager:** npm
- **Ubicación:** Mérida, Yucatán, MX → Oaxaca, MX (proyecto)
- **Idioma:** Español (interfaz y mensajes)