/**
 * Estado del apicultor
 */
export type ApicultorEstado = 'ACTIVO' | 'INACTIVO';

/**
 * Modelo base de Apicultor
 */
export interface Apicultor {
    id: string;  // UUID
    nombre: string;
    curp: string;
    rfc: string;
    telefono: string;
    email: string;
    estadoMexico: string;      // Estado de la república
    municipio: string;
    direccion: string;
    certificadoSenasica: boolean;
    certificadoIPP: boolean;
    estado: ApicultorEstado;
    createdAt: string;  // ISO8601
}

/**
 * Apicultor en listados (incluye contadores)
 */
export interface ApicultorListItem extends Omit<Apicultor, 'direccion' | 'createdAt'> {
    _count: {
        apiarios: number;
        proveedores: number;
    };
}

/**
 * Apicultor con información completa (vista detalle)
 */
export interface ApicultorDetail extends Apicultor {
    apiarios: ApicultorApiario[];
    proveedores: ApicultorProveedor[];
}

/**
 * Apiario asociado a un apicultor
 */
export interface ApicultorApiario {
    id: string;
    nombre: string;
    numeroColmenas: number;
    latitud: number;
    longitud: number;
}

/**
 * Proveedor vinculado a un apicultor
 */
export interface ApicultorProveedor {
    proveedor: {
        id: number;
        nombre: string;
    };
    fechaVinculacion: string;  // ISO8601
}

/**
 * Request para crear apicultor
 */
export interface CreateApicultorRequest {
    nombre: string;
    curp: string;
    rfc?: string;
    telefono: string;
    email?: string;
    estadoMexico: string;
    municipio: string;
    direccion: string;
    certificadoSenasica: boolean;
    certificadoIPP: boolean;
    proveedorId?: number;  // Opcional: vincular inmediatamente
}

/**
 * Request para actualizar apicultor
 */
export interface UpdateApicultorRequest {
    nombre?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    certificadoSenasica?: boolean;
    certificadoIPP?: boolean;
    estado?: ApicultorEstado;  // Solo ADMINISTRADOR
}

/**
 * Parámetros de filtro para listado de apicultores
 */
export interface ApicultorFilterParams {
    page?: number;
    limit?: number;
    search?: string;              // Nombre, CURP, RFC
    estado?: ApicultorEstado;
    municipio?: string;
    proveedorId?: number;         // Filtrar por proveedor
}

/**
 * Request para vincular apicultor con proveedor
 */
export interface VincularProveedorRequest {
    proveedorId: number;
}