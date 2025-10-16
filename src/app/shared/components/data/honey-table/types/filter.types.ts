/**
 * ============================================================================
 * 🔍 FILTER TYPES - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Tipos para el sistema de filtros de tablas
 * 
 * ============================================================================
 */

import { IconName } from "../../../ui/icon/types/icon.types";

/**
 * Tipo de filtro
 */
export type FilterType =
    | 'text'      // Input de búsqueda
    | 'select'    // Dropdown
    | 'date'      // Selector de fecha
    | 'daterange' // Rango de fechas
    | 'number'    // Input numérico
    | 'boolean';  // Checkbox

/**
 * Opción de select
 */
export interface FilterOption {
    value: string | number;
    label: string;
    icon?: IconName;
}

/**
 * Configuración de un filtro
 */
export interface FilterConfig {
    /** Tipo de filtro */
    type: FilterType;

    /** Clave única del filtro */
    key: string;

    /** Label mostrado */
    label: string;

    /** Placeholder (para inputs) */
    placeholder?: string;

    /** Opciones (para select) */
    options?: FilterOption[];

    /** Valor por defecto */
    defaultValue?: any;

    /** Ancho del filtro */
    width?: string;

    /** Icono */
    icon?: IconName;
    /** Deshabilitado */
    disabled?: boolean;
}

/**
 * Filtro activo
 */
export interface ActiveFilter {
    key: string;
    label: string;
    value: any;
    displayValue: string;
}

/**
 * Evento de cambio de filtros
 */
export interface FiltersChangeEvent {
    filters: Record<string, any>;
    activeFilters: ActiveFilter[];
}

/**
 * Estado de filtros
 */
export interface FilterState {
    [key: string]: any;
}