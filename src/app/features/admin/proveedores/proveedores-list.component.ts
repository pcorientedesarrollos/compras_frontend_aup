/**
 * ============================================================================
 * 🐝 PROVEEDORES LIST COMPONENT - SISTEMA OAXACA MIEL (v2.0)
 * ============================================================================
 * 
 * ✅ MEJORAS APLICADAS:
 * 1. Carga TODOS los proveedores (sin paginación backend)
 * 2. Filtrado LOCAL (búsqueda en todos los campos)
 * 3. Paginación LOCAL (frontend)
 * 4. Búsqueda instantánea con debounce
 * 5. deleteProve para activo/inactivo
 * 
 * ============================================================================
 */

import { Component, computed, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Componentes reutilizables
import { HoneyTableComponent } from '../../../shared/components/data/honey-table/honey-table.component';
import { TableFiltersComponent } from '../../../shared/components/data/table-filters/table-filters.component';
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';
import { BeeLoaderComponent } from '../../../shared/components/bee-loader/bee-loader.component';

// Tipos y modelos
import { TableColumn, TableConfig } from '../../../shared/components/data/honey-table/types/table.types';
import { FilterConfig, FilterState } from '../../../shared/components/data/honey-table/types/filter.types';
import { ActionMenuConfig } from '../../../shared/components/data/honey-table/types/action.types';
import {
    ProveedorAPI,
    TipoDeMiel,
    ProveedorFilterParams
} from '../../../core/models/index';

// Servicios
import { ProveedorService } from '../../../core/services/proveedor.service';
import { ProveedorDetailModalComponent } from './proveedor-detail-modal.component';

@Component({
    selector: 'app-proveedores-list',
    standalone: true,
    imports: [
        CommonModule,
        HoneyTableComponent,
        TableFiltersComponent,
        IconComponent,
        BeeLoaderComponent,
        ProveedorDetailModalComponent
    ],
    templateUrl: './proveedores-list.component.html',
    styleUrl: './proveedores-list.component.css'
})
export class ProveedoresListComponent implements OnInit {
    private proveedorService = inject(ProveedorService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // PUBLIC PROPERTIES
    // ============================================================================
    Math = Math;

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** ✅ TODOS los proveedores (sin filtrar) */
    allProveedores = signal<ProveedorAPI[]>([]);

    /** ✅ Proveedores filtrados (después de aplicar filtros) */
    filteredProveedores = signal<ProveedorAPI[]>([]);

    /** ✅ Proveedores paginados (lo que se muestra en tabla) */
    paginatedProveedores = signal<ProveedorAPI[]>([]);

    /** Estado de carga */
    isLoading = signal<boolean>(false);

    /** Catálogo de tipos de miel */
    tiposMiel = signal<TipoDeMiel[]>([]);

    /** Filtros activos */
    filterState = signal<FilterState>({});

    /** ✅ Paginación LOCAL */
    currentPage = signal<number>(1);
    pageSize = signal<number>(10);

    /** Modal de detalle */
    isModalOpen = signal<boolean>(false);
    selectedProveedor = signal<ProveedorAPI | null>(null);
    selectedTab = signal<'general' | 'apicultores' | 'inventario' | 'mapa'>('general');

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** ✅ Total items filtrados */
    totalItems = computed(() => this.filteredProveedores().length);

    /** ✅ Total páginas */
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

    /**
     * ✅ Columnas de la tabla (usa deleteProve)
     */
    columns = computed<TableColumn[]>(() => ([
        {
            key: 'idProveedor',
            label: 'ID',
            type: 'number',
            width: '80px',
            sortable: true,
            align: 'center'
        },
        {
            key: 'nombre',
            label: 'Nombre / Razón Social',
            type: 'text',
            sortable: true,
            width: '280px'
        },
        // {
        //     key: 'tipo',
        //     label: 'Tipo',
        //     type: 'badge',
        //     sortable: true,
        //     width: '130px',
        //     align: 'center',
        //     badgeConfig: {
        //         'Acopiador': { label: 'Acopiador', variant: 'info', icon: 'building-office' },
        //         'Apicultor': { label: 'Apicultor', variant: 'success', icon: 'user' }
        //     }
        // },
        {
            key: 'tipoDeMielNombre',
            label: 'Tipo de Miel',
            type: 'text',
            sortable: true,
            width: '150px',
            formatter: (value: string | null) => value || 'No especificado'
        },
        {
            key: 'idSagarpa',
            label: 'Registro SAGARPA',
            type: 'text',
            width: '150px',
            formatter: (value: string | null) => value || 'Sin registro'
        },
        {
            key: 'cantidadApicultores',
            label: 'Apicultores',
            type: 'number',
            sortable: true,
            width: '110px',
            align: 'center',
            formatter: (value: number) => value.toString()
        },
        {
            key: 'cantidad',
            label: 'Cantidad (kg)',
            type: 'number',
            sortable: true,
            width: '130px',
            align: 'right',
            formatter: (value: number | null) => value ?
                value.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '0.00'
        },
        {
            key: 'activoInactivo',
            label: 'Estado',
            type: 'badge',
            sortable: true,
            width: '100px',
            align: 'center',
            badgeConfig: {
                0: { label: 'Activo', variant: 'success' },
                1: { label: 'Desactivado', variant: 'danger' }
            }
        }
    ] as TableColumn[]));

    /**
     * Configuración de la tabla
     */
    tableConfig = computed<TableConfig>(() => ({
        loading: this.isLoading(),
        loadingMessage: 'Cargando proveedores...',
        emptyMessage: 'No se encontraron proveedores',
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
                key: 'apicultores',
                label: 'Ver apicultores',
                icon: 'users',
                variant: 'success'
            },
            {
                key: 'ubicacion',
                label: 'Ver en mapa',
                icon: 'map-pin',
                variant: 'warning',
                visible: (row: ProveedorAPI) => !!(row.latitud && row.longitud)
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
            placeholder: 'Buscar en todos los campos...'
        },
        // {
        //     key: 'tipo',
        //     label: 'Tipo de Proveedor',
        //     type: 'select',
        //     placeholder: 'Todos',
        //     options: [
        //         { value: '', label: 'Todos' },
        //         { value: 'Acopiador', label: 'Acopiador' },
        //         { value: 'Apicultor', label: 'Apicultor' }
        //     ]
        // },
        {
            key: 'tipoDeMiel',
            label: 'Tipo de Miel',
            type: 'select',
            placeholder: 'Todos',
            options: [
                { value: '', label: 'Todos' },
                ...this.tiposMiel().map(tipo => ({
                    value: tipo.idTipoDeMiel.toString(),
                    label: tipo.tipoDeMiel
                }))
            ]
        },
        {
            key: 'activoInactivo',
            label: 'Estado',
            type: 'select',
            placeholder: 'Todos',
            options: [
                { value: '', label: 'Todos' },
                { value: '0', label: 'Activos' },        // activoInactivo=0
                { value: '1', label: 'Desactivados' }    // activoInactivo=1
            ]
        }
    ]);

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadTiposMiel();
        this.loadAllProveedores();
    }

    // ============================================================================
    // METHODS - DATA LOADING
    // ============================================================================

    /**
     * ✅ Cargar catálogo de tipos de miel FILTRADOS (solo IDs 1 y 2)
     */
    private loadTiposMiel(): void {
        this.proveedorService.getTiposMielFiltrados()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (tipos) => {
                    this.tiposMiel.set(tipos);
                },
                error: (error) => {
                    console.error('Error al cargar tipos de miel:', error);
                }
            });
    }

    /**
     * ✅ CARGAR TODOS LOS PROVEEDORES (SIN PAGINACIÓN)
     */
    private loadAllProveedores(): void {
        this.isLoading.set(true);

        // ✅ Solicitar TODOS los registros
        const params: ProveedorFilterParams = {
            page: 1,
            limit: 9999 // Traer todos
        };

        this.proveedorService.searchProveedores(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    // ✅ Filtrar solo proveedores con nombre
                    const proveedoresValidos = response.data.filter(
                        proveedor => proveedor.nombre && proveedor.nombre.trim() !== ''
                    );

                    this.allProveedores.set(proveedoresValidos);
                    this.applyFiltersAndPagination();
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar proveedores:', error);
                    this.isLoading.set(false);
                    this.allProveedores.set([]);
                }
            });
    }

    /**
     * ✅ APLICAR FILTROS Y PAGINACIÓN (LOCAL)
     */
    private applyFiltersAndPagination(): void {
        const state = this.filterState();
        let filtered = [...this.allProveedores()];

        // ✅ FILTRO 1: Búsqueda global (nombre, tipo, sagarpa, etc.)
        if (state['nombre'] && state['nombre'].trim() !== '') {
            const searchTerm = state['nombre'].toLowerCase().trim();
            filtered = filtered.filter(proveedor => {
                return (
                    proveedor.nombre?.toLowerCase().includes(searchTerm) ||
                    proveedor.tipo?.toLowerCase().includes(searchTerm) ||
                    proveedor.idSagarpa?.toLowerCase().includes(searchTerm) ||
                    proveedor.tipoDeMielNombre?.toLowerCase().includes(searchTerm) ||
                    proveedor.idProveedor?.toString().includes(searchTerm)
                );
            });
        }

        // ✅ FILTRO 2: Tipo de proveedor
        if (state['tipo'] && state['tipo'] !== '') {
            filtered = filtered.filter(p => p.tipo === state['tipo']);
        }

        // ✅ FILTRO 3: Tipo de miel
        if (state['tipoDeMiel'] && state['tipoDeMiel'] !== '') {
            const tipoDeMielId = Number(state['tipoDeMiel']);
            filtered = filtered.filter(p => p.tipoDeMiel === tipoDeMielId);
        }

        // ✅ FILTRO 4: Estado (activoInactivo)
        if (state['activoInactivo'] !== undefined && state['activoInactivo'] !== '') {
            const activoInactivoValue = Number(state['activoInactivo']);
            filtered = filtered.filter(p => p.activoInactivo === activoInactivoValue);
        }

        // ✅ Guardar filtrados
        this.filteredProveedores.set(filtered);

        // ✅ Aplicar paginación LOCAL
        const start = (this.currentPage() - 1) * this.pageSize();
        const end = start + this.pageSize();
        this.paginatedProveedores.set(filtered.slice(start, end));
    }

    // ============================================================================
    // EVENT HANDLERS - FILTROS
    // ============================================================================

    /**
     * ✅ Manejar cambio en filtros (recibe FiltersChangeEvent)
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
            // Sin ordenamiento, restaurar filtrados originales
            this.applyFiltersAndPagination();
            return;
        }

        const filtered = [...this.filteredProveedores()];

        filtered.sort((a, b) => {
            const aValue = a[event.column as keyof ProveedorAPI];
            const bValue = b[event.column as keyof ProveedorAPI];

            // Manejar valores null/undefined
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Comparación según tipo
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
                return event.direction === 'asc' ? comparison : -comparison;
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return event.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            return 0;
        });

        // Aplicar paginación después del ordenamiento
        const start = (this.currentPage() - 1) * this.pageSize();
        const end = start + this.pageSize();
        this.paginatedProveedores.set(filtered.slice(start, end));
    }

    /**
     * Manejar acción en una fila
     */
    onActionClick(event: { action: string; row: ProveedorAPI; index: number }): void {
        const { action, row } = event;

        switch (action) {
            case 'view':
                this.viewProveedorDetail(row);
                break;
            case 'apicultores':
                this.viewApicultores(row);
                break;
            case 'ubicacion':
                this.viewUbicacion(row);
                break;
        }
    }

    /**
     * ✅ Ver ubicación en mapa (abre modal en tab GPS)
     */
    private viewUbicacion(proveedor: ProveedorAPI): void {
        if (!proveedor.latitud || !proveedor.longitud) return;
        this.selectedProveedor.set(proveedor);
        this.selectedTab.set('mapa');
        this.isModalOpen.set(true);
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
     * ✅ Ver detalle del proveedor (Modal en tab General)
     */
    private viewProveedorDetail(proveedor: ProveedorAPI): void {
        this.selectedProveedor.set(proveedor);
        this.selectedTab.set('general');
        this.isModalOpen.set(true);
    }

    /**
     * ✅ Cerrar modal de detalle
     */
    closeModal(): void {
        this.isModalOpen.set(false);
        this.selectedProveedor.set(null);
        this.selectedTab.set('general'); // Reset tab
    }

    /**
     * ✅ Ver apicultores del proveedor (abre modal en tab Apicultores)
     */
    private viewApicultores(proveedor: ProveedorAPI): void {
        this.selectedProveedor.set(proveedor);
        this.selectedTab.set('apicultores');
        this.isModalOpen.set(true);
    }
}