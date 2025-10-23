/**
 * ============================================================================
 * 🗺️ ESTADO SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio para consumir las APIs de Estados del backend
 *
 * ENDPOINTS:
 * - GET /api/estados                 → Obtener todos los estados
 * - GET /api/estados/:codigo_inegi   → Obtener estado por código
 *
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import {
    EstadoAPI,
    EstadosResponse,
    EstadoDetailResponse
} from '../models/estado.model';

@Injectable({
    providedIn: 'root'
})
export class EstadoService {
    private httpService = inject(HttpService);

    private readonly BASE_PATH = 'estados';

    // ============================================================================
    // API 1: GET /api/estados
    // ============================================================================

    /**
     * Obtener todos los estados de México
     *
     * @returns Observable con array de estados (32 estados)
     */
    getAllEstados(): Observable<EstadoAPI[]> {
        return this.httpService
            .get<EstadosResponse>(this.BASE_PATH)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 2: GET /api/estados/:codigo_inegi
    // ============================================================================

    /**
     * Obtener un estado específico por su código INEGI
     *
     * @param codigoInegi Código INEGI del estado (ej: "20" para Oaxaca)
     * @returns Observable con el estado encontrado
     */
    getEstadoByCodigo(codigoInegi: string): Observable<EstadoAPI> {
        return this.httpService
            .get<EstadoDetailResponse>(`${this.BASE_PATH}/${codigoInegi}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // MÉTODOS HELPER
    // ============================================================================

    /**
     * Buscar nombre del estado por su código INEGI
     * Útil para mostrar labels en lugar de códigos
     *
     * @param codigoInegi Código INEGI del estado
     * @returns Observable con el nombre del estado
     */
    getNombreEstado(codigoInegi: string): Observable<string> {
        return this.getEstadoByCodigo(codigoInegi).pipe(
            map(estado => estado.estado)
        );
    }
}
