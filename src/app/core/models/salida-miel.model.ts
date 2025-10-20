/**
 * ============================================================================
 * 📦 SALIDA MIEL MODEL - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Modelo para salidas de miel del inventario
 * 
 * FLUJO DE ESTADOS:
 * BORRADOR → EN_TRANSITO → ENTREGADA
 *     ↓
 * CANCELADA (solo desde BORRADOR)
 * 
 * ENDPOINTS:
 * - POST /api/salidas-miel (crear borrador)
 * - GET /api/salidas-miel (listar con filtros)
 * - GET /api/salidas-miel/folio/:folio (buscar por folio)
 * - GET /api/salidas-miel/:id (detalle completo)
 * - PATCH /api/salidas-miel/:id (actualizar borrador)
 * - POST /api/salidas-miel/:id/finalizar (finalizar y aplicar FIFO)
 * - DELETE /api/salidas-miel/:id (cancelar borrador)
 * 
 * ============================================================================
 */

import { ClasificacionMiel } from "./entrada-miel.model";

/**
 * Estado de la salida
 */
export enum EstadoSalida {
    BORRADOR = 'BORRADOR',           // Editable, no afecta inventario
    EN_TRANSITO = 'EN_TRANSITO',     // Finalizada, inventario descontado
    ENTREGADA = 'ENTREGADA',         // Verificada en destino
    CANCELADA = 'CANCELADA'          // Cancelada (solo desde BORRADOR)
}


/**
 * Detalle de salida (item individual)
 */
export interface DetalleSalidaMiel {
    id: string;
    tipoMielId: number;
    tipoMielNombre: string;
    clasificacion: ClasificacionMiel;
    kilos: number;
    precio: number | null;
    costoTotal: number;
    verificado: boolean;
    zona: string | null;
    trazabilidad: string | null;
    referencia: string | null;
    observaciones: string | null;
    createdAt: string; // ISO DateTime
    updatedAt: string; // ISO DateTime
}

/**
 * Salida completa (GET /api/salidas-miel/:id)
 */
export interface SalidaMielAPI {
    id: string;
    folio: string; // SAL-YYYY-NNNN
    fecha: string; // ISO Date
    proveedor: {
        id: number;
        nombre: string;
    };
    chofer: {
        id: string;
        nombre: string;
        alias: string | null;
    };
    totalKilos: number;
    totalCompra: number;
    estado: EstadoSalida;
    tieneDiferencias: boolean;
    observaciones: string | null;
    observacionesChofer: string | null;
    usuarioCreador: {
        id: string;
        nombre: string;
    };
    usuarioFinalizador: {
        id: string;
        nombre: string;
    } | null;
    fechaCreacion: string; // ISO DateTime
    fechaFinalizacion: string | null; // ISO DateTime
    detalles: DetalleSalidaMiel[];
    createdAt: string; // ISO DateTime
    updatedAt: string; // ISO DateTime
}

/**
 * Salida en listado (GET /api/salidas-miel)
 */
export interface SalidaMielListItem {
    id: string;
    folio: string;
    fecha: string; // ISO Date
    proveedorId: number;
    proveedorNombre: string;
    choferId: string;
    choferNombre: string;
    totalKilos: number;
    totalCompra: number;
    estado: EstadoSalida;
    tieneDiferencias: boolean;
    observaciones: string | null;
    fechaCreacion: string; // ISO DateTime
    usuarioCreadorNombre: string;
    cantidadDetalles: number;
}

/**
 * Request para crear salida (POST /api/salidas-miel)
 */
export interface CreateSalidaMielRequest {
    fecha: string; // YYYY-MM-DD
    choferId: string;
    observaciones?: string;
    observacionesChofer?: string;
    detalles: CreateDetalleSalidaRequest[];
}

/**
 * Detalle para crear salida
 */
export interface CreateDetalleSalidaRequest {
    tipoMielId: number;
    clasificacion: ClasificacionMiel;
    kilos: number;
    precio?: number;
    zona?: string;
    trazabilidad?: string;
    referencia?: string;
    observaciones?: string;
}

/**
 * Request para actualizar salida borrador (PATCH /api/salidas-miel/:id)
 */
export interface UpdateSalidaMielRequest {
    fecha?: string;
    choferId?: string;
    observaciones?: string;
    observacionesChofer?: string;
    detalles?: CreateDetalleSalidaRequest[];
}

/**
 * Parámetros de filtro para búsqueda de salidas
 */
export interface SalidaMielFilterParams {
    folio?: string;
    estado?: EstadoSalida;
    fechaInicio?: string; // YYYY-MM-DD
    fechaFin?: string; // YYYY-MM-DD
    proveedorId?: number; // Solo para ADMIN
    choferId?: string;
    tieneDiferencias?: boolean;
    page?: number;
    limit?: number;
}

/**
 * Respuesta paginada de salidas
 */
export interface SalidasMielResponse {
    data: SalidaMielListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Respuesta de crear/obtener salida individual
 */
export interface SalidaMielResponse {
    data: SalidaMielAPI;
    message?: string;
}

/**
 * Resumen de kilos por tipo de miel (para display)
 */
export interface ResumenKilosPorTipo {
    tipoMielId: number;
    tipoMielNombre: string;
    clasificacion: ClasificacionMiel;
    totalKilos: number;
}