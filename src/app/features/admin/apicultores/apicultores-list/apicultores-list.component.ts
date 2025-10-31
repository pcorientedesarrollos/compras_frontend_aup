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
import { BeeLoaderComponent } from '../../../../shared/components/bee-loader/bee-loader.component';
import { ApicultorDetailModalComponent } from '../apicultor-detail-modal/apicultor-detail-modal.component';

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
import { AuthService } from '../../../../core/services/auth.service';
import { EstadoService } from '../../../../core/services/estado.service';
import { MunicipioService } from '../../../../core/services/municipio.service';

@Component({
    selector: 'app-apicultores-list',
    standalone: true,
    imports: [
        CommonModule,
        HoneyTableComponent,
        TableFiltersComponent,
        IconComponent,
        BeeLoaderComponent,
        ApicultorDetailModalComponent
    ],
    templateUrl: './apicultores-list.component.html',
    styleUrl: './apicultores-list.component.css'
})
export class ApicultoresListComponent implements OnInit {
    private apicultorService = inject(ApicultorService);
    private authService = inject(AuthService);
    private estadoService = inject(EstadoService);
    private municipioService = inject(MunicipioService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // PUBLIC PROPERTIES
    // ============================================================================
    Math = Math;

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** ✅ Catálogos */
    private estadosMap = signal<Map<string, string>>(new Map());
    private municipiosMap = signal<Map<string, string>>(new Map());

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

    /** Modal de detalle */
    isModalOpen = signal<boolean>(false);
    selectedApicultor = signal<ApicultorAPI | null>(null);
    selectedTab = signal<'general' | 'proveedores' | 'apiarios' | 'mielPorTipo'>('general');

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
            key: 'nombreCompleto',
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
            key: 'estadoCodigo',
            label: 'Entidad',
            type: 'text',
            width: '150px',
            align: 'center',
            formatter: (value: string | null) => {
                if (!value) return 'N/A';
                return this.estadosMap().get(value) || value;
            }
        },
        {
            key: 'totalColmenas',
            label: 'Colmenas',
            type: 'number',
            sortable: true,
            width: '100px',
            align: 'center'
        },
        {
            key: 'totalEntregas',
            label: 'Entradas de Miel',
            type: 'number',
            sortable: true,
            width: '140px',
            align: 'center'
        },
        {
            key: 'estatus',
            label: 'Estatus',
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
     * ✅ Configuración de filtros v2.0
     */
    filterConfig = computed<FilterConfig[]>(() => [
        {
            key: 'nombre',
            label: 'Búsqueda',
            type: 'text',
            placeholder: 'Buscar por nombre, código, CURP...'
        },
        {
            key: 'estadoCodigo',
            label: 'Entidad',
            type: 'select',
            placeholder: 'Yucatán',
            options: [
                { value: '', label: 'Todos' },
                { value: '31', label: 'Yucatán' },
                { value: '20', label: 'Oaxaca' }
            ]
        },
        {
            key: 'estatus',
            label: 'Status',
            type: 'select',
            placeholder: 'Activos',
            options: [
                { value: '', label: 'Todos' },
                { value: 'ACTIVO', label: 'Activos' },
                { value: 'INACTIVO', label: 'Inactivos' }
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
        this.loadCatalogos();
        this.loadApicultores();
    }

    /**
     * ✅ Hook después de cargar datos (para aplicar filtros por defecto)
     */
    private applyDefaultFilters(): void {
        // ✅ Establecer filtros por defecto DESPUÉS de cargar los datos
        this.filterState.set({
            estadoCodigo: '31',  // Yucatán por defecto
            estatus: 'ACTIVO'    // Activos por defecto
        });

        // Aplicar filtros inmediatamente
        this.applyFiltersAndPagination();
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    /**
     * ✅ Obtener la ruta base según el rol del usuario
     */
    private getBaseRoute(): string {
        const currentUser = this.authService.getCurrentUser();
        return currentUser?.role === 'ACOPIADOR' ? '/acopiador' : '/admin';
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    /**
     * ✅ Cargar catálogos de estados y municipios
     */
    private loadCatalogos(): void {
        // Cargar estados
        this.estadoService.getAllEstados()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (estados) => {
                    const map = new Map<string, string>();
                    estados.forEach(estado => {
                        map.set(estado.codigo_inegi, estado.estado);
                    });
                    this.estadosMap.set(map);
                },
                error: (error) => console.error('Error al cargar estados:', error)
            });

        // Cargar todos los municipios
        this.municipioService.getAllMunicipios()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (municipios) => {
                    const map = new Map<string, string>();
                    municipios.forEach(municipio => {
                        // Clave: "estadoCodigo-municipioCodigo"
                        const key = `${municipio.estado_codigo}-${municipio.clave_municipio}`;
                        map.set(key, municipio.nombreMunicipio);
                    });
                    this.municipiosMap.set(map);
                },
                error: (error) => console.error('Error al cargar municipios:', error)
            });
    }

    /**
     * ✅ Cargar apicultores según el rol del usuario
     * - ADMINISTRADOR: Carga todos los apicultores
     * - ACOPIADOR: Carga solo apicultores vinculados a su proveedor
     */
    private loadApicultores(): void {
        this.isLoading.set(true);

        const currentUser = this.authService.getCurrentUser();

        // Si es ACOPIADOR, filtrar por proveedorId
        if (currentUser?.role === 'ACOPIADOR' && currentUser?.proveedorId) {
            // TODO: Cuando tengas el endpoint de proveedores/{id}/apicultores, úsalo aquí
            // Por ahora, cargamos todos y filtramos en frontend
            this.apicultorService
                .getAllApicultores()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (apicultores) => {
                        // Filtrar solo los apicultores vinculados a este proveedor
                        const filtered = apicultores.filter(ap =>
                            ap.cantidadProveedores > 0 // Tiene al menos un proveedor vinculado
                        );
                        this.allApicultores.set(filtered);
                        this.applyDefaultFilters(); // ✅ Aplicar filtros por defecto
                        this.isLoading.set(false);
                    },
                    error: (error) => {
                        console.error('Error al cargar apicultores:', error);
                        this.isLoading.set(false);
                    }
                });
        } else {
            // ADMINISTRADOR: Carga todos
            this.apicultorService
                .getAllApicultores()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (apicultores) => {
                        this.allApicultores.set(apicultores);
                        this.applyDefaultFilters(); // ✅ Aplicar filtros por defecto
                        this.isLoading.set(false);
                    },
                    error: (error) => {
                        console.error('Error al cargar apicultores:', error);
                        this.isLoading.set(false);
                    }
                });
        }
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

        // ✅ FILTRO 4: Certificaciones (v2.0: senasica → idRasmiel, ippSiniga → uppSiniiga)
        if (state['certificaciones'] && state['certificaciones'] !== '') {
            const certFilter = state['certificaciones'];
            filtered = filtered.filter(a => {
                const hasRasmiel = a.idRasmiel !== null && a.idRasmiel.trim() !== '';
                const hasUPP = a.uppSiniiga !== null && a.uppSiniiga.trim() !== '';

                if (certFilter === 'senasica') return hasRasmiel; // Mantener nombre de filtro por compatibilidad
                if (certFilter === 'ipp') return hasUPP;
                if (certFilter === 'ambas') return hasRasmiel && hasUPP;
                if (certFilter === 'ninguna') return !hasRasmiel && !hasUPP;
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
     * ✅ Ver detalle del apicultor (abre modal en tab General)
     */
    private viewApicultorDetail(apicultor: ApicultorAPI): void {
        this.selectedApicultor.set(apicultor);
        this.selectedTab.set('general');
        this.isModalOpen.set(true);
    }

    /**
     * Editar apicultor
     */
    private editApicultor(apicultor: ApicultorAPI): void {
        const baseRoute = this.getBaseRoute();
        this.router.navigate([`${baseRoute}/apicultores`, apicultor.id, 'edit']);
    }

    /**
     * ✅ Ver proveedores del apicultor (abre modal en tab Proveedores)
     */
    private viewProveedores(apicultor: ApicultorAPI): void {
        this.selectedApicultor.set(apicultor);
        this.selectedTab.set('proveedores');
        this.isModalOpen.set(true);
    }

    /**
     * ✅ Ver apiarios del apicultor (abre modal en tab Apiarios)
     */
    private viewApiarios(apicultor: ApicultorAPI): void {
        this.selectedApicultor.set(apicultor);
        this.selectedTab.set('apiarios');
        this.isModalOpen.set(true);
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
     * ✅ Cerrar modal de detalle
     */
    closeModal(): void {
        this.isModalOpen.set(false);
        this.selectedApicultor.set(null);
        this.selectedTab.set('general');
    }

    /**
     * Navegar a crear nuevo apicultor
     */
    createApicultor(): void {
        const baseRoute = this.getBaseRoute();
        this.router.navigate([`${baseRoute}/apicultores/nuevo`]);
    }
}