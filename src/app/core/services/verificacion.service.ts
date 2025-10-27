/**
 * ============================================================================
 * VERIFICACION SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio para el módulo de Verificación (Llegadas de Chofer)
 * Basado en DOCS_FRONTEND_VERIFICACION_COMPLETA.md v2.0
 *
 * ENDPOINTS:
 * - GET    /api/verificadores/llegadas                    → Llegadas agrupadas por chofer
 * - GET    /api/verificadores/llegadas/:choferId          → Detalle de llegada (jerárquico)
 * - PATCH  /api/salidas-miel/:salidaId/detalles/:detalleId/verificar  → Verificar tambor
 * - PATCH  /api/salidas-miel/:salidaId/finalizar-verificacion         → Finalizar salida
 * - GET    /api/verificadores/mis-verificaciones          → Historial
 * - GET    /api/verificadores/mis-verificaciones/:id/detalle  → Detalle verificación
 * - GET    /api/verificadores/mis-verificaciones/resumen  → Resumen estadístico
 * - GET    /api/inventario/tambores-verificados           → Inventario en planta
 *
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import {
  LlegadaChoferResponse,
  DetalleLlegadaParaVerificar,
  VerificarTamborDTO,
  VerificacionTamborResponse,
  ResumenVerificacionSalida,
  VerificacionResponse,
  DetalleVerificacionResponse,
  ResumenVerificacionesResponse,
  TamborInventarioResponse,
  MisVerificacionesParams,
  InventarioPlantaParams,
  LlegadasChoferResponse,
  DetalleLlegadaResponse,
  VerificacionTamborApiResponse,
  FinalizarVerificacionResponse,
  VerificacionesListResponse,
  DetalleVerificacionApiResponse,
  ResumenVerificacionesApiResponse,
  InventarioPlantaApiResponse
} from '../models/verificador.model';

@Injectable({
  providedIn: 'root'
})
export class VerificacionService {
  private httpService = inject(HttpService);

  private readonly VERIFICADORES_PATH = 'verificadores';
  private readonly SALIDAS_PATH = 'salidas-miel';
  private readonly INVENTARIO_PATH = 'inventario';

  // ============================================================================
  // LLEGADAS DE CHOFER
  // ============================================================================

  /**
   * Obtener lista de llegadas agrupadas por chofer
   * Solo incluye llegadas con estado EN_TRANSITO o EN_VERIFICACION
   */
  getLlegadas(): Observable<LlegadaChoferResponse[]> {
    return this.httpService
      .get<LlegadasChoferResponse>(`${this.VERIFICADORES_PATH}/llegadas`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Obtener detalle completo de una llegada (organizado jerárquicamente)
   * Chofer → Proveedores → Salidas → Tambores
   * @param choferId ID del chofer
   */
  getDetalleLlegada(choferId: string): Observable<DetalleLlegadaParaVerificar> {
    return this.httpService
      .get<DetalleLlegadaResponse>(`${this.VERIFICADORES_PATH}/llegadas/${choferId}`)
      .pipe(
        map(response => response.data)
      );
  }

  // ============================================================================
  // PROCESO DE VERIFICACIÓN
  // ============================================================================

  /**
   * Verificar un tambor individual
   * Puede incluir diferencias (kilos, humedad, floración, color) o marcar como conforme
   * @param salidaId ID de la salida
   * @param detalleId ID del detalle (tambor)
   * @param data Datos de verificación
   */
  verificarTambor(
    salidaId: string,
    detalleId: string,
    data: VerificarTamborDTO
  ): Observable<VerificacionTamborResponse> {
    return this.httpService
      .patch<VerificacionTamborApiResponse>(
        `${this.SALIDAS_PATH}/${salidaId}/detalles/${detalleId}/verificar`,
        data
      )
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Finalizar verificación completa de una salida
   * Requiere que todos los tambores estén verificados
   * Cambia estado de EN_TRANSITO a VERIFICADA
   * @param salidaId ID de la salida
   */
  finalizarVerificacionSalida(salidaId: string): Observable<ResumenVerificacionSalida> {
    return this.httpService
      .patch<FinalizarVerificacionResponse>(
        `${this.SALIDAS_PATH}/${salidaId}/finalizar-verificacion`,
        {}
      )
      .pipe(
        map(response => response.data)
      );
  }

  // ============================================================================
  // MIS VERIFICACIONES (HISTORIAL)
  // ============================================================================

  /**
   * Obtener historial de verificaciones completadas
   * @param params Parámetros de filtrado y paginación
   */
  getMisVerificaciones(params: MisVerificacionesParams = {}): Observable<{
    data: VerificacionResponse[];
    pagination?: any;
  }> {
    const queryParams: Record<string, string> = {};

    if (params.page) queryParams['page'] = params.page.toString();
    if (params.limit) queryParams['limit'] = params.limit.toString();
    if (params.fechaDesde) queryParams['fechaDesde'] = params.fechaDesde;
    if (params.fechaHasta) queryParams['fechaHasta'] = params.fechaHasta;
    if (params.proveedorId) queryParams['proveedorId'] = params.proveedorId.toString();

    const queryString = new URLSearchParams(queryParams).toString();
    const url = queryString
      ? `${this.VERIFICADORES_PATH}/mis-verificaciones?${queryString}`
      : `${this.VERIFICADORES_PATH}/mis-verificaciones`;

    return this.httpService
      .get<VerificacionesListResponse>(url)
      .pipe(
        map(response => ({
          data: response.data,
          pagination: (response as any).pagination
        }))
      );
  }

  /**
   * Obtener detalle completo de una verificación
   * Incluye comparación declarado vs verificado
   * @param verificacionId ID de la verificación (salidaId)
   */
  getDetalleVerificacion(verificacionId: string): Observable<DetalleVerificacionResponse> {
    return this.httpService
      .get<DetalleVerificacionApiResponse>(
        `${this.VERIFICADORES_PATH}/mis-verificaciones/${verificacionId}/detalle`
      )
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Obtener resumen estadístico de verificaciones
   * @param params Filtros de fecha y proveedor
   */
  getResumenVerificaciones(params: {
    fechaDesde?: string;
    fechaHasta?: string;
    proveedorId?: number;
  } = {}): Observable<ResumenVerificacionesResponse> {
    const queryParams: Record<string, string> = {};

    if (params.fechaDesde) queryParams['fechaDesde'] = params.fechaDesde;
    if (params.fechaHasta) queryParams['fechaHasta'] = params.fechaHasta;
    if (params.proveedorId) queryParams['proveedorId'] = params.proveedorId.toString();

    const queryString = new URLSearchParams(queryParams).toString();
    const url = queryString
      ? `${this.VERIFICADORES_PATH}/mis-verificaciones/resumen?${queryString}`
      : `${this.VERIFICADORES_PATH}/mis-verificaciones/resumen`;

    return this.httpService
      .get<ResumenVerificacionesApiResponse>(url)
      .pipe(
        map(response => response.data)
      );
  }

  // ============================================================================
  // INVENTARIO EN PLANTA
  // ============================================================================

  /**
   * Obtener inventario de tambores verificados en planta
   * @param params Filtros de búsqueda
   */
  getInventarioPlanta(params: InventarioPlantaParams = {}): Observable<{
    data: TamborInventarioResponse[];
    pagination?: any;
  }> {
    const queryParams: Record<string, string> = {};

    if (params.search) queryParams['search'] = params.search;
    if (params.clasificacion) queryParams['clasificacion'] = params.clasificacion;
    if (params.proveedorId) queryParams['proveedorId'] = params.proveedorId.toString();
    if (params.floracionId) queryParams['floracionId'] = params.floracionId.toString();
    if (params.colorId) queryParams['colorId'] = params.colorId.toString();
    if (params.page) queryParams['page'] = params.page.toString();
    if (params.limit) queryParams['limit'] = params.limit.toString();

    const queryString = new URLSearchParams(queryParams).toString();
    const url = queryString
      ? `${this.INVENTARIO_PATH}/tambores-verificados?${queryString}`
      : `${this.INVENTARIO_PATH}/tambores-verificados`;

    return this.httpService
      .get<InventarioPlantaApiResponse>(url)
      .pipe(
        map(response => ({
          data: response.data,
          pagination: (response as any).pagination
        }))
      );
  }
}
