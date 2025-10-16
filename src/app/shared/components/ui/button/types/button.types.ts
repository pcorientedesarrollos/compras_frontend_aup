/**
 * ============================================================================
 * 🎨 BUTTON TYPES - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Definición de tipos para el componente Button
 * 
 * ============================================================================
 */

export type ButtonVariant =
    | 'primary'      // Botón principal (honey-primary)
    | 'secondary'    // Botón secundario (gris)
    | 'danger'       // Acciones destructivas (rojo)
    | 'success'      // Acciones positivas (verde)
    | 'outline';     // Botón con borde

export type ButtonSize =
    | 'sm'           // Pequeño
    | 'md'           // Mediano (default)
    | 'lg';          // Grande

export type ButtonType =
    | 'button'       // Botón normal
    | 'submit'       // Para formularios
    | 'reset';       // Reset de formularios

export interface ButtonConfig {
    variant: ButtonVariant;
    size: ButtonSize;
    type: ButtonType;
    disabled: boolean;
    loading: boolean;
    fullWidth: boolean;
    iconLeft?: string;
    iconRight?: string;
}