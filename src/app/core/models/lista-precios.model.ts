/**
 * Modelo: Lista de Precios por Tipo de Miel
 * Fecha: 2025-11-17
 * Actualizado: Diciembre 2024 - Nueva clasificación de humedad
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
 * Tipo de Miel con su precio (respuesta del API)
 */
export interface TipoMielPrecio {
  id: string;  // CUID
  tipoMielId: number;
  tipoMielNombre: string;
  clasificacion: ClasificacionPrecio;
  precio: number;
  fechaUltimaActualizacion: string;
  usuarioActualizador: string | null;
}

/**
 * Precio por clasificación (para vista agrupada)
 */
export interface PrecioClasificacionInfo {
  id: string;
  precio: number;
  fechaUltimaActualizacion: string;
}

/**
 * Tipo de miel con precios agrupados por clasificación
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

/**
 * DTO para actualizar precio de un tipo de miel
 */
export interface UpdatePrecioDto {
  precio: number;
}

/**
 * Historial de cambios de precio
 */
export interface HistorialPrecio {
  id: string;  // CUID
  listaPrecioId: string;
  precioAnterior: number;
  precioNuevo: number;
  usuarioId: string;
  usuarioNombre: string;
  fechaCambio: string;
}
