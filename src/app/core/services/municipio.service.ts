/**
 * ============================================================================
 * 🏘️ MUNICIPIO SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio para consumir las APIs de Municipios del backend
 *
 * ENDPOINTS:
 * - GET /api/municipios                          → Obtener todos los municipios
 * - GET /api/municipios?estado_codigo={code}     → Filtrar por estado
 * - GET /api/municipios/estado/:estado_codigo    → Municipios de un estado
 *
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import {
    MunicipioAPI,
    MunicipiosResponse
} from '../models/municipio.model';

@Injectable({
    providedIn: 'root'
})
export class MunicipioService {
    private httpService = inject(HttpService);

    private readonly BASE_PATH = 'municipios';

    // ============================================================================
    // API 1: GET /api/municipios
    // ============================================================================

    /**
     * Obtener todos los municipios de México
     * Opcionalmente puede filtrarse por estado usando query params
     *
     * @param estadoCodigo Código del estado para filtrar (opcional)
     * @returns Observable con array de municipios
     */
    getAllMunicipios(estadoCodigo?: string): Observable<MunicipioAPI[]> {
        const url = estadoCodigo
            ? `${this.BASE_PATH}?estado_codigo=${estadoCodigo}`
            : this.BASE_PATH;

        return this.httpService
            .get<MunicipiosResponse>(url)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 2: GET /api/municipios/estado/:estado_codigo
    // ============================================================================

    /**
     * Obtener municipios de un estado específico
     * Endpoint alternativo al anterior
     *
     * @param estadoCodigo Código INEGI del estado (ej: "20" para Oaxaca)
     * @returns Observable con array de municipios del estado
     */
    getMunicipiosByEstado(estadoCodigo: string): Observable<MunicipioAPI[]> {
        return this.httpService
            .get<MunicipiosResponse>(`${this.BASE_PATH}/estado/${estadoCodigo}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // MÉTODOS HELPER
    // ============================================================================

    /**
     * Buscar nombre del municipio por su clave y estado
     * Útil para mostrar labels en lugar de códigos
     *
     * @param claveMunicipio Clave del municipio
     * @param estadoCodigo Código del estado
     * @returns Observable con el nombre del municipio
     */
    getNombreMunicipio(claveMunicipio: string, estadoCodigo: string): Observable<string | null> {
        return this.getMunicipiosByEstado(estadoCodigo).pipe(
            map(municipios => {
                const municipio = municipios.find(m => m.clave_municipio === claveMunicipio);
                return municipio ? municipio.nombreMunicipio : null;
            })
        );
    }
}
