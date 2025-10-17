/**
 * ============================================================================
 * 🐝 APIARIOS LIST COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Lista de apiarios con:
 * 1. Carga TODOS los apiarios (sin paginación backend)
 * 2. Filtrado LOCAL (búsqueda en todos los campos)
 * 3. Paginación LOCAL (frontend)
 * 4. Búsqueda instantánea con debounce
 * 
 * ============================================================================
 */

import { Component, computed, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Componentes reutilizables
import { HoneyTableComponent } from '../../../../shared/components/data/honey-table/honey-table.component';
import { TableFiltersComponent } from '../../../../shared/components/data/table-filters/table-filters.component';
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';

// Tipos y modelos
import { TableColumn, TableConfig } from '../../../../shared/components/data/honey-table/types/table.types';
import { FilterConfig, FilterState } from '../../../../shared/components/data/honey-table/types/filter.types';
import { ActionMenuConfig } from '../../../../shared/components/data/honey-table/types/action.types';
import { ApiarioAPI } from '../../../../core/models/index';

// Servicios
import { ApiarioService } from '../../../../core/services/apiario.service';

@Component({
    selector: 'app-apiarios-list',
    standalone: true,
    imports: [
        CommonModule,
        HoneyTableComponent,
        TableFiltersComponent,
        IconComponent
    ],
    templateUrl: './apiarios-list.component.html',
    styleUrl: './apiarios-list.component.css'
})
export class ApiariosListComponent implements OnInit {
    private apiarioService = inject(ApiarioService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // SIGNALS
    // ============================================================================

    /**
     * ✅ Todos los apiarios (sin paginación)
     */
    allApiarios = signal<ApiarioAPI[]>([]);

    /**
     * ✅ Apiarios filtrados (después de aplicar filtros)
     */
    filteredApiarios = signal<ApiarioAPI[]>([]);

    /**
     * ✅ Apiarios paginados (página actual)
     */
    paginatedApiarios = signal<ApiarioAPI[]>([]);

    /**
     * ✅ Estado de carga
     */
    isLoading = signal<boolean>(false);

    /**
     * ✅ Estado de los filtros
     */
    filterState = signal<FilterState>({});

    /**
     * ✅ Paginación local
     */
    currentPage = signal<number>(1);
    pageSize = signal<number>(20);

    /**
     * Total de items (después de filtros)
     */
    totalItems = computed(() => this.filteredApiarios().length);

    /**
     * Total de páginas
     */
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

    /**
     * Math para template
     */
    Math = Math;

    // ============================================================================
    // TABLE CONFIG
    // ============================================================================

    /**
     * ✅ Configuración de columnas
     */
    columns = computed(() => [
        {
            key: 'nombre',
            label: 'Nombre del Apiario',
            type: 'text',
            sortable: true,
            width: '200px'
        },
        {
            key: 'apicultor.codigo',
            label: 'Código',
            type: 'text',
            sortable: true,
            width: '120px'
        },
        {
            key: 'apicultor.nombre',
            label: 'Apicultor',
            type: 'text',
            sortable: true,
            width: '200px'
        },
        {
            key: 'colmenas',
            label: 'Colmenas',
            type: 'badge',
            sortable: true,
            width: '100px',
            align: 'center',
            badgeVariant: 'warning'
        },
        {
            key: 'latitud',
            label: 'Latitud',
            type: 'text',
            sortable: false,
            width: '110px',
            format: (value: number) => value.toFixed(6)
        },
        {
            key: 'longitud',
            label: 'Longitud',
            type: 'text',
            sortable: false,
            width: '110px',
            format: (value: number) => value.toFixed(6)
        },
        {
            key: 'fechaAlta',
            label: 'Fecha Alta',
            type: 'date',
            sortable: true,
            width: '120px'
        }
    ] as TableColumn[]);

    /**
     * Configuración de la tabla
     */
    tableConfig = computed<TableConfig>(() => ({
        loading: this.isLoading(),
        loadingMessage: 'Cargando apiarios...',
        emptyMessage: 'No se encontraron apiarios',
        striped: true,
        hoverable: true,
        stickyHeader: true,
        size: 'md'
    }));

    /**
     * Configuración de acciones por fila
     */
    rowActions = computed<ActionMenuConfig>(() => ({
        items: [
            {
                key: 'view',
                label: 'Ver detalle',
                icon: 'eye',
                variant: 'info'
            },
            {
                key: 'edit',
                label: 'Editar',
                icon: 'pencil',
                variant: 'primary'
            },
            {
                key: 'map',
                label: 'Ver en mapa',
                icon: 'map-pin',
                variant: 'success'
            },
            {
                key: 'delete',
                label: 'Eliminar',
                icon: 'trash',
                variant: 'danger'
            }
        ]
    }));

    /**
     * ✅ Configuración de filtros
     */
    filterConfig = computed<FilterConfig[]>(() => [
        {
            key: 'nombre',
            label: 'Búsqueda',
            type: 'text',
            placeholder: 'Buscar por nombre, código de apicultor...'
        },
        {
            key: 'colmenasRango',
            label: 'Rango de Colmenas',
            type: 'select',
            placeholder: 'Todas',
            options: [
                { value: '', label: 'Todas' },
                { value: '1-50', label: '1-50 colmenas' },
                { value: '51-100', label: '51-100 colmenas' },
                { value: '101-200', label: '101-200 colmenas' },
                { value: '201-500', label: '201-500 colmenas' },
                { value: '500+', label: 'Más de 500' }
            ]
        }
    ]);

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadApiarios();
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    /**
     * ✅ Cargar TODOS los apiarios (sin paginación backend)
     */
    private loadApiarios(): void {
        this.isLoading.set(true);

        this.apiarioService
            .getAllApiarios()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apiarios) => {
                    this.allApiarios.set(apiarios);
                    this.applyFiltersAndPagination();
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar apiarios:', error);
                    this.isLoading.set(false);
                }
            });
    }

    // ============================================================================
    // FILTRADO Y PAGINACIÓN LOCAL
    // ============================================================================

    /**
     * ✅ Aplicar filtros y paginación en el frontend
     */
    private applyFiltersAndPagination(): void {
        let filtered = [...this.allApiarios()];
        const state = this.filterState();

        // ✅ FILTRO 1: Búsqueda general
        if (state['nombre'] && state['nombre'].trim() !== '') {
            const searchTerm = state['nombre'].toLowerCase().trim();
            filtered = filtered.filter(apiario => {
                return (
                    apiario.nombre?.toLowerCase().includes(searchTerm) ||
                    apiario.apicultor.nombre?.toLowerCase().includes(searchTerm) ||
                    apiario.apicultor.codigo?.toLowerCase().includes(searchTerm)
                );
            });
        }

        // ✅ FILTRO 2: Rango de colmenas
        if (state['colmenasRango'] && state['colmenasRango'] !== '') {
            const rango = state['colmenasRango'];
            filtered = filtered.filter(apiario => {
                const colmenas = apiario.colmenas;
                switch (rango) {
                    case '1-50':
                        return colmenas >= 1 && colmenas <= 50;
                    case '51-100':
                        return colmenas >= 51 && colmenas <= 100;
                    case '101-200':
                        return colmenas >= 101 && colmenas <= 200;
                    case '201-500':
                        return colmenas >= 201 && colmenas <= 500;
                    case '500+':
                        return colmenas > 500;
                    default:
                        return true;
                }
            });
        }

        // ✅ Guardar filtrados
        this.filteredApiarios.set(filtered);

        // ✅ Aplicar paginación LOCAL
        const start = (this.currentPage() - 1) * this.pageSize();
        const end = start + this.pageSize();
        this.paginatedApiarios.set(filtered.slice(start, end));
    }

    // ============================================================================
    // EVENT HANDLERS - FILTROS
    // ============================================================================

    /**
     * ✅ Manejar cambio en filtros
     */
    onFiltersChange(event: { filters: FilterState; activeFilters?: any[] }): void {
        this.filterState.set(event.filters);
        this.currentPage.set(1);
        this.applyFiltersAndPagination();
    }

    /**
     * ✅ Manejar remoción de un filtro específico
     */
    onFilterRemove(filterKey: string): void {
        const newState = { ...this.filterState() };
        delete newState[filterKey];
        this.filterState.set(newState);
        this.currentPage.set(1);
        this.applyFiltersAndPagination();
    }

    /**
     * ✅ Limpiar todos los filtros
     */
    clearAllFilters(): void {
        this.filterState.set({});
        this.currentPage.set(1);
        this.applyFiltersAndPagination();
    }

    // ============================================================================
    // EVENT HANDLERS - TABLA
    // ============================================================================

    /**
     * ✅ Manejar ordenamiento de columnas (LOCAL)
     */
    onSort(event: { column: string; direction: 'asc' | 'desc' | null }): void {
        if (!event.direction) {
            this.applyFiltersAndPagination();
            return;
        }

        const filtered = [...this.filteredApiarios()];

        filtered.sort((a, b) => {
            const aValue = a[event.column as keyof ApiarioAPI];
            const bValue = b[event.column as keyof ApiarioAPI];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
                return event.direction === 'asc' ? comparison : -comparison;
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return event.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            return 0;
        });

        const start = (this.currentPage() - 1) * this.pageSize();
        const end = start + this.pageSize();
        this.paginatedApiarios.set(filtered.slice(start, end));
    }

    /**
     * Manejar acción en una fila
     */
    onActionClick(event: { action: string; row: ApiarioAPI; index: number }): void {
        const { action, row } = event;

        switch (action) {
            case 'view':
                this.viewApiarioDetail(row);
                break;
            case 'edit':
                this.editApiario(row);
                break;
            case 'map':
                this.viewInMap(row);
                break;
            case 'delete':
                this.deleteApiario(row);
                break;
        }
    }

    /**
     * Ver detalle del apiario
     */
    private viewApiarioDetail(apiario: ApiarioAPI): void {
        console.log('Ver detalle:', apiario);
        alert(`Detalle de ${apiario.nombre}\n\nApicultor: ${apiario.apicultor.nombre}\nColmenas: ${apiario.colmenas}\nUbicación: ${apiario.latitud.toFixed(6)}, ${apiario.longitud.toFixed(6)}`);
    }

    /**
     * Editar apiario
     */
    private editApiario(apiario: ApiarioAPI): void {
        console.log('Editar:', apiario);
        this.router.navigate(['/admin/apiarios', apiario.id, 'edit']);
    }

    /**
     * Ver en mapa (abre Google Maps en nueva pestaña)
     */
    private viewInMap(apiario: ApiarioAPI): void {
        const url = `https://www.google.com/maps?q=${apiario.latitud},${apiario.longitud}`;
        window.open(url, '_blank');
    }

    /**
     * Eliminar apiario
     */
    private deleteApiario(apiario: ApiarioAPI): void {
        if (!confirm(`¿Estás seguro de eliminar el apiario "${apiario.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        this.apiarioService
            .deleteApiario(apiario.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (message) => {
                    alert(message);
                    this.loadApiarios();
                },
                error: (error) => {
                    console.error('Error al eliminar:', error);
                    alert('Error al eliminar el apiario. Verifica los permisos.');
                }
            });
    }

    /**
     * ✅ Manejar cambio de página (LOCAL)
     */
    onPageChange(page: number): void {
        this.currentPage.set(page);
        this.applyFiltersAndPagination();
    }

    /**
     * Navegar a crear nuevo apiario
     */
    createApiario(): void {
        this.router.navigate(['/admin/apiarios/nuevo']);
    }
}