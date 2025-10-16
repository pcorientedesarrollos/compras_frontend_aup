/**
 * ============================================================================
 * 📊 TABLE TYPES - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Tipos e interfaces para el sistema de tablas reutilizable
 * 
 * ============================================================================
 */

import { BadgeVariant } from '../../../ui/badge/types/badge.types';
import { IconName } from '../../../ui/icon/types/icon.types';

/**
 * Tipo de columna
 */
export type ColumnType =
    | 'text'        // Texto simple
    | 'number'      // Número formateado
    | 'badge'       // Badge con colores
    | 'date'        // Fecha formateada
    | 'editable'    // Editable inline
    | 'boolean'     // Checkbox/Toggle
    | 'custom'      // Custom template
    | 'actions';    // Menú de acciones

/**
 * Alineación de columna
 */
export type ColumnAlign = 'left' | 'center' | 'right';

/**
 * Configuración de badge para columnas tipo 'badge'
 */
export interface BadgeConfig {
    [key: string | number]: {
        variant: BadgeVariant;
        label: string;
        icon?: IconName;
    };
}

/**
 * Configuración de edición para columnas tipo 'editable'
 */
export interface EditConfig {
    type?: 'text' | 'number' | 'email';
    validation?: 'required' | 'email' | 'rfc' | 'curp' | RegExp;
    maxLength?: number;
    uppercase?: boolean;
    placeholder?: string;
}

/**
 * Formateador de valor
 */
export type ValueFormatter = (value: any, row?: any) => string;

/**
 * Configuración de columna
 */
export interface TableColumn {
    /** Clave de la propiedad en el objeto de datos */
    key: string;

    /** Etiqueta mostrada en el header */
    label: string;

    /** Tipo de columna */
    type: ColumnType;

    /** Ancho de la columna */
    width?: string;

    /** Alineación del contenido */
    align?: ColumnAlign;

    /** Si la columna es ordenable */
    sortable?: boolean;

    /** Si la columna es visible */
    visible?: boolean;

    /** Configuración de badge (para type='badge') */
    badgeConfig?: BadgeConfig;

    /** Configuración de edición (para type='editable') */
    editConfig?: EditConfig;

    /** Formateador personalizado de valor */
    formatter?: ValueFormatter;

    /** CSS classes adicionales */
    cssClass?: string;

    /** Tooltip del header */
    headerTooltip?: string;
}

/**
 * Dirección de ordenamiento
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Estado de ordenamiento
 */
export interface SortState {
    column: string;
    direction: SortDirection;
}

/**
 * Configuración de paginación
 */
export interface PaginationConfig {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    pageSizeOptions?: number[];
}

/**
 * Evento de cambio de página
 */
export interface PageChangeEvent {
    page: number;
    pageSize: number;
}

/**
 * Evento de edición de celda
 */
export interface CellEditEvent {
    row: any;
    column: TableColumn;
    oldValue: any;
    newValue: any;
}

/**
 * Configuración general de la tabla
 */
export interface TableConfig {
    /** Mostrar loading skeleton */
    loading?: boolean;

    /** Mensaje cuando no hay datos */
    emptyMessage?: string;

    /** Mensaje durante loading */
    loadingMessage?: string;

    /** Permitir selección de filas */
    selectable?: boolean;

    /** Filas seleccionadas */
    selectedRows?: any[];

    /** Hover en filas */
    hoverable?: boolean;

    /** Striped rows */
    striped?: boolean;

    /** Bordes */
    bordered?: boolean;

    /** Tamaño de la tabla */
    size?: 'sm' | 'md' | 'lg';

    /** Sticky header */
    stickyHeader?: boolean;

    /** Altura máxima (con scroll) */
    maxHeight?: string;
}

/**
 * Evento de click en fila
 */
export interface RowClickEvent {
    row: any;
    index: number;
    event: MouseEvent;
}

/**
 * Evento de ordenamiento
 */
export interface SortEvent {
    column: string;
    direction: SortDirection;
}