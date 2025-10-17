/**
 * ============================================================================
 * 🐝 APIARIO SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Servicio para consumir las APIs de Apiarios del backend
 * 
 * ENDPOINTS:
 * - GET /api/apiarios                     → Búsqueda con filtros + paginación
 * - GET /api/apiarios/:id                 → Detalle de un apiario
 * - POST /api/apiarios                    → Crear apiario
 * - PUT /api/apiarios/:id                 → Actualizar apiario
 * - DELETE /api/apiarios/:id              → Eliminar apiario
 * - GET /api/apiarios/apicultor/:id       → Apiarios de un apicultor
 * - GET /api/apiarios/region              → Apiarios por región
 * - GET /api/apiarios/estadisticas        → Estadísticas generales
 * 
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import {
    ApiarioAPI,
    ApiarioDetailAPI,
    ApiarioDeApicultor,
    CreateApiarioRequest,
    UpdateApiarioRequest,
    ApiarioFilterParams,
    ApiarioRegionParams,
    ApiarioEstadisticasParams,
    ApiariosPaginatedResponse,
    ApiarioDetailResponse,
    CreateApiarioResponse,
    UpdateApiarioResponse,
    DeleteApiarioResponse,
    ApiariosDeApicultorResponse,
    ApiarioEstadisticas,
    ApiarioEstadisticasResponse
} from '../models/index';

@Injectable({
    providedIn: 'root'
})
export class ApiarioService {
    private httpService = inject(HttpService);

    private readonly BASE_PATH = 'apiarios';

    // ============================================================================
    // API 1: GET /api/apiarios (CON FILTROS)
    // ============================================================================

    /**
     * Buscar apiarios con filtros avanzados y paginación
     * Los ACOPIADORES solo ven apiarios de apicultores vinculados
     * Los APICULTORES solo ven sus propios apiarios
     * 
     * @param params Parámetros de filtrado y paginación
     * @returns Observable con lista paginada de apiarios
     */
    getApiarios(params: ApiarioFilterParams = {}): Observable<ApiariosPaginatedResponse> {
        // Construir query params dinámicamente (solo los que tienen valor)
        const queryParams: Record<string, string> = {};

        if (params.apicultorId) queryParams['apicultorId'] = params.apicultorId;
        if (params.nombre) queryParams['nombre'] = params.nombre;
        if (params.estadoCodigo) queryParams['estadoCodigo'] = params.estadoCodigo;
        if (params.municipioCodigo) queryParams['municipioCodigo'] = params.municipioCodigo;
        if (params.colmenasMin) queryParams['colmenasMin'] = params.colmenasMin.toString();
        if (params.colmenasMax) queryParams['colmenasMax'] = params.colmenasMax.toString();
        if (params.sortBy) queryParams['sortBy'] = params.sortBy;
        if (params.sortOrder) queryParams['sortOrder'] = params.sortOrder;
        if (params.page) queryParams['page'] = params.page.toString();
        if (params.limit) queryParams['limit'] = params.limit.toString();

        // Construir query string
        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString ? `${this.BASE_PATH}?${queryString}` : this.BASE_PATH;

        return this.httpService.get<ApiariosPaginatedResponse>(url);
    }

    /**
     * Obtener TODOS los apiarios sin paginación (para filtrado local)
     * Útil para tablas con filtrado frontend
     * 
     * @returns Observable con todos los apiarios
     */
    getAllApiarios(): Observable<ApiarioAPI[]> {
        const url = `${this.BASE_PATH}?page=1&limit=9999`;

        return this.httpService
            .get<ApiariosPaginatedResponse>(url)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 2: GET /api/apiarios/:id
    // ============================================================================

    /**
     * Obtener información completa de un apiario por su ID
     * Incluye información detallada del apicultor propietario
     * 
     * @param id ID del apiario (CUID)
     * @returns Observable con el apiario completo
     */
    getApiarioById(id: string): Observable<ApiarioDetailAPI> {
        return this.httpService
            .get<ApiarioDetailResponse>(`${this.BASE_PATH}/${id}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 3: POST /api/apiarios
    // ============================================================================

    /**
     * Crear un nuevo apiario
     * Requiere que el apicultor exista y esté ACTIVO
     * 
     * @param data Datos del apiario a crear
     * @returns Observable con el apiario creado
     */
    createApiario(data: CreateApiarioRequest): Observable<ApiarioDetailAPI> {
        return this.httpService
            .post<CreateApiarioResponse>(this.BASE_PATH, data)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 4: PUT /api/apiarios/:id
    // ============================================================================

    /**
     * Actualizar un apiario existente
     * Solo se pueden actualizar: nombre, colmenas, latitud, longitud
     * No se puede cambiar el apicultorId
     * 
     * @param id ID del apiario a actualizar
     * @param data Datos a actualizar (todos opcionales)
     * @returns Observable con el apiario actualizado
     */
    updateApiario(id: string, data: UpdateApiarioRequest): Observable<ApiarioDetailAPI> {
        return this.httpService
            .put<UpdateApiarioResponse>(`${this.BASE_PATH}/${id}`, data)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 5: DELETE /api/apiarios/:id
    // ============================================================================

    /**
     * Eliminar un apiario
     * Solo ADMINISTRADOR puede eliminar
     * Registra en historial de auditoría
     * 
     * @param id ID del apiario a eliminar
     * @returns Observable con mensaje de confirmación
     */
    deleteApiario(id: string): Observable<string> {
        return this.httpService
            .delete<DeleteApiarioResponse>(`${this.BASE_PATH}/${id}`)
            .pipe(
                map(response => response.message)
            );
    }

    // ============================================================================
    // API 6: GET /api/apiarios/apicultor/:apicultorId
    // ============================================================================

    /**
     * Obtener todos los apiarios de un apicultor específico
     * Incluye paginación
     * 
     * @param apicultorId ID del apicultor
     * @param page Número de página (default: 1)
     * @param limit Registros por página (default: 20)
     * @returns Observable con lista paginada de apiarios
     */
    getApiariosByApicultor(
        apicultorId: string,
        page: number = 1,
        limit: number = 20
    ): Observable<ApiariosDeApicultorResponse> {
        // Construir query params
        const queryParams: Record<string, string> = {};
        if (page) queryParams['page'] = page.toString();
        if (limit) queryParams['limit'] = limit.toString();

        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString
            ? `${this.BASE_PATH}/apicultor/${apicultorId}?${queryString}`
            : `${this.BASE_PATH}/apicultor/${apicultorId}`;

        return this.httpService.get<ApiariosDeApicultorResponse>(url);
    }

    /**
     * Obtener TODOS los apiarios de un apicultor sin paginación
     * 
     * @param apicultorId ID del apicultor
     * @returns Observable con todos los apiarios del apicultor
     */
    getAllApiariosByApicultor(apicultorId: string): Observable<ApiarioDeApicultor[]> {
        const url = `${this.BASE_PATH}/apicultor/${apicultorId}?page=1&limit=9999`;

        return this.httpService
            .get<ApiariosDeApicultorResponse>(url)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 7: GET /api/apiarios/region
    // ============================================================================

    /**
     * Obtener apiarios filtrados por región (estado/municipio del apicultor)
     * Útil para análisis geográfico
     * 
     * @param params Parámetros de región y paginación
     * @returns Observable con lista paginada de apiarios
     */
    getApiariosByRegion(params: ApiarioRegionParams): Observable<ApiariosPaginatedResponse> {
        // Construir query params
        const queryParams: Record<string, string> = {};

        if (params.estadoCodigo) queryParams['estadoCodigo'] = params.estadoCodigo;
        if (params.municipioCodigo) queryParams['municipioCodigo'] = params.municipioCodigo;
        if (params.page) queryParams['page'] = params.page.toString();
        if (params.limit) queryParams['limit'] = params.limit.toString();

        const queryString = new URLSearchParams(queryParams).toString();
        const url = `${this.BASE_PATH}/region?${queryString}`;

        return this.httpService.get<ApiariosPaginatedResponse>(url);
    }

    // ============================================================================
    // API 8: GET /api/apiarios/estadisticas
    // ============================================================================

    /**
     * Obtener estadísticas generales de apiarios
     * Solo ADMINISTRADOR, ACOPIADOR y MIELERA
     * 
     * @param params Filtros opcionales (estadoCodigo, apicultorId)
     * @returns Observable con estadísticas completas
     */
    getEstadisticas(params: ApiarioEstadisticasParams = {}): Observable<ApiarioEstadisticas> {
        // Construir query params
        const queryParams: Record<string, string> = {};

        if (params.estadoCodigo) queryParams['estadoCodigo'] = params.estadoCodigo;
        if (params.apicultorId) queryParams['apicultorId'] = params.apicultorId;

        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString
            ? `${this.BASE_PATH}/estadisticas?${queryString}`
            : `${this.BASE_PATH}/estadisticas`;

        return this.httpService
            .get<ApiarioEstadisticasResponse>(url)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // MÉTODOS HELPER
    // ============================================================================

    /**
     * Formatea coordenadas GPS para mostrar
     * 
     * @param latitud Coordenada latitud
     * @param longitud Coordenada longitud
     * @returns String formateado "LAT, LONG"
     */
    formatCoordenadas(latitud: number, longitud: number): string {
        return `${latitud.toFixed(6)}, ${longitud.toFixed(6)}`;
    }

    /**
     * Valida si las coordenadas están en rango válido
     * 
     * @param latitud Coordenada latitud
     * @param longitud Coordenada longitud
     * @returns true si las coordenadas son válidas
     */
    validarCoordenadas(latitud: number, longitud: number): boolean {
        return latitud >= -90 && latitud <= 90 && longitud >= -180 && longitud <= 180;
    }

    /**
     * Calcula la distancia aproximada entre dos coordenadas (en km)
     * Usa la fórmula de Haversine
     * 
     * @param lat1 Latitud punto 1
     * @param lon1 Longitud punto 1
     * @param lat2 Latitud punto 2
     * @param lon2 Longitud punto 2
     * @returns Distancia en kilómetros
     */
    calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convierte grados a radianes
     */
    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Obtiene el total de colmenas de múltiples apiarios
     * 
     * @param apiarios Lista de apiarios
     * @returns Total de colmenas
     */
    getTotalColmenas(apiarios: ApiarioAPI[] | ApiarioDeApicultor[]): number {
        return apiarios.reduce((total, apiario) => total + apiario.colmenas, 0);
    }
}