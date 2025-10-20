/**
 * ============================================================================
 * 🚛 CHOFER SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Servicio para gestión de choferes
 * 
 * ENDPOINTS:
 * - GET /api/choferes/activos (select options)
 * - GET /api/choferes (listado con filtros)
 * - GET /api/choferes/:id (detalle con estadísticas)
 * 
 * ROLES: ADMINISTRADOR, ACOPIADOR
 * 
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from './http.service';
import { ApiResponse } from '../models/user.model';
import {
    Chofer,
    ChoferSelectOption,
    ChoferConEstadisticas,
    ChoferFilterParams,
    ChoferesResponse
} from '../models/index';

@Injectable({
    providedIn: 'root'
})
export class ChoferService {
    private http = inject(HttpService);
    private readonly BASE_URL = '/choferes';

    // ============================================================================
    // READ OPERATIONS
    // ============================================================================

    /**
     * Obtener choferes activos para select
     * GET /api/choferes/activos
     * 
     * @returns Observable con array de choferes activos
     * 
     * @example
     * this.choferService.getChoferesActivos().subscribe(choferes => {
     *   this.choferesOptions = choferes;
     * });
     */
    getChoferesActivos(): Observable<ChoferSelectOption[]> {
        return this.http.get<ApiResponse<ChoferSelectOption[]>>(`${this.BASE_URL}/activos`)
            .pipe(
                map(response => response.data)
            );
    }

    /**
     * Buscar choferes con filtros y paginación
     * GET /api/choferes
     * 
     * @param params - Parámetros de filtro (nombre, alias, estatus, page, limit)
     * @returns Observable con respuesta paginada de choferes
     * 
     * @example
     * const params = { estatus: EstatusChofer.ACTIVO, page: 1, limit: 10 };
     * this.choferService.getChoferes(params).subscribe(response => {
     *   this.choferes = response.data;
     *   this.totalPages = response.pagination.totalPages;
     * });
     */
    getChoferes(params?: ChoferFilterParams): Observable<ChoferesResponse> {
        return this.http.get<any>(this.BASE_URL, params as any)
            .pipe(
                map(response => ({
                    data: response.data,
                    pagination: response.pagination || {
                        page: 1,
                        limit: 10,
                        total: response.data.length,
                        totalPages: 1
                    }
                }))
            );
    }

    /**
     * Obtener detalle de un chofer con estadísticas
     * GET /api/choferes/:id
     * 
     * @param id - ID del chofer
     * @returns Observable con chofer y estadísticas
     * 
     * @example
     * this.choferService.getChoferById('clxxx123').subscribe(chofer => {
     *   console.log('Total salidas:', chofer.estadisticas.totalSalidas);
     * });
     */
    getChoferById(id: string): Observable<ChoferConEstadisticas> {
        return this.http.get<ApiResponse<ChoferConEstadisticas>>(`${this.BASE_URL}/${id}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Formatear nombre completo del chofer (con alias si existe)
     * 
     * @param chofer - Chofer o ChoferSelectOption
     * @returns Nombre formateado: "Juan Pérez (Juanito)" o "Juan Pérez"
     */
    formatNombreChofer(chofer: { nombre: string; alias: string | null }): string {
        return chofer.alias
            ? `${chofer.nombre} (${chofer.alias})`
            : chofer.nombre;
    }
}