/**
 * ============================================================================
 * 📊 DIFERENCIAS DE PRECIO SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio para auditoría de diferencias entre precios oficiales y capturados
 * Solo accesible para ADMINISTRADORES
 *
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../../../core/services/http.service';
import { ApiResponse } from '../../../core/models/user.model';
import {
  DiferenciaPrecio,
  ResumenProveedorDiferencias,
  EstadisticasDiferencias,
  FiltrosDiferenciasPrecio,
  DiferenciasPrecioResponse,
  PaginationMeta
} from '../../../core/models/diferencias-precio.model';

@Injectable({
  providedIn: 'root'
})
export class DiferenciasPrecioService {
  private httpService = inject(HttpService);
  private endpoint = '/diferencias-precio';

  /**
   * 1. Buscar diferencias con filtros y paginación
   * GET /api/diferencias-precio
   */
  getDiferencias(filtros?: FiltrosDiferenciasPrecio): Observable<DiferenciasPrecioResponse> {
    // Construir query params
    const params: any = {};

    if (filtros?.proveedorId) params.proveedorId = filtros.proveedorId;
    if (filtros?.tipoMielId) params.tipoMielId = filtros.tipoMielId;
    if (filtros?.clasificacion) params.clasificacion = filtros.clasificacion;
    if (filtros?.entradaId) params.entradaId = filtros.entradaId;
    if (filtros?.fechaInicio) params.fechaInicio = filtros.fechaInicio;
    if (filtros?.fechaFin) params.fechaFin = filtros.fechaFin;
    if (filtros?.page) params.page = filtros.page;
    if (filtros?.limit) params.limit = filtros.limit;
    if (filtros?.sortBy) params.sortBy = filtros.sortBy;
    if (filtros?.sortOrder) params.sortOrder = filtros.sortOrder;

    // El API retorna: { success, data: DiferenciaPrecio[], pagination }
    return this.httpService.get<{
      success: boolean;
      data: DiferenciaPrecio[];
      pagination: PaginationMeta;
    }>(this.endpoint, params).pipe(
      map(response => ({
        diferencias: response.data,
        pagination: response.pagination
      }))
    );
  }

  /**
   * 2. Resumen de diferencias por proveedor
   * GET /api/diferencias-precio/resumen/proveedor
   */
  getResumenProveedor(proveedorId?: number): Observable<ResumenProveedorDiferencias[]> {
    const params = proveedorId ? { proveedorId } : {};

    return this.httpService.get<ApiResponse<ResumenProveedorDiferencias[]>>(
      `${this.endpoint}/resumen/proveedor`,
      params
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * 3. Estadísticas globales de diferencias
   * GET /api/diferencias-precio/estadisticas
   */
  getEstadisticas(fechaInicio?: string, fechaFin?: string): Observable<EstadisticasDiferencias> {
    const params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;

    return this.httpService.get<ApiResponse<EstadisticasDiferencias>>(
      `${this.endpoint}/estadisticas`,
      params
    ).pipe(
      map(response => response.data)
    );
  }
}
