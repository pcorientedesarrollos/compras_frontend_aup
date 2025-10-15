# 🛡️ Guards de Autenticación - Sistema Oaxaca Miel

## 📋 Descripción

Los guards son funciones que protegen las rutas de la aplicación, verificando permisos antes de permitir el acceso. En Angular 19 se implementan como `CanActivateFn`.

---

## 🔐 Guards Disponibles

### 1️⃣ authGuard
**Propósito:** Verificar que el usuario esté autenticado

**Uso:** Rutas que requieren login (cualquier rol)

**Comportamiento:**
- ✅ Usuario autenticado → Permite acceso
- ❌ Usuario NO autenticado → Redirige a `/auth/login`
- 💾 Guarda la URL de retorno en `returnUrl`

---

### 2️⃣ adminGuard
**Propósito:** Solo usuarios con rol `ADMINISTRADOR`

**Uso:** Rutas administrativas (CRUD completo, configuración)

**Comportamiento:**
- ✅ Usuario es ADMINISTRADOR → Permite acceso
- ❌ Usuario NO autenticado → Redirige a `/auth/login`
- ❌ Usuario con otro rol → Redirige a su dashboard correspondiente

---

### 3️⃣ acopiadorGuard
**Propósito:** Usuarios con rol `ACOPIADOR` o `ADMINISTRADOR`

**Uso:** Gestión de apicultores vinculados, compras de miel

**Permisos:**
- ✅ ADMINISTRADOR
- ✅ ACOPIADOR
- ❌ APICULTOR → Redirige a `/dashboard/apicultor`
- ❌ MIELERA → Redirige a `/dashboard/mielera`

---

### 4️⃣ apicultorGuard
**Propósito:** Usuarios con rol `APICULTOR`, `ACOPIADOR` o `ADMINISTRADOR`

**Uso:** Gestión de apiarios, datos de producción

**Permisos:**
- ✅ ADMINISTRADOR
- ✅ ACOPIADOR
- ✅ APICULTOR
- ❌ MIELERA → Redirige a `/dashboard/mielera`

---

### 5️⃣ mieleraGuard
**Propósito:** Usuarios con rol `MIELERA` o `ADMINISTRADOR`

**Uso:** Consulta de trazabilidad, reportes (solo lectura)

**Permisos:**
- ✅ ADMINISTRADOR
- ✅ MIELERA
- ❌ ACOPIADOR → Redirige a `/dashboard/acopiador`
- ❌ APICULTOR → Redirige a `/dashboard/apicultor`

---

## 📝 Ejemplo de Uso en Rutas

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard, acopiadorGuard, apicultorGuard } from './core/guards';

export const routes: Routes = [
  // Rutas públicas (sin guard)
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component')
  },

  // Rutas protegidas - Solo autenticados
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
  },

  // Rutas de administrador
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: 'usuarios',
        loadComponent: () => import('./features/admin/usuarios/usuarios.component')
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./features/admin/config/config.component')
      }
    ]
  },

  // Rutas de acopiador
  {
    path: 'acopiador',
    canActivate: [acopiadorGuard],
    children: [
      {
        path: 'mis-apicultores',
        loadComponent: () => import('./features/acopiador/apicultores/apicultores.component')
      },
      {
        path: 'vincular',
        loadComponent: () => import('./features/acopiador/vincular/vincular.component')
      }
    ]
  },

  // Rutas de apicultor
  {
    path: 'apicultor',
    canActivate: [apicultorGuard],
    children: [
      {
        path: 'mis-apiarios',
        loadComponent: () => import('./features/apicultor/apiarios/apiarios.component')
      },
      {
        path: 'apiarios/nuevo',
        loadComponent: () => import('./features/apicultor/apiario-form/apiario-form.component')
      }
    ]
  },

  // Ruta por defecto
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // 404
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
  }
];
```

---

## 🔄 Flujo de Autorización

### Escenario 1: Usuario no autenticado intenta acceder

```
Usuario → /admin/usuarios
    ↓
adminGuard → isAuthenticated()?
    ↓ NO
Redirige → /auth/login?returnUrl=/admin/usuarios
```

### Escenario 2: APICULTOR intenta acceder a ruta de ACOPIADOR

```
Usuario APICULTOR → /acopiador/mis-apicultores
    ↓
acopiadorGuard → isAuthenticated()? ✅
    ↓
acopiadorGuard → isAdmin() || isAcopiador()? ❌
    ↓
Redirige → /dashboard/apicultor
```

### Escenario 3: ADMINISTRADOR accede a cualquier ruta

```
Usuario ADMINISTRADOR → /acopiador/vincular
    ↓
acopiadorGuard → isAuthenticated()? ✅
    ↓
acopiadorGuard → isAdmin()? ✅
    ↓
Permite acceso ✅
```

---

## 🎯 Matriz de Permisos

| Ruta | ADMIN | ACOPIADOR | APICULTOR | MIELERA |
|------|-------|-----------|-----------|---------|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/admin/*` | ✅ | ❌ | ❌ | ❌ |
| `/acopiador/*` | ✅ | ✅ | ❌ | ❌ |
| `/apicultor/*` | ✅ | ✅ | ✅ | ❌ |
| `/mielera/*` | ✅ | ❌ | ❌ | ✅ |
| `/reportes/*` | ✅ | ❌ | ❌ | ✅ |

---

## 💡 Características Clave

### returnUrl (URL de retorno)
Cuando un usuario no autenticado intenta acceder a una ruta protegida:

```typescript
// Guarda la URL que intentaba acceder
router.navigate(['/auth/login'], { 
  queryParams: { returnUrl: '/admin/usuarios' } 
});

// Después del login exitoso, redirigir a esa URL
const returnUrl = route.snapshot.queryParams['returnUrl'] || '/dashboard';
router.navigate([returnUrl]);
```

### Redirección Inteligente
Cada guard redirige al dashboard correspondiente según el rol:

```typescript
switch (user?.role) {
  case 'ADMINISTRADOR':
    router.navigate(['/dashboard/admin']);
    break;
  case 'ACOPIADOR':
    router.navigate(['/dashboard/acopiador']);
    break;
  case 'APICULTOR':
    router.navigate(['/dashboard/apicultor']);
    break;
  case 'MIELERA':
    router.navigate(['/dashboard/mielera']);
    break;
}
```

---

## 🔒 Seguridad

### Verificación en Frontend + Backend
⚠️ **IMPORTANTE:** Los guards son seguridad de **UI**, NO reemplazan la validación en el backend.

```
Frontend Guards → Ocultan rutas y mejoran UX
Backend Guards → Validan permisos REALMENTE
```

El backend **SIEMPRE** debe verificar:
- Token JWT válido
- Usuario activo
- Permisos correctos

---

## 🧪 Testing

### Ejemplo de prueba de guards

```typescript
describe('adminGuard', () => {
  it('permite acceso a administradores', () => {
    const authService = { isAuthenticated: () => true, isAdmin: () => true };
    const result = adminGuard(route, state);
    expect(result).toBe(true);
  });

  it('redirige usuarios no admin', () => {
    const authService = { isAuthenticated: () => true, isAdmin: () => false };
    const result = adminGuard(route, state);
    expect(result).toBe(false);
  });
});
```

---

## 📌 Notas Importantes

1. ✅ Los guards se ejecutan **antes** de cargar el componente
2. ✅ Si retornan `false`, el componente **NO se carga**
3. ✅ Compatibles con **lazy loading** de Angular
4. ✅ Soportan **múltiples guards** en una ruta
5. ✅ Angular 19 usa **functional guards** (no clases)

---

## 🚀 Ejemplo Completo

```typescript
// Ruta con múltiples guards
{
  path: 'admin/usuarios/editar/:id',
  canActivate: [authGuard, adminGuard],  // ✅ Múltiples guards
  loadComponent: () => import('./admin/usuario-edit.component')
}
```

**Orden de ejecución:**
1. `authGuard` → Verifica autenticación
2. `adminGuard` → Verifica rol ADMINISTRADOR
3. Si ambos ✅ → Carga el componente

---

## ✅ Ventajas

- 🔒 **Seguridad:** Protección por roles
- 🎨 **UX:** Redirección automática
- 🧩 **Modular:** Guards reutilizables
- 📱 **Responsive:** Funciona en cualquier dispositivo
- 🚀 **Performance:** No carga componentes sin permisos