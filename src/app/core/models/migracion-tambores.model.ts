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
 * Item del historial de migraciones
 */
export interface HistorialMigracion {
  id: string;
  salidaVerificadaId: string;
  status: 'EXITOSO' | 'PARCIAL' | 'FALLIDO';
  fechaMigracion: string;

  // Datos resumidos
  proveedorNombre: string;
  apicultorNombre: string;
  tipoMiel: string;
  totalTambores: number;
  totalKilosNetos: number;

  // Observaciones y errores
  observaciones?: string;
  errores?: string[];

  // Usuario que realizó la migración
  usuarioMigracion: string;
}

/**
 * RESPONSE del historial
 * GET /api/migracion/historial
 */
export interface HistorialMigracionResponse {
  success: boolean;
  data: HistorialMigracion[];
}
