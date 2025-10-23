/**
 * ============================================================================
 * 🗺️ ESTADO MODEL - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Modelos TypeScript para el catálogo de Estados de México
 * Basado en documentación: DOCUMENTACION_CAMBIOS_FRONTEND.md
 *
 * ENDPOINTS:
 * - GET /api/estados                 → Obtener todos los estados
 * - GET /api/estados/:codigo_inegi   → Obtener estado por código
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * ESTADO - ESTRUCTURA DE LA API
 * ============================================================================
 */
export interface EstadoAPI {
    idEstado: number;                    // ID autoincrementable
    estado: string;                      // Nombre del estado (ej: "Oaxaca")
    abreviacion: string;                 // Abreviación (ej: "Oax.")
    codigo_inegi: string;                // Código INEGI (ej: "20")
}

/**
 * ============================================================================
 * RESPUESTAS DE LA API
 * ============================================================================
 */

/**
 * Respuesta GET /api/estados
 */
export interface EstadosResponse {
    success: boolean;
    data: EstadoAPI[];
    message: string;
}

/**
 * Respuesta GET /api/estados/:codigo_inegi
 */
export interface EstadoDetailResponse {
    success: boolean;
    data: EstadoAPI;
    message: string;
}

/**
 * ============================================================================
 * HELPERS Y UTILIDADES
 * ============================================================================
 */

/**
 * Opción para select/autocomplete de estados
 */
export interface EstadoOption {
    value: string;                       // codigo_inegi
    label: string;                       // nombre del estado
}

/**
 * Convertir EstadoAPI a EstadoOption (para componentes de UI)
 */
export function estadoToOption(estado: EstadoAPI): EstadoOption {
    return {
        value: estado.codigo_inegi,
        label: estado.estado
    };
}

/**
 * Convertir array de EstadoAPI a array de EstadoOption
 */
export function estadosToOptions(estados: EstadoAPI[]): EstadoOption[] {
    return estados.map(e => estadoToOption(e));
}
