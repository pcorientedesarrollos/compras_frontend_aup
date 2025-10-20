/**
 * ============================================================================
 * 🚛 CHOFER MODEL - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Modelo para choferes que transportan miel
 * 
 * ENDPOINTS:
 * - GET /api/choferes/activos (select options)
 * - GET /api/choferes (listado con filtros)
 * - GET /api/choferes/:id (detalle)
 * 
 * ============================================================================
 */

/**
 * Estado del chofer
 */
export enum EstatusChofer {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO'
}

/**
 * Chofer (respuesta API completa)
 */
export interface Chofer {
    id: string;
    nombre: string;
    alias: string | null;
    estatus: EstatusChofer;
    fechaAlta: string; // ISO Date
    observaciones: string | null;
    createdAt: string; // ISO DateTime
    updatedAt: string; // ISO DateTime
}

/**
 * Chofer para select (GET /api/choferes/activos)
 */
export interface ChoferSelectOption {
    id: string;
    nombre: string;
    alias: string | null;
}

/**
 * Chofer con estadísticas (GET /api/choferes/:id)
 */
export interface ChoferConEstadisticas extends Chofer {
    estadisticas: {
        totalSalidas: number;
        totalKilosTransportados: number;
        ultimaSalida: string | null; // ISO Date
    };
}

/**
 * Parámetros de filtro para búsqueda de choferes
 */
export interface ChoferFilterParams {
    nombre?: string;
    alias?: string;
    estatus?: EstatusChofer;
    page?: number;
    limit?: number;
}

/**
 * Respuesta paginada de choferes
 */
export interface ChoferesResponse {
    data: Chofer[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}