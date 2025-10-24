/**
 * ============================================================================
 * 📊 INVENTARIO SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Servicio para consultar inventario disponible
 * 
 * ENDPOINTS:
 * - GET /api/inventario (resumen por tipo de miel)
 * - GET /api/inventario/detalles (entradas disponibles con FIFO)
 * 
 * ROLES: ADMINISTRADOR (todos), ACOPIADOR (propio), MIELERA (consulta)
 * 
 * ⚠️ IMPORTANTE: Validar stock ANTES de crear/finalizar salidas
 * 
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from './http.service';
import {
    ResumenInventario,
    InventarioResumenResponse,
    DetalleEntradaDisponible,
    InventarioDetallesResponse,
    InventarioFilterParams,
    StockDisponibleDisplay,
    ClasificacionMiel
} from '../models/index';

@Injectable({
    providedIn: 'root'
})
export class InventarioService {
    private http = inject(HttpService);
    private readonly BASE_URL = '/inventario';

    // ============================================================================
    // READ OPERATIONS
    // ============================================================================

    /**
     * Obtener resumen de inventario por tipo de miel
     * GET /api/inventario
     * 
     * @param params - Filtros opcionales (tipoMielId, clasificacion)
     * @returns Observable con resumen de inventario y totales
     * 
     * @example
     * this.inventarioService.getResumenInventario().subscribe(response => {
     *   this.resumenInventario = response.resumen;
     *   this.totalDisponible = response.totales.kilosDisponibles;
     * });
     */
    getResumenInventario(params?: InventarioFilterParams): Observable<{
        resumen: ResumenInventario[];
        totales: {
            kilosDisponibles: number;
            kilosUsados: number;
            kilosTotal: number;
        };
    }> {
        return this.http.get<InventarioResumenResponse>(this.BASE_URL, params as any)
            .pipe(
                map(response => response.data)
            );
    }

    /**
     * Obtener detalles de entradas disponibles (ordenadas por FIFO)
     * GET /api/inventario/detalles
     * 
     * @param params - Filtros (tipoMielId, clasificacion, apicultorId)
     * @returns Observable con detalles de entradas disponibles
     * 
     * @example
     * const params = { tipoMielId: 1, clasificacion: ClasificacionMiel.EXPORTACION };
     * this.inventarioService.getDetallesInventario(params).subscribe(response => {
     *   console.log('Stock disponible:', response.totalKilosDisponibles);
     *   this.entradasDisponibles = response.detalles;
     * });
     */
    getDetallesInventario(params?: InventarioFilterParams): Observable<{
        detalles: DetalleEntradaDisponible[];
        totalKilosDisponibles: number;
        cantidadEntradas: number;
    }> {
        return this.http.get<InventarioDetallesResponse>(`${this.BASE_URL}/detalles`, params as any)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // VALIDATION HELPERS
    // ============================================================================

    /**
     * Validar si hay suficiente stock para una salida
     *
     * @param tipoMielId - ID del tipo de miel
     * @param clasificacion - Clasificación (EXPORTACION/NACIONAL)
     * @param kilosSolicitados - Cantidad de kilos a sacar
     * @returns Observable<StockDisponibleDisplay> con validación
     *
     * @example
     * this.inventarioService.validarStock(1, ClasificacionMiel.EXPORTACION, 500)
     *   .subscribe(stock => {
     *     if (!stock.suficiente) {
     *       alert(`Solo hay ${stock.kilosDisponibles}kg disponibles`);
     *     }
     *   });
     */
    validarStock(
        tipoMielId: number,
        clasificacion: ClasificacionMiel,
        kilosSolicitados: number
    ): Observable<StockDisponibleDisplay> {
        const params: InventarioFilterParams = {
            tipoMielId,
            clasificacion
        };

        return this.getDetallesInventario(params).pipe(
            map(response => {
                const stock: StockDisponibleDisplay = {
                    tipoMielId,
                    tipoMielNombre: response.detalles[0]?.tipoMielNombre || 'Desconocido',
                    clasificacion,
                    kilosDisponibles: response.totalKilosDisponibles,
                    suficiente: response.totalKilosDisponibles >= kilosSolicitados
                };
                return stock;
            })
        );
    }

    /**
     * Obtener stock disponible para display en formulario
     * (sin validar cantidad, solo mostrar disponibilidad)
     *
     * @param tipoMielId - ID del tipo de miel
     * @param clasificacion - Clasificación (EXPORTACION/NACIONAL)
     * @returns Observable con kilos disponibles
     *
     * @example
     * this.inventarioService.getStockDisponible(1, ClasificacionMiel.EXPORTACION)
     *   .subscribe(kilos => {
     *     this.stockDisponibleText = `Disponible: ${kilos}kg`;
     *   });
     */
    getStockDisponible(
        tipoMielId: number,
        clasificacion: ClasificacionMiel
    ): Observable<number> {
        const params: InventarioFilterParams = {
            tipoMielId,
            clasificacion
        };

        return this.getDetallesInventario(params).pipe(
            map(response => response.totalKilosDisponibles)
        );
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Agrupar resumen de inventario por tipo de miel (sumando clasificaciones)
     * 
     * @param resumen - Array de ResumenInventario
     * @returns Array agrupado por tipo de miel con totales
     */
    agruparPorTipoMiel(resumen: ResumenInventario[]): {
        tipoMielId: number;
        tipoMielNombre: string;
        totalKilosDisponibles: number;
        porClasificacion: {
            [key in ClasificacionMiel]?: number;
        };
    }[] {
        const agrupado = new Map<number, {
            tipoMielId: number;
            tipoMielNombre: string;
            totalKilosDisponibles: number;
            porClasificacion: {
                [key in ClasificacionMiel]?: number;
            };
        }>();

        resumen.forEach(item => {
            if (!agrupado.has(item.tipoMielId)) {
                agrupado.set(item.tipoMielId, {
                    tipoMielId: item.tipoMielId,
                    tipoMielNombre: item.tipoMielNombre,
                    totalKilosDisponibles: 0,
                    porClasificacion: {}
                });
            }

            const grupo = agrupado.get(item.tipoMielId)!;
            grupo.totalKilosDisponibles += item.kilosDisponibles;
            grupo.porClasificacion[item.clasificacion] = item.kilosDisponibles;
        });

        return Array.from(agrupado.values());
    }

    /**
     * Formatear kilos con 2 decimales
     */
    formatKilos(kilos: number): string {
        return `${kilos.toFixed(2)} kg`;
    }
}