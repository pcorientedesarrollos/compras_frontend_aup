/**
 * ============================================================================
 * 📦 SALIDA MIEL SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio para gestión de salidas de miel con TAMBORES
 *
 * FLUJO:
 * 1. Crear salida (EN_PROCESO) - Solo encabezado
 * 2. Añadir/quitar tambores
 * 3. Actualizar tara de tambores
 * 4. Finalizar salida (EN_PROCESO → FINALIZADA)
 * 5. Marcar en tránsito (FINALIZADA → EN_TRANSITO)
 * 6. Cancelar solo desde EN_PROCESO
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
    SalidaMielAPI,
    SalidaMielListItem,
    CreateSalidaMielRequest,
    UpdateSalidaEncabezadoRequest,
    AddTamborToSalidaRequest,
    UpdateTaraRequest,
    SalidaMielFilterParams,
    SalidasMielResponse,
    SalidaMielResponse,
    EstadoSalida,
    TamborDisponible
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
     * Crear nueva salida de miel en estado EN_PROCESO
     * POST /api/salidas-miel
     *
     * ⚠️ Se crea solo el encabezado, sin tambores
     *
     * @param data - Datos de la salida (fecha, choferId, observaciones)
     * @returns Observable con la salida creada
     *
     * @example
     * const request: CreateSalidaMielRequest = {
     *   fecha: '2025-01-24',
     *   choferId: 'clxxx123',
     *   observaciones: 'Salida planta Guadalajara'
     * };
     * this.salidaMielService.createSalida(request).subscribe(...);
     */
    createSalida(data: CreateSalidaMielRequest): Observable<SalidaMielAPI> {
        return this.http.post<SalidaMielResponse>(this.BASE_URL, data)
            .pipe(
                map(response => response.data)
            );
    }

    /**
     * Añadir tambor a la salida
     * POST /api/salidas-miel/:id/tambores
     *
     * ⚠️ Solo permitido si estado = EN_PROCESO
     *
     * @param salidaId - ID de la salida
     * @param data - tamborId, taraCapturada (opcional)
     * @returns Observable con la salida actualizada
     *
     * @example
     * const request: AddTamborToSalidaRequest = {
     *   tamborId: 'clxxx456',
     *   taraCapturada: 25.5
     * };
     * this.salidaMielService.addTambor('clxxx123', request).subscribe(...);
     */
    addTambor(salidaId: string, data: AddTamborToSalidaRequest): Observable<SalidaMielAPI> {
        return this.http.post<SalidaMielResponse>(`${this.BASE_URL}/${salidaId}/tambores`, data)
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
     * const params = { estado: EstadoSalida.EN_PROCESO, page: 1, limit: 10 };
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
     * @returns Observable con la salida completa (incluye detalles de tambores)
     *
     * @example
     * this.salidaMielService.getSalidaById('clxxx123').subscribe(salida => {
     *   console.log('Tambores:', salida.detalles);
     * });
     */
    getSalidaById(id: string): Observable<SalidaMielAPI> {
        return this.http.get<SalidaMielResponse>(`${this.BASE_URL}/${id}`)
            .pipe(
                map(response => response.data)
            );
    }

    /**
     * Obtener tambores disponibles del proveedor (estado ACTIVO)
     * GET /api/salidas-miel/tambores-disponibles
     *
     * @returns Observable con array de tambores disponibles
     *
     * @example
     * this.salidaMielService.getTamboresDisponibles().subscribe(tambores => {
     *   console.log('Tambores disponibles:', tambores);
     * });
     */
    getTamboresDisponibles(): Observable<TamborDisponible[]> {
        return this.http.get<{ data: TamborDisponible[] }>(`${this.BASE_URL}/tambores-disponibles`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // UPDATE OPERATIONS
    // ============================================================================

    /**
     * Actualizar encabezado de salida en estado EN_PROCESO
     * PATCH /api/salidas-miel/:id
     *
     * ⚠️ Solo se puede actualizar si estado = EN_PROCESO
     *
     * @param id - ID de la salida
     * @param data - Datos a actualizar (fecha, choferId, observaciones)
     * @returns Observable con la salida actualizada
     *
     * @example
     * const update: UpdateSalidaEncabezadoRequest = {
     *   observaciones: 'Actualización de ruta'
     * };
     * this.salidaMielService.updateEncabezado('clxxx123', update).subscribe(...);
     */
    updateEncabezado(id: string, data: UpdateSalidaEncabezadoRequest): Observable<SalidaMielAPI> {
        return this.http.patch<SalidaMielResponse>(`${this.BASE_URL}/${id}`, data)
            .pipe(
                map(response => response.data)
            );
    }

    /**
     * Actualizar tara de un tambor en la salida
     * PATCH /api/salidas-miel/:id/tambores/:detalleId/tara
     *
     * ⚠️ Se puede actualizar en estados: EN_PROCESO, FINALIZADA
     *
     * @param salidaId - ID de la salida
     * @param detalleId - ID del detalle (tambor en la salida)
     * @param data - taraCapturada
     * @returns Observable con el detalle actualizado
     *
     * @example
     * const tara: UpdateTaraRequest = { taraCapturada: 26.0 };
     * this.salidaMielService.updateTara('clxxx123', 'clxxx789', tara).subscribe(...);
     */
    updateTara(salidaId: string, detalleId: string, data: UpdateTaraRequest): Observable<any> {
        return this.http.patch<any>(
            `${this.BASE_URL}/${salidaId}/tambores/${detalleId}/tara`,
            data
        );
    }

    /**
     * Finalizar salida y cambiar estado a FINALIZADA
     * POST /api/salidas-miel/:id/finalizar
     *
     * ⚠️ CRÍTICO:
     * - Solo se puede finalizar si estado = EN_PROCESO
     * - Debe tener al menos 1 tambor
     * - Cambia estado a FINALIZADA
     * - Ya NO se pueden añadir/quitar tambores
     * - Aún se puede modificar tara
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

    /**
     * Marcar salida como en tránsito
     * POST /api/salidas-miel/:id/en-transito
     *
     * ⚠️ Solo permitido si estado = FINALIZADA
     * El chofer recogió la carga
     *
     * @param id - ID de la salida
     * @returns Observable con la salida actualizada
     *
     * @example
     * this.salidaMielService.marcarEnTransito('clxxx123').subscribe(...);
     */
    marcarEnTransito(id: string): Observable<SalidaMielAPI> {
        return this.http.post<SalidaMielResponse>(`${this.BASE_URL}/${id}/en-transito`, {})
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // DELETE OPERATIONS
    // ============================================================================

    /**
     * Remover tambor de la salida
     * DELETE /api/salidas-miel/:id/tambores/:detalleId
     *
     * ⚠️ Solo permitido si estado = EN_PROCESO
     * Devuelve el tambor a estado ACTIVO
     *
     * @param salidaId - ID de la salida
     * @param detalleId - ID del detalle a remover
     * @returns Observable con la salida actualizada
     *
     * @example
     * this.salidaMielService.removeTambor('clxxx123', 'clxxx789').subscribe(...);
     */
    removeTambor(salidaId: string, detalleId: string): Observable<SalidaMielAPI> {
        return this.http.delete<SalidaMielResponse>(`${this.BASE_URL}/${salidaId}/tambores/${detalleId}`)
            .pipe(
                map(response => response.data)
            );
    }

    /**
     * Cancelar salida (solo desde estado EN_PROCESO)
     * DELETE /api/salidas-miel/:id
     *
     * ⚠️ Solo se puede cancelar si estado = EN_PROCESO
     * Devuelve todos los tambores a estado ACTIVO
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
     * Verificar si una salida es editable (puede añadir/quitar tambores)
     * Solo EN_PROCESO es editable
     *
     * @param estado - Estado de la salida
     * @returns true si es EN_PROCESO
     */
    esEditable(estado: EstadoSalida): boolean {
        return estado === EstadoSalida.EN_PROCESO;
    }

    /**
     * Verificar si una salida se puede cancelar
     * Solo EN_PROCESO se puede cancelar
     *
     * @param estado - Estado de la salida
     * @returns true si es EN_PROCESO
     */
    esCancelable(estado: EstadoSalida): boolean {
        return estado === EstadoSalida.EN_PROCESO;
    }

    /**
     * Verificar si una salida se puede finalizar
     * Solo EN_PROCESO se puede finalizar
     *
     * @param estado - Estado de la salida
     * @returns true si es EN_PROCESO
     */
    esFinalizable(estado: EstadoSalida): boolean {
        return estado === EstadoSalida.EN_PROCESO;
    }

    /**
     * Verificar si se puede marcar como en tránsito
     * Solo FINALIZADA se puede marcar en tránsito
     *
     * @param estado - Estado de la salida
     * @returns true si es FINALIZADA
     */
    puedeMarcarEnTransito(estado: EstadoSalida): boolean {
        return estado === EstadoSalida.FINALIZADA;
    }

    /**
     * Verificar si se puede actualizar tara
     * EN_PROCESO y FINALIZADA permiten actualizar tara
     *
     * @param estado - Estado de la salida
     * @returns true si es EN_PROCESO o FINALIZADA
     */
    puedeActualizarTara(estado: EstadoSalida): boolean {
        return estado === EstadoSalida.EN_PROCESO || estado === EstadoSalida.FINALIZADA;
    }

    /**
     * Obtener clase CSS para badge de estado
     *
     * @param estado - Estado de la salida
     * @returns Clases de Tailwind para el badge
     */
    getEstadoBadgeClass(estado: EstadoSalida): string {
        const classes: Record<EstadoSalida, string> = {
            [EstadoSalida.EN_PROCESO]: 'bg-yellow-100 text-yellow-800',
            [EstadoSalida.FINALIZADA]: 'bg-blue-100 text-blue-800',
            [EstadoSalida.EN_TRANSITO]: 'bg-purple-100 text-purple-800',
            [EstadoSalida.VERIFICADA]: 'bg-green-100 text-green-800'
        };

        return classes[estado] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Obtener label de estado en español
     *
     * @param estado - Estado de la salida
     * @returns Label del estado
     */
    getEstadoLabel(estado: EstadoSalida): string {
        const labels: Record<EstadoSalida, string> = {
            [EstadoSalida.EN_PROCESO]: 'En Proceso',
            [EstadoSalida.FINALIZADA]: 'Finalizada',
            [EstadoSalida.EN_TRANSITO]: 'En Tránsito',
            [EstadoSalida.VERIFICADA]: 'Verificada'
        };

        return labels[estado] || estado;
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

    /**
     * Formatear kilos
     *
     * @param kilos - Valor numérico
     * @returns String formateado (ej: "1,234.56 kg")
     */
    formatKilos(kilos: number): string {
        return `${kilos.toFixed(2)} kg`;
    }
}
