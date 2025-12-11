/**
 * ============================================================================
 * 🐝 APICULTOR API MODELS - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Modelos TypeScript para la API de Apicultores del backend v2.0
 * Basado en documentación: DOCUMENTACION_CAMBIOS_FRONTEND.md
 *
 * CAMBIOS BREAKING v2.0:
 * - Campo 'codigo' ya NO se envía en CREATE (se genera automáticamente)
 * - Campo 'nombre' dividido en: nombre, apellidoPaterno, apellidoMaterno
 * - Campo 'senasica' renombrado a 'idRasmiel'
 * - Campo 'ippSiniga' renombrado a 'uppSiniiga'
 * - Campos 'estadoCodigo' y 'municipioCodigo' ahora obligatorios
 * - Nuevo campo 'nombreCompleto' (generado automáticamente)
 * - Nuevo campo 'totalColmenas' (suma de colmenas de apiarios)
 *
 * ENDPOINTS:
 * - POST   /api/apicultores                    → Crear apicultor
 * - GET    /api/apicultores                    → Listar con filtros
 * - GET    /api/apicultores/:id                → Detalle por ID
 * - GET    /api/apicultores/codigo/:codigo     → Buscar por código
 * - GET    /api/apicultores/curp/:curp         → Buscar por CURP
 * - PUT    /api/apicultores/:id                → Actualizar (incluye proveedores)
 * - DELETE /api/apicultores/:id                → Eliminar (solo ADMIN)
 * - GET    /api/apicultores/:id/proveedores    → Proveedores vinculados
 * - GET    /api/proveedores/:id/apicultores    → Apicultores de un proveedor
 *
 * ============================================================================
 */

/**
 * Estado del apicultor
 */
export type ApicultorEstado = 'ACTIVO' | 'INACTIVO';

/**
 * ============================================================================
 * MIEL POR TIPO - ENTREGAS DEL APICULTOR
 * ============================================================================
 */
export interface MielPorTipo {
    tipoMielId: number;                  // ID del tipo de miel
    tipoMielNombre: string;              // Nombre del tipo de miel
    totalKilos: number;                  // Total de kilos entregados de este tipo
    cantidadEntregas: number;            // Número de entregas de este tipo
}

/**
 * ============================================================================
 * APICULTOR - ESTRUCTURA COMPLETA DE LA API v2.0
 * ============================================================================
 */
export interface ApicultorAPI {
    id: string;                          // CUID
    codigo: string;                      // Código único formato: XX-XXX-XXX (generado automáticamente)
    nombre: string;                      // Solo primer nombre (antes era nombre completo)
    apellidoPaterno: string;             // Apellido paterno (NUEVO - obligatorio)
    apellidoMaterno: string | null;      // Apellido materno (NUEVO - opcional)
    nombreCompleto: string;              // Nombre completo generado automáticamente
    curp: string;                        // CURP (18 caracteres, único)
    rfc: string | null;                  // RFC (13 caracteres, opcional)
    estadoCodigo: string;                // Código del estado (ej: "20" = Oaxaca) - AHORA OBLIGATORIO
    municipioCodigo: string;             // Código del municipio - AHORA OBLIGATORIO
    direccion: string | null;            // Dirección física
    idRasmiel: string | null;            // ID-RASMIEL (antes: senasica)
    uppSiniiga: string | null;           // UPPSINIIGA (antes: ippSiniga)
    estatus: ApicultorEstado;            // ACTIVO | INACTIVO
    fechaAlta: string;                   // ISO 8601
    createdAt: string;                   // ISO 8601
    updatedAt: string;                   // ISO 8601
    cantidadApiarios: number;            // Contador de apiarios
    cantidadProveedores: number;         // Contador de proveedores
    proveedorNombres?: string;           // ✅ NUEVO - Nombres de proveedores separados por coma
    totalColmenas: number;               // NUEVO - Suma total de colmenas de todos los apiarios
    totalKilosEntregados: number;        // ✅ NUEVO - Total de kilos entregados a proveedores
    totalEntregas: number;               // ✅ NUEVO - Número total de entregas realizadas
    mielPorTipo: MielPorTipo[];          // ✅ NUEVO - Detalle de entregas por tipo de miel
}

/**
 * ============================================================================
 * APICULTOR DETALLE - CON RELACIONES COMPLETAS
 * ============================================================================
 */
export interface ApicultorDetailAPI extends ApicultorAPI {
    apiarios: ApicultorApiario[];
    proveedores: ApicultorProveedor[];
}

/**
 * ============================================================================
 * APIARIO VINCULADO AL APICULTOR
 * ============================================================================
 */
export interface ApicultorApiario {
    id: string;                          // CUID del apiario
    nombre: string;                      // Nombre del apiario
    colmenas: number;                    // Número de colmenas
    produccion: number;                  // Producción por colmena (kg)
    produccionAnual: number;             // Producción anual total (kg)
    latitud: string | null;              // Coordenada GPS (string en DB)
    longitud: string | null;             // Coordenada GPS (string en DB)
}

/**
 * ============================================================================
 * PROVEEDOR VINCULADO AL APICULTOR
 * ============================================================================
 */
export interface ApicultorProveedor {
    id: string;                          // CUID del vínculo
    proveedorId: number;                 // ID del proveedor
    proveedorNombre: string;             // Nombre del proveedor
    proveedorTipo: string;               // ACOPIADOR | MIELERA
    fechaRegistro: string;               // ISO 8601
    estatusVinculo: 'ACTIVO' | 'INACTIVO';
}

/**
 * ============================================================================
 * REQUEST PARA CREAR APICULTOR v2.0
 * ============================================================================
 * IMPORTANTE: Campo 'codigo' YA NO SE ENVÍA (se genera automáticamente)
 */
export interface CreateApicultorRequest {
    nombre: string;                      // Solo primer nombre (obligatorio, max 100 chars)
    apellidoPaterno: string;             // Apellido paterno (obligatorio, max 100 chars)
    apellidoMaterno?: string;            // Apellido materno (opcional, max 100 chars)
    curp: string;                        // CURP 18 caracteres (obligatorio, único)
    rfc?: string;                        // RFC (opcional, max 13 chars)
    estadoCodigo: string;                // Código del estado (AHORA OBLIGATORIO)
    municipioCodigo: string;             // Código del municipio (AHORA OBLIGATORIO)
    direccion?: string;                  // Dirección física
    idRasmiel?: string;                  // ID-RASMIEL (opcional, max 50 chars)
    uppSiniiga?: string;                 // UPPSINIIGA (opcional, max 50 chars)
    estatus?: ApicultorEstado;           // Default: ACTIVO
    proveedorIds?: number[];             // IDs de proveedores a vincular
}

/**
 * ============================================================================
 * REQUEST PARA ACTUALIZAR APICULTOR v2.0
 * ============================================================================
 *
 * IMPORTANTE:
 * - Campo 'codigo' NO se puede modificar (se muestra como solo lectura)
 * - Campo 'curp' NO se puede modificar (es único e inmutable)
 * - Campo 'nombreCompleto' se recalcula automáticamente al actualizar nombres
 * - Campo proveedorIds gestiona vínculos completos:
 *   · Si NO se envía: mantiene vínculos actuales
 *   · Si se envía con IDs: reemplaza completamente los vínculos
 *   · Si se envía vacío []: elimina todos los vínculos
 */
export interface UpdateApicultorRequest {
    nombre?: string;                     // Solo primer nombre (max 100 chars)
    apellidoPaterno?: string;            // Apellido paterno (max 100 chars)
    apellidoMaterno?: string;            // Apellido materno (max 100 chars)
    rfc?: string;                        // RFC (max 13 chars)
    estadoCodigo?: string;               // Código del estado
    municipioCodigo?: string;            // Código del municipio
    direccion?: string;                  // Dirección física
    idRasmiel?: string;                  // ID-RASMIEL (max 50 chars)
    uppSiniiga?: string;                 // UPPSINIIGA (max 50 chars)
    estatus?: ApicultorEstado;           // ACTIVO | INACTIVO
    proveedorIds?: number[];             // Gestión de vínculos (opcional)
}

/**
 * ============================================================================
 * PARÁMETROS DE FILTRADO Y BÚSQUEDA
 * ============================================================================
 */
export interface ApicultorFilterParams {
    nombre?: string;                     // Búsqueda parcial
    curp?: string;                       // Búsqueda parcial
    codigo?: string;                     // Búsqueda parcial
    estadoCodigo?: string;               // Filtrar por estado
    municipioCodigo?: string;            // Filtrar por municipio
    estatus?: ApicultorEstado;           // ACTIVO | INACTIVO
    page?: number;                       // Paginación (default: 1)
    limit?: number;                      // Registros por página (default: 10)
}

/**
 * ============================================================================
 * RESPUESTAS DE LA API
 * ============================================================================
 */

/**
 * Respuesta GET /api/apicultores (lista paginada)
 */
export interface ApicultoresPaginatedResponse {
    success: boolean;
    data: ApicultorAPI[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Respuesta GET /api/apicultores/:id (detalle)
 */
export interface ApicultorDetailResponse {
    success: boolean;
    data: ApicultorDetailAPI;
}

/**
 * Respuesta POST /api/apicultores (crear)
 */
export interface CreateApicultorResponse {
    success: boolean;
    data: ApicultorDetailAPI;
    message: string;
}

/**
 * Respuesta PUT /api/apicultores/:id (actualizar)
 */
export interface UpdateApicultorResponse {
    success: boolean;
    data: ApicultorDetailAPI;
    message: string;
}

/**
 * Respuesta DELETE /api/apicultores/:id (eliminar)
 */
export interface DeleteApicultorResponse {
    success: boolean;
    message: string;
}

/**
 * Respuesta GET /api/apicultores/:id/proveedores
 */
export interface ProveedoresDeApicultorResponse {
    success: boolean;
    data: ApicultorProveedor[];
}

/**
 * ============================================================================
 * HELPERS Y UTILIDADES
 * ============================================================================
 */

/**
 * Verificar si el apicultor tiene certificación ID-RASMIEL
 */
export function tieneCertificacionRasmiel(apicultor: ApicultorAPI): boolean {
    return apicultor.idRasmiel !== null && apicultor.idRasmiel.trim() !== '';
}

/**
 * Verificar si el apicultor tiene certificación UPPSINIIGA
 */
export function tieneCertificacionUPP(apicultor: ApicultorAPI): boolean {
    return apicultor.uppSiniiga !== null && apicultor.uppSiniiga.trim() !== '';
}

/**
 * Obtener texto del estatus
 */
export function obtenerTextoEstatus(estatus: ApicultorEstado): string {
    return estatus === 'ACTIVO' ? 'Activo' : 'Inactivo';
}

/**
 * Obtener variante de badge según estatus
 */
export function obtenerVarianteBadgeEstatus(estatus: ApicultorEstado): 'success' | 'danger' {
    return estatus === 'ACTIVO' ? 'success' : 'danger';
}