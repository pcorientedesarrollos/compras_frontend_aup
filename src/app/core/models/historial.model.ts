/**
 * Tipos de acciones auditadas en el sistema
 */
export type TipoAccion =
    | 'APICULTOR_CREADO'
    | 'APICULTOR_ACTUALIZADO'
    | 'APICULTOR_DESACTIVADO'
    | 'APIARIO_CREADO'
    | 'APIARIO_ACTUALIZADO'
    | 'APIARIO_ELIMINADO'
    | 'PROVEEDOR_VINCULADO'
    | 'PROVEEDOR_DESVINCULADO'
    | 'USUARIO_CREADO'
    | 'USUARIO_ACTUALIZADO'
    | 'LOGIN_EXITOSO'
    | 'LOGIN_FALLIDO'
    | 'CAMBIO_PASSWORD';

/**
 * Tipos de entidades auditadas
 */
export type EntidadTipo =
    | 'apicultor'
    | 'apiario'
    | 'proveedor'
    | 'usuario'
    | 'vinculacion';

/**
 * Modelo de registro de historial
 */
export interface HistorialRegistro {
    id: string;  // UUID
    tipoAccion: TipoAccion;
    entidadTipo: EntidadTipo;
    entidadId: string;
    descripcion: string;
    estadoAnterior: any | null;      // JSON del estado previo
    estadoNuevo: any | null;         // JSON del nuevo estado
    usuarioId: string;
    usuarioNombre: string;
    usuarioRole: string;
    ip: string;
    userAgent: string;
    createdAt: string;  // ISO8601
}

/**
 * Parámetros de filtro para consultar historial
 */
export interface HistorialFilterParams {
    page?: number;
    limit?: number;
    usuarioId?: string;          // Filtrar por usuario
    tipoAccion?: TipoAccion;     // Filtrar por tipo de acción
    entidadTipo?: EntidadTipo;   // Filtrar por tipo de entidad
    fechaInicio?: string;        // Formato: YYYY-MM-DD
    fechaFin?: string;           // Formato: YYYY-MM-DD
}

/**
 * Resumen de cambios en el historial
 */
export interface HistorialCambio {
    campo: string;
    valorAnterior: any;
    valorNuevo: any;
}

/**
 * Estadísticas de auditoría (opcional para dashboards)
 */
export interface HistorialEstadisticas {
    totalAcciones: number;
    accionesPorTipo: Record<TipoAccion, number>;
    usuariosMasActivos: {
        usuarioId: string;
        usuarioNombre: string;
        totalAcciones: number;
    }[];
}