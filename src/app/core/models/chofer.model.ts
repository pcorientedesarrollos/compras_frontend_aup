/**
 * ============================================================================
 * 📊 INVENTARIO MODEL - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Modelo para consultar inventario disponible
 * 
 * ENDPOINTS:
 * - GET /api/inventario (resumen de stock disponible)
 * - GET /api/inventario/detalles (entradas disponibles con FIFO)
 * 
 * ============================================================================
 */

import { ClasificacionMiel, EstadoUsoDetalle } from "./entrada-miel.model";

/**
 * Resumen de inventario por tipo de miel (GET /api/inventario)
 */
export interface ResumenInventario {
    tipoMielId: number;
    tipoMielNombre: string;
    clasificacion: ClasificacionMiel;
    kilosDisponibles: number;
    kilosUsados: number;
    kilosTotal: number;
    cantidadEntradas: number;
}

/**
 * Respuesta de resumen de inventario
 */
export interface InventarioResumenResponse {
    data: {
        resumen: ResumenInventario[];
        totales: {
            kilosDisponibles: number;
            kilosUsados: number;
            kilosTotal: number;
        };
    };
}

/**
 * Detalle de entrada disponible en inventario (GET /api/inventario/detalles)
 */
export interface DetalleEntradaDisponible {
    id: string;
    entradaId: string;
    entradaFolio: string;
    entradaFecha: string; // ISO Date
    apicultorNombre: string;
    tipoMielId: number;
    tipoMielNombre: string;
    clasificacion: ClasificacionMiel;
    kilosOriginales: number;
    kilosDisponibles: number;
    kilosUsados: number;
    estadoUso: EstadoUsoDetalle;
    precio: number | null;
    createdAt: string; // ISO DateTime (para ordenar por FIFO)
}

/**
 * Respuesta de detalles de inventario disponible
 */
export interface InventarioDetallesResponse {
    data: {
        detalles: DetalleEntradaDisponible[];
        totalKilosDisponibles: number;
        cantidadEntradas: number;
    };
}

/**
 * Parámetros de filtro para inventario
 */
export interface InventarioFilterParams {
    tipoMielId?: number;
    clasificacion?: ClasificacionMiel;
    apicultorId?: string;
}

/**
 * Display de stock disponible para el form de salidas
 */
export interface StockDisponibleDisplay {
    tipoMielId: number;
    tipoMielNombre: string;
    clasificacion: ClasificacionMiel;
    kilosDisponibles: number;
    suficiente: boolean; // true si hay stock suficiente para la cantidad solicitada
}

/**
 * Inventario agrupado por tipo de miel (sumando clasificaciones)
 * Para mostrar en dashboard/resumen
 */
export interface InventarioAgrupado {
    tipoMielId: number;
    tipoMielNombre: string;
    kilos: number;
    porcentaje: number;
}