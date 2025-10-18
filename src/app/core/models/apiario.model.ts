/**
 * ============================================================================
 * 🐝 APIARIO MODEL - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Modelo de datos para apiarios (ubicaciones de producción de miel)
 * Basado en la tabla: compras_apiarios
 * 
 * Relación: Un apicultor puede tener múltiples apiarios (1:N)
 * ============================================================================
 */

/**
 * ============================================================================
 * INTERFACES BASE
 * ============================================================================
 */

/**
 * Modelo base de Apiario
 */
export interface Apiario {
    id: string;                     // CUID generado por el backend
    apicultorId: string;            // FK a compras_apicultores
    nombre: string;                 // Nombre descriptivo del apiario
    colmenas: number;               // Cantidad de colmenas activas
    latitud: number;                // Coordenada GPS (-90 a 90)
    longitud: number;               // Coordenada GPS (-180 a 180)
    fechaAlta: string;              // ISO 8601
    createdAt: string;              // ISO 8601
    updatedAt: string;              // ISO 8601
}

/**
 * Apiario con información del apicultor (para listados)
 */
export interface ApiarioAPI {
    id: string;
    apicultorId: string;
    nombre: string;
    colmenas: number;
    latitud: number;
    longitud: number;
    fechaAlta: string;
    apicultorNombre: string;
    apicultorCodigo: string;
    apicultor: {
        codigo: string;             // Código único del apicultor (APIC-2024-001)
        nombre: string;             // Nombre completo del apicultor
        estadoCodigo?: string;      // Código del estado
        municipioCodigo?: string;   // Código del municipio
    };
}

/**
 * Apiario con información completa (vista detalle)
 */
export interface ApiarioDetailAPI extends ApiarioAPI {
    createdAt: string;
    updatedAt: string;
    apicultor: {
        id: string;
        codigo: string;
        nombre: string;
        curp: string;
        estadoCodigo: string;
        municipioCodigo: string;
        estatus: 'ACTIVO' | 'INACTIVO';
    };
}

/**
 * Apiario del apicultor (desde vista de apicultor)
 */
export interface ApiarioDeApicultor {
    id: string;
    nombre: string;
    colmenas: number;
    latitud: number;
    longitud: number;
    fechaAlta: string;
}

/**
 * ============================================================================
 * REQUEST INTERFACES
 * ============================================================================
 */

/**
 * Request para crear un nuevo apiario
 * POST /api/apiarios
 */
export interface CreateApiarioRequest {
    apicultorId: string;            // Requerido: ID del apicultor
    nombre: string;                 // Requerido: 3-255 caracteres
    colmenas: number;               // Requerido: 1-9999
    latitud: number;                // Requerido: -90 a 90
    longitud: number;               // Requerido: -180 a 180
}

/**
 * Request para actualizar un apiario existente
 * PUT /api/apiarios/:id
 */
export interface UpdateApiarioRequest {
    nombre?: string;                // Opcional: 3-255 caracteres
    colmenas?: number;              // Opcional: 1-9999
    latitud?: number;               // Opcional: -90 a 90
    longitud?: number;              // Opcional: -180 a 180
}

/**
 * ============================================================================
 * FILTER & SEARCH PARAMS
 * ============================================================================
 */

/**
 * Parámetros de filtro para GET /api/apiarios
 */
export interface ApiarioFilterParams {
    page?: number;                  // Número de página (default: 1)
    limit?: number;                 // Registros por página (default: 20, max: 100)
    apicultorId?: string;           // Filtrar por apicultor específico
    nombre?: string;                // Búsqueda parcial por nombre
    estadoCodigo?: string;          // Filtrar por estado del apicultor
    municipioCodigo?: string;       // Filtrar por municipio del apicultor
    colmenasMin?: number;           // Colmenas mínimas
    colmenasMax?: number;           // Colmenas máximas
    sortBy?: 'nombre' | 'colmenas' | 'fechaAlta';  // Campo de ordenamiento
    sortOrder?: 'asc' | 'desc';     // Orden ascendente/descendente
}

/**
 * Parámetros para GET /api/apiarios/region
 */
export interface ApiarioRegionParams {
    estadoCodigo?: string;          // Código del estado
    municipioCodigo?: string;       // Código del municipio
    page?: number;
    limit?: number;
}

/**
 * Parámetros para GET /api/apiarios/estadisticas
 */
export interface ApiarioEstadisticasParams {
    estadoCodigo?: string;          // Filtrar por estado
    apicultorId?: string;           // Filtrar por apicultor específico
}

/**
 * ============================================================================
 * RESPONSE INTERFACES
 * ============================================================================
 */

/**
 * Respuesta de GET /api/apiarios (con paginación)
 */
export interface ApiariosPaginatedResponse {
    success: boolean;
    data: ApiarioAPI[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Respuesta de GET /api/apiarios/:id
 */
export interface ApiarioDetailResponse {
    success: boolean;
    data: ApiarioDetailAPI;
    message?: string;
}

/**
 * Respuesta de POST /api/apiarios
 */
export interface CreateApiarioResponse {
    success: boolean;
    data: ApiarioDetailAPI;
    message: string;
}

/**
 * Respuesta de PUT /api/apiarios/:id
 */
export interface UpdateApiarioResponse {
    success: boolean;
    data: ApiarioDetailAPI;
    message: string;
}

/**
 * Respuesta de DELETE /api/apiarios/:id
 */
export interface DeleteApiarioResponse {
    success: boolean;
    message: string;
}

/**
 * Respuesta de GET /api/apiarios/apicultor/:apicultorId
 */
export interface ApiariosDeApicultorResponse {
    success: boolean;
    data: ApiarioDeApicultor[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * ============================================================================
 * ESTADÍSTICAS
 * ============================================================================
 */

/**
 * Respuesta de GET /api/apiarios/estadisticas
 */
export interface ApiarioEstadisticasResponse {
    success: boolean;
    data: ApiarioEstadisticas;
}

/**
 * Estadísticas generales de apiarios
 */
export interface ApiarioEstadisticas {
    totalApiarios: number;
    totalColmenas: number;
    promedioColmenasPorApiario: number;
    apiarioMayorProduccion: {
        id: string;
        nombre: string;
        colmenas: number;
        apicultor: string;          // "CÓDIGO - Nombre"
    };
    apiarioMenorProduccion: {
        id: string;
        nombre: string;
        colmenas: number;
        apicultor: string;          // "CÓDIGO - Nombre"
    };
    distribucionPorRango: {
        '1-50': number;
        '51-100': number;
        '101-200': number;
        '201-500': number;
        '500+': number;
    };
    apicultoresConApiarios: number;
    apicultoresSinApiarios: number;
}

/**
 * ============================================================================
 * HELPER TYPES
 * ============================================================================
 */

/**
 * Opciones para el select de apicultores
 */
export interface ApicultorSelectOption {
    value: string;                  // ID del apicultor
    label: string;                  // "CÓDIGO - Nombre"
    codigo: string;                 // Código del apicultor
    nombre: string;                 // Nombre completo
}

/**
 * Coordenadas GPS
 */
export interface Coordenadas {
    latitud: number;
    longitud: number;
}

/**
 * Resultado de geolocalización
 */
export interface GeolocationResult {
    success: boolean;
    coordenadas?: Coordenadas;
    error?: string;
}