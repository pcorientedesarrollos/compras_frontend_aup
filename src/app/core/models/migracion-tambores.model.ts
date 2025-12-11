/**
 * ============================================================================
 * MODELOS DE MIGRACIÓN DE TAMBORES - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * DTOs para integración con sistema legacy (apicultores2025)
 * Migración de salidas verificadas con sus tambores
 *
 * ============================================================================
 */

/**
 * REQUEST para migrar una salida verificada
 * POST /api/migracion/migrar-salida
 */
export interface MigracionSalidaRequest {
  salidaVerificadaId: string;
  observaciones?: string;
}

/**
 * Tambor individual migrado (según API real)
 */
export interface TamborMigrado {
  tamborId: string;
  consecutivo: string;
  tipoMiel: string;
  clasificacion: 'EXPORTACION_1' | 'EXPORTACION_2' | 'NACIONAL' | 'INDUSTRIA';
  pesoNeto: number;
  pesoBruto: number;
  tara: number;
  humedad: number;
  idAlmacen: number;
  estado: 'EXITOSO' | 'FALLIDO';
}

/**
 * Totales de la migración (según API real)
 */
export interface TotalesMigracion {
  cantidadTambores: number;
  pesoTotalNeto: number;
  pesoTotalBruto: number;
}

/**
 * RESPONSE de la migración (según API real)
 */
export interface MigracionSalidaResponse {
  success: boolean;
  message: string;
  data: {
    salidaId: string;
    salidaFolio: string;
    fechaVerificacion: string;
    proveedorNombre: string;
    idReporteDescarga: number;
    idAlmacenEncabezado: number;
    folio: string;
    totalTambores: number;
    tamboresExitosos: number;
    tamboresFallidos: number;
    tambores: TamborMigrado[];
    totales: TotalesMigracion;
  };
}

/**
 * Item del historial de migraciones (según API real)
 */
export interface HistorialMigracion {
  id: string;
  salidaFolio: string;
  fechaMigracion: string;
  usuarioNombre: string;
  totalTambores: number;
  tamboresExitosos: number;
  tamboresFallidos: number;
  estado: 'EXITOSO' | 'PARCIAL' | 'FALLIDO';
  idReporteDescarga: number;
  idAlmacenEncabezado: number;
  errorMensaje: string | null;
}

/**
 * RESPONSE del historial
 * GET /api/migracion/historial
 */
export interface HistorialMigracionResponse {
  success: boolean;
  data: HistorialMigracion[];
}
