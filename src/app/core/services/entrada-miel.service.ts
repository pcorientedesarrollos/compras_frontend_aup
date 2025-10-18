/**
 * ============================================================================
 * 📦 ENTRADA MIEL SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Servicio para consumir las APIs de Entradas de Miel del backend
 * 
 * ENDPOINTS:
 * - POST   /api/entradas-miel                      → Crear entrada
 * - GET    /api/entradas-miel                      → Listar con filtros y paginación
 * - GET    /api/entradas-miel/estadisticas         → Estadísticas
 * - GET    /api/entradas-miel/disponibles/pool     → Pool de miel disponible
 * - GET    /api/entradas-miel/folio/:folio         → Buscar por folio
 * - GET    /api/entradas-miel/:id                  → Detalle por ID
 * - PATCH  /api/entradas-miel/:id/cancelar         → Cancelar entrada
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
    LoteMielDisponible,
    CreateEntradaMielRequest,
    CancelarEntradaMielRequest,
    EntradaMielFilterParams,
    EntradaMielEstadisticasParams,
    PoolDisponiblesParams,
    CreateEntradaMielResponse,
    EntradasMielPaginatedResponse,
    EntradaMielDetailResponse,
    EntradaMielByFolioResponse,
    CancelarEntradaMielResponse,
    PoolDisponiblesResponse,
    EntradaMielEstadisticas,
    EntradaMielEstadisticasResponse
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
    // API 7: PATCH /api/entradas-miel/:id/cancelar
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
}