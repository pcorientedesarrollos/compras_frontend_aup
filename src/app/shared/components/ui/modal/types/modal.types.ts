/**
 * ============================================================================
 * 🪟 MODAL TYPES - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Definición de tipos para el componente Modal
 * 
 * ============================================================================
 */

export type ModalSize =
    | 'sm'           // Pequeño (max-w-md)
    | 'md'           // Mediano (max-w-lg) - default
    | 'lg'           // Grande (max-w-2xl)
    | 'xl'           // Extra grande (max-w-4xl)
    | 'full';        // Pantalla completa

export interface ModalConfig {
    size: ModalSize;
    title?: string;
    showCloseButton: boolean;
    closeOnBackdrop: boolean;
    closeOnEscape: boolean;
    showFooter: boolean;
}