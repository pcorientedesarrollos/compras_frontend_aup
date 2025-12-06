/**
 * Service: Lista de Precios
 * Fecha: 2025-11-17
 * Actualizado: Diciembre 2024 - API v2.0 con estructura de 2 niveles
 * Descripción: Gestión de precios por tipo de miel
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../../../core/services/http.service';
import {
  TipoMielResumen,
  PrecioDetalle,
  PrecioActualizado,
  HistorialPrecio,
  ClasificacionPrecio
} from '../../../core/models/lista-precios.model';
import { ApiResponse } from '../../../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ListaPreciosService {
  private httpService = inject(HttpService);
  private endpoint = 'lista-precios';

  /**
   * Nivel 1: Obtener lista de tipos de miel con conteo de precios asignados
   */
  getTiposMiel(): Observable<TipoMielResumen[]> {
    return this.httpService.get<ApiResponse<TipoMielResumen[]>>(`${this.endpoint}/tipos-miel`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Nivel 2: Obtener los 4 precios de un tipo de miel específico
   * @param tipoMielId - ID del tipo de miel
   */
  getPreciosPorTipo(tipoMielId: number): Observable<PrecioDetalle[]> {
    return this.httpService.get<ApiResponse<PrecioDetalle[]>>(
      `${this.endpoint}/tipo-miel/${tipoMielId}`
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Actualizar precio de un tipo de miel específico
   * @param id - ID del registro de precio (CUID)
   * @param precio - Nuevo precio
   * @param motivoCambio - Motivo del cambio (opcional)
   */
  updatePrecio(id: string, precio: number, motivoCambio?: string): Observable<PrecioActualizado> {
    const dto = { precio, ...(motivoCambio && { motivoCambio }) };
    return this.httpService.put<ApiResponse<PrecioActualizado>>(
      `${this.endpoint}/${id}`,
      dto
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtener historial de cambios de precio
   * @param id - ID del registro de precio (CUID)
   */
  getHistorial(id: string): Observable<HistorialPrecio[]> {
    return this.httpService.get<ApiResponse<HistorialPrecio[]>>(
      `${this.endpoint}/${id}/historial`
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtener precio por tipo de miel y clasificación
   * @param tipoMielId - ID del tipo de miel
   * @param clasificacion - Clasificación de la miel
   * @returns Precio encontrado o null si no existe
   */
  getPrecioPorTipoYClasificacion(
    tipoMielId: number,
    clasificacion: ClasificacionPrecio
  ): Observable<number | null> {
    return this.getPreciosPorTipo(tipoMielId).pipe(
      map(precios => {
        const precioEncontrado = precios.find(
          p => p.clasificacion === clasificacion && p.existeRegistro
        );
        return precioEncontrado ? precioEncontrado.precio : null;
      })
    );
  }
}
