/**
 * ============================================================================
 * 📦 ICONS BARREL EXPORT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Punto de entrada único para todos los iconos del sistema
 * 
 * ============================================================================
 */

import { OUTLINE_ICONS } from './outline-icons';
import { IconName, IconVariant } from '../types/icon.types';

/**
 * Obtener el path SVG de un icono por nombre y variante
 * @param name - Nombre del icono
 * @param variant - Variante del icono (outline por defecto)
 * @returns Path SVG o string vacío si no existe
 */
export function getIconPath(name: IconName, variant: IconVariant = 'outline'): string {
    if (variant === 'outline') {
        return OUTLINE_ICONS[name] || '';
    }

    // Fallback para variantes no implementadas
    console.warn(`Variante "${variant}" no implementada. Usando outline.`);
    return OUTLINE_ICONS[name] || '';
}

/**
 * Verificar si un icono existe
 * @param name - Nombre del icono
 * @returns true si el icono existe
 */
export function hasIcon(name: IconName): boolean {
    return name in OUTLINE_ICONS;
}

/**
 * Obtener todos los nombres de iconos disponibles
 * @returns Array con todos los nombres de iconos
 */
export function getAllIconNames(): IconName[] {
    return Object.keys(OUTLINE_ICONS) as IconName[];
}

/**
 * Re-exportar constantes para uso externo
 */
export { OUTLINE_ICONS } from './outline-icons';