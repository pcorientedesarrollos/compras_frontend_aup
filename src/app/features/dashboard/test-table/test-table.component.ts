/**
 * ============================================================================
 * 🧪 TEST TABLE COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Componente de pruebas para honey-table
 * Incluye ejemplos de todos los tipos de columnas y funcionalidades
 * 
 * ============================================================================
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HoneyTableComponent, TableColumn, TableConfig } from '../../../shared/components/data/honey-table';
import { ActionMenuConfig, ActionClickEvent } from '../../../shared/components/data/honey-table/types/action.types';
import { CellEditEvent, RowClickEvent, SortEvent } from '../../../shared/components/data/honey-table/types/table.types';

interface TestData {
    id: string;
    nombre: string;
    edad: number;
    email: string;
    estado: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE';
    fechaRegistro: string;
    produccion: number;
}

@Component({
    selector: 'app-test-table',
    standalone: true,
    imports: [CommonModule, HoneyTableComponent],
    template: `
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          🧪 Pruebas Honey Table
        </h1>
        <p class="text-gray-600">
          Componente de prueba para verificar todas las funcionalidades del honey-table
        </p>
      </div>

      <!-- Controles de prueba -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Controles de Prueba</h2>
        
        <div class="flex flex-wrap gap-4">
          <button
            (click)="toggleLoading()"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            {{ isLoading() ? '⏸️ Detener Loading' : '▶️ Mostrar Loading' }}
          </button>

          <button
            (click)="toggleStriped()"
            class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
            {{ config().striped ? '❌ Sin Rayas' : '✅ Con Rayas' }}
          </button>

          <button
            (click)="toggleBordered()"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
            {{ config().bordered ? '❌ Sin Bordes' : '✅ Con Bordes' }}
          </button>

          <button
            (click)="clearData()"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
            🗑️ Vaciar Tabla
          </button>

          <button
            (click)="loadData()"
            class="px-4 py-2 bg-honey-primary hover:bg-honey-dark text-white rounded-lg transition-colors">
            🔄 Recargar Datos
          </button>
        </div>

        <!-- Eventos -->
        @if (lastEvent()) {
          <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm font-semibold text-blue-900 mb-1">Último Evento:</p>
            <pre class="text-xs text-blue-800 overflow-x-auto">{{ lastEvent() }}</pre>
          </div>
        }
      </div>

      <!-- Tabla -->
      <app-honey-table
        [columns]="columns()"
        [data]="data()"
        [config]="config()"
        [rowActions]="rowActions()"
        (rowClick)="onRowClick($event)"
        (cellEdit)="onCellEdit($event)"
        (sort)="onSort($event)"
        (actionClick)="onActionClick($event)"
      />
    </div>
  `
})
export class TestTableComponent {

    // ============================================================================
    // STATE
    // ============================================================================

    data = signal<TestData[]>([]);
    isLoading = signal(false);
    lastEvent = signal<string | null>(null);

    // ============================================================================
    // CONFIGURATION
    // ============================================================================

    columns = signal<TableColumn[]>([
        {
            key: 'nombre',
            label: 'Nombre',
            type: 'text',
            sortable: true,
            width: '200px',
            cssClass: 'font-semibold'
        },
        {
            key: 'edad',
            label: 'Edad',
            type: 'number',
            sortable: true,
            align: 'center',
            width: '100px'
        },
        {
            key: 'email',
            label: 'Email',
            type: 'text',
            sortable: true
        },
        {
            key: 'estado',
            label: 'Estado',
            type: 'badge',
            sortable: true,
            align: 'center',
            width: '120px',
            badgeConfig: {
                'ACTIVO': { variant: 'success', label: 'Activo' },
                'INACTIVO': { variant: 'danger', label: 'Inactivo' },
                'PENDIENTE': { variant: 'warning', label: 'Pendiente' }
            }
        },
        {
            key: 'fechaRegistro',
            label: 'F. Registro',
            type: 'date',
            sortable: true,
            align: 'center',
            width: '150px',
            formatter: (value: string) => {
                return new Date(value).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        },
        {
            key: 'produccion',
            label: 'Producción (kg)',
            type: 'editable',
            sortable: true,
            align: 'right',
            width: '150px',
            formatter: (value: number) => `${value.toLocaleString('es-MX')} kg`
        }
    ]);

    config = signal<TableConfig>({
        striped: true,
        bordered: false,
        hoverable: true,
        stickyHeader: true,
        size: 'md',
        loading: false,
        loadingMessage: 'Cargando datos de prueba...',
        emptyMessage: '🔍 No hay datos para mostrar'
    });

    rowActions = signal<ActionMenuConfig>({
        items: [
            {
                key: 'view',
                label: 'Ver Detalles',
                icon: 'eye',
                variant: 'primary'
            },
            {
                key: 'edit',
                label: 'Editar',
                icon: 'pencil',
                variant: 'warning'
            },
            {
                key: 'divider',
                label: '',
                separator: true
            },
            {
                key: 'delete',
                label: 'Eliminar',
                icon: 'trash',
                variant: 'danger',
                confirm: {
                    title: 'Confirmar eliminación',
                    message: '¿Estás seguro de eliminar este registro?'
                }
            }
        ]
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    constructor() {
        this.loadData();
    }

    // ============================================================================
    // METHODS - DATA
    // ============================================================================

    loadData(): void {
        this.data.set([
            {
                id: '1',
                nombre: 'Juan Pérez García',
                edad: 45,
                email: 'juan.perez@example.com',
                estado: 'ACTIVO',
                fechaRegistro: '2024-01-15',
                produccion: 1250
            },
            {
                id: '2',
                nombre: 'María López Hernández',
                edad: 38,
                email: 'maria.lopez@example.com',
                estado: 'ACTIVO',
                fechaRegistro: '2024-02-20',
                produccion: 980
            },
            {
                id: '3',
                nombre: 'Carlos Ramírez Cruz',
                edad: 52,
                email: 'carlos.ramirez@example.com',
                estado: 'PENDIENTE',
                fechaRegistro: '2024-03-10',
                produccion: 1500
            },
            {
                id: '4',
                nombre: 'Ana Martínez Soto',
                edad: 41,
                email: 'ana.martinez@example.com',
                estado: 'ACTIVO',
                fechaRegistro: '2024-01-28',
                produccion: 875
            },
            {
                id: '5',
                nombre: 'Pedro González Flores',
                edad: 49,
                email: 'pedro.gonzalez@example.com',
                estado: 'INACTIVO',
                fechaRegistro: '2023-12-05',
                produccion: 650
            },
            {
                id: '6',
                nombre: 'Laura Sánchez Morales',
                edad: 36,
                email: 'laura.sanchez@example.com',
                estado: 'ACTIVO',
                fechaRegistro: '2024-04-01',
                produccion: 1100
            }
        ]);
    }

    clearData(): void {
        this.data.set([]);
        this.lastEvent.set('🗑️ Datos limpiados');
    }

    // ============================================================================
    // METHODS - CONTROLS
    // ============================================================================

    toggleLoading(): void {
        const current = this.isLoading();
        this.isLoading.set(!current);
        this.config.update(cfg => ({ ...cfg, loading: !current }));

        if (!current) {
            // Simular carga
            setTimeout(() => {
                this.isLoading.set(false);
                this.config.update(cfg => ({ ...cfg, loading: false }));
            }, 3000);
        }
    }

    toggleStriped(): void {
        this.config.update(cfg => ({ ...cfg, striped: !cfg.striped }));
    }

    toggleBordered(): void {
        this.config.update(cfg => ({ ...cfg, bordered: !cfg.bordered }));
    }

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    onRowClick(event: RowClickEvent): void {
        this.lastEvent.set(
            `👆 Click en fila: ${event.row.nombre} (Index: ${event.index})`
        );
    }

    onCellEdit(event: CellEditEvent): void {
        // Actualizar el valor
        const updated = this.data().map(item =>
            item.id === event.row.id
                ? { ...item, [event.column.key]: event.newValue }
                : item
        );
        this.data.set(updated);

        this.lastEvent.set(
            `✏️ Edición: ${event.column.label} cambió de "${event.oldValue}" a "${event.newValue}"`
        );
    }

    onSort(event: SortEvent): void {
        const sorted = [...this.data()].sort((a, b) => {
            const aVal = a[event.column as keyof TestData];
            const bVal = b[event.column as keyof TestData];

            if (aVal < bVal) return event.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return event.direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.data.set(sorted);
        this.lastEvent.set(
            `🔄 Ordenado por: ${event.column} (${event.direction === 'asc' ? '↑ Ascendente' : '↓ Descendente'})`
        );
    }

    onActionClick(event: ActionClickEvent): void {
        const nombre = event.row.nombre;

        switch (event.action) {
            case 'view':
                this.lastEvent.set(`👁️ Ver detalles: ${nombre}`);
                break;
            case 'edit':
                this.lastEvent.set(`✏️ Editar: ${nombre}`);
                break;
            case 'delete':
                // Eliminar el registro
                const filtered = this.data().filter(item => item.id !== event.row.id);
                this.data.set(filtered);
                this.lastEvent.set(`🗑️ Eliminado: ${nombre}`);
                break;
        }
    }
}