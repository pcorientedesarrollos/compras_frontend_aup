/**
 * Modelo: Lista de Precios por Tipo de Miel
 * Fecha: 2025-11-17
 * Actualizado: Diciembre 2024 - API v2.0 con estructura de 2 niveles
 * Descripción: Interfaces para gestión de precios de tipos de miel
 */

/**
 * Clasificación de precios (nueva clasificación Dic 2024)
 * EXPORTACION_1: 0-19% humedad (mejor calidad)
 * EXPORTACION_2: 20% humedad
 * NACIONAL: 21% humedad
 * INDUSTRIA: 22%+ humedad
 */
export type ClasificacionPrecio = 'EXPORTACION_1' | 'EXPORTACION_2' | 'NACIONAL' | 'INDUSTRIA';

/**
 * Nivel 1: Resumen de tipo de miel con conteo de precios asignados
 * Endpoint: GET /lista-precios/tipos-miel
 */
export interface TipoMielResumen {
  no: number;
  tipoMielId: number;
  tipoMielNombre: string;
  asignados: number; // 0-4
  fechaUltimaModificacion: string | null;
}

/**
 * Nivel 2: Detalle de precio por clasificación
 * Endpoint: GET /lista-precios/tipo-miel/:tipoMielId
 */
export interface PrecioDetalle {
  no: number;
  id: string | null;
  tipoMielId: number;
  tipoMielNombre: string;
  clasificacion: ClasificacionPrecio;
  clasificacionNombre: string;
  precio: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  existeRegistro: boolean;
}

/**
 * DTO para actualizar precio de un tipo de miel
 * Endpoint: PUT /lista-precios/:id
 */
export interface UpdatePrecioDto {
  precio: number;
  motivoCambio?: string;
}

/**
 * Respuesta de actualización de precio
 */
export interface PrecioActualizado {
  id: string;
  tipoMielId: number;
  tipoMielNombre: string;
  clasificacion: ClasificacionPrecio;
  precio: number;
  fechaUltimaActualizacion: string;
  usuarioActualizador: {
    id: string;
    nombre: string;
  };
}

/**
 * DTO para inicializar precios de un tipo de miel nuevo
 * Endpoint: POST /lista-precios/tipo-miel/:tipoMielId/inicializar
 */
export interface InicializarPreciosDto {
  exportacion1: number;
  exportacion2: number;
  nacional: number;
  industria: number;
}

/**
 * Historial de cambios de precio
 */
export interface HistorialPrecio {
  id: string;
  listaPrecioId: string;
  precioAnterior: number;
  precioNuevo: number;
  usuarioId: string;
  usuarioNombre: string;
  fechaCambio: string;
}

// ============================================
// INTERFACES LEGACY (mantener compatibilidad)
// ============================================

/**
 * @deprecated Usar TipoMielResumen y PrecioDetalle
 */
export interface TipoMielPrecio {
  id: string;
  tipoMielId: number;
  tipoMielNombre: string;
  clasificacion: ClasificacionPrecio;
  precio: number;
  fechaUltimaActualizacion: string;
  usuarioActualizador: string | null;
}

/**
 * @deprecated Usar PrecioDetalle
 */
export interface PrecioClasificacionInfo {
  id: string;
  precio: number;
  fechaUltimaActualizacion: string;
}

/**
 * @deprecated Usar TipoMielResumen + PrecioDetalle
 */
export interface TipoMielPreciosAgrupados {
  tipoMielId: number;
  tipoMielNombre: string;
  precios: {
    exportacion1: PrecioClasificacionInfo | null;
    exportacion2: PrecioClasificacionInfo | null;
    nacional: PrecioClasificacionInfo | null;
    industria: PrecioClasificacionInfo | null;
  };
}
