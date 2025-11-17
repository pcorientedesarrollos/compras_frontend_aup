# 📋 API Lista de Precios - Documentación Frontend
**Sistema:** Oaxaca Miel - Trazabilidad
**Módulo:** Lista de Precios
**Versión:** 1.0.0
**Fecha:** 2025-01-17

---

## 📌 Resumen

API para gestionar precios por kilogramo de cada tipo de miel, diferenciando entre clasificación **NACIONAL** y **EXPORTACIÓN**. Incluye historial completo de cambios con auditoría de usuarios.

### Funcionalidad Principal
- Consultar precios vigentes de todos los tipos de miel
- Actualizar precios (solo ADMINISTRADOR)
- Ver historial de cambios por tipo de miel
- Ver historial completo de todos los cambios

### Caso de Uso
El administrador visualiza una tabla con todos los tipos de miel, cada uno con dos columnas de precio (NACIONAL y EXPORTACIÓN). Al lado de cada precio hay un botón para ver el historial de cambios. Todos los administradores pueden ver los cambios realizados por otros administradores.

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT.

**Header requerido:**
```
Authorization: Bearer <token>
```

**Roles permitidos por endpoint:**
| Endpoint | ADMINISTRADOR | ACOPIADOR | APICULTOR | MIELERA | VERIFICADOR |
|----------|---------------|-----------|-----------|---------|-------------|
| Ver precios | ✅ | ✅ | ✅ | ✅ | ✅ |
| Actualizar precios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver historial específico | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver historial completo | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📡 Endpoints

### 1. Obtener Precios Agrupados por Tipo de Miel

**Endpoint más recomendado para la vista principal del frontend.**

#### **GET** `/api/lista-precios/agrupados`

Retorna todos los tipos de miel con sus precios NACIONAL y EXPORTACIÓN agrupados.

#### **Autenticación**
- Header: `Authorization: Bearer <token>`
- Roles: Todos los autenticados

#### **Response (200 OK)**

```json
{
  "success": true,
  "message": "Precios obtenidos exitosamente",
  "data": [
    {
      "tipoMielId": 1,
      "tipoMielNombre": "Miel 100% pura de abeja",
      "precios": {
        "nacional": {
          "id": "clx1a2b3c4d5e6f7g8h9",
          "precio": 85.50,
          "fechaUltimaActualizacion": "2025-01-17T10:30:00.000Z"
        },
        "exportacion": {
          "id": "clx9z8y7x6w5v4u3t2s1",
          "precio": 95.00,
          "fechaUltimaActualizacion": "2025-01-17T10:30:00.000Z"
        }
      }
    },
    {
      "tipoMielId": 2,
      "tipoMielNombre": "Miel 100% orgánica",
      "precios": {
        "nacional": {
          "id": "clxaabbccddee123456",
          "precio": 90.00,
          "fechaUltimaActualizacion": "2025-01-16T15:20:00.000Z"
        },
        "exportacion": {
          "id": "clxffgghhiijj789012",
          "precio": 100.00,
          "fechaUltimaActualizacion": "2025-01-16T15:20:00.000Z"
        }
      }
    }
  ]
}
```

#### **Estructura del Response**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `success` | `boolean` | Indica si la operación fue exitosa |
| `message` | `string` | Mensaje descriptivo |
| `data` | `array` | Array de tipos de miel con sus precios |
| `data[].tipoMielId` | `number` | ID del tipo de miel |
| `data[].tipoMielNombre` | `string` | Nombre del tipo de miel |
| `data[].precios.nacional.id` | `string` | ID del registro de precio NACIONAL |
| `data[].precios.nacional.precio` | `number` | Precio por kg clasificación NACIONAL |
| `data[].precios.nacional.fechaUltimaActualizacion` | `string` (ISO 8601) | Última actualización del precio |
| `data[].precios.exportacion.id` | `string` | ID del registro de precio EXPORTACIÓN |
| `data[].precios.exportacion.precio` | `number` | Precio por kg clasificación EXPORTACIÓN |
| `data[].precios.exportacion.fechaUltimaActualizacion` | `string` (ISO 8601) | Última actualización del precio |

#### **Errores Posibles**

| Código | Descripción |
|--------|-------------|
| `401` | No autenticado (token inválido o expirado) |
| `500` | Error interno del servidor |

---

### 2. Obtener Todos los Precios (Formato Lista)

**Alternativa al endpoint agrupado, retorna una lista plana de todos los registros.**

#### **GET** `/api/lista-precios`

#### **Autenticación**
- Header: `Authorization: Bearer <token>`
- Roles: Todos los autenticados

#### **Response (200 OK)**

```json
{
  "success": true,
  "message": "Precios obtenidos exitosamente",
  "data": [
    {
      "id": "clx1a2b3c4d5e6f7g8h9",
      "tipoMielId": 1,
      "tipoMielNombre": "Miel 100% pura de abeja",
      "clasificacion": "NACIONAL",
      "precio": 85.50,
      "fechaUltimaActualizacion": "2025-01-17T10:30:00.000Z",
      "usuarioActualizador": {
        "id": "clxuser123456789",
        "nombre": "Admin Principal"
      }
    },
    {
      "id": "clx9z8y7x6w5v4u3t2s1",
      "tipoMielId": 1,
      "tipoMielNombre": "Miel 100% pura de abeja",
      "clasificacion": "EXPORTACION",
      "precio": 95.00,
      "fechaUltimaActualizacion": "2025-01-17T10:30:00.000Z",
      "usuarioActualizador": {
        "id": "clxuser123456789",
        "nombre": "Admin Principal"
      }
    }
  ]
}
```

#### **Estructura del Response**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `data[].id` | `string` | ID único del registro de precio |
| `data[].tipoMielId` | `number` | ID del tipo de miel |
| `data[].tipoMielNombre` | `string` | Nombre del tipo de miel |
| `data[].clasificacion` | `string` | `"NACIONAL"` o `"EXPORTACION"` |
| `data[].precio` | `number` | Precio por kg (dos decimales) |
| `data[].fechaUltimaActualizacion` | `string` (ISO 8601) | Fecha y hora de última actualización |
| `data[].usuarioActualizador` | `object` o `null` | Usuario que realizó la última actualización |
| `data[].usuarioActualizador.id` | `string` | ID del usuario |
| `data[].usuarioActualizador.nombre` | `string` | Nombre completo del usuario |

---

### 3. Obtener Precio Específico por ID

#### **GET** `/api/lista-precios/:id`

#### **Path Parameters**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `id` | `string` | Sí | ID del registro de precio | `clx1a2b3c4d5e6f7g8h9` |

#### **Autenticación**
- Header: `Authorization: Bearer <token>`
- Roles: Todos los autenticados

#### **Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "clx1a2b3c4d5e6f7g8h9",
    "tipoMielId": 1,
    "tipoMielNombre": "Miel 100% pura de abeja",
    "clasificacion": "NACIONAL",
    "precio": 85.50,
    "fechaUltimaActualizacion": "2025-01-17T10:30:00.000Z",
    "usuarioActualizador": {
      "id": "clxuser123456789",
      "nombre": "Admin Principal"
    }
  }
}
```

#### **Errores Posibles**

| Código | Descripción | Response |
|--------|-------------|----------|
| `401` | No autenticado | `{"success": false, "message": "No autenticado"}` |
| `404` | Precio no encontrado | `{"success": false, "message": "Precio con ID {id} no encontrado"}` |
| `500` | Error interno | `{"success": false, "message": "Error interno del servidor"}` |

---

### 4. Actualizar Precio

**Solo ADMINISTRADOR puede actualizar precios.**

#### **PUT** `/api/lista-precios/:id`

#### **Path Parameters**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `id` | `string` | Sí | ID del registro de precio a actualizar | `clx1a2b3c4d5e6f7g8h9` |

#### **Autenticación**
- Header: `Authorization: Bearer <token>`
- Roles: **Solo ADMINISTRADOR**

#### **Body Parameters**

| Parámetro | Tipo | Requerido | Validación | Descripción | Ejemplo |
|-----------|------|-----------|------------|-------------|---------|
| `precio` | `number` | Sí | ≥ 0, máximo 2 decimales | Nuevo precio por kg | `88.75` |
| `motivoCambio` | `string` | No | Texto libre | Razón del cambio de precio | `"Ajuste por inflación"` |

#### **Request Body**

```json
{
  "precio": 88.75,
  "motivoCambio": "Ajuste por inflación trimestral"
}
```

#### **Response (200 OK)**

```json
{
  "success": true,
  "message": "Precio actualizado exitosamente",
  "data": {
    "id": "clx1a2b3c4d5e6f7g8h9",
    "tipoMielId": 1,
    "tipoMielNombre": "Miel 100% pura de abeja",
    "clasificacion": "NACIONAL",
    "precio": 88.75,
    "fechaUltimaActualizacion": "2025-01-17T14:45:00.000Z",
    "usuarioActualizador": {
      "id": "clxuser987654321",
      "nombre": "Admin Secundario"
    }
  }
}
```

#### **Efectos Secundarios**

Al actualizar un precio, automáticamente:
1. Se actualiza el registro en `compras_lista_precios_vigentes`
2. Se crea un nuevo registro en `compras_historial_precios` con el cambio
3. Se registra la acción en `compras_historial_acciones` para auditoría

#### **Errores Posibles**

| Código | Descripción | Response |
|--------|-------------|----------|
| `400` | Precio negativo | `{"success": false, "message": "El precio no puede ser negativo"}` |
| `400` | Precio igual al actual | `{"success": false, "message": "El nuevo precio es igual al precio actual. No hay cambios para registrar."}` |
| `401` | No autenticado | `{"success": false, "message": "No autenticado"}` |
| `403` | Usuario no es ADMINISTRADOR | `{"success": false, "message": "No autorizado"}` |
| `404` | Precio no encontrado | `{"success": false, "message": "Precio con ID {id} no encontrado"}` |
| `500` | Error interno | `{"success": false, "message": "Error interno del servidor"}` |

---

### 5. Obtener Historial de Cambios de un Precio Específico

**Endpoint para el botón "Ver Historial" al lado de cada precio.**

#### **GET** `/api/lista-precios/:id/historial`

Retorna todos los cambios históricos de un precio específico (por tipo de miel + clasificación).

#### **Path Parameters**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `id` | `string` | Sí | ID del registro de precio vigente | `clx1a2b3c4d5e6f7g8h9` |

#### **Autenticación**
- Header: `Authorization: Bearer <token>`
- Roles: Todos los autenticados

#### **Response (200 OK)**

```json
{
  "success": true,
  "message": "Historial obtenido exitosamente",
  "data": [
    {
      "id": "clxhist123abc",
      "tipoMielId": 1,
      "tipoMielNombre": "Miel 100% pura de abeja",
      "clasificacion": "NACIONAL",
      "precioAnterior": 85.50,
      "precioNuevo": 88.75,
      "fechaCambio": "2025-01-17T14:45:00.000Z",
      "usuarioId": "clxuser987654321",
      "usuarioNombre": "Admin Secundario",
      "motivoCambio": "Ajuste por inflación trimestral"
    },
    {
      "id": "clxhist456def",
      "tipoMielId": 1,
      "tipoMielNombre": "Miel 100% pura de abeja",
      "clasificacion": "NACIONAL",
      "precioAnterior": 82.00,
      "precioNuevo": 85.50,
      "fechaCambio": "2025-01-10T09:15:00.000Z",
      "usuarioId": "clxuser123456789",
      "usuarioNombre": "Admin Principal",
      "motivoCambio": "Ajuste de mercado"
    },
    {
      "id": "clxhist789ghi",
      "tipoMielId": 1,
      "tipoMielNombre": "Miel 100% pura de abeja",
      "clasificacion": "NACIONAL",
      "precioAnterior": 80.00,
      "precioNuevo": 82.00,
      "fechaCambio": "2025-01-03T11:30:00.000Z",
      "usuarioId": "clxuser555555555",
      "usuarioNombre": "Admin Regional",
      "motivoCambio": null
    }
  ]
}
```

#### **Estructura del Response**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `data` | `array` | Array de cambios históricos (ordenado por fecha DESC) |
| `data[].id` | `string` | ID único del registro de historial |
| `data[].tipoMielId` | `number` | ID del tipo de miel |
| `data[].tipoMielNombre` | `string` | Nombre del tipo de miel |
| `data[].clasificacion` | `string` | `"NACIONAL"` o `"EXPORTACION"` |
| `data[].precioAnterior` | `number` | Precio antes del cambio |
| `data[].precioNuevo` | `number` | Precio después del cambio |
| `data[].fechaCambio` | `string` (ISO 8601) | Fecha y hora del cambio |
| `data[].usuarioId` | `string` | ID del usuario que realizó el cambio |
| `data[].usuarioNombre` | `string` | Nombre completo del usuario |
| `data[].motivoCambio` | `string` o `null` | Razón del cambio (opcional) |

#### **Orden de Resultados**
Los registros se devuelven ordenados de **más reciente a más antiguo** (`fechaCambio DESC`).

#### **Errores Posibles**

| Código | Descripción | Response |
|--------|-------------|----------|
| `401` | No autenticado | `{"success": false, "message": "No autenticado"}` |
| `404` | Precio no encontrado | `{"success": false, "message": "Precio con ID {id} no encontrado"}` |
| `500` | Error interno | `{"success": false, "message": "Error interno del servidor"}` |

---

### 6. Obtener Historial Completo de Todos los Cambios

**Solo ADMINISTRADOR. Útil para reportes de auditoría global.**

#### **GET** `/api/lista-precios/historial/completo`

Retorna los últimos 100 cambios de precios de TODOS los tipos de miel.

#### **Autenticación**
- Header: `Authorization: Bearer <token>`
- Roles: **Solo ADMINISTRADOR**

#### **Response (200 OK)**

```json
{
  "success": true,
  "message": "Historial completo obtenido exitosamente",
  "data": [
    {
      "id": "clxhist123abc",
      "tipoMielId": 1,
      "tipoMielNombre": "Miel 100% pura de abeja",
      "clasificacion": "NACIONAL",
      "precioAnterior": 85.50,
      "precioNuevo": 88.75,
      "fechaCambio": "2025-01-17T14:45:00.000Z",
      "usuarioId": "clxuser987654321",
      "usuarioNombre": "Admin Secundario",
      "motivoCambio": "Ajuste por inflación trimestral"
    },
    {
      "id": "clxhist999xyz",
      "tipoMielId": 5,
      "tipoMielNombre": "Miel Mantequilla",
      "clasificacion": "EXPORTACION",
      "precioAnterior": 110.00,
      "precioNuevo": 115.00,
      "fechaCambio": "2025-01-17T13:20:00.000Z",
      "usuarioId": "clxuser123456789",
      "usuarioNombre": "Admin Principal",
      "motivoCambio": "Aumento demanda internacional"
    }
  ]
}
```

#### **Estructura del Response**
Igual que el historial específico, pero con registros de TODOS los tipos de miel mezclados.

#### **Límite de Resultados**
Solo retorna los **últimos 100 cambios** para optimizar performance. Ordenados por fecha descendente.

#### **Errores Posibles**

| Código | Descripción | Response |
|--------|-------------|----------|
| `401` | No autenticado | `{"success": false, "message": "No autenticado"}` |
| `403` | Usuario no es ADMINISTRADOR | `{"success": false, "message": "No autorizado"}` |
| `500` | Error interno | `{"success": false, "message": "Error interno del servidor"}` |

---

## 📊 Estructura de Datos Completa

### Objeto: ListaPrecioAgrupado

```json
{
  "tipoMielId": 1,
  "tipoMielNombre": "Miel 100% pura de abeja",
  "precios": {
    "nacional": {
      "id": "clx1a2b3c4d5e6f7g8h9",
      "precio": 85.50,
      "fechaUltimaActualizacion": "2025-01-17T10:30:00.000Z"
    },
    "exportacion": {
      "id": "clx9z8y7x6w5v4u3t2s1",
      "precio": 95.00,
      "fechaUltimaActualizacion": "2025-01-17T10:30:00.000Z"
    }
  }
}
```

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `tipoMielId` | `number` | No | ID del tipo de miel (FK a `compras_tiposdemiel`) |
| `tipoMielNombre` | `string` | No | Nombre descriptivo del tipo de miel |
| `precios.nacional.id` | `string` | No | ID del registro de precio NACIONAL |
| `precios.nacional.precio` | `number` | No | Precio por kg (2 decimales) |
| `precios.nacional.fechaUltimaActualizacion` | `string` | No | ISO 8601 timestamp |
| `precios.exportacion.id` | `string` | No | ID del registro de precio EXPORTACIÓN |
| `precios.exportacion.precio` | `number` | No | Precio por kg (2 decimales) |
| `precios.exportacion.fechaUltimaActualizacion` | `string` | No | ISO 8601 timestamp |

---

### Objeto: ListaPrecioVigente

```json
{
  "id": "clx1a2b3c4d5e6f7g8h9",
  "tipoMielId": 1,
  "tipoMielNombre": "Miel 100% pura de abeja",
  "clasificacion": "NACIONAL",
  "precio": 85.50,
  "fechaUltimaActualizacion": "2025-01-17T10:30:00.000Z",
  "usuarioActualizador": {
    "id": "clxuser123456789",
    "nombre": "Admin Principal"
  }
}
```

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `string` | No | ID único del registro (CUID) |
| `tipoMielId` | `number` | No | ID del tipo de miel |
| `tipoMielNombre` | `string` | No | Nombre del tipo de miel |
| `clasificacion` | `string` | No | `"NACIONAL"` o `"EXPORTACION"` |
| `precio` | `number` | No | Precio actual por kg (2 decimales) |
| `fechaUltimaActualizacion` | `string` | No | ISO 8601 timestamp |
| `usuarioActualizador` | `object` | **Sí** | Usuario que realizó última actualización (null si nunca se actualizó) |
| `usuarioActualizador.id` | `string` | No | ID del usuario |
| `usuarioActualizador.nombre` | `string` | No | Nombre completo del usuario |

---

### Objeto: HistorialPrecio

```json
{
  "id": "clxhist123abc",
  "tipoMielId": 1,
  "tipoMielNombre": "Miel 100% pura de abeja",
  "clasificacion": "NACIONAL",
  "precioAnterior": 85.50,
  "precioNuevo": 88.75,
  "fechaCambio": "2025-01-17T14:45:00.000Z",
  "usuarioId": "clxuser987654321",
  "usuarioNombre": "Admin Secundario",
  "motivoCambio": "Ajuste por inflación trimestral"
}
```

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `string` | No | ID único del registro de historial (CUID) |
| `tipoMielId` | `number` | No | ID del tipo de miel |
| `tipoMielNombre` | `string` | No | Nombre del tipo de miel (desnormalizado) |
| `clasificacion` | `string` | No | `"NACIONAL"` o `"EXPORTACION"` |
| `precioAnterior` | `number` | No | Precio ANTES del cambio (2 decimales) |
| `precioNuevo` | `number` | No | Precio DESPUÉS del cambio (2 decimales) |
| `fechaCambio` | `string` | No | ISO 8601 timestamp del momento del cambio |
| `usuarioId` | `string` | No | ID del usuario que realizó el cambio |
| `usuarioNombre` | `string` | No | Nombre del usuario (desnormalizado) |
| `motivoCambio` | `string` | **Sí** | Razón del cambio (null si no se proporcionó) |

---

## 🎯 Casos de Uso Frontend

### Caso 1: Vista Principal de Lista de Precios

**Flujo:**
1. Usuario navega a módulo "Lista de Precios"
2. Frontend llama a `GET /api/lista-precios/agrupados`
3. Renderiza tabla con columnas:
   - Tipo de Miel
   - Precio NACIONAL (con botón "Ver Historial")
   - Precio EXPORTACIÓN (con botón "Ver Historial")
   - Última Actualización
   - Botones de Acción (solo para ADMINISTRADOR)

**Datos necesarios:**
- `tipoMielNombre`: Columna "Tipo de Miel"
- `precios.nacional.precio`: Input/label de precio NACIONAL
- `precios.exportacion.precio`: Input/label de precio EXPORTACIÓN
- `precios.nacional.fechaUltimaActualizacion`: Mostrar "Actualizado hace X días"
- `precios.nacional.id`: Para llamar a actualizar precio
- `precios.exportacion.id`: Para llamar a actualizar precio

---

### Caso 2: Actualizar Precio (Solo ADMINISTRADOR)

**Flujo:**
1. Administrador hace clic en input de precio (o botón "Editar")
2. Abre modal/formulario con:
   - Campo: Nuevo Precio (validar ≥ 0, máximo 2 decimales)
   - Campo: Motivo del Cambio (opcional, textarea)
3. Usuario ingresa datos y hace clic en "Guardar"
4. Frontend llama a `PUT /api/lista-precios/:id` con body:
   ```json
   {
     "precio": 90.00,
     "motivoCambio": "Ajuste semestral"
   }
   ```
5. Si respuesta es exitosa (200), actualiza la tabla con el nuevo precio

**Validaciones Frontend:**
- Precio no puede ser negativo
- Precio máximo 2 decimales
- Si precio es igual al actual, mostrar advertencia

---

### Caso 3: Ver Historial de un Precio Específico

**Flujo:**
1. Usuario hace clic en botón "Ver Historial" al lado del precio
2. Frontend llama a `GET /api/lista-precios/:id/historial` usando el `id` del precio
3. Abre modal/panel lateral mostrando tabla de cambios:
   - Fecha del Cambio
   - Precio Anterior → Precio Nuevo
   - Usuario que realizó el cambio
   - Motivo del cambio (si existe)
4. Ordenar por fecha descendente (más reciente primero)

**Datos del Modal:**
- Título: "Historial de {tipoMielNombre} - {clasificacion}"
- Tabla con columnas:
  - Fecha
  - Precio Anterior
  - Precio Nuevo
  - Diferencia (+/- $X.XX)
  - Usuario
  - Motivo

**Ejemplo de Fila:**
```
17/01/2025 14:45 | $85.50 → $88.75 | +$3.25 | Admin Secundario | Ajuste por inflación
```

---

### Caso 4: Dashboard de Auditoría (Solo ADMINISTRADOR)

**Flujo:**
1. Administrador navega a "Reportes > Historial de Precios"
2. Frontend llama a `GET /api/lista-precios/historial/completo`
3. Muestra tabla global con TODOS los cambios recientes (últimos 100)
4. Columnas:
   - Fecha
   - Tipo de Miel
   - Clasificación
   - Precio Anterior → Precio Nuevo
   - Usuario
   - Motivo

**Filtros opcionales (implementar en frontend):**
- Por tipo de miel
- Por clasificación
- Por usuario
- Por rango de fechas

---

## 🔄 Mapeo de Campos para Integraciones

### Tabla Frontend → API

| Campo Destino (Vista) | Campo API | Ruta JSON Completa |
|------------------------|-----------|-------------------|
| Tipo de Miel | `tipoMielNombre` | `data[].tipoMielNombre` |
| ID Precio NACIONAL | `id` | `data[].precios.nacional.id` |
| Precio NACIONAL | `precio` | `data[].precios.nacional.precio` |
| Fecha Act. NACIONAL | `fechaUltimaActualizacion` | `data[].precios.nacional.fechaUltimaActualizacion` |
| ID Precio EXPORTACIÓN | `id` | `data[].precios.exportacion.id` |
| Precio EXPORTACIÓN | `precio` | `data[].precios.exportacion.precio` |
| Fecha Act. EXPORTACIÓN | `fechaUltimaActualizacion` | `data[].precios.exportacion.fechaUltimaActualizacion` |

### Tabla Historial → API

| Campo Destino (Modal) | Campo API | Ruta JSON Completa |
|------------------------|-----------|-------------------|
| Fecha del Cambio | `fechaCambio` | `data[].fechaCambio` |
| Precio Antes | `precioAnterior` | `data[].precioAnterior` |
| Precio Después | `precioNuevo` | `data[].precioNuevo` |
| Diferencia | Calculado | `precioNuevo - precioAnterior` |
| Usuario | `usuarioNombre` | `data[].usuarioNombre` |
| Motivo | `motivoCambio` | `data[].motivoCambio` |

---

## ⚠️ Notas Importantes

### Valores Calculados vs Guardados

**Valores guardados en BD:**
- `precio`: Valor actual del precio
- `precioAnterior` y `precioNuevo` en historial

**Valores calculados en frontend:**
- Diferencia de precios: `precioNuevo - precioAnterior`
- Tiempo transcurrido: "Actualizado hace X días/horas"
- Porcentaje de cambio: `((precioNuevo - precioAnterior) / precioAnterior) * 100`

### Comportamientos Especiales

1. **Precio $0.00**: Si un precio está en $0.00, significa que no ha sido configurado aún. Mostrar indicador visual (ej: badge "Sin Configurar").

2. **Sin Usuario Actualizador**: Si `usuarioActualizador` es `null`, significa que el precio nunca ha sido modificado desde su creación inicial. Mostrar "Sistema" como usuario.

3. **Motivo Vacío**: Si `motivoCambio` es `null`, mostrar "-" o "Sin especificar" en la columna de motivo.

4. **Historial Vacío**: Si un precio nunca ha sido modificado, el endpoint de historial retornará un array vacío `[]`. Mostrar mensaje "Sin cambios registrados".

### Validaciones

**En Frontend:**
- Validar que el precio sea un número válido
- Validar que el precio sea ≥ 0
- Validar máximo 2 decimales
- Si el precio es igual al actual, mostrar advertencia antes de enviar

**En Backend (ya implementado):**
- Precio no puede ser negativo
- Precio no puede ser igual al precio actual
- Solo ADMINISTRADOR puede actualizar
- Usuario debe estar autenticado

### Límites y Restricciones

- Historial completo limitado a **últimos 100 registros** (optimización de performance)
- Historial específico **sin límite** (retorna todos los cambios del tipo+clasificación)
- Los precios deben tener máximo **2 decimales** (ej: 85.50, no 85.5555)
- Los IDs son **CUIDs** de 25-30 caracteres, no números secuenciales

---

## 🔐 Seguridad

### Control de Acceso

**Lectura de Precios:**
- Todos los roles autenticados pueden consultar precios vigentes
- Todos los roles pueden ver historial específico de un precio
- Solo ADMINISTRADOR puede ver historial completo

**Escritura de Precios:**
- **Solo ADMINISTRADOR** puede actualizar precios
- Intentos de actualización por otros roles retornan `403 Forbidden`

### Auditoría Automática

Cada actualización de precio registra automáticamente:
1. **Historial de Precios**: Registro en `compras_historial_precios`
   - Precio anterior y nuevo
   - Usuario que realizó el cambio
   - Fecha y hora exacta
   - Motivo (si se proporcionó)

2. **Historial de Acciones**: Registro en `compras_historial_acciones`
   - Tipo de acción: `PRECIO_ACTUALIZADO`
   - Entidad afectada: `lista_precio`
   - Estado anterior y nuevo
   - IP y UserAgent del usuario

### Validaciones de Seguridad

- Token JWT válido y no expirado
- Usuario activo en el sistema
- Rol del usuario tiene permisos suficientes
- Precio no puede ser negativo (previene errores de entrada)
- No se permite actualizar con el mismo precio (previene spam de historial)

---

## 📞 Soporte y Contacto

**Documentación Técnica Completa:** [LISTA_PRECIOS_INSTALACION.md](LISTA_PRECIOS_INSTALACION.md)

**Base URL:** `http://localhost:3000/api` (desarrollo) | `https://api.oaxacamiel.com/api` (producción)

**Swagger UI:** `http://localhost:3000/api-docs` (solo desarrollo)

---

**Versión:** 1.0.0
**Última Actualización:** 2025-01-17
**Sistema:** Oaxaca Miel - Trazabilidad
**Módulo:** Lista de Precios
