/**
 * ============================================================================
 * 🏘️ MUNICIPIO MODEL - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Modelos TypeScript para el catálogo de Municipios de México
 * Basado en documentación: DOCUMENTACION_CAMBIOS_FRONTEND.md
 *
 * ENDPOINTS:
 * - GET /api/municipios                          → Obtener todos los municipios
 * - GET /api/municipios?estado_codigo={code}     → Filtrar por estado
 * - GET /api/municipios/estado/:estado_codigo    → Municipios de un estado
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * MUNICIPIO - ESTRUCTURA DE LA API
 * ============================================================================
 */
export interface MunicipioAPI {
    id_municipio: number;                // ID autoincrementable
    clave_municipio: string;             // Clave del municipio (ej: "001")
    nombreMunicipio: string;             // Nombre del municipio (ej: "Oaxaca de Juárez")
    estado_codigo: string;               // Código del estado al que pertenece (ej: "20")
}

/**
 * ============================================================================
 * RESPUESTAS DE LA API
 * ============================================================================
 */

/**
 * Respuesta GET /api/municipios
 * Respuesta GET /api/municipios/estado/:estado_codigo
 */
export interface MunicipiosResponse {
    success: boolean;
    data: MunicipioAPI[];
    message: string;
}

/**
 * ============================================================================
 * HELPERS Y UTILIDADES
 * ============================================================================
 */

/**
 * Opción para select/autocomplete de municipios
 */
export interface MunicipioOption {
    value: string;                       // clave_municipio
    label: string;                       // nombreMunicipio
    estadoCodigo: string;                // estado_codigo (para filtrado)
}

/**
 * Convertir MunicipioAPI a MunicipioOption (para componentes de UI)
 */
export function municipioToOption(municipio: MunicipioAPI): MunicipioOption {
    return {
        value: municipio.clave_municipio,
        label: municipio.nombreMunicipio,
        estadoCodigo: municipio.estado_codigo
    };
}

/**
 * Convertir array de MunicipioAPI a array de MunicipioOption
 */
export function municipiosToOptions(municipios: MunicipioAPI[]): MunicipioOption[] {
    return municipios.map(m => municipioToOption(m));
}
