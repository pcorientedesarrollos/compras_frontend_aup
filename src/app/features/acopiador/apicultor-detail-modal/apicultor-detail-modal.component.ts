/**
 * ============================================================================
 * 🐝 APICULTOR DETAIL MODAL - ACOPIADOR - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Modal con información detallada de un apicultor (READ-ONLY)
 * 
 * TABS:
 * 1. General: Información básica del apicultor
 * 2. Apiarios: Lista de apiarios del apicultor (tabla)
 * 3. Proveedores: Lista de proveedores vinculados (read-only)
 * 
 * RESTRICCIONES:
 * - Solo visualización (sin edición)
 * - No puede ver información sensible de otros proveedores
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

// Tipos y modelos
import { TableColumn, TableConfig } from '../../../shared/components/data/honey-table/types/table.types';
import {
    ApicultorDeProveedor,
    ApiarioDeApicultor,
    ApicultorProveedor
} from '../../../core/models/index';

// Servicios
import { ApicultorService } from '../../../core/services/apicultor.service';
import { ApiarioService } from '../../../core/services/apiario.service';
import { IconName } from '../../../shared/components/ui/icon/types/icon.types';

type TabId = 'general' | 'apiarios' | 'proveedores';

interface Tab {
    id: TabId;
    label: string;
    icon: IconName;
    visible: boolean;
}

@Component({
    selector: 'app-apicultor-detail-modal',
    standalone: true,
    imports: [
        CommonModule,
        IconComponent,
        BadgeComponent,
        HoneyTableComponent
    ],
    templateUrl: './apicultor-detail-modal.component.html',
    styleUrl: './apicultor-detail-modal.component.css'
})
export class ApicultorDetailModalComponent {
    private apicultorService = inject(ApicultorService);
    private apiarioService = inject(ApiarioService);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // INPUTS / OUTPUTS
    // ============================================================================

    /** Apicultor a mostrar */
    apicultor = input.required<ApicultorDeProveedor>();

    /** Si el modal está abierto */
    isOpen = input<boolean>(false);

    /** Evento de cierre */
    close = output<void>();

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Tab activo */
    activeTab = signal<TabId>('general');

    /** Lista de apiarios del apicultor */
    apiarios = signal<ApiarioDeApicultor[]>([]);

    /** Estado de carga de apiarios */
    isLoadingApiarios = signal<boolean>(false);

    /** Lista de proveedores vinculados */
    proveedores = signal<ApicultorProveedor[]>([]);

    /** Estado de carga de proveedores */
    isLoadingProveedores = signal<boolean>(false);

    // ============================================================================
    // EFFECTS
    // ============================================================================

    constructor() {
        // Cargar apiarios cuando se abre el modal y está en el tab de apiarios
        effect(() => {
            if (this.isOpen() && this.activeTab() === 'apiarios' && this.apiarios().length === 0) {
                this.loadApiarios();
            }
        });

        // Cargar proveedores cuando se abre el modal y está en el tab de proveedores
        effect(() => {
            if (this.isOpen() && this.activeTab() === 'proveedores' && this.proveedores().length === 0) {
                this.loadProveedores();
            }
        });
    }

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /**
     * Tabs disponibles
     */
    tabs = computed<Tab[]>(() => {
        const apic = this.apicultor();
        return [
            {
                id: 'general' as TabId,
                label: 'Información General',
                icon: 'information-circle' as IconName,
                visible: true
            },
            {
                id: 'apiarios' as TabId,
                label: `Apiarios (${apic.cantidadApiarios})`,
                icon: 'home' as IconName,
                visible: true
            },
            {
                id: 'proveedores' as TabId,
                label: 'Otros Proveedores',
                icon: 'building-office' as IconName,
                visible: true
            }
        ];
    });

    /**
     * Columnas para tabla de apiarios
     */
    apiariosColumns = computed<TableColumn[]>(() => [
        {
            key: 'nombre',
            label: 'Nombre del Apiario',
            type: 'text',
            width: '200px',
            sortable: true
        },
        {
            key: 'colmenas',
            label: 'Colmenas',
            type: 'badge',
            width: '100px',
            align: 'center',
            sortable: true,
            badgeVariant: 'warning'
        },
        {
            key: 'latitud',
            label: 'Latitud',
            type: 'text',
            width: '110px',
            formatter: (value: number) => value.toFixed(6)
        },
        {
            key: 'longitud',
            label: 'Longitud',
            type: 'text',
            width: '110px',
            formatter: (value: number) => value.toFixed(6)
        }
    ] as TableColumn[]);

    /**
     * Configuración de tabla de apiarios
     */
    apiariosTableConfig = computed<TableConfig>(() => ({
        loading: this.isLoadingApiarios(),
        loadingMessage: 'Cargando apiarios...',
        emptyMessage: 'Este apicultor no tiene apiarios registrados',
        striped: true,
        hoverable: true,
        size: 'sm'
    }));

    /**
     * Columnas para tabla de proveedores
     */
    proveedoresColumns = computed<TableColumn[]>(() => [
        {
            key: 'proveedor.nombre',
            label: 'Proveedor',
            type: 'text',
            width: '250px',
            sortable: true,
            formatter: (value: any, row: ApicultorProveedor) => row.proveedorNombre
        },
        {
            key: 'fechaVinculacion',
            label: 'Fecha de Vinculación',
            type: 'date',
            width: '150px',
            sortable: true
        }
    ] as TableColumn[]);

    /**
     * Configuración de tabla de proveedores
     */
    proveedoresTableConfig = computed<TableConfig>(() => ({
        loading: this.isLoadingProveedores(),
        loadingMessage: 'Cargando proveedores...',
        emptyMessage: 'Este apicultor solo está vinculado contigo',
        striped: true,
        hoverable: true,
        size: 'sm'
    }));

    // ============================================================================
    // METHODS - DATA LOADING
    // ============================================================================

    /**
     * Cargar apiarios del apicultor
     */
    private loadApiarios(): void {
        this.isLoadingApiarios.set(true);

        this.apiarioService
            .getApiariosByApicultor(this.apicultor().apicultorId, 1, 100)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.apiarios.set(response.data);
                    this.isLoadingApiarios.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar apiarios:', error);
                    this.isLoadingApiarios.set(false);
                }
            });
    }

    /**
     * Cargar proveedores vinculados al apicultor
     */
    private loadProveedores(): void {
        this.isLoadingProveedores.set(true);

        this.apicultorService
            .getProveedoresDeApicultor(this.apicultor().apicultorId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (proveedores) => {
                    this.proveedores.set(proveedores);
                    this.isLoadingProveedores.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar proveedores:', error);
                    this.isLoadingProveedores.set(false);
                }
            });
    }

    // ============================================================================
    // METHODS - TABS
    // ============================================================================

    /**
     * Cambiar tab activo
     */
    changeTab(tabId: TabId): void {
        this.activeTab.set(tabId);
    }

    // ============================================================================
    // METHODS - ACTIONS
    // ============================================================================

    /**
     * Cerrar modal
     */
    closeModal(): void {
        // Reset state
        this.activeTab.set('general');
        this.apiarios.set([]);
        this.proveedores.set([]);

        this.close.emit();
    }
}