/**
 * ============================================================================
 * 🚨 ALERT TYPES - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Definición de tipos para el componente Alert
 * 
 * ============================================================================
 */

export type AlertType =
    | 'success'      // Verde - Operaciones exitosas
    | 'error'        // Rojo - Errores
    | 'warning'      // Amarillo - Advertencias
    | 'info';        // Azul - Información

export type AlertPosition =
    | 'top-right'    // Esquina superior derecha
    | 'top-left'     // Esquina superior izquierda
    | 'top-center'   // Centro superior
    | 'bottom-right' // Esquina inferior derecha
    | 'bottom-left'  // Esquina inferior izquierda
    | 'bottom-center'; // Centro inferior

export interface AlertConfig {
    type: AlertType;
    title?: string;
    message: string;
    dismissible: boolean;
    autoClose: boolean;
    duration: number;
    icon?: string;
    position?: AlertPosition;
}