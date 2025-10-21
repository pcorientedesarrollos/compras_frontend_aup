/**
 * ============================================================================
 * 🐝 APICULTOR API MODELS - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Modelos TypeScript para la API de Apicultores del backend
 * Basado en documentación: documentacion_apicultores_backend.md
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
 * - GET    /api/apicultores/proveedor/:id      → Apicultores de un proveedor
 * 
 * ============================================================================
 */

/**
 * Estado del apicultor
 */
export type ApicultorEstado = 'ACTIVO' | 'INACTIVO';

/**
 * ============================================================================
 * APICULTOR - ESTRUCTURA COMPLETA DE LA API
 * ============================================================================
 */
export interface ApicultorAPI {
    id: string;                          // CUID
    codigo: string;                      // Código único (APIC-2025-001)
    nombre: string;                      // Nombre completo
    curp: string;                        // CURP (18 caracteres, único)
    rfc: string | null;                  // RFC (13 caracteres, opcional)
    estadoCodigo: string | null;         // Código del estado (ej: "20" = Oaxaca)
    municipioCodigo: string | null;      // Código del municipio
    direccion: string | null;            // Dirección física
    senasica: string | null;             // Certificación SENASICA
    ippSiniga: string | null;            // Certificación IPP/SINIGA
    estatus: ApicultorEstado;            // ACTIVO | INACTIVO
    fechaAlta: string;                   // ISO 8601
    createdAt: string;                   // ISO 8601
    updatedAt: string;                   // ISO 8601
    totalApiarios: number;               // Contador (join)
    totalProveedores: number;            // Contador (join)
    cantidadApiarios: number;          // Contador alternativo (join)
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
 * REQUEST PARA CREAR APICULTOR
 * ============================================================================
 */
export interface CreateApicultorRequest {
    codigo: string;                      // Código único (obligatorio)
    nombre: string;                      // Nombre completo (obligatorio)
    curp: string;                        // CURP 18 caracteres (obligatorio, único)
    rfc?: string;                        // RFC (opcional, sin validación estricta)
    estadoCodigo?: string;               // Código del estado
    municipioCodigo?: string;            // Código del municipio
    direccion?: string;                  // Dirección física
    senasica?: string;                   // Certificación SENASICA
    ippSiniga?: string;                  // Certificación IPP/SINIGA
    estatus?: ApicultorEstado;           // Default: ACTIVO
    proveedorIds?: number[];             // IDs de proveedores a vincular
}

/**
 * ============================================================================
 * REQUEST PARA ACTUALIZAR APICULTOR
 * ============================================================================
 * 
 * IMPORTANTE: Campo proveedorIds gestiona vínculos completos:
 * - Si NO se envía: mantiene vínculos actuales
 * - Si se envía con IDs: reemplaza completamente los vínculos
 * - Si se envía vacío []: elimina todos los vínculos
 */
export interface UpdateApicultorRequest {
    nombre?: string;
    rfc?: string;
    estadoCodigo?: string;
    municipioCodigo?: string;
    direccion?: string;
    senasica?: string;
    ippSiniga?: string;
    estatus?: ApicultorEstado;
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
 * Verificar si el apicultor tiene certificación SENASICA
 */
export function tieneCertificacionSenasica(apicultor: ApicultorAPI): boolean {
    return apicultor.senasica !== null && apicultor.senasica.trim() !== '';
}

/**
 * Verificar si el apicultor tiene certificación IPP/SINIGA
 */
export function tieneCertificacionIPP(apicultor: ApicultorAPI): boolean {
    return apicultor.ippSiniga !== null && apicultor.ippSiniga.trim() !== '';
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