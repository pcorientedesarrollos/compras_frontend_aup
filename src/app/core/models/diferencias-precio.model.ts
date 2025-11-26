/**
 * ============================================================================
 * 📊 DIFERENCIAS DE PRECIO - MODELS
 * ============================================================================
 *
 * Modelos para auditoría de diferencias entre precios oficiales y capturados
 * Solo accesible para ADMINISTRADORES
 *
 * ============================================================================
 */

/**
 * Diferencia de precio individual
 */
export interface DiferenciaPrecio {
  id: string;                          // ID único de la diferencia (CUID)
  entradaId: string;                   // ID de la entrada de miel
  entradaFolio: string;                // Folio legible (ej: ENT-2025-0001)
  detalleId: string;                   // ID del detalle de entrada
  fechaEntrada: string;                // Fecha de la entrada (ISO datetime)
  tipoMielId: number;                  // ID del tipo de miel
  tipoMielNombre: string;              // Nombre del tipo de miel
  clasificacion: 'EXPORTACION' | 'NACIONAL' | 'INDUSTRIA';
  precioOficial: number;               // Precio oficial según lista ($)
  precioCapturado: number;             // Precio capturado por acopiador ($)
  diferencia: number;                  // Diferencia en pesos (+ = ganancia, - = pérdida)
  porcentajeDiferencia: number;        // Diferencia en porcentaje (%)
  proveedorId: number;                 // ID del proveedor/acopiador
  proveedorNombre: string;             // Nombre del proveedor
  usuarioCapturadorId: string;         // ID del usuario que capturó
  usuarioCapturadorNombre: string;     // Nombre del usuario
  fechaRegistro: string;               // Fecha/hora del registro (ISO datetime)
}

/**
 * Resumen de diferencias por proveedor
 */
export interface ResumenProveedorDiferencias {
  proveedorId: number;                 // ID del proveedor
  proveedorNombre: string;             // Nombre del proveedor
  totalDiferencias: number;            // Total de diferencias registradas
  totalPerdida: number;                // Suma de pérdidas ($)
  totalGanancia: number;               // Suma de ganancias ($)
  fechaPrimeraDiferencia: string;      // Primera diferencia (ISO datetime)
  fechaUltimaDiferencia: string;       // Última diferencia (ISO datetime)
  promedioDesviacion: number;          // Promedio de desviación (%)
}

/**
 * Desglose por tipo de miel
 */
export interface DesgloseTipoMiel {
  tipoMielId: number;                  // ID del tipo de miel
  tipoMielNombre: string;              // Nombre del tipo de miel
  totalDiferencias: number;            // Total de diferencias
  promedioDesviacion: number;          // Promedio de desviación (%)
}

/**
 * Estadísticas globales de diferencias
 */
export interface EstadisticasDiferencias {
  totalDiferencias: number;            // Total de diferencias registradas
  totalProveedoresAfectados: number;   // Proveedores únicos con diferencias
  totalPerdidasAcumuladas: number;     // Suma total de pérdidas ($)
  totalGananciasAcumuladas: number;    // Suma total de ganancias ($)
  promedioDesviacionGlobal: number;    // Promedio global de desviación (%)
  desglosePorProveedor: ResumenProveedorDiferencias[];  // Array de resúmenes
  desglosePorTipoMiel: DesgloseTipoMiel[];             // Array de desgloses
}

/**
 * Filtros para búsqueda de diferencias
 */
export interface FiltrosDiferenciasPrecio {
  proveedorId?: number;                // Filtrar por proveedor
  tipoMielId?: number;                 // Filtrar por tipo de miel
  clasificacion?: 'EXPORTACION' | 'NACIONAL' | 'INDUSTRIA';
  entradaId?: string;                  // Filtrar por entrada específica
  fechaInicio?: string;                // Fecha inicio (YYYY-MM-DD)
  fechaFin?: string;                   // Fecha fin (YYYY-MM-DD)
  page?: number;                       // Página actual (default: 1)
  limit?: number;                      // Registros por página (default: 20, max: 1000)
  sortBy?: string;                     // Campo para ordenar (default: fechaRegistro)
  sortOrder?: 'asc' | 'desc';          // Dirección de orden (default: desc)
}

/**
 * Metadata de paginación
 */
export interface PaginationMeta {
  page: number;                        // Página actual
  limit: number;                       // Registros por página
  total: number;                       // Total de registros
  totalPages: number;                  // Total de páginas
}

/**
 * Response con paginación para lista de diferencias
 */
export interface DiferenciasPrecioResponse {
  diferencias: DiferenciaPrecio[];     // Array de diferencias
  pagination: PaginationMeta;          // Metadata de paginación
}
