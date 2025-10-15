/**
 * Modelo base de Proveedor (Acopiador o Mielera)
 */
export interface Proveedor {
    id: number;
    nombre: string;
    rfc: string;
    tipoDeMiel: string;
    direccion: string;
    telefono: string;
    email: string;
}

/**
 * Proveedor con información adicional (usado en listados)
 */
export interface ProveedorListItem extends Proveedor {
    _count: {
        apicultores: number;  // Total de apicultores vinculados
    };
}

/**
 * Proveedor con detalles completos (usado en vista detalle)
 */
export interface ProveedorDetail extends Proveedor {
    createdAt: string;  // ISO8601
    apicultores: ProveedorApicultor[];
}

/**
 * Apicultor vinculado a un proveedor
 */
export interface ProveedorApicultor {
    apicultor: {
        id: string;
        nombre: string;
        curp: string;
        estado: 'ACTIVO' | 'INACTIVO';
    };
    fechaVinculacion: string;  // ISO8601
}

/**
 * Parámetros de filtro para listado de proveedores
 */
export interface ProveedorFilterParams {
    page?: number;
    limit?: number;
    search?: string;       // Búsqueda por nombre/RFC
    tipoDeMiel?: string;   // Filtrar por tipo de miel
}

/**
 * Apicultor simple vinculado a proveedor (respuesta GET /proveedores/:id/apicultores)
 */
export interface ApicultorDeProveedor {
    id: string;
    nombre: string;
    curp: string;
    rfc: string;
    estado: 'ACTIVO' | 'INACTIVO';
    municipio: string;
    fechaVinculacion: string;  // ISO8601
    _count: {
        apiarios: number;
    };
}