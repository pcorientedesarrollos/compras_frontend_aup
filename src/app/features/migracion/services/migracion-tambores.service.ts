/**
 * ============================================================================
 * MIGRACIÓN DE TAMBORES SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio para migrar salidas verificadas al sistema legacy (apicultores2025)
 * Solo accesible para VERIFICADORES y ADMINISTRADORES
 *
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../../../core/services/http.service';
import {
  MigracionSalidaRequest,
  MigracionSalidaResponse,
  HistorialMigracion,
  HistorialMigracionResponse
} from '../../../core/models/migracion-tambores.model';

@Injectable({
  providedIn: 'root'
})
export class MigracionTamboresService {
  private httpService = inject(HttpService);
  private endpoint = 'migracion';

  /**
   * 1. Migrar una salida verificada al sistema legacy
   * POST /api/migracion/migrar-salida
   *
   * @param salidaVerificadaId - ID de la salida verificada a migrar
   * @param observaciones - Observaciones opcionales de la migración
   * @returns Observable con el resultado de la migración
   */
  migrarSalida(salidaVerificadaId: string, observaciones?: string): Observable<MigracionSalidaResponse> {
    const body: MigracionSalidaRequest = {
      salidaVerificadaId,
      observaciones
    };

    return this.httpService.post<MigracionSalidaResponse>(
      `${this.endpoint}/migrar-salida`,
      body
    );
  }

  /**
   * 2. Obtener historial de migraciones
   * GET /api/migracion/historial
   *
   * @returns Observable con el listado de migraciones realizadas
   */
  getHistorial(): Observable<HistorialMigracion[]> {
    return this.httpService.get<HistorialMigracionResponse>(
      `${this.endpoint}/historial`
    ).pipe(
      map(response => response.data)
    );
  }
}
