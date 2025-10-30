/**
 * ============================================================================
 * 🏢 PROVEEDOR API MODELS - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Modelos TypeScript para la API de Proveedores del backend
 * Basado en documentación: documentacion_apis_proveedores.md
 * 
 * NOTA: Estos modelos reflejan la estructura REAL de la API,
 * NO son modelos de dominio del frontend.
 * 
 * ============================================================================
 */

/**
 * Tipos de proveedor en el sistema
 */
export type TipoProveedor = 'ACOPIADOR' | 'MIELERA';

/**
 * Estado del proveedor
 */
export type ProveedorEstado = 0 | 1; // 0 = Inactivo, 1 = Activo

/**
 * ============================================================================
 * PROVEEDOR - ESTRUCTURA COMPLETA DE LA API
 * ============================================================================
 */
export interface ProveedorAPI {
    idProveedor: number;
    tipo: string | null;
    nombre: string;
    idComprador: number | null;
    idDatosFiscales: number | null;
    idDireccion: number | null;
    idSagarpa: string | null;
    tipoDeMiel: number | null;          // ID del tipo de miel
    tipoDeMielNombre: string | null;    // Nombre del tipo de miel (join)
    empresa: number | null;
    cantidad: number | null;            // Cantidad en kg (Decimal)
    idEstado: number | null;
    activoInactivo: ProveedorEstado;    // 0 = Inactivo, 1 = Activo
    latitud: number | null;             // Coordenada GPS
    longitud: number | null;            // Coordenada GPS
    cantidadApicultores: number;        // Contador calculado por backend
    deleteProve: number;
    estaActivo?: boolean;               // Helper calculado
    inventarioMiel?: InventarioMiel[];  // ✅ NUEVO: Inventario por tipo de miel
}

/**
 * ============================================================================
 * TIPO DE MIEL - CATÁLOGO
 * ============================================================================
 */
export interface TipoDeMiel {
    idTipoDeMiel: number;
    tipoDeMiel: string;
    orden: number | null;
}

/**
 * ============================================================================
 * INVENTARIO DE MIEL POR TIPO
 * ============================================================================
 */
export interface InventarioMiel {
    tipoMielId: number;
    tipoMielNombre: string;
    totalEntradas: number;      // kg
    totalSalidas: number;        // kg
    disponible: number;          // kg
}

/**
 * ============================================================================
 * APICULTOR DE PROVEEDOR - VINCULACIÓN
 * ============================================================================
 */
export interface ApicultorDeProveedor {
    id: string;                         // ID del registro de vinculación
    apicultorId: string;                // ID del apicultor (CUID)
    apicultorCodigo: string;            // Código único (APIC-2024-001)
    apicultorNombre: string;            // Nombre completo
    apicultorCurp: string;              // CURP (18 caracteres)
    estadoCodigo: string | null;        // Código del estado (OAX)
    municipioCodigo: string | null;     // Código del municipio
    estatus: 'ACTIVO' | 'INACTIVO';     // Estado del apicultor
    cantidadApiarios: number;           // Número de apiarios
    fechaRegistro: string;              // ISO 8601
    estatusVinculo: 'ACTIVO' | 'INACTIVO'; // Estado del vínculo
}

/**
 * ============================================================================
 * RESPUESTAS DE LA API
 * ============================================================================
 */

/**
 * Respuesta GET /api/proveedores/activos
 */
export interface ProveedoresActivosResponse {
    success: boolean;
    data: ProveedorAPI[];
    total: number;
}

/**
 * Respuesta GET /api/proveedores/tipos-miel
 */
export interface TiposMielResponse {
    success: boolean;
    data: TipoDeMiel[];
    total: number;
}

/**
 * Respuesta GET /api/proveedores (con paginación)
 */
export interface ProveedoresPaginatedResponse {
    success: boolean;
    data: ProveedorAPI[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Respuesta GET /api/proveedores/:id
 */
export interface ProveedorDetailResponse {
    success: boolean;
    data: ProveedorAPI;
}

/**
 * Respuesta GET /api/proveedores/:id/apicultores
 */
export interface ApicultoresDeProveedorResponse {
    success: boolean;
    data: ApicultorDeProveedor[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * ============================================================================
 * PARÁMETROS DE FILTRADO Y BÚSQUEDA
 * ============================================================================
 */

/**
 * Parámetros para GET /api/proveedores (búsqueda avanzada)
 */
export interface ProveedorFilterParams {
    nombre?: string;              // Búsqueda parcial por nombre
    tipo?: string;                // ACOPIADOR | MIELERA
    idEstado?: number;            // ID del estado
    tipoDeMiel?: number;          // ID del tipo de miel
    activoInactivo?: ProveedorEstado; // 0 = Inactivo, 1 = Activo
    page?: number;                // Número de página (default: 1)
    limit?: number;               // Registros por página (default: 10)
}

/**
 * Parámetros para GET /api/proveedores/:id/apicultores
 */
export interface ApicultoresProveedorParams {
    page?: number;                // Número de página (default: 1)
    limit?: number;               // Registros por página (default: 10)
}

/**
 * ============================================================================
 * HELPERS Y UTILIDADES
 * ============================================================================
 */

/**
 * Coordenadas GPS del proveedor
 */
export interface ProveedorCoordenadas {
    latitud: number;
    longitud: number;
}

/**
 * Función helper para verificar si un proveedor tiene coordenadas GPS
 */
export function tieneUbicacionGPS(proveedor: ProveedorAPI): boolean {
    return proveedor.latitud !== null && proveedor.longitud !== null;
}

/**
 * Función helper para obtener coordenadas o null
 */
export function obtenerCoordenadas(proveedor: ProveedorAPI): ProveedorCoordenadas | null {
    if (!tieneUbicacionGPS(proveedor)) {
        return null;
    }
    return {
        latitud: proveedor.latitud!,
        longitud: proveedor.longitud!
    };
}

/**
 * Función helper para obtener texto del estado
 */
export function obtenerTextoEstado(estado: ProveedorEstado): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
}

/**
 * Función helper para obtener variante de badge según estado
 */
export function obtenerVarianteBadgeEstado(estado: ProveedorEstado): 'success' | 'danger' {
    return estado === 1 ? 'success' : 'danger';
}