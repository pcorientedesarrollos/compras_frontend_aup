/**
 * Modelo: Lista de Precios por Tipo de Miel
 * Fecha: 2025-11-17
 * Descripción: Interfaces para gestión de precios de tipos de miel
 */

/**
 * Tipo de Miel con su precio (respuesta del API)
 */
export interface TipoMielPrecio {
  id: string;  // CUID
  tipoMielId: number;
  tipoMielNombre: string;
  clasificacion: 'EXPORTACION' | 'NACIONAL' | 'INDUSTRIA';
  precio: number;
  fechaUltimaActualizacion: string;
  usuarioActualizador: string | null;
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
