/**
 * ============================================================================
 * 🏢 PROVEEDOR SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Servicio para consumir las APIs de Proveedores del backend
 * 
 * ENDPOINTS:
 * - GET /api/proveedores/activos          → Lista proveedores activos
 * - GET /api/proveedores/tipos-miel       → Catálogo de tipos de miel
 * - GET /api/proveedores                  → Búsqueda con filtros + paginación
 * - GET /api/proveedores/:id              → Detalle de un proveedor
 * - GET /api/proveedores/:id/apicultores  → Apicultores de un proveedor
 * 
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import {
    ProveedorAPI,
    TipoDeMiel,
    ApicultorDeProveedor,
    ProveedoresActivosResponse,
    TiposMielResponse,
    ProveedoresPaginatedResponse,
    ProveedorDetailResponse,
    ApicultoresDeProveedorResponse,
    ProveedorFilterParams,
    ApicultoresProveedorParams
} from '../models/index';

@Injectable({
    providedIn: 'root'
})
export class ProveedorService {
    private httpService = inject(HttpService);

    private readonly BASE_PATH = 'proveedores';

    // ============================================================================
    // API 1: GET /api/proveedores/activos
    // ============================================================================

    /**
     * Obtiene todos los proveedores activos
     * Ideal para poblar dropdowns/selects
     * 
     * @returns Observable con array de proveedores activos
     */
    getProveedoresActivos(): Observable<ProveedorAPI[]> {
        return this.httpService
            .get<ProveedoresActivosResponse>(`${this.BASE_PATH}/activos`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 2: GET /api/proveedores/tipos-miel
    // ============================================================================

    /**
     * Obtiene el catálogo completo de tipos de miel
     * Tabla de solo lectura (NO modificable)
     * 
     * @returns Observable con array de tipos de miel
     */
    getTiposMiel(): Observable<TipoDeMiel[]> {
        return this.httpService
            .get<TiposMielResponse>(`${this.BASE_PATH}/tipos-miel`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 3: GET /api/proveedores
    // ============================================================================

    /**
     * Búsqueda avanzada de proveedores con filtros y paginación
     * 
     * @param filters Parámetros de filtrado (nombre, tipo, estado, etc.)
     * @returns Observable con respuesta paginada
     * 
     * @example
     * ```typescript
     * const filters: ProveedorFilterParams = {
     *   nombre: 'Acopiadora',
     *   tipo: 'ACOPIADOR',
     *   activoInactivo: 1,
     *   page: 1,
     *   limit: 10
     * };
     * 
     * this.proveedorService.searchProveedores(filters).subscribe(response => {
     *   console.log(response.data); // Array de proveedores
     *   console.log(response.pagination); // Info de paginación
     * });
     * ```
     */
    searchProveedores(filters: ProveedorFilterParams = {}): Observable<ProveedoresPaginatedResponse> {
        // Construir query params dinámicamente (solo los que tienen valor)
        const params: Record<string, string> = {};

        if (filters.nombre) params['nombre'] = filters.nombre;
        if (filters.tipo) params['tipo'] = filters.tipo;
        if (filters.idEstado !== undefined) params['idEstado'] = filters.idEstado.toString();
        if (filters.tipoDeMiel !== undefined) params['tipoDeMiel'] = filters.tipoDeMiel.toString();
        if (filters.activoInactivo !== undefined) params['activoInactivo'] = filters.activoInactivo.toString();
        if (filters.page) params['page'] = filters.page.toString();
        if (filters.limit) params['limit'] = filters.limit.toString();

        // Construir query string
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${this.BASE_PATH}?${queryString}` : this.BASE_PATH;

        return this.httpService.get<ProveedoresPaginatedResponse>(url);
    }

    // ============================================================================
    // API 4: GET /api/proveedores/:id
    // ============================================================================

    /**
     * Obtiene la información completa de un proveedor por su ID
     * 
     * @param id ID del proveedor
     * @returns Observable con datos del proveedor
     * @throws NotFoundException (404) si el proveedor no existe
     * 
     * @example
     * ```typescript
     * this.proveedorService.getProveedorById(1).subscribe(
     *   proveedor => console.log(proveedor),
     *   error => console.error('Proveedor no encontrado')
     * );
     * ```
     */
    getProveedorById(id: number): Observable<ProveedorAPI> {
        return this.httpService
            .get<ProveedorDetailResponse>(`${this.BASE_PATH}/${id}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 5: GET /api/proveedores/:id/apicultores
    // ============================================================================

    /**
     * Obtiene los apicultores asociados a un proveedor específico
     * Con paginación
     * 
     * @param id ID del proveedor
     * @param params Parámetros de paginación (page, limit)
     * @returns Observable con respuesta paginada de apicultores
     * @throws NotFoundException (404) si el proveedor no existe
     * 
     * @example
     * ```typescript
     * const params: ApicultoresProveedorParams = {
     *   page: 1,
     *   limit: 10
     * };
     * 
     * this.proveedorService.getApicultoresDeProveedor(1, params).subscribe(
     *   response => {
     *     console.log(response.data); // Array de apicultores
     *     console.log(response.pagination.total); // Total de apicultores
     *   }
     * );
     * ```
     */
    getApicultoresDeProveedor(
        id: number,
        params: ApicultoresProveedorParams = {}
    ): Observable<ApicultoresDeProveedorResponse> {
        // Construir query params
        const queryParams: Record<string, string> = {};
        if (params.page) queryParams['page'] = params.page.toString();
        if (params.limit) queryParams['limit'] = params.limit.toString();

        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString
            ? `${this.BASE_PATH}/${id}/apicultores?${queryString}`
            : `${this.BASE_PATH}/${id}/apicultores`;

        return this.httpService.get<ApicultoresDeProveedorResponse>(url);
    }

    // ============================================================================
    // MÉTODOS HELPER (Opcionales)
    // ============================================================================

    /**
     * Verifica si un proveedor está activo
     */
    isProveedorActivo(proveedor: ProveedorAPI): boolean {
        return proveedor.activoInactivo === 1;
    }

    /**
     * Obtiene el total de proveedores activos (wrapper)
     */
    getTotalProveedoresActivos(): Observable<number> {
        return this.getProveedoresActivos().pipe(
            map(proveedores => proveedores.length)
        );
    }

    /**
     * Busca un tipo de miel específico por ID
     */
    getTipoMielById(id: number): Observable<TipoDeMiel | undefined> {
        return this.getTiposMiel().pipe(
            map(tipos => tipos.find(t => t.idTipoDeMiel === id))
        );
    }
}