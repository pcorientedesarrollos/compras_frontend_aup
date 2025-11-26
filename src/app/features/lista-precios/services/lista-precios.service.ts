/**
 * Service: Lista de Precios
 * Fecha: 2025-11-17
 * Descripción: Gestión de precios por tipo de miel
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../../../core/services/http.service';
import {
  TipoMielPrecio,
  UpdatePrecioDto,
  HistorialPrecio
} from '../../../core/models/lista-precios.model';
import { ApiResponse } from '../../../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ListaPreciosService {
  private httpService = inject(HttpService);
  private endpoint = 'lista-precios';

  /**
   * Obtener todos los tipos de miel con sus precios
   */
  getListaPrecios(): Observable<TipoMielPrecio[]> {
    return this.httpService.get<ApiResponse<TipoMielPrecio[]>>(this.endpoint)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Actualizar precio de un tipo de miel específico
   * @param id - ID del registro de precio (CUID)
   * @param precio - Nuevo precio
   */
  updatePrecio(id: string, precio: number): Observable<TipoMielPrecio> {
    const dto: UpdatePrecioDto = { precio };
    return this.httpService.put<ApiResponse<TipoMielPrecio>>(
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
   * @param clasificacion - 'EXPORTACION', 'NACIONAL' o 'INDUSTRIA'
   * @returns Precio encontrado o null si no existe
   */
  getPrecioPorTipoYClasificacion(tipoMielId: number, clasificacion: 'EXPORTACION' | 'NACIONAL' | 'INDUSTRIA'): Observable<number | null> {
    return this.getListaPrecios().pipe(
      map(precios => {
        const precioEncontrado = precios.find(
          p => p.tipoMielId === tipoMielId && p.clasificacion === clasificacion
        );
        return precioEncontrado ? precioEncontrado.precio : null;
      })
    );
  }
}
