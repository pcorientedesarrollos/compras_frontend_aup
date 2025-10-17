/**
 * ============================================================================
 * 📊 HONEY TABLE COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Tabla reutilizable con soporte para:
 * - Múltiples tipos de columnas
 * - Ordenamiento
 * - Edición inline
 * - Acciones por fila
 * - Loading states
 * - Empty states
 * 
 * 🔧 BUG CORREGIDO: Menú de acciones se cierra correctamente
 * 
 * ============================================================================
 */

import { Component, computed, input, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { ActionMenuComponent } from '../action-menu/action-menu.component';
import { EditableCellComponent } from '../editable-cell/editable-cell.component';
import {
    TableColumn,
    TableConfig,
    SortState,
    SortDirection,
    RowClickEvent,
    CellEditEvent,
    SortEvent
} from './types/table.types';
import { ActionMenuConfig, ActionClickEvent } from './types/action.types';

@Component({
    selector: 'app-honey-table',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BadgeComponent,
        IconComponent,
        ActionMenuComponent,
        EditableCellComponent
    ],
    templateUrl: './honey-table.component.html',
    styleUrl: './honey-table.component.css'
})
export class HoneyTableComponent {

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Columnas de la tabla */
    columns = input.required<TableColumn[]>();

    /** Datos a mostrar */
    data = input<any[]>([]);

    /** Configuración general */
    config = input<TableConfig>({});

    /** Configuración de acciones por fila */
    rowActions = input<ActionMenuConfig | undefined>(undefined);

    /** Clave única para identificar filas (default: 'id') */
    rowKey = input<string>('idProveedor');

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    /** Evento de click en fila */
    rowClick = output<RowClickEvent>();

    /** Evento de edición de celda */
    cellEdit = output<CellEditEvent>();

    /** Evento de ordenamiento */
    sort = output<SortEvent>();

    /** Evento de acción */
    actionClick = output<ActionClickEvent>();

    // ============================================================================
    // STATE
    // ============================================================================

    /** Estado de ordenamiento */
    sortState = signal<SortState>({ column: '', direction: null });

    /** Menú abierto (ID de fila) */
    openMenuRowId = signal<string | number | null>(null);

    /** Celda en edición */
    editingCell = signal<{ rowId: string | number; columnKey: string } | null>(null);

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Columnas visibles */
    visibleColumns = computed(() =>
        this.columns().filter(col => col.visible !== false)
    );

    /** Tiene columna de acciones */
    hasActionsColumn = computed(() =>
        this.visibleColumns().some(col => col.type === 'actions') || this.rowActions() !== undefined
    );

    /** Configuración con defaults */
    tableConfig = computed(() => ({
        loading: false,
        emptyMessage: 'No hay datos disponibles',
        loadingMessage: 'Cargando datos...',
        selectable: false,
        selectedRows: [],
        hoverable: true,
        striped: false,
        bordered: true,
        size: 'md' as const,
        stickyHeader: false,
        ...this.config()
    }));

    // ============================================================================
    // HOST LISTENERS - CERRAR MENÚ AL HACER CLICK FUERA
    // ============================================================================

    /**
     * ✅ CORREGIDO: Cerrar menú al hacer click fuera de la tabla
     */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;

        // Si el click NO fue dentro de un menú de acciones, cerrar todos
        if (!target.closest('.action-menu') && !target.closest('.action-menu-trigger')) {
            this.openMenuRowId.set(null);
        }
    }

    // ============================================================================
    // METHODS - SORTING
    // ============================================================================

    onColumnSort(column: TableColumn): void {
        if (!column.sortable) return;

        const currentSort = this.sortState();
        let newDirection: SortDirection;

        if (currentSort.column !== column.key) {
            newDirection = 'asc';
        } else {
            newDirection = currentSort.direction === 'asc' ? 'desc' :
                currentSort.direction === 'desc' ? null : 'asc';
        }

        this.sortState.set({
            column: newDirection ? column.key : '',
            direction: newDirection
        });

        this.sort.emit({
            column: column.key,
            direction: newDirection
        });
    }

    getSortIcon(column: TableColumn): 'arrows-up-down' | 'arrow-up' | 'arrow-down' {
        const currentSort = this.sortState();
        if (currentSort.column !== column.key) return 'arrows-up-down';
        return currentSort.direction === 'asc' ? 'arrow-up' : 'arrow-down';
    }

    // ============================================================================
    // METHODS - ROW ACTIONS
    // ============================================================================

    onRowClick(row: any, index: number, event: MouseEvent): void {
        // No emitir si se hizo click en el menú de acciones
        const target = event.target as HTMLElement;
        if (target.closest('.action-menu-trigger')) return;

        this.rowClick.emit({ row, index, event });
    }

    /**
     * ✅ CORREGIDO: Toggle del menú de acciones
     * - Si está abierto el mismo menú → cerrar
     * - Si está abierto otro menú → cerrar el anterior y abrir el nuevo
     * - Si no hay menú abierto → abrir el seleccionado
     */
    toggleActionMenu(rowId: string | number): void {
        const currentOpenId = this.openMenuRowId();

        if (currentOpenId === rowId) {
            // ✅ Si es el mismo menú, cerrarlo
            this.openMenuRowId.set(null);
        } else {
            // ✅ Abrir el nuevo menú (cierra el anterior automáticamente)
            this.openMenuRowId.set(rowId);
        }
    }

    /**
     * ✅ Handler de acción desde el menú
     */
    onActionClick(action: string, row: any, index: number): void {
        // ✅ Cerrar el menú inmediatamente
        this.openMenuRowId.set(null);

        // ✅ Emitir el evento de acción
        this.actionClick.emit({ action, row, index });
    }

    // ============================================================================
    // METHODS - CELL EDITING
    // ============================================================================

    startEdit(row: any, column: TableColumn): void {
        if (column.type !== 'editable') return;

        const rowId = row[this.rowKey()];
        this.editingCell.set({ rowId, columnKey: column.key });
    }

    isEditing(row: any, column: TableColumn): boolean {
        const editing = this.editingCell();
        if (!editing) return false;

        const rowId = row[this.rowKey()];
        return editing.rowId === rowId && editing.columnKey === column.key;
    }

    onCellSave(row: any, column: TableColumn, newValue: any): void {
        const oldValue = row[column.key];

        this.cellEdit.emit({
            row,
            column,
            oldValue,
            newValue
        });

        this.editingCell.set(null);
    }

    onCellCancel(): void {
        this.editingCell.set(null);
    }

    // ============================================================================
    // METHODS - VALUE FORMATTING
    // ============================================================================

    getCellValue(row: any, column: TableColumn): any {
        const value = row[column.key];

        if (column.formatter) {
            return column.formatter(value, row);
        }

        return value;
    }

    getBadgeConfig(row: any, column: TableColumn) {
        const value = row[column.key];
        return column.badgeConfig?.[value];
    }

    // ============================================================================
    // METHODS - HELPERS
    // ============================================================================

    getRowId(row: any): string | number {
        return row[this.rowKey()] ?? row.id ?? row.idProveedor;
    }

    trackByRowId(index: number, row: any): any {
        return this.getRowId(row);
    }
}