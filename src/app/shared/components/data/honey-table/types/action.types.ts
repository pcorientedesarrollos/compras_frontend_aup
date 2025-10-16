/**
 * ============================================================================
 * ⚡ ACTION TYPES - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Tipos para menús de acciones
 * 
 * ============================================================================
 */

import { IconName } from '../../../ui/icon/types/icon.types';

/**
 * Variante de acción (para colores)
 */
export type ActionVariant =
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

/**
 * Item de acción
 */
export interface ActionItem {
    /** Clave única de la acción */
    key: string;

    /** Label mostrado */
    label: string;

    /** Icono */
    icon?: IconName;

    /** Variante de color */
    variant?: ActionVariant;

    /** Deshabilitado */
    disabled?: boolean | ((row: any) => boolean);

    /** Visible */
    visible?: boolean | ((row: any) => boolean);

    /** Separador después de este item */
    separator?: boolean;

    /** Confirmación requerida */
    confirm?: {
        title: string;
        message: string;
    };
}

/**
 * Sección de acciones
 */
export interface ActionSection {
    /** Label de la sección */
    label: string;

    /** Items de la sección */
    items: ActionItem[];
}

/**
 * Configuración de menú de acciones
 */
export interface ActionMenuConfig {
    /** Secciones de acciones */
    sections?: ActionSection[];

    /** Items sin sección */
    items?: ActionItem[];

    /** Posición del menú */
    position?: 'left' | 'right';

    /** Ancho del menú */
    width?: string;
}

/**
 * Evento de click en acción
 */
export interface ActionClickEvent {
    action: string;
    row: any;
    index: number;
}