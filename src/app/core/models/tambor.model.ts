/**
 * Modelos para el módulo de Tambores
 * Basado en API_TAMBORES.md
 */

import { ClasificacionMiel } from './entrada-miel.model';

export type EstadoTambor = 'ACTIVO' | 'CANCELADO';

/**
 * Detalle de entrada disponible para asignar a un tambor
 * Endpoint: GET /api/entradas-miel/disponibles/tambores
 */
export interface DetalleDisponibleParaTambor {
  id: string;
  entradaId: string;
  entradaFolio: string;
  fecha: Date;
  apicultorId: string;
  apicultorNombre: string;
  tipoMielId: number;
  tipoMielNombre: string;
  floracionId?: number | null;
  floracionNombre?: string | null;
  colorId?: number | null;
  colorNombre?: string | null;
  clasificacion: ClasificacionMiel;
  kilos: number;
  humedad: number;
  precio: number;
  costoTotal: number;
}

/**
 * Encabezado de tambor (para lista)
 * Endpoint: GET /api/tambores
 */
export interface TamborEncabezado {
  id: string;
  consecutivo: string;
  proveedorId: number;
  proveedorNombre: string;
  tipoMielId: number;
  tipoMielNombre: string;
  clasificacion: ClasificacionMiel;
  totalKilos: number;
  totalCosto: number;
  cantidadDetalles: number;
  estado: EstadoTambor;
  observaciones?: string | null;
  fechaCreacion: Date;
  usuarioCreadorNombre: string;
  fechaCancelacion?: Date | null;
  usuarioCanceladorNombre?: string | null;
  motivoCancelacion?: string | null;
}

/**
 * Detalle completo de tambor
 * Endpoint: GET /api/tambores/:id
 */
export interface TamborDetalle extends TamborEncabezado {
  usuarioCreadorId: string;
  detalles: TamborDetalleItem[];
}

/**
 * Item de detalle dentro de un tambor
 */
export interface TamborDetalleItem {
  id: string;
  entradaDetalleId: string;
  entradaFolio: string;
  apicultorNombre: string;
  kilos: number;
  costo: number;
  humedad: number;
  precio: number;
}

/**
 * Request para crear tambor
 * Endpoint: POST /api/tambores
 */
export interface CreateTamborRequest {
  detalleIds: string[];
  observaciones?: string;
}

/**
 * Request para cancelar tambor
 * Endpoint: PATCH /api/tambores/:id/cancelar
 */
export interface CancelarTamborRequest {
  motivoCancelacion: string;
}

/**
 * Filtros para buscar detalles disponibles
 */
export interface FiltrosDetallesDisponibles {
  clasificacion?: ClasificacionMiel;
  tipoMielId?: number;
  page?: number;
  limit?: number;
}

/**
 * Filtros para buscar tambores
 */
export interface FiltrosTambores {
  consecutivo?: string;
  proveedorId?: number;
  tipoMielId?: number;
  clasificacion?: ClasificacionMiel;
  estado?: EstadoTambor;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Tambor temporal en frontend (antes de guardar)
 * Usado para UI/UX de asignación progresiva
 */
export interface TamborBorrador {
  id: string; // ID temporal generado en frontend
  detalles: DetalleDisponibleParaTambor[];
  totalKilos: number;
  totalCosto: number;
  observaciones?: string;
}
