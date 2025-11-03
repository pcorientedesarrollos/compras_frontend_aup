/**
 * ============================================================================
 * 📦 ENTRADA MIEL SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio para consumir las APIs de Entradas de Miel del backend
 *
 * ENDPOINTS:
 * - POST   /api/entradas-miel                              → Crear entrada
 * - GET    /api/entradas-miel                              → Listar con filtros y paginación
 * - GET    /api/entradas-miel/estadisticas                 → Estadísticas
 * - GET    /api/entradas-miel/disponibles/pool             → Pool de miel disponible
 * - GET    /api/entradas-miel/folio/:folio                 → Buscar por folio
 * - GET    /api/entradas-miel/:id                          → Detalle por ID
 * - PUT    /api/entradas-miel/:id                          → Actualizar entrada
 * - PATCH  /api/entradas-miel/:id/cancelar                 → Cancelar entrada
 * - PATCH  /api/entradas-miel/detalles/:detalleId/cancelar → Cancelar detalle individual
 *
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import {
    EntradaMielAPI,
    EntradaMielDetailAPI,
    EntradaMielDetalleAPI,
    LoteMielDisponible,
    CreateEntradaMielRequest,
    UpdateEntradaMielRequest,
    CancelarEntradaMielRequest,
    CancelarDetalleRequest,
    EntradaMielFilterParams,
    EntradaMielEstadisticasParams,
    PoolDisponiblesParams,
    CreateEntradaMielResponse,
    UpdateEntradaMielResponse,
    EntradasMielPaginatedResponse,
    EntradaMielDetailResponse,
    EntradaMielByFolioResponse,
    CancelarEntradaMielResponse,
    CancelarDetalleResponse,
    PoolDisponiblesResponse,
    EntradaMielEstadisticas,
    EntradaMielEstadisticasResponse,
    Floracion,
    ColorMiel,
    FloracionesResponse,
    ColoresResponse
} from '../models/index';

@Injectable({
    providedIn: 'root'
})
export class EntradaMielService {
    private httpService = inject(HttpService);

    private readonly BASE_PATH = 'entradas-miel';

    // ============================================================================
    // API 1: POST /api/entradas-miel
    // ============================================================================

    /**
     * Crear una nueva entrada de miel
     * Genera automáticamente el folio y clasifica según humedad
     * 
     * @param data Datos de la entrada con detalles
     * @returns Observable con la entrada creada
     */
    createEntrada(data: CreateEntradaMielRequest): Observable<EntradaMielDetailAPI> {
        return this.httpService
            .post<CreateEntradaMielResponse>(this.BASE_PATH, data)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 2: GET /api/entradas-miel
    // ============================================================================

    /**
     * Obtener listado de entradas con filtros y paginación
     * Los ACOPIADORES solo ven sus propias entradas
     * 
     * @param params Parámetros de filtrado y paginación
     * @returns Observable con lista paginada
     */
    getEntradas(params: EntradaMielFilterParams = {}): Observable<EntradasMielPaginatedResponse> {
        // Construir query params dinámicamente
        const queryParams: Record<string, string> = {};

        if (params.page) queryParams['page'] = params.page.toString();
        if (params.limit) queryParams['limit'] = params.limit.toString();
        if (params.proveedorId) queryParams['proveedorId'] = params.proveedorId.toString();
        if (params.apicultorId) queryParams['apicultorId'] = params.apicultorId;
        if (params.tipoMielId) queryParams['tipoMielId'] = params.tipoMielId.toString();
        if (params.estado) queryParams['estado'] = params.estado;
        if (params.clasificacion) queryParams['clasificacion'] = params.clasificacion;
        if (params.fechaInicio) queryParams['fechaInicio'] = params.fechaInicio;
        if (params.fechaFin) queryParams['fechaFin'] = params.fechaFin;
        if (params.sortBy) queryParams['sortBy'] = params.sortBy;
        if (params.sortOrder) queryParams['sortOrder'] = params.sortOrder;

        // Construir query string
        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString ? `${this.BASE_PATH}?${queryString}` : this.BASE_PATH;

        return this.httpService.get<EntradasMielPaginatedResponse>(url);
    }

    // ============================================================================
    // API 3: GET /api/entradas-miel/estadisticas
    // ============================================================================

    /**
     * Obtener estadísticas de entradas de miel
     * Útil para dashboards y reportes
     * 
     * @param params Filtros opcionales (fechas, proveedor, apicultor)
     * @returns Observable con estadísticas completas
     */
    getEstadisticas(params: EntradaMielEstadisticasParams = {}): Observable<EntradaMielEstadisticas> {
        // Construir query params dinámicamente
        const queryParams: Record<string, string> = {};

        if (params.fechaInicio) queryParams['fechaInicio'] = params.fechaInicio;
        if (params.fechaFin) queryParams['fechaFin'] = params.fechaFin;
        if (params.proveedorId) queryParams['proveedorId'] = params.proveedorId.toString();
        if (params.apicultorId) queryParams['apicultorId'] = params.apicultorId;

        // Construir query string
        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString
            ? `${this.BASE_PATH}/estadisticas?${queryString}`
            : `${this.BASE_PATH}/estadisticas`;

        return this.httpService
            .get<EntradaMielEstadisticasResponse>(url)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 4: GET /api/entradas-miel/disponibles/pool
    // ============================================================================

    /**
     * Obtener pool de lotes de miel disponibles para producción
     * Ordenados por FIFO (más antiguos primero)
     * 
     * @param params Filtros opcionales (tipo, clasificación, fechas)
     * @returns Observable con lotes y resumen
     */
    getPoolDisponibles(params: PoolDisponiblesParams = {}): Observable<PoolDisponiblesResponse> {
        // Construir query params dinámicamente
        const queryParams: Record<string, string> = {};

        if (params.tipoMielId) queryParams['tipoMielId'] = params.tipoMielId.toString();
        if (params.clasificacion) queryParams['clasificacion'] = params.clasificacion;
        if (params.fechaInicio) queryParams['fechaInicio'] = params.fechaInicio;
        if (params.fechaFin) queryParams['fechaFin'] = params.fechaFin;
        if (params.limit) queryParams['limit'] = params.limit.toString();

        // Construir query string
        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString
            ? `${this.BASE_PATH}/disponibles/pool?${queryString}`
            : `${this.BASE_PATH}/disponibles/pool`;

        return this.httpService.get<PoolDisponiblesResponse>(url);
    }

    // ============================================================================
    // API 5: GET /api/entradas-miel/folio/:folio
    // ============================================================================

    /**
     * Buscar entrada por folio único
     * 
     * @param folio Folio de la entrada (ej: EM-20251017-0001)
     * @returns Observable con detalle de la entrada
     */
    getEntradaByFolio(folio: string): Observable<EntradaMielDetailAPI> {
        return this.httpService
            .get<EntradaMielByFolioResponse>(`${this.BASE_PATH}/folio/${folio}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 6: GET /api/entradas-miel/:id
    // ============================================================================

    /**
     * Obtener detalle completo de una entrada por ID
     * Incluye encabezado y todos los detalles
     * 
     * @param id ID de la entrada (CUID)
     * @returns Observable con detalle completo
     */
    getEntradaById(id: string): Observable<EntradaMielDetailAPI> {
        return this.httpService
            .get<EntradaMielDetailResponse>(`${this.BASE_PATH}/${id}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 7: PUT /api/entradas-miel/:id
    // ============================================================================

    /**
     * Actualizar una entrada de miel completa (encabezado y detalles)
     * Permite agregar, modificar o eliminar detalles
     *
     * REGLAS:
     * - Solo se puede actualizar si estado = ACTIVO
     * - Solo se puede actualizar si todos los detalles tienen estadoUso = DISPONIBLE
     * - Detalles CON id: se actualizan
     * - Detalles SIN id: se crean nuevos
     * - Detalles omitidos: se eliminan
     *
     * @param id ID de la entrada a actualizar
     * @param data Datos de la entrada actualizada
     * @returns Observable con la entrada actualizada
     */
    updateEntrada(id: string, data: UpdateEntradaMielRequest): Observable<EntradaMielDetailAPI> {
        return this.httpService
            .put<UpdateEntradaMielResponse>(`${this.BASE_PATH}/${id}`, data)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 8: PATCH /api/entradas-miel/:id/cancelar
    // ============================================================================

    /**
     * Cancelar una entrada de miel (acción irreversible)
     * Actualiza estado a CANCELADO en encabezado y detalles
     *
     * @param id ID de la entrada a cancelar
     * @param motivoCancelacion Motivo (mínimo 10 caracteres)
     * @returns Observable con datos de la cancelación
     */
    cancelarEntrada(id: string, motivoCancelacion: string): Observable<CancelarEntradaMielResponse['data']> {
        return this.httpService
            .patch<CancelarEntradaMielResponse>(
                `${this.BASE_PATH}/${id}/cancelar`,
                { motivoCancelacion }
            )
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 9: PATCH /api/entradas-miel/detalles/:detalleId/cancelar
    // ============================================================================

    /**
     * Cancelar un detalle individual de entrada de miel
     * Si se cancelan todos los detalles, la entrada completa se cancela automáticamente
     *
     * REGLAS:
     * - Solo se puede cancelar si estadoUso = DISPONIBLE
     * - No se puede cancelar si estadoUso = USADO (ya en tambores/salidas)
     * - No se puede cancelar detalles de entrada con estado = CANCELADO
     *
     * @param detalleId ID del detalle a cancelar
     * @param motivoCancelacion Motivo (mínimo 10, máximo 500 caracteres)
     * @returns Observable con el detalle cancelado
     */
    cancelarDetalle(detalleId: string, motivoCancelacion: string): Observable<EntradaMielDetalleAPI> {
        return this.httpService
            .patch<CancelarDetalleResponse>(
                `${this.BASE_PATH}/detalles/${detalleId}/cancelar`,
                { motivoCancelacion }
            )
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // CATÁLOGOS: GET /api/catalogos/floraciones
    // ============================================================================

    /**
     * Obtener catálogo de floraciones
     *
     * @returns Observable con listado de floraciones
     */
    getFloraciones(): Observable<Floracion[]> {
        return this.httpService
            .get<FloracionesResponse>('catalogos/floraciones')
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // CATÁLOGOS: GET /api/catalogos/colores
    // ============================================================================

    /**
     * Obtener catálogo de colores de miel
     * Ordenados por campo 'orden'
     *
     * @returns Observable con listado de colores
     */
    getColores(): Observable<ColorMiel[]> {
        return this.httpService
            .get<ColoresResponse>('catalogos/colores')
            .pipe(
                map(response => response.data)
            );
    }
}