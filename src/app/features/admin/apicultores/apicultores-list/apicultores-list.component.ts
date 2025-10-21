/**
 * ============================================================================
 * 🐝 APICULTORES LIST COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Lista de apicultores con:
 * 1. Carga TODOS los apicultores (sin paginación backend)
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
import {
    ApicultorAPI,
    ApicultorEstado
} from '../../../../core/models/index';

// Servicios
import { ApicultorService } from '../../../../core/services/apicultor.service';

@Component({
    selector: 'app-apicultores-list',
    standalone: true,
    imports: [
        CommonModule,
        HoneyTableComponent,
        TableFiltersComponent,
        IconComponent
    ],
    templateUrl: './apicultores-list.component.html',
    styleUrl: './apicultores-list.component.css'
})
export class ApicultoresListComponent implements OnInit {
    private apicultorService = inject(ApicultorService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // PUBLIC PROPERTIES
    // ============================================================================
    Math = Math;

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** ✅ TODOS los apicultores (sin filtrar) */
    allApicultores = signal<ApicultorAPI[]>([]);

    /** ✅ Apicultores filtrados (después de aplicar filtros) */
    filteredApicultores = signal<ApicultorAPI[]>([]);

    /** ✅ Apicultores paginados (lo que se muestra en tabla) */
    paginatedApicultores = signal<ApicultorAPI[]>([]);

    /** Estado de carga */
    isLoading = signal<boolean>(false);

    /** Filtros activos */
    filterState = signal<FilterState>({});

    /** ✅ Paginación LOCAL */
    currentPage = signal<number>(1);
    pageSize = signal<number>(10);

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** ✅ Total items filtrados */
    totalItems = computed(() => this.filteredApicultores().length);

    /** ✅ Total páginas */
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

    /**
     * ✅ Columnas de la tabla
     */
    columns = computed<TableColumn[]>(() => [
        {
            key: 'codigo',
            label: 'Código',
            type: 'text',
            sortable: true,
            width: '140px'
        },
        {
            key: 'nombre',
            label: 'Nombre Completo',
            type: 'text',
            sortable: true,
            width: '250px'
        },
        {
            key: 'curp',
            label: 'CURP',
            type: 'text',
            sortable: true,
            width: '180px'
        },
        {
            key: 'rfc',
            label: 'RFC',
            type: 'text',
            width: '140px',
            formatter: (value: string | null) => value || 'Sin RFC'
        },
        {
            key: 'estadoCodigo',
            label: 'Estado',
            type: 'text',
            width: '100px',
            align: 'center',
            formatter: (value: string | null) => value || 'N/A'
        },
        {
            key: 'municipioCodigo',
            label: 'Municipio',
            type: 'text',
            width: '110px',
            align: 'center',
            formatter: (value: string | null) => value || 'N/A'
        },
        {
            key: 'senasica',
            label: 'SENASICA',
            type: 'badge',
            width: '100px',
            align: 'center',
            badgeConfig: {
                'SI': { label: '✓ Sí', variant: 'success' },
                'NO': { label: '✗ No', variant: 'danger' }
            },
            formatter: (value: string | null) => value ? 'SI' : 'NO'
        },
        {
            key: 'ippSiniga',
            label: 'IPP/SINIGA',
            type: 'badge',
            width: '100px',
            align: 'center',
            badgeConfig: {
                'SI': { label: '✓ Sí', variant: 'success' },
                'NO': { label: '✗ No', variant: 'danger' }
            },
            formatter: (value: string | null) => value ? 'SI' : 'NO'
        },
        {
            key: 'cantidadApiarios',
            label: 'Apiarios',
            type: 'number',
            sortable: true,
            width: '100px',
            align: 'center'
        },
        {
            key: 'estatus',
            label: 'Estado',
            type: 'badge',
            sortable: true,
            width: '100px',
            align: 'center',
            badgeConfig: {
                'ACTIVO': { label: 'Activo', variant: 'success' },
                'INACTIVO': { label: 'Inactivo', variant: 'danger' }
            }
        }
    ] as TableColumn[]);

    /**
     * Configuración de la tabla
     */
    tableConfig = computed<TableConfig>(() => ({
        loading: this.isLoading(),
        loadingMessage: 'Cargando apicultores...',
        emptyMessage: 'No se encontraron apicultores',
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
                variant: 'warning'
            },
            {
                key: 'proveedores',
                label: 'Ver proveedores',
                icon: 'building-office',
                variant: 'success'
            },
            {
                key: 'apiarios',
                label: 'Ver apiarios',
                icon: 'map-pin',
                variant: 'info'
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
            placeholder: 'Buscar por nombre, código, CURP, RFC...'
        },
        {
            key: 'estadoCodigo',
            label: 'Estado',
            type: 'select',
            placeholder: 'Todos',
            options: [
                { value: '', label: 'Todos' },
                { value: '20', label: 'Oaxaca (20)' }
                // TODO: Agregar más estados si es necesario
            ]
        },
        {
            key: 'estatus',
            label: 'Estatus',
            type: 'select',
            placeholder: 'Todos',
            options: [
                { value: '', label: 'Todos' },
                { value: 'ACTIVO', label: 'Activo' },
                { value: 'INACTIVO', label: 'Inactivo' }
            ]
        },
        {
            key: 'certificaciones',
            label: 'Certificaciones',
            type: 'select',
            placeholder: 'Todas',
            options: [
                { value: '', label: 'Todas' },
                { value: 'senasica', label: 'Con SENASICA' },
                { value: 'ipp', label: 'Con IPP/SINIGA' },
                { value: 'ambas', label: 'Con ambas' },
                { value: 'ninguna', label: 'Sin certificaciones' }
            ]
        }
    ]);

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadApicultores();
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    /**
     * ✅ Cargar TODOS los apicultores (sin paginación backend)
     */
    private loadApicultores(): void {
        this.isLoading.set(true);

        this.apicultorService
            .getAllApicultores()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apicultores) => {
                    this.allApicultores.set(apicultores);
                    this.applyFiltersAndPagination();
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar apicultores:', error);
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
        let filtered = [...this.allApicultores()];
        const state = this.filterState();

        // ✅ FILTRO 1: Búsqueda general
        if (state['nombre'] && state['nombre'].trim() !== '') {
            const searchTerm = state['nombre'].toLowerCase().trim();
            filtered = filtered.filter(apicultor => {
                return (
                    apicultor.nombre?.toLowerCase().includes(searchTerm) ||
                    apicultor.codigo?.toLowerCase().includes(searchTerm) ||
                    apicultor.curp?.toLowerCase().includes(searchTerm) ||
                    apicultor.rfc?.toLowerCase().includes(searchTerm) ||
                    apicultor.direccion?.toLowerCase().includes(searchTerm)
                );
            });
        }

        // ✅ FILTRO 2: Estado
        if (state['estadoCodigo'] && state['estadoCodigo'] !== '') {
            filtered = filtered.filter(a => a.estadoCodigo === state['estadoCodigo']);
        }

        // ✅ FILTRO 3: Estatus
        if (state['estatus'] && state['estatus'] !== '') {
            filtered = filtered.filter(a => a.estatus === state['estatus']);
        }

        // ✅ FILTRO 4: Certificaciones
        if (state['certificaciones'] && state['certificaciones'] !== '') {
            const certFilter = state['certificaciones'];
            filtered = filtered.filter(a => {
                const hasSenasica = a.senasica !== null && a.senasica.trim() !== '';
                const hasIPP = a.ippSiniga !== null && a.ippSiniga.trim() !== '';

                if (certFilter === 'senasica') return hasSenasica;
                if (certFilter === 'ipp') return hasIPP;
                if (certFilter === 'ambas') return hasSenasica && hasIPP;
                if (certFilter === 'ninguna') return !hasSenasica && !hasIPP;
                return true;
            });
        }

        // ✅ Guardar filtrados
        this.filteredApicultores.set(filtered);

        // ✅ Aplicar paginación LOCAL
        const start = (this.currentPage() - 1) * this.pageSize();
        const end = start + this.pageSize();
        this.paginatedApicultores.set(filtered.slice(start, end));
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

        const filtered = [...this.filteredApicultores()];

        filtered.sort((a, b) => {
            const aValue = a[event.column as keyof ApicultorAPI];
            const bValue = b[event.column as keyof ApicultorAPI];

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
        this.paginatedApicultores.set(filtered.slice(start, end));
    }

    /**
     * Manejar acción en una fila
     */
    onActionClick(event: { action: string; row: ApicultorAPI; index: number }): void {
        const { action, row } = event;

        switch (action) {
            case 'view':
                this.viewApicultorDetail(row);
                break;
            case 'edit':
                this.editApicultor(row);
                break;
            case 'proveedores':
                this.viewProveedores(row);
                break;
            case 'apiarios':
                this.viewApiarios(row);
                break;
            case 'delete':
                this.deleteApicultor(row);
                break;
        }
    }

    /**
     * Ver detalle del apicultor
     */
    private viewApicultorDetail(apicultor: ApicultorAPI): void {
        console.log('Ver detalle:', apicultor);
        alert(`Detalle de ${apicultor.nombre}\nCódigo: ${apicultor.codigo}\nCURP: ${apicultor.curp}`);
    }

    /**
     * Editar apicultor
     */
    private editApicultor(apicultor: ApicultorAPI): void {
        console.log('Editar:', apicultor);
        this.router.navigate(['/admin/apicultores', apicultor.id, 'edit']);
    }

    /**
     * Ver proveedores del apicultor
     */
    private viewProveedores(apicultor: ApicultorAPI): void {
        console.log('Ver proveedores:', apicultor);
        alert(`Proveedores de ${apicultor.nombre}\nTotal: ${apicultor.totalProveedores}`);
    }

    /**
     * Ver apiarios del apicultor
     */
    private viewApiarios(apicultor: ApicultorAPI): void {
        console.log('Ver apiarios:', apicultor);
        alert(`Apiarios de ${apicultor.nombre}\nTotal: ${apicultor.cantidadApiarios}`);
    }

    /**
     * Eliminar apicultor
     */
    private deleteApicultor(apicultor: ApicultorAPI): void {
        if (!confirm(`¿Estás seguro de eliminar al apicultor ${apicultor.nombre}?`)) {
            return;
        }

        this.apicultorService
            .deleteApicultor(apicultor.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (message) => {
                    alert(message);
                    this.loadApicultores();
                },
                error: (error) => {
                    console.error('Error al eliminar:', error);
                    alert('Error al eliminar el apicultor. Verifica que no tenga apiarios o usuario asociado.');
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
     * ✅ Manejar cambio de tamaño de página (LOCAL)
     */
    onPageSizeChange(size: number): void {
        this.pageSize.set(size);
        this.currentPage.set(1);
        this.applyFiltersAndPagination();
    }

    /**
     * Navegar a crear nuevo apicultor
     */
    createApicultor(): void {
        this.router.navigate(['/admin/apicultores/nuevo']);
    }
}