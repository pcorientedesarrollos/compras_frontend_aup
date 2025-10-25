import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import { HttpParams } from '@angular/common/http';
import {
  DetalleDisponibleParaTambor,
  TamborEncabezado,
  TamborDetalle,
  CreateTamborRequest,
  CancelarTamborRequest,
  FiltrosDetallesDisponibles,
  FiltrosTambores
} from '../models/tambor.model';
import { PaginatedResponse } from '../models/pagination.model';

/**
 * Respuesta simple del API (sin paginación)
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TamborService {
  private httpService = inject(HttpService);

  /**
   * Obtiene detalles de entradas disponibles para asignar a tambores
   * Endpoint: GET /api/entradas-miel/disponibles/tambores
   */
  getDetallesDisponibles(filtros?: FiltrosDetallesDisponibles): Observable<DetalleDisponibleParaTambor[]> {
    let params = new HttpParams();

    if (filtros?.clasificacion) {
      params = params.set('clasificacion', filtros.clasificacion);
    }
    if (filtros?.tipoMielId) {
      params = params.set('tipoMielId', filtros.tipoMielId.toString());
    }
    if (filtros?.page) {
      params = params.set('page', filtros.page.toString());
    }
    if (filtros?.limit) {
      params = params.set('limit', filtros.limit.toString());
    }

    return this.httpService
      .get<PaginatedResponse<DetalleDisponibleParaTambor>>('entradas-miel/disponibles/tambores', params)
      .pipe(map(response => response.data));
  }

  /**
   * Crea un nuevo tambor
   * Endpoint: POST /api/tambores
   */
  createTambor(request: CreateTamborRequest): Observable<TamborDetalle> {
    return this.httpService
      .post<ApiResponse<TamborDetalle>>('tambores', request)
      .pipe(map(response => response.data));
  }

  /**
   * Busca tambores con filtros
   * Endpoint: GET /api/tambores
   */
  searchTambores(filtros?: FiltrosTambores): Observable<TamborEncabezado[]> {
    let params = new HttpParams();

    if (filtros?.consecutivo) {
      params = params.set('consecutivo', filtros.consecutivo);
    }
    if (filtros?.proveedorId) {
      params = params.set('proveedorId', filtros.proveedorId.toString());
    }
    if (filtros?.tipoMielId) {
      params = params.set('tipoMielId', filtros.tipoMielId.toString());
    }
    if (filtros?.clasificacion) {
      params = params.set('clasificacion', filtros.clasificacion);
    }
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    if (filtros?.page) {
      params = params.set('page', filtros.page.toString());
    }
    if (filtros?.limit) {
      params = params.set('limit', filtros.limit.toString());
    }
    if (filtros?.sortBy) {
      params = params.set('sortBy', filtros.sortBy);
    }
    if (filtros?.sortOrder) {
      params = params.set('sortOrder', filtros.sortOrder);
    }

    return this.httpService
      .get<PaginatedResponse<TamborEncabezado>>('tambores', params)
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene detalle completo de un tambor por ID
   * Endpoint: GET /api/tambores/:id
   */
  getTamborById(id: string): Observable<TamborDetalle> {
    return this.httpService
      .get<ApiResponse<TamborDetalle>>(`tambores/${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene tambor por consecutivo
   * Endpoint: GET /api/tambores/consecutivo/:consecutivo
   */
  getTamborByConsecutivo(consecutivo: string): Observable<TamborDetalle> {
    return this.httpService
      .get<ApiResponse<TamborDetalle>>(`tambores/consecutivo/${consecutivo}`)
      .pipe(map(response => response.data));
  }

  /**
   * Cancela un tambor y libera los lotes
   * Endpoint: PATCH /api/tambores/:id/cancelar
   */
  cancelarTambor(id: string, motivo: string): Observable<TamborDetalle> {
    const request: CancelarTamborRequest = { motivoCancelacion: motivo };
    return this.httpService
      .patch<ApiResponse<TamborDetalle>>(`tambores/${id}/cancelar`, request)
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene estadísticas de tambores
   * Endpoint: GET /api/tambores/estadisticas
   */
  getEstadisticas(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let params = new HttpParams();

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.httpService
      .get<ApiResponse<any>>('tambores/estadisticas', params)
      .pipe(map(response => response.data));
  }
}
