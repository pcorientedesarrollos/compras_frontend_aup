/**
 * ============================================================================
 * 📦 SALIDA MIEL SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Servicio para gestión de salidas de miel (inventario)
 * 
 * ENDPOINTS:
 * - POST /api/salidas-miel (crear borrador)
 * - GET /api/salidas-miel (listar con filtros)
 * - GET /api/salidas-miel/folio/:folio (buscar por folio)
 * - GET /api/salidas-miel/:id (detalle completo)
 * - PATCH /api/salidas-miel/:id (actualizar borrador)
 * - POST /api/salidas-miel/:id/finalizar (finalizar y aplicar FIFO)
 * - DELETE /api/salidas-miel/:id (cancelar borrador)
 * 
 * ROLES: ADMINISTRADOR, ACOPIADOR
 * 
 * ⚠️ FLUJO:
 * 1. Crear BORRADOR (no afecta inventario)
 * 2. Editar BORRADOR (opcional)
 * 3. Finalizar → EN_TRANSITO (descuenta inventario con FIFO)
 * 4. Cancelar solo desde BORRADOR
 * 
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from './http.service';
import { ApiResponse } from '../models/user.model';
import {
    SalidaMielAPI,
    SalidaMielListItem,
    CreateSalidaMielRequest,
    UpdateSalidaMielRequest,
    SalidaMielFilterParams,
    SalidasMielResponse,
    SalidaMielResponse,
    EstadoSalida,
    ResumenKilosPorTipo
} from '../models/salida-miel.model';

@Injectable({
    providedIn: 'root'
})
export class SalidaMielService {
    private http = inject(HttpService);
    private readonly BASE_URL = '/salidas-miel';

    // ============================================================================
    // CREATE OPERATIONS
    // ============================================================================

    /**
     * Crear nueva salida de miel en estado BORRADOR
     * POST /api/salidas-miel
     * 
     * ⚠️ No afecta el inventario hasta que se finaliza
     * 
     * @param data - Datos de la salida (fecha, choferId, detalles)
     * @returns Observable con la salida creada
     * 
     * @example
     * const request: CreateSalidaMielRequest = {
     *   fecha: '2025-01-20',
     *   choferId: 'clxxx123',
     *   detalles: [{
     *     tipoMielId: 1,
     *     clasificacion: ClasificacionMiel.EXPORTACION,
     *     kilos: 500,
     *     precio: 85.50
     *   }]
     * };
     * this.salidaMielService.createSalida(request).subscribe(...);
     */
    createSalida(data: CreateSalidaMielRequest): Observable<SalidaMielAPI> {
        return this.http.post<SalidaMielResponse>(this.BASE_URL, data)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // READ OPERATIONS
    // ============================================================================

    /**
     * Buscar salidas con filtros y paginación
     * GET /api/salidas-miel
     * 
     * @param params - Filtros (folio, estado, fechas, choferId, page, limit)
     * @returns Observable con respuesta paginada de salidas
     * 
     * @example
     * const params = { estado: EstadoSalida.EN_TRANSITO, page: 1, limit: 10 };
     * this.salidaMielService.getSalidas(params).subscribe(response => {
     *   this.salidas = response.data;
     *   this.totalPages = response.pagination.totalPages;
     * });
     */
    getSalidas(params?: SalidaMielFilterParams): Observable<SalidasMielResponse> {
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
     * Obtener salida por folio
     * GET /api/salidas-miel/folio/:folio
     * 
     * @param folio - Folio de la salida (ej: SAL-2025-0001)
     * @returns Observable con la salida completa
     * 
     * @example
     * this.salidaMielService.getSalidaByFolio('SAL-2025-0001').subscribe(...);
     */
    getSalidaByFolio(folio: string): Observable<SalidaMielAPI> {
        return this.http.get<SalidaMielResponse>(`${this.BASE_URL}/folio/${folio}`)
            .pipe(
                map(response => response.data)
            );
    }

    /**
     * Obtener detalle completo de una salida
     * GET /api/salidas-miel/:id
     * 
     * @param id - ID de la salida
     * @returns Observable con la salida completa (incluye detalles, historial)
     * 
     * @example
     * this.salidaMielService.getSalidaById('clxxx123').subscribe(salida => {
     *   console.log('Detalles:', salida.detalles);
     * });
     */
    getSalidaById(id: string): Observable<SalidaMielAPI> {
        return this.http.get<SalidaMielResponse>(`${this.BASE_URL}/${id}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // UPDATE OPERATIONS
    // ============================================================================

    /**
     * Actualizar salida en estado BORRADOR
     * PATCH /api/salidas-miel/:id
     * 
     * ⚠️ Solo se puede actualizar si estado = BORRADOR
     * 
     * @param id - ID de la salida
     * @param data - Datos a actualizar (fecha, choferId, detalles)
     * @returns Observable con la salida actualizada
     * 
     * @example
     * const update: UpdateSalidaMielRequest = {
     *   observaciones: 'Actualización de ruta'
     * };
     * this.salidaMielService.updateSalida('clxxx123', update).subscribe(...);
     */
    updateSalida(id: string, data: UpdateSalidaMielRequest): Observable<SalidaMielAPI> {
        return this.http.patch<SalidaMielResponse>(`${this.BASE_URL}/${id}`, data)
            .pipe(
                map(response => response.data)
            );
    }

    /**
     * Finalizar salida y aplicar descuento de inventario (FIFO)
     * POST /api/salidas-miel/:id/finalizar
     * 
     * ⚠️ CRÍTICO:
     * - Solo se puede finalizar si estado = BORRADOR
     * - Descuenta inventario usando FIFO (First In, First Out)
     * - Cambia estado a EN_TRANSITO
     * - NO es reversible
     * 
     * @param id - ID de la salida
     * @returns Observable con la salida finalizada
     * 
     * @example
     * this.salidaMielService.finalizarSalida('clxxx123').subscribe(salida => {
     *   alert(`Salida ${salida.folio} finalizada. Estado: ${salida.estado}`);
     * });
     */
    finalizarSalida(id: string): Observable<SalidaMielAPI> {
        return this.http.post<SalidaMielResponse>(`${this.BASE_URL}/${id}/finalizar`, {})
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // DELETE OPERATIONS
    // ============================================================================

    /**
     * Cancelar salida (solo desde estado BORRADOR)
     * DELETE /api/salidas-miel/:id
     * 
     * ⚠️ Solo se puede cancelar si estado = BORRADOR
     * 
     * @param id - ID de la salida
     * @returns Observable vacío (204 No Content)
     * 
     * @example
     * this.salidaMielService.cancelarSalida('clxxx123').subscribe(() => {
     *   alert('Salida cancelada exitosamente');
     * });
     */
    cancelarSalida(id: string): Observable<void> {
        return this.http.delete<void>(`${this.BASE_URL}/${id}`);
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Calcular resumen de kilos por tipo de miel
     * Útil para mostrar conteo en la UI
     * 
     * @param salida - Salida completa con detalles
     * @returns Array con resumen agrupado por tipo y clasificación
     * 
     * @example
     * const resumen = this.salidaMielService.calcularResumenKilos(salida);
     * // [{tipoMielNombre: 'Multifloral', clasificacion: 'CALIDAD', totalKilos: 500}, ...]
     */
    calcularResumenKilos(salida: SalidaMielAPI): ResumenKilosPorTipo[] {
        const agrupado = new Map<string, ResumenKilosPorTipo>();

        salida.detalles.forEach(detalle => {
            const key = `${detalle.tipoMielId}-${detalle.clasificacion}`;

            if (!agrupado.has(key)) {
                agrupado.set(key, {
                    tipoMielId: detalle.tipoMielId,
                    tipoMielNombre: detalle.tipoMielNombre,
                    clasificacion: detalle.clasificacion,
                    totalKilos: 0
                });
            }

            agrupado.get(key)!.totalKilos += detalle.kilos;
        });

        return Array.from(agrupado.values());
    }

    /**
     * Verificar si una salida es editable
     * Solo BORRADOR es editable
     * 
     * @param estado - Estado de la salida
     * @returns true si es BORRADOR
     */
    esEditable(estado: EstadoSalida): boolean {
        return estado === EstadoSalida.BORRADOR;
    }

    /**
     * Verificar si una salida se puede cancelar
     * Solo BORRADOR se puede cancelar
     * 
     * @param estado - Estado de la salida
     * @returns true si es BORRADOR
     */
    esCancelable(estado: EstadoSalida): boolean {
        return estado === EstadoSalida.BORRADOR;
    }

    /**
     * Verificar si una salida se puede finalizar
     * Solo BORRADOR se puede finalizar
     * 
     * @param estado - Estado de la salida
     * @returns true si es BORRADOR
     */
    esFinalizable(estado: EstadoSalida): boolean {
        return estado === EstadoSalida.BORRADOR;
    }

    /**
     * Obtener clase CSS para badge de estado
     * 
     * @param estado - Estado de la salida
     * @returns Clases de Tailwind para el badge
     */
    getEstadoBadgeClass(estado: EstadoSalida): string {
        const classes: Record<EstadoSalida, string> = {
            [EstadoSalida.BORRADOR]: 'bg-yellow-100 text-yellow-800',
            [EstadoSalida.EN_TRANSITO]: 'bg-blue-100 text-blue-800',
            [EstadoSalida.ENTREGADA]: 'bg-green-100 text-green-800',
            [EstadoSalida.CANCELADA]: 'bg-red-100 text-red-800'
        };

        return classes[estado] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Formatear fecha ISO a formato local
     * 
     * @param dateString - Fecha en formato ISO
     * @returns Fecha formateada (ej: "20 ene 2025")
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    }

    /**
     * Formatear moneda
     * 
     * @param value - Valor numérico
     * @returns String formateado (ej: "$1,234.56")
     */
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(value);
    }
}