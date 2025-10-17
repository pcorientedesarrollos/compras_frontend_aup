/**
 * ============================================================================
 * 🏢 PROVEEDORES LIST COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Listado de proveedores (Acopiadores/Mieleras) con:
 * - Filtros avanzados (nombre, tipo, estado, tipo de miel, activo/inactivo)
 * - Tabla interactiva (honey-table)
 * - Paginación server-side
 * - Acciones: Ver detalle, Ver apicultores
 * 
 * RUTA: /admin/proveedores
 * GUARD: adminGuard (solo ADMINISTRADOR)
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

// Tipos y modelos
import { TableColumn, TableConfig } from '../../../shared/components/data/honey-table/types/table.types';
import { FilterConfig, FilterState } from '../../../shared/components/data/honey-table/types/filter.types';
import { ActionMenuConfig } from '../../../shared/components/data/honey-table/types/action.types';
import {
    ProveedorAPI,
    TipoDeMiel,
    ProveedorFilterParams,
    obtenerTextoEstado,
    obtenerVarianteBadgeEstado
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
    // PUBLIC PROPERTIES (Para usar en template)
    // ============================================================================

    /** Exponer Math para usar en template */
    Math = Math;

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Lista de proveedores */
    proveedores = signal<ProveedorAPI[]>([]);

    /** Estado de carga */
    isLoading = signal<boolean>(false);

    /** Catálogo de tipos de miel */
    tiposMiel = signal<TipoDeMiel[]>([]);

    /** Filtros activos */
    filterState = signal<FilterState>({});

    /** Paginación */
    currentPage = signal<number>(1);
    pageSize = signal<number>(10);
    totalItems = signal<number>(0);
    totalPages = signal<number>(0);

    /** Modal de detalle */
    isModalOpen = signal<boolean>(false);
    selectedProveedor = signal<ProveedorAPI | null>(null);

    // ============================================================================
    // COMPUTED - CONFIGURACIONES
    // ============================================================================

    /**
     * Configuración de columnas de la tabla
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
        {
            key: 'tipo',
            label: 'Tipo',
            type: 'badge',
            sortable: true,
            width: '120px',
            align: 'center',
            badgeConfig: {
                'ACOPIADOR': { label: 'Acopiador', variant: 'info', icon: 'building-office' },
                'MIELERA': { label: 'Mielera', variant: 'success' }
            }
        },
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
            formatter: (value: number | null) => value ? value.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '0.00'
        },
        {
            key: 'activoInactivo',
            label: 'Estado',
            type: 'badge',
            sortable: true,
            width: '100px',
            align: 'center',
            badgeConfig: {
                1: { label: 'Activo', variant: 'success' },
                0: { label: 'Inactivo', variant: 'danger' }
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
     * Configuración de filtros
     */
    filterConfig = computed<FilterConfig[]>(() => [
        {
            key: 'nombre',
            label: 'Nombre',
            type: 'text',
            placeholder: 'Buscar por nombre...'
        },
        {
            key: 'tipo',
            label: 'Tipo de Proveedor',
            type: 'select',
            placeholder: 'Todos',
            options: [
                { value: '', label: 'Todos' },
                { value: 'ACOPIADOR', label: 'Acopiador' },
                { value: 'MIELERA', label: 'Mielera' }
            ]
        },
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
                { value: '1', label: 'Activos' },
                { value: '0', label: 'Inactivos' }
            ]
        }
    ]);

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadTiposMiel();
        this.loadProveedores();
    }

    // ============================================================================
    // METHODS - DATA LOADING
    // ============================================================================

    /**
     * Cargar catálogo de tipos de miel
     */
    private loadTiposMiel(): void {
        this.proveedorService.getTiposMiel()
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
     * Cargar proveedores con filtros actuales
     */
    loadProveedores(): void {
        this.isLoading.set(true);

        const filters = this.buildFilterParams();

        this.proveedorService.searchProveedores(filters)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.proveedores.set(response.data);
                    this.totalItems.set(response.pagination.total);
                    this.totalPages.set(response.pagination.totalPages);
                    this.currentPage.set(response.pagination.page);
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar proveedores:', error);
                    this.isLoading.set(false);
                    this.proveedores.set([]);
                }
            });
    }

    /**
     * Construir parámetros de filtrado desde el estado actual
     */
    private buildFilterParams(): ProveedorFilterParams {
        const state = this.filterState();
        const params: ProveedorFilterParams = {
            page: this.currentPage(),
            limit: this.pageSize()
        };

        if (state['nombre']) params.nombre = state['nombre'] as string;
        if (state['tipo']) params.tipo = state['tipo'] as string;
        if (state['tipoDeMiel']) params.tipoDeMiel = Number(state['tipoDeMiel']);
        if (state['activoInactivo'] !== undefined && state['activoInactivo'] !== '') {
            params.activoInactivo = Number(state['activoInactivo']) as 0 | 1;
        }

        return params;
    }

    // ============================================================================
    // EVENT HANDLERS - FILTROS
    // ============================================================================

    /**
     * Manejar cambio en filtros
     */
    onFiltersChange(newState: FilterState): void {
        this.filterState.set(newState);
        this.currentPage.set(1); // Resetear a página 1
        this.loadProveedores();
    }

    /**
     * Manejar remoción de un filtro específico
     */
    onFilterRemove(filterKey: string): void {
        const newState = { ...this.filterState() };
        delete newState[filterKey];
        this.filterState.set(newState);
        this.currentPage.set(1);
        this.loadProveedores();
    }

    /**
     * Limpiar todos los filtros
     */
    clearAllFilters(): void {
        this.filterState.set({});
        this.currentPage.set(1);
        this.loadProveedores();
    }

    // ============================================================================
    // EVENT HANDLERS - TABLA
    // ============================================================================

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
     * Ver ubicación en mapa (TODO: Modal con Leaflet)
     */
    private viewUbicacion(proveedor: ProveedorAPI): void {
        if (!proveedor.latitud || !proveedor.longitud) return;
        console.log('Ver ubicación:', proveedor.latitud, proveedor.longitud);
        // TODO: Implementar modal con mapa Leaflet
        alert(`Ubicación GPS:\nLat: ${proveedor.latitud}\nLng: ${proveedor.longitud}`);
    }

    /**
     * Manejar cambio de página
     */
    onPageChange(page: number): void {
        this.currentPage.set(page);
        this.loadProveedores();
    }

    /**
     * Manejar cambio de tamaño de página
     */
    onPageSizeChange(size: number): void {
        this.pageSize.set(size);
        this.currentPage.set(1); // Resetear a página 1
        this.loadProveedores();
    }


    /**
     * Ver detalle del proveedor (Modal)
     */
    private viewProveedorDetail(proveedor: ProveedorAPI): void {
        this.selectedProveedor.set(proveedor);
        this.isModalOpen.set(true);
    }

    /**
     * Cerrar modal de detalle
     */
    closeModal(): void {
        this.isModalOpen.set(false);
        this.selectedProveedor.set(null);
    }

    /**
     * Ver apicultores del proveedor (TODO: Modal o página)
     */
    private viewApicultores(proveedor: ProveedorAPI): void {
        console.log('Ver apicultores de:', proveedor);
        // TODO: Implementar modal o navegación
        alert(`Apicultores de ${proveedor.nombre}\nTotal: ${proveedor.cantidadApicultores}`);
    }
}