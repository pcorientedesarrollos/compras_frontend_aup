/**
 * Modelo base de Apiario
 */
export interface Apiario {
    id: string;  // UUID
    nombre: string;
    estadoMexico: string;
    municipio: string;
    direccion: string;
    numeroColmenas: number;
    latitud: number;   // -90 a 90
    longitud: number;  // -180 a 180
    createdAt: string; // ISO8601
}

/**
 * Apiario en listados (incluye información del apicultor)
 */
export interface ApiarioListItem extends Omit<Apiario, 'direccion' | 'createdAt'> {
    apicultor: {
        id: string;
        nombre: string;
    };
}

/**
 * Apiario con información completa (vista detalle)
 */
export interface ApiarioDetail extends Apiario {
    apicultor: {
        id: string;
        nombre: string;
        curp: string;
    };
}

/**
 * Request para crear apiario
 */
export interface CreateApiarioRequest {
    nombre: string;
    apicultorId: string;     // UUID del apicultor
    estadoMexico: string;
    municipio: string;
    direccion?: string;      // Opcional
    numeroColmenas: number;
    latitud: number;         // -90 a 90
    longitud: number;        // -180 a 180
}

/**
 * Request para actualizar apiario
 */
export interface UpdateApiarioRequest {
    nombre?: string;
    direccion?: string;
    numeroColmenas?: number;
    latitud?: number;
    longitud?: number;
}

/**
 * Parámetros de filtro para listado de apiarios
 */
export interface ApiarioFilterParams {
    page?: number;
    limit?: number;
    apicultorId?: string;  // Filtrar por apicultor
    search?: string;       // Búsqueda por nombre
}

/**
 * Coordenadas GPS del apiario
 */
export interface ApiarioCoordenadas {
    latitud: number;
    longitud: number;
}

/**
 * Datos para mostrar apiario en mapa
 */
export interface ApiarioMapa {
    id: string;
    nombre: string;
    numeroColmenas: number;
    latitud: number;
    longitud: number;
    apicultorNombre: string;
}