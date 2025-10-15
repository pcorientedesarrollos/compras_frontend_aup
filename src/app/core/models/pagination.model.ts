/**
 * Metadatos de paginación retornados por el backend
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Respuesta paginada genérica del backend
 * Se usa en listados de apicultores, apiarios, proveedores, etc.
 */
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: PaginationMeta;
    message?: string;
}

/**
 * Parámetros de consulta para endpoints paginados
 */
export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
}