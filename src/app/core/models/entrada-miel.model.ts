/**
 * ============================================================================
 * 📦 ENTRADA MIEL MODELS - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Modelos TypeScript para el módulo de Entradas de Miel
 * Basado en la documentación backend v1.0
 * 
 * ENDPOINTS RELACIONADOS:
 * - POST   /api/entradas-miel
 * - GET    /api/entradas-miel
 * - GET    /api/entradas-miel/estadisticas
 * - GET    /api/entradas-miel/disponibles/pool
 * - GET    /api/entradas-miel/folio/:folio
 * - GET    /api/entradas-miel/:id
 * - PATCH  /api/entradas-miel/:id/cancelar
 * 
 * ============================================================================
 */

/**
 * ============================================================================
 * ENUMS
 * ============================================================================
 */

/**
 * Clasificación de miel según porcentaje de humedad
 */
export enum ClasificacionMiel {
    EXPORTACION = 'EXPORTACION',   // Humedad ≤ 20%
    NACIONAL = 'NACIONAL'          // Humedad > 20%
}

/**
 * Estado de la entrada de miel
 */
export enum EstadoEntrada {
    ACTIVO = 'ACTIVO',
    CANCELADO = 'CANCELADO'
}

/**
 * Estado de uso del detalle de entrada
 */
export enum EstadoUsoDetalle {
    DISPONIBLE = 'DISPONIBLE',  // Miel no usada en producción
    USADO = 'USADO',            // Miel ya procesada
    CANCELADO = 'CANCELADO'     // Entrada cancelada
}

/**
 * ============================================================================
 * ENTITIES (Representación de datos del backend)
 * ============================================================================
 */

/**
 * Entrada de Miel - Encabezado (respuesta detallada)
 */
export interface EntradaMielDetailAPI {
    id: string;
    folio: string;
    fecha: string;  // ISO 8601
    proveedorId: number;
    proveedorNombre: string;
    apicultorId: string;
    apicultorNombre: string;
    totalCompra: number;
    estado: EstadoEntrada;
    observaciones?: string;
    usuarioCreadorId: string;
    usuarioCreadorNombre: string;
    fechaCreacion: string;  // ISO 8601
    fechaCancelacion?: string;
    usuarioCanceladorId?: string;
    usuarioCanceladorNombre?: string;
    motivoCancelacion?: string;
    detalles: EntradaMielDetalleAPI[];
}

/**
 * Detalle de Entrada de Miel (completo)
 */
export interface EntradaMielDetalleAPI {
    id: string;
    entradaEncabezadoId: string;
    tipoMielId: number;
    tipoMielNombre: string;
    floracionId?: number;
    floracionNombre?: string;
    colorId?: number;
    colorNombre?: string;
    kilos: number;
    humedad: number;
    clasificacion: ClasificacionMiel;
    precio: number;
    costoTotal: number;
    estadoUso: EstadoUsoDetalle;
    autorizado: boolean;
    zona?: string;
    trazabilidad?: string;
    pesoLista?: number;
    bruto?: number;
    tara?: number;
    diferencia?: number;
    referencia?: string;
    observaciones?: string;
    fechaCreacion: string;  // ISO 8601
}

/**
 * Entrada de Miel - Lista (versión simplificada)
 */
export interface EntradaMielAPI {
    id: string;
    folio: string;
    fecha: string;
    proveedorId: number;
    proveedorNombre: string;
    apicultorId: string;
    apicultorNombre: string;
    apicultorCodigo: string;
    totalCompra: number;
    estado: EstadoEntrada;
    observaciones?: string | null;
    usuarioCreadorId: string;
    usuarioCreadorNombre: string;
    fechaCreacion: string;
    fechaCancelacion?: string | null;
    motivoCancelacion?: string | null;
    cantidadDetalles: number;
    kilosTotales: number;
}

/**
 * Lote de miel disponible para pool de producción
 */
export interface LoteMielDisponible {
    entradaDetalleId: string;
    folio: string;
    fecha: string;
    apicultorNombre: string;
    tipoMielNombre: string;
    kilosDisponibles: number;
    humedad: number;
    clasificacion: ClasificacionMiel;
    zona?: string;
    trazabilidad?: string;
}

/**
 * ============================================================================
 * REQUEST DTOs
 * ============================================================================
 */

/**
 * DTO para crear detalle de entrada
 */
export interface CreateEntradaMielDetalleRequest {
    tipoMielId: number;
    floracionId?: number;
    colorId?: number;
    kilos: number;
    humedad: number;
    precio: number;
    autorizado?: boolean;
    zona?: string;
    trazabilidad?: string;
    pesoLista?: number;
    bruto?: number;
    tara?: number;
    referencia?: string;
    observaciones?: string;
}

/**
 * DTO para crear entrada de miel completa
 */
export interface CreateEntradaMielRequest {
    fecha: string;  // YYYY-MM-DD
    apicultorId: string;
    observaciones?: string;
    detalles: CreateEntradaMielDetalleRequest[];
}

/**
 * DTO para cancelar entrada
 */
export interface CancelarEntradaMielRequest {
    motivoCancelacion: string;  // Mínimo 10 caracteres
}

/**
 * DTO para actualizar detalle de entrada
 */
export interface UpdateEntradaMielDetalleRequest {
    id?: string;  // Si tiene ID: ACTUALIZA. Si NO tiene ID: CREA nuevo
    tipoMielId: number;
    floracionId?: number;
    colorId?: number;
    kilos: number;
    humedad: number;
    precio: number;
    autorizado?: boolean;
    zona?: string;
    trazabilidad?: string;
    pesoLista?: number;
    bruto?: number;
    tara?: number;
    referencia?: string;
    observaciones?: string;
}

/**
 * DTO para actualizar entrada de miel completa
 */
export interface UpdateEntradaMielRequest {
    fecha: string;  // YYYY-MM-DD
    apicultorId: string;
    observaciones?: string;
    detalles: UpdateEntradaMielDetalleRequest[];
}

/**
 * DTO para cancelar detalle individual
 */
export interface CancelarDetalleRequest {
    motivoCancelacion: string;  // Mínimo 10, máximo 500 caracteres
}

/**
 * Parámetros de filtrado para GET /api/entradas-miel
 */
export interface EntradaMielFilterParams {
    page?: number;
    limit?: number;
    proveedorId?: number;
    apicultorId?: string;
    tipoMielId?: number;
    estado?: EstadoEntrada;
    clasificacion?: ClasificacionMiel;
    fechaInicio?: string;  // YYYY-MM-DD
    fechaFin?: string;     // YYYY-MM-DD
    sortBy?: 'fecha' | 'folio' | 'totalCompra';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Parámetros para estadísticas
 */
export interface EntradaMielEstadisticasParams {
    fechaInicio?: string;  // YYYY-MM-DD
    fechaFin?: string;     // YYYY-MM-DD
    proveedorId?: number;
    apicultorId?: string;
}

/**
 * Parámetros para pool de disponibles
 */
export interface PoolDisponiblesParams {
    tipoMielId?: number;
    clasificacion?: ClasificacionMiel;
    fechaInicio?: string;  // YYYY-MM-DD
    fechaFin?: string;     // YYYY-MM-DD
    limit?: number;
}

/**
 * ============================================================================
 * RESPONSE DTOs
 * ============================================================================
 */

/**
 * Respuesta de POST /api/entradas-miel
 */
export interface CreateEntradaMielResponse {
    success: boolean;
    message: string;
    data: EntradaMielDetailAPI;
}

/**
 * Respuesta de GET /api/entradas-miel (paginada)
 */
export interface EntradasMielPaginatedResponse {
    success: boolean;
    data: EntradaMielAPI[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Respuesta de GET /api/entradas-miel/:id
 */
export interface EntradaMielDetailResponse {
    success: boolean;
    data: EntradaMielDetailAPI;
}

/**
 * Respuesta de GET /api/entradas-miel/folio/:folio
 */
export interface EntradaMielByFolioResponse {
    success: boolean;
    data: EntradaMielDetailAPI;
}

/**
 * Respuesta de PATCH /api/entradas-miel/:id/cancelar
 */
export interface CancelarEntradaMielResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        folio: string;
        fecha: string;
        estado: EstadoEntrada;
        fechaCancelacion: string;
        usuarioCanceladorId: string;
        usuarioCanceladorNombre: string;
        motivoCancelacion: string;
        proveedorNombre: string;
        apicultorNombre: string;
        totalCompra: number;
    };
}

/**
 * Respuesta de PUT /api/entradas-miel/:id
 */
export interface UpdateEntradaMielResponse {
    success: boolean;
    message: string;
    data: EntradaMielDetailAPI;
}

/**
 * Respuesta de PATCH /api/entradas-miel/detalles/:detalleId/cancelar
 */
export interface CancelarDetalleResponse {
    success: boolean;
    message: string;
    data: EntradaMielDetalleAPI;
}

/**
 * Respuesta de GET /api/entradas-miel/disponibles/pool
 */
export interface PoolDisponiblesResponse {
    success: boolean;
    data: LoteMielDisponible[];
    resumen: {
        totalLotes: number;
        kilosTotales: number;
        clasificaciones: {
            CALIDAD: number;
            CONVENCIONAL: number;
        };
    };
}

/**
 * ============================================================================
 * ESTADÍSTICAS
 * ============================================================================
 */

/**
 * Estadísticas de entradas de miel
 */
export interface EntradaMielEstadisticas {
    totalEntradas: number;
    totalKilos: number;
    totalCompras: number;
    promedioKilosPorEntrada: number;
    promedioPrecioPorKilo: number;
    clasificaciones: {
        CALIDAD: {
            cantidad: number;
            kilos: number;
            porcentaje: number;
        };
        CONVENCIONAL: {
            cantidad: number;
            kilos: number;
            porcentaje: number;
        };
    };
    tiposMiel: Array<{
        tipoMielId: number;
        tipoMielNombre: string;
        cantidad: number;
        kilos: number;
        porcentaje: number;
    }>;
    apicultoresTop: Array<{
        apicultorId: string;
        apicultorNombre: string;
        totalEntradas: number;
        totalKilos: number;
        totalCompras: number;
    }>;
    estadosUso: {
        DISPONIBLE: number;
        USADO: number;
        CANCELADO: number;
    };
}

/**
 * Respuesta de GET /api/entradas-miel/estadisticas
 */
export interface EntradaMielEstadisticasResponse {
    success: boolean;
    data: EntradaMielEstadisticas;
}

/**
 * ============================================================================
 * HELPER TYPES (para componentes)
 * ============================================================================
 */

/**
 * Interfaz para FormGroup de detalle (tambor)
 */
export interface EntradaMielDetalleForm {
    bruto: number | null;       // PB (Peso Bruto)
    tara: number | null;        // T (Tara)
    floracionId: number | null;
    humedad: number | null;
    colorId: number | null;
}

/**
 * Tipo Miel (para autocomplete)
 */
export interface TipoMielOption {
    id: number;
    nombre: string;
}

/**
 * Apicultor (para autocomplete)
 */
export interface ApicultorOption {
    id: string;
    nombre: string;
    codigo: string;
}

/**
 * ============================================================================
 * CATÁLOGOS (Floraciones y Colores)
 * ============================================================================
 */

/**
 * Floración (catálogo)
 */
export interface Floracion {
    idFloracion: number;
    floracion: string;
}

/**
 * Color de miel (catálogo)
 */
export interface ColorMiel {
    idColor: number;
    color: string;
    orden: number;
}

/**
 * Respuesta de GET /api/catalogos/floraciones
 */
export interface FloracionesResponse {
    success: boolean;
    data: Floracion[];
    total: number;
}

/**
 * Respuesta de GET /api/catalogos/colores
 */
export interface ColoresResponse {
    success: boolean;
    data: ColorMiel[];
    total: number;
}