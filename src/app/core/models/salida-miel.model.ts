/**
 * ============================================================================
 * 📦 SALIDA MIEL MODEL - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Modelo para salidas de miel con TAMBORES
 *
 * FLUJO DE ESTADOS:
 * EN_PROCESO → FINALIZADA → EN_TRANSITO → VERIFICADA
 *     ↓
 * CANCELADA (solo desde EN_PROCESO)
 *
 * ENDPOINTS PRINCIPALES:
 * - POST /api/salidas-miel (crear salida)
 * - POST /api/salidas-miel/:id/tambores (añadir tambor)
 * - DELETE /api/salidas-miel/:id/tambores/:detalleId (remover tambor)
 * - PATCH /api/salidas-miel/:id/tambores/:detalleId/tara (actualizar tara)
 * - POST /api/salidas-miel/:id/finalizar (finalizar)
 * - POST /api/salidas-miel/:id/en-transito (marcar en tránsito)
 * - GET /api/salidas-miel/tambores-disponibles (listar tambores ACTIVOS)
 * - DELETE /api/salidas-miel/:id (cancelar solo EN_PROCESO)
 *
 * ============================================================================
 */

import { ClasificacionMiel } from "./entrada-miel.model";

/**
 * Estado de la salida (NUEVO FLUJO)
 */
export enum EstadoSalida {
    EN_PROCESO = 'EN_PROCESO',       // Añadiendo/quitando tambores
    FINALIZADA = 'FINALIZADA',       // No se pueden añadir tambores, se puede modificar tara
    EN_TRANSITO = 'EN_TRANSITO',     // Chofer recogió la carga
    VERIFICADA = 'VERIFICADA'        // Verificada en planta
}

/**
 * Detalle de salida (vinculado a un tambor)
 * Snapshot de datos del tambor al momento de la salida
 */
export interface DetalleSalidaMiel {
    id: string;
    salidaEncabezadoId: string;
    tamborId: string;

    // Snapshot del tambor
    tipoMielId: number;
    tipoMielNombre: string;
    floracionId: number | null;
    floracionNombre: string | null;
    colorId: number | null;
    colorNombre: string | null;
    clasificacion: ClasificacionMiel;
    kilosDeclarados: number;      // Kilos brutos del tambor (con tara)
    humedadPromedio: number | null;
    costoTotal: number;

    // Datos capturados en salida
    taraCapturada: number | null;

    // Datos de verificación (solo para VERIFICADOR)
    verificado: boolean;
    kilosVerificados: number | null;
    humedadVerificada: number | null;
    observacionesVerificador: string | null;
    tieneDiferencias: boolean;
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
    cantidadTambores: number;
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
    verificador: {
        id: string;
        nombre: string;
    } | null;
    fechaCreacion: string; // ISO DateTime
    fechaFinalizacion: string | null; // ISO DateTime
    fechaVerificacion: string | null; // ISO DateTime
    observacionesVerificador: string | null;
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
    cantidadTambores: number;
    estado: EstadoSalida;
    tieneDiferencias: boolean;
    observaciones: string | null;
    fechaCreacion: string; // ISO DateTime
    usuarioCreadorNombre: string;
}

/**
 * Request para crear salida (POST /api/salidas-miel)
 * Ahora solo crea el encabezado, sin detalles
 */
export interface CreateSalidaMielRequest {
    fecha: string; // YYYY-MM-DD
    choferId: string;
    observaciones?: string;
    observacionesChofer?: string;
}

/**
 * Request para actualizar encabezado (PATCH /api/salidas-miel/:id)
 * Solo permitido en estado EN_PROCESO
 */
export interface UpdateSalidaEncabezadoRequest {
    fecha?: string;
    choferId?: string;
    observaciones?: string;
    observacionesChofer?: string;
}

/**
 * Request para añadir tambor a la salida
 * POST /api/salidas-miel/:id/tambores
 */
export interface AddTamborToSalidaRequest {
    tamborId: string;
    taraCapturada?: number;
    observaciones?: string;
}

/**
 * Request para actualizar tara de un tambor
 * PATCH /api/salidas-miel/:id/tambores/:detalleId/tara
 */
export interface UpdateTaraRequest {
    taraCapturada: number;
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
 * Tambor disponible para añadir a salida
 * GET /api/salidas-miel/tambores-disponibles
 */
export interface TamborDisponible {
    id: string;
    consecutivo: string; // TAMB-2025-NNNN
    tipoMielId: number;
    tipoMielNombre: string;
    floracionId: number | null;
    colorId: number | null;
    clasificacion: ClasificacionMiel;
    totalKilos: number;
    humedadPromedio: number;
    totalCosto: number;
    cantidadDetalles: number;
    estado: string; // 'ACTIVO'
    observaciones: string | null;
    fechaCreacion: string; // ISO DateTime
}