# 🍯 Sistema de Trazabilidad de Miel - Oaxaca Miel / AUP

🎯 FRONTEND EXPERT - Sistema Oaxaca Miel (AUP)
Stack: Angular 19 + TypeScript 5 + Tailwind CSS 3 + Standalone Components

REGLAS CRÍTICAS ABSOLUTAS
🚨 PROHIBIDO

Crear NgModules (proyecto 100% standalone)
Usar any en tipos
Lógica de negocio en componentes
Subscripciones sin unsubscribe
Manipulación directa del DOM
Generar múltiples archivos simultáneamente

✅ OBLIGATORIO

Consultar servicios/guards/modelos existentes antes de desarrollar
Usar signals para estado reactivo (Angular 19)
takeUntilDestroyed() en subscripciones
Validación con Reactive Forms
Tailwind para estilos (honey-primary, honey-dark)
Desarrollo incremental: Models → Services → Components → Routes
UN archivo a la vez con explicación breve
Nombres: kebab-case.component.ts, clases PascalCase, variables camelCase
NO USES ALERTS! o aviso del sistema, o usamos toast o modales para confirmar


ARQUITECTURA
src/app/
├── core/           # Services, Guards, Interceptors, Models (singleton)
├── shared/         # Componentes/Pipes/Directivas reutilizables
└── features/       # Módulos funcionales (Auth, Dashboard, Apicultores, etc.)
Flujo: Component → Service → HTTP → Backend → Signal/Observable → Template

SISTEMA DE ROLES
typescriptauthGuard        // Cualquier usuario autenticado
adminGuard       // Solo ADMINISTRADOR
acopiadorGuard   // ADMINISTRADOR + ACOPIADOR
apicultorGuard   // ADMINISTRADOR + ACOPIADOR + APICULTOR
mieleraGuard     // ADMINISTRADOR + MIELERA
RutaADMINACOPIADORAPICULTORMIELERA/admin/*✅❌❌❌/acopiador/*✅✅❌❌/apicultor/*✅✅✅❌/mielera/*✅❌❌✅

PATRONES ESTABLECIDOS
Component (Signals + Standalone)

Inyección con inject()
Estado con signal(), computed()
Subscripciones con takeUntilDestroyed(destroyRef)
Template control flow: @if, @for, @switch

Service

Injectable({ providedIn: 'root' })
Métodos retornan Observable<T>
Mapeo de ApiResponse<T> → T en service
Manejo de errores en interceptor

Forms

ReactiveFormsModule con FormBuilder
Validadores: Validators.required, custom patterns
CURP: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/
RFC: /^[A-Z&Ñ]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/
markAllAsTouched() antes de submit

Routing

Lazy loading con loadComponent()
Guards en canActivate: [authGuard, adminGuard]
Rutas hijas con children: []


SERVICIOS CORE EXISTENTES
HttpService: GET, POST, PUT, PATCH, DELETE genéricos
AuthService: login, logout, isAuthenticated(), hasRole(), getCurrentUser()
StorageService: setItem, getItem, removeItem (localStorage/sessionStorage)
Interceptores:

jwtInterceptor: Añade token automáticamente
errorInterceptor: Maneja errores HTTP (401→login, 403/404/409/500)


MODELOS BASE
typescripttype UserRole = 'ADMINISTRADOR' | 'ACOPIADOR' | 'APICULTOR' | 'MIELERA';

interface User {
  id: string;
  username: string;
  nombre: string;
  role: UserRole;
  proveedorId?: number | null;
  apicultorId?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: { code: string; details?: any };
  pagination?: PaginationMeta;
}

interface Apicultor {
  id: string;
  nombre: string;
  curp: string;
  rfc?: string;
  estado: string;
  municipio: string;
  certificacionSenasica: boolean;
  certificacionIpp: boolean;
  estado: 'ACTIVO' | 'INACTIVO';
}

TAILWIND
Colores: honey-primary (#F59E0B), honey-dark (#92400E)
Botones: bg-honey-primary hover:bg-honey-dark text-white px-4 py-2 rounded-lg
Cards: bg-white rounded-lg shadow-md p-6
Inputs: border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary
Badges: bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full

LEAFLET (MAPAS)

Librería: Leaflet + OpenStreetMap
Componente standalone con @Input() latitude, longitude
Inicializar en ngAfterViewInit()
Limpiar en ngOnDestroy() con map?.remove()


FLUJO DE DESARROLLO
1. ANÁLISIS

Revisar servicios/guards/componentes existentes
Verificar modelos TypeScript necesarios
Confirmar permisos y guards

2. DISEÑO

Proponer arquitectura
Listar archivos a crear/modificar
ESPERAR APROBACIÓN

3. IMPLEMENTACIÓN

Orden: Models → Services → Components → Routes
UN archivo a la vez
Esperar confirmación entre archivos

4. VALIDACIÓN

TypeScript sin errores
Signals/Observables correctos
Guards aplicados
Tailwind consistente


RESPUESTAS TÉCNICAS
Contexto activo: Frontend Angular 19 + Tailwind (Sistema trazabilidad miel)
Al empezar desarrollo:

Confirmar funcionalidad
Buscar código existente relacionado
Proponer arquitectura + archivos
Implementar tras aprobación

Estilo: Técnico, conciso, código cuando sea necesario. Sin repetir contexto completo.
Si conversación extensa: Sugerir resumen técnico.

Sistema Oaxaca Miel - Frontend Expert
Versión Optimizada 1.0 | Reducción 75% tokens | Mantiene 100% funcionalidad

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

## 🍯 Sistema de Clasificación de Miel (Diciembre 2024)

### Clasificación por Humedad
La miel se clasifica según su porcentaje de humedad:

| Clasificación | Humedad | Color Badge | Descripción |
|--------------|---------|-------------|-------------|
| **EXPORTACION_1** | 0-19% | Verde (`bg-green-100 text-green-800`) | Mejor calidad, apta para exportación premium |
| **EXPORTACION_2** | 20% | Azul (`bg-blue-100 text-blue-800`) | Calidad exportación estándar |
| **NACIONAL** | 21% | Ámbar (`bg-amber-100 text-amber-800`) | Mercado nacional |
| **INDUSTRIA** | 22%+ | Rojo (`bg-red-100 text-red-800`) | Uso industrial |

### Enum TypeScript
```typescript
enum ClasificacionMiel {
  EXPORTACION_1 = 'EXPORTACION_1',
  EXPORTACION_2 = 'EXPORTACION_2',
  NACIONAL = 'NACIONAL',
  INDUSTRIA = 'INDUSTRIA'
}
```

### Función de Cálculo
```typescript
function calcularClasificacion(humedad: number): ClasificacionMiel {
  if (humedad >= 22) return ClasificacionMiel.INDUSTRIA;
  if (humedad === 21) return ClasificacionMiel.NACIONAL;
  if (humedad === 20) return ClasificacionMiel.EXPORTACION_2;
  return ClasificacionMiel.EXPORTACION_1; // 0-19%
}
```

### Helper Methods (usar en componentes)
```typescript
getClasificacionBadgeClass(clasificacion: string): string {
  switch (clasificacion) {
    case 'EXPORTACION_1': return 'bg-green-100 text-green-800';
    case 'EXPORTACION_2': return 'bg-blue-100 text-blue-800';
    case 'NACIONAL': return 'bg-amber-100 text-amber-800';
    case 'INDUSTRIA': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

getClasificacionLabel(clasificacion: string): string {
  switch (clasificacion) {
    case 'EXPORTACION_1': return 'EXPORTACIÓN 1';
    case 'EXPORTACION_2': return 'EXPORTACIÓN 2';
    case 'NACIONAL': return 'NACIONAL';
    case 'INDUSTRIA': return 'INDUSTRIA';
    default: return clasificacion;
  }
}
```

### Archivos Relacionados
- `core/models/entrada-miel.model.ts` - Enum y funciones base
- `core/models/lista-precios.model.ts` - ClasificacionPrecio type
- `core/models/diferencias-precio.model.ts` - Tipos de clasificación
- `core/services/lista-precios.service.ts` - Servicio de precios
- Componentes con helpers: entradas-miel-list, asignacion-tambores-list, salidas-miel-create, tambores-disponibles, diferencias-precio, detalle-llegada

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
- ✅ Servicios HTTP base (API, Auth, Storage)
- ✅ Interceptores (JWT, Errores)
- ✅ Guards de autenticación por rol
- ✅ Modelos TypeScript completos
- ✅ Layout principal (Navbar, Sidebar)
- ✅ Módulo de Login
- ✅ Dashboards por rol (Admin, Acopiador, Verificador)
- ✅ CRUD Apicultores completo
- ✅ CRUD Apiarios + Mapa Leaflet
- ✅ Vinculación Proveedor-Apicultor
- ✅ Sistema de Entradas de Miel
- ✅ Sistema de Tambores (asignación, disponibles)
- ✅ Sistema de Salidas de Miel
- ✅ Módulo Verificador (llegadas, verificación)
- ✅ Lista de Precios por clasificación
- ✅ Diferencias de Precio (auditoría)
- ✅ Sistema de Clasificación de Miel (4 niveles: EXPORTACION_1/2, NACIONAL, INDUSTRIA)
- ✅ NotificationService (toast) y ModalComponent
- ✅ Migración a sistema legacy

### En Desarrollo
- 🔄 Reportes y estadísticas avanzadas
- 🔄 Optimizaciones de rendimiento

---

## 📝 Notas Importantes

- **Node.js:** v22.3.0
- **Angular:** v19
- **Package Manager:** npm
- **Ubicación:** Mérida, Yucatán, MX → Oaxaca, MX (proyecto)
- **Idioma:** Español (interfaz y mensajes)