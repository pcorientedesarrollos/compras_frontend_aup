/**
 * ============================================================================
 * 🏢 PROVEEDOR DETAIL MODAL - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Modal con información detallada de un proveedor
 * 
 * TABS:
 * 1. General: Información básica del proveedor
 * 2. Apicultores: Lista paginada de apicultores asociados
 * 3. Mapa: Ubicación GPS (solo si tiene coordenadas)
 * 
 * ============================================================================
 */

import { Component, computed, signal, inject, DestroyRef, input, output, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

// Componentes reutilizables
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { HoneyTableComponent } from '../../../shared/components/data/honey-table/honey-table.component';
import { LeafletMapComponent } from '../../../shared/components/map/leaflet-map.component';

// Tipos y modelos
import { TableColumn, TableConfig } from '../../../shared/components/data/honey-table/types/table.types';
import {
    ProveedorAPI,
    ApicultorDeProveedor,
    obtenerTextoEstado,
    obtenerVarianteBadgeEstado,
    tieneUbicacionGPS
} from '../../../core/models/index';

// Servicios
import { ProveedorService } from '../../../core/services/proveedor.service';
import { IconName } from '../../../shared/components/ui/icon';

type TabId = 'general' | 'apicultores' | 'mapa';

interface Tab {
    id: TabId;
    label: string;
    icon: IconName;
    visible: boolean;
}

@Component({
    selector: 'app-proveedor-detail-modal',
    standalone: true,
    imports: [
        CommonModule,
        IconComponent,
        BadgeComponent,
        HoneyTableComponent,
        LeafletMapComponent
    ],
    templateUrl: './proveedor-detail-modal.component.html',
    styleUrl: './proveedor-detail-modal.component.css'
})
export class ProveedorDetailModalComponent {
    private proveedorService = inject(ProveedorService);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // INPUTS / OUTPUTS
    // ============================================================================

    /** Proveedor a mostrar */
    proveedor = input.required<ProveedorAPI>();

    /** Si el modal está abierto */
    isOpen = input<boolean>(false);

    /** Tab inicial a mostrar */
    initialTab = input<TabId>('general');

    /** Evento de cierre */
    close = output<void>();

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Tab activo */
    activeTab = signal<TabId>('general');

    /** Lista de apicultores */
    apicultores = signal<ApicultorDeProveedor[]>([]);

    /** Estado de carga de apicultores */
    isLoadingApicultores = signal<boolean>(false);

    /** Paginación de apicultores */
    apicultoresPage = signal<number>(1);
    apicultoresPageSize = signal<number>(10);
    apicultorestotalItems = signal<number>(0);
    apicultorestotalPages = signal<number>(0);

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /**
     * Tabs disponibles (Mapa solo si tiene GPS)
     */
    tabs = computed<Tab[]>(() => {
        const prov = this.proveedor();
        const list: Tab[] = [
            {
                id: 'general' as TabId,
                label: 'Información General',
                icon: 'information-circle' as IconName,
                visible: true
            },
            {
                id: 'apicultores' as TabId,
                label: `Apicultores (${prov.cantidadApicultores})`,
                icon: 'users' as IconName,
                visible: true
            },
            {
                id: 'mapa' as TabId,
                label: 'Ubicación GPS',
                icon: 'map-pin' as IconName,
                visible: tieneUbicacionGPS(prov)
            }
        ];
        return list.filter(tab => tab.visible);
    });

    /**
     * Helpers para template
     */
    obtenerTextoEstado = obtenerTextoEstado;
    obtenerVarianteBadgeEstado = obtenerVarianteBadgeEstado;

    /**
     * Columnas para tabla de apicultores
     */
    apicultoresColumns = computed<TableColumn[]>(() => [
        {
            key: 'apicultorCodigo',
            label: 'Código',
            type: 'text',
            width: '120px',
            sortable: true
        },
        {
            key: 'apicultorNombre',
            label: 'Nombre Completo',
            type: 'text',
            sortable: true,
            width: '250px'
        },
        {
            key: 'apicultorCurp',
            label: 'CURP',
            type: 'text',
            width: '180px'
        },
        {
            key: 'municipioCodigo',
            label: 'Municipio',
            type: 'text',
            width: '120px',
            formatter: (value: string | null) => value || 'No especificado'
        },
        {
            key: 'cantidadApiarios',
            label: 'Apiarios',
            type: 'number',
            width: '100px',
            align: 'center',
            sortable: true
        },
        {
            key: 'estatus',
            label: 'Estado',
            type: 'badge',
            width: '100px',
            align: 'center',
            badgeConfig: {
                'ACTIVO': { label: 'Activo', variant: 'success' },
                'INACTIVO': { label: 'Inactivo', variant: 'danger' }
            }
        }
    ]);

    /**
     * Config de tabla de apicultores
     */
    apicultoresTableConfig = computed<TableConfig>(() => ({
        loading: this.isLoadingApicultores(),
        loadingMessage: 'Cargando apicultores...',
        emptyMessage: 'Este proveedor no tiene apicultores asociados',
        striped: true,
        hoverable: false,
        stickyHeader: false,
        size: 'sm'
    }));

    // ============================================================================
    // EFFECTS
    // ============================================================================

    constructor() {
        // ✅ Establecer tab inicial cuando se abre el modal
        effect(() => {
            if (this.isOpen()) {
                this.activeTab.set(this.initialTab());
            }
        });

        // Cargar apicultores cuando se abre el modal y el tab es 'apicultores'
        effect(() => {
            if (this.isOpen() && this.activeTab() === 'apicultores') {
                this.loadApicultores();
            }
        });
    }

    // ============================================================================
    // METHODS - DATA LOADING
    // ============================================================================

    /**
     * Cargar apicultores del proveedor
     */
    private loadApicultores(): void {
        const proveedorId = this.proveedor().idProveedor;
        this.isLoadingApicultores.set(true);

        this.proveedorService.getApicultoresDeProveedor(proveedorId, {
            page: this.apicultoresPage(),
            limit: this.apicultoresPageSize()
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.apicultores.set(response.data);
                    this.apicultorestotalItems.set(response.pagination.total);
                    this.apicultorestotalPages.set(response.pagination.totalPages);
                    this.isLoadingApicultores.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar apicultores:', error);
                    this.isLoadingApicultores.set(false);
                    this.apicultores.set([]);
                }
            });
    }

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    /**
     * Cambiar tab activo
     */
    selectTab(tabId: TabId): void {
        this.activeTab.set(tabId);
    }

    /**
     * Verificar si un tab está activo
     */
    isTabActive(tabId: TabId): boolean {
        return this.activeTab() === tabId;
    }

    /**
     * Cerrar modal
     */
    onClose(): void {
        this.close.emit();
        // Resetear estado
        this.activeTab.set('general');
        this.apicultoresPage.set(1);
    }

    /**
     * Cerrar con Escape
     */
    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.onClose();
        }
    }

    /**
     * Cambiar página de apicultores
     */
    onApicultoresPageChange(page: number): void {
        this.apicultoresPage.set(page);
        this.loadApicultores();
    }

    /**
     * Prevenir cierre al hacer click dentro del modal
     */
    onModalClick(event: MouseEvent): void {
        event.stopPropagation();
    }
}