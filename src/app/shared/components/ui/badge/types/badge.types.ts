/**
 * ============================================================================
 * 🏷️ BADGE TYPES - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Definición de tipos para el componente Badge
 * 
 * ============================================================================
 */

export type BadgeVariant =
    | 'success'      // Verde - Estados activos, aprobados
    | 'warning'      // Amarillo - Advertencias, pendientes
    | 'danger'       // Rojo - Errores, inactivos
    | 'info'         // Azul - Información general
    | 'default';     // Gris - Neutral

export type BadgeSize =
    | 'sm'           // Pequeño
    | 'md'           // Mediano (default)
    | 'lg';          // Grande

export interface BadgeConfig {
    variant: BadgeVariant;
    size: BadgeSize;
    dot: boolean;
    icon?: string;
    removable: boolean;
}