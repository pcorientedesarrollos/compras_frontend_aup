/**
 * ============================================================================
 * 🔍 TABLE FILTERS COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Sistema de filtros dinámico para tablas
 * 
 * FEATURES:
 * - Múltiples tipos de filtros (text, select, date, number)
 * - Pills de filtros activos (removibles)
 * - Contador de resultados
 * - Botón "Limpiar todo"
 * - Responsive
 * - Signals reactivos
 * 
 * USO:
 * <app-table-filters
 *   [filters]="filterConfig()"
 *   [activeFilters]="activeFilters()"
 *   [resultCount]="totalItems()"
 *   [totalCount]="totalItems()"
 *   (filtersChange)="onFiltersChange($event)"
 *   (filterRemove)="onFilterRemove($event)"
 *   (clearAll)="clearAllFilters()">
 * </app-table-filters>
 * 
 * ============================================================================
 */

import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../ui/icon/icon.component';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { ButtonComponent } from '../../ui/button/button.component';
import {
    FilterConfig,
    FilterType,
    ActiveFilter,
    FilterState,
    FiltersChangeEvent
} from '../honey-table/types/filter.types';

@Component({
    selector: 'app-table-filters',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IconComponent,
        BadgeComponent,
        ButtonComponent
    ],
    templateUrl: './table-filters.component.html',
    styleUrl: './table-filters.component.css'
})
export class TableFiltersComponent {

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Configuración de filtros */
    filters = input.required<FilterConfig[]>();

    /** Estado actual de filtros */
    filterState = input<FilterState>({});

    /** Contador de resultados filtrados */
    resultCount = input<number | undefined>(undefined);

    /** Total de registros sin filtrar */
    totalCount = input<number | undefined>(undefined);

    /** Mostrar contador de resultados */
    showResultCount = input<boolean>(true);

    /** Mostrar pills de filtros activos */
    showActivePills = input<boolean>(true);

    /** Mostrar botón limpiar */
    showClearButton = input<boolean>(true);

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    /** Evento cuando cambian los filtros */
    filtersChange = output<FiltersChangeEvent>();

    /** Evento cuando se remueve un filtro específico */
    filterRemove = output<string>();

    /** Evento cuando se limpian todos los filtros */
    clearAll = output<void>();

    // ============================================================================
    // STATE
    // ============================================================================

    /** Estado interno de filtros */
    private internalFilters = signal<FilterState>({});

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Estado actual de filtros (usa input si está disponible, sino interno) */
    currentFilters = computed(() => {
        const inputState = this.filterState();
        return Object.keys(inputState).length > 0 ? inputState : this.internalFilters();
    });

    /** Filtros activos (con valores no vacíos) */
    activeFilters = computed(() => {
        const filters: ActiveFilter[] = [];
        const state = this.currentFilters();
        const configs = this.filters();

        Object.entries(state).forEach(([key, value]) => {
            // Skip si el valor es vacío o default
            if (this.isEmptyValue(value)) return;

            const config = configs.find(f => f.key === key);
            if (!config) return;

            filters.push({
                key,
                label: config.label,
                value,
                displayValue: this.getDisplayValue(value, config)
            });
        });

        return filters;
    });

    /** Si hay filtros activos */
    hasActiveFilters = computed(() => this.activeFilters().length > 0);

    /** Texto del contador de resultados */
    resultText = computed(() => {
        const result = this.resultCount();
        const total = this.totalCount();
        const hasFilters = this.hasActiveFilters();

        if (result === undefined) return '';

        if (!hasFilters && total !== undefined) {
            return `${result} de ${total} registros`;
        }

        if (hasFilters && total !== undefined) {
            return `${result} resultados de ${total} filtrados`;
        }

        return `${result} resultados`;
    });

    // ============================================================================
    // METHODS - FILTER CHANGES
    // ============================================================================

    onFilterChange(key: string, value: any): void {
        const newState = {
            ...this.currentFilters(),
            [key]: value
        };

        this.internalFilters.set(newState);
        this.emitFiltersChange(newState);
    }

    onFilterRemove(key: string): void {
        const config = this.filters().find(f => f.key === key);
        const defaultValue = config?.defaultValue ?? this.getDefaultValueForType(config?.type);

        const newState = {
            ...this.currentFilters(),
            [key]: defaultValue
        };

        this.internalFilters.set(newState);
        this.filterRemove.emit(key);
        this.emitFiltersChange(newState);
    }

    onClearAll(): void {
        const clearedState: FilterState = {};

        this.filters().forEach(filter => {
            clearedState[filter.key] = filter.defaultValue ?? this.getDefaultValueForType(filter.type);
        });

        this.internalFilters.set(clearedState);
        this.clearAll.emit();
        this.emitFiltersChange(clearedState);
    }

    private emitFiltersChange(state: FilterState): void {
        this.filtersChange.emit({
            filters: state,
            activeFilters: this.activeFilters()
        });
    }

    // ============================================================================
    // METHODS - HELPERS
    // ============================================================================

    getFilterValue(key: string): any {
        const state = this.currentFilters();
        const config = this.filters().find(f => f.key === key);

        if (state[key] !== undefined) {
            return state[key];
        }

        return config?.defaultValue ?? this.getDefaultValueForType(config?.type);
    }

    getDefaultValueForType(type?: FilterType): any {
        switch (type) {
            case 'text':
            case 'select':
                return '';
            case 'number':
                return null;
            case 'date':
            case 'daterange':
                return null;
            case 'boolean':
                return false;
            default:
                return '';
        }
    }

    isEmptyValue(value: any): boolean {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;

        // Para selects, considerar 'all' como vacío
        if (typeof value === 'string' && value === 'all') return true;

        return false;
    }

    getDisplayValue(value: any, config: FilterConfig): string {
        if (config.type === 'select' && config.options) {
            const option = config.options.find(opt => opt.value === value);
            return option?.label ?? String(value);
        }

        if (config.type === 'boolean') {
            return value ? 'Sí' : 'No';
        }

        if (config.type === 'date') {
            return new Date(value).toLocaleDateString('es-MX');
        }

        return String(value);
    }

    getPillColor(index: number): string {
        const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'indigo'];
        return colors[index % colors.length];
    }

    trackByKey(index: number, filter: FilterConfig): string {
        return filter.key;
    }

    trackByActiveKey(index: number, filter: ActiveFilter): string {
        return filter.key;
    }
}