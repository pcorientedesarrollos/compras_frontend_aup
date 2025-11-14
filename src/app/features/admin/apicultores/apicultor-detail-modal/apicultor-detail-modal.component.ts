/**
 * ============================================================================
 * 🐝 APICULTOR DETAIL MODAL - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Modal con información detallada de un apicultor
 *
 * TABS:
 * 1. General: Información básica del apicultor
 * 2. Proveedores: Lista de proveedores vinculados
 * 3. Apiarios: Lista de apiarios del apicultor (con botón crear nuevo)
 *
 * ============================================================================
 */

import { Component, computed, signal, inject, DestroyRef, input, output, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { HoneyTableComponent } from '../../../../shared/components/data/honey-table/honey-table.component';

// Tipos y modelos
import { TableColumn, TableConfig } from '../../../../shared/components/data/honey-table/types/table.types';
import {
    ApicultorAPI,
    ApicultorDetailAPI,
    ApicultorProveedor,
    ApicultorApiario
} from '../../../../core/models/index';

// Servicios
import { ApicultorService } from '../../../../core/services/apicultor.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EntradaMielService } from '../../../../core/services/entrada-miel.service';
import { EstadoService } from '../../../../core/services/estado.service';
import { MunicipioService } from '../../../../core/services/municipio.service';
import { IconName } from '../../../../shared/components/ui/icon';
import { EntradaMielAPI } from '../../../../core/models/entrada-miel.model';

type TabId = 'general' | 'proveedores' | 'apiarios' | 'mielPorTipo';

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
    private authService = inject(AuthService);
    private entradaMielService = inject(EntradaMielService);
    private estadoService = inject(EstadoService);
    private municipioService = inject(MunicipioService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // INPUTS / OUTPUTS
    // ============================================================================

    /** Apicultor a mostrar (solo info básica) */
    apicultor = input.required<ApicultorAPI>();

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

    /** Detalle completo del apicultor (con apiarios y proveedores) */
    apicultorDetalle = signal<ApicultorDetailAPI | null>(null);

    /** Estado de carga */
    isLoading = signal<boolean>(false);

    /** Lista de entregas del apicultor */
    entradasMiel = signal<EntradaMielAPI[]>([]);

    /** Mapas de catálogos */
    private estadosMap = signal<Map<string, string>>(new Map());
    private municipiosMap = signal<Map<string, string>>(new Map());

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /**
     * Verificar si el usuario es ACOPIADOR
     */
    private isAcopiador = computed(() => {
        const user = this.authService.getCurrentUser();
        return user?.role === 'ACOPIADOR';
    });

    /**
     * Obtener nombre del estado
     */
    estadoNombre = computed(() => {
        const codigo = this.apicultor().estadoCodigo;
        return this.estadosMap().get(codigo) || codigo;
    });

    /**
     * Obtener nombre del municipio
     */
    municipioNombre = computed(() => {
        const estadoCodigo = this.apicultor().estadoCodigo;
        const municipioCodigo = this.apicultor().municipioCodigo;
        const key = `${estadoCodigo}-${municipioCodigo}`;
        return this.municipiosMap().get(key) || municipioCodigo;
    });

    /**
     * Tabs disponibles
     */
    tabs = computed<Tab[]>(() => {
        const apic = this.apicultor();
        const list: Tab[] = [
            {
                id: 'general' as TabId,
                label: 'Información General',
                icon: 'information-circle' as IconName,
                visible: true
            },
            {
                id: 'proveedores' as TabId,
                label: `Proveedores (${apic.cantidadProveedores})`,
                icon: 'building-office' as IconName,
                visible: !this.isAcopiador() // Ocultar para ACOPIADOR
            },
            {
                id: 'apiarios' as TabId,
                label: `Apiarios (${apic.cantidadApiarios})`,
                icon: 'map-pin' as IconName,
                visible: true
            },
            {
                id: 'mielPorTipo' as TabId,
                label: 'Miel por Tipo',
                icon: 'shopping-bag' as IconName,
                visible: !!(apic.mielPorTipo && apic.mielPorTipo.length > 0)
            }
        ];
        return list.filter(tab => tab.visible);
    });

    /**
     * Lista de proveedores (del detalle)
     */
    proveedores = computed<ApicultorProveedor[]>(() => {
        return this.apicultorDetalle()?.proveedores || [];
    });

    /**
     * Lista de apiarios (del detalle)
     */
    apiarios = computed<ApicultorApiario[]>(() => {
        return this.apicultorDetalle()?.apiarios || [];
    });

    /**
     * Columnas para tabla de proveedores
     */
    proveedoresColumns = computed<TableColumn[]>(() => [
        {
            key: 'proveedorId',
            label: 'ID',
            type: 'number',
            width: '80px',
            sortable: true,
            align: 'center'
        },
        {
            key: 'proveedorNombre',
            label: 'Nombre / Razón Social',
            type: 'text',
            sortable: true,
            width: '300px'
        },
        {
            key: 'proveedorTipo',
            label: 'Tipo',
            type: 'text',
            width: '130px',
            align: 'center',
            formatter: (value: string) => value || 'N/A'
        },
        {
            key: 'estatusVinculo',
            label: 'Estado',
            type: 'badge',
            width: '100px',
            align: 'center',
            badgeConfig: {
                'ACTIVO': { label: 'Activo', variant: 'success' },
                'INACTIVO': { label: 'Inactivo', variant: 'danger' }
            }
        }
    ] as TableColumn[]);

    /**
     * Columnas para tabla de apiarios
     */
    apiariosColumns = computed<TableColumn[]>(() => [
        {
            key: 'nombre',
            label: 'Nombre del Apiario',
            type: 'text',
            sortable: true,
            width: '250px'
        },
        {
            key: 'colmenas',
            label: 'Colmenas',
            type: 'number',
            sortable: true,
            width: '100px',
            align: 'center'
        },
           
        {
            key: 'produccion',
            label: 'Producción (kg)',
            type: 'number',
            sortable: true,
            width: '100px',
            align: 'center'
        },
        {
            key: 'produccionAnual',
            label: 'Producción Anual (kg)',
            type: 'number',
            sortable: true,
            width: '100px',
            align: 'center'
        },

        {
            key: 'latitud',
            label: 'Latitud',
            type: 'text',
            width: '120px',
            formatter: (value: string | null) => value || 'N/A'
        },
        {
            key: 'longitud',
            label: 'Longitud',
            type: 'text',
            width: '120px',
            formatter: (value: string | null) => value || 'N/A'
        }
    ]);

    /**
     * Config de tabla de proveedores
     */
    proveedoresTableConfig = computed<TableConfig>(() => ({
        loading: this.isLoading(),
        loadingMessage: 'Cargando proveedores...',
        emptyMessage: 'Este apicultor no tiene proveedores asociados',
        striped: true,
        hoverable: false,
        stickyHeader: false,
        size: 'sm'
    }));

    /**
     * Config de tabla de apiarios
     */
    apiariosTableConfig = computed<TableConfig>(() => ({
        loading: this.isLoading(),
        loadingMessage: 'Cargando apiarios...',
        emptyMessage: 'Este apicultor no tiene apiarios registrados',
        striped: true,
        hoverable: false,
        stickyHeader: false,
        size: 'sm'
    }));

    /**
     * Columnas para tabla de entregas de miel (desglose completo)
     */
    mielPorTipoColumns = computed<TableColumn[]>(() => [
        {
            key: 'folio',
            label: 'Folio',
            type: 'text',
            sortable: true,
            width: '150px'
        },
        {
            key: 'fecha',
            label: 'Fecha',
            type: 'text',
            sortable: true,
            width: '120px',
            formatter: (value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
            }
        },
        {
            key: 'cantidadDetalles',
            label: 'No. Registros',
            type: 'number',
            sortable: true,
            width: '120px',
            align: 'center'
        },
        {
            key: 'kilosTotales',
            label: 'Kilos',
            type: 'number',
            sortable: true,
            width: '120px',
            align: 'right',
            formatter: (value: number) => {
                return value ? value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kg' : '0.00 kg';
            }
        },
        {
            key: 'totalCompra',
            label: 'Total Compra',
            type: 'number',
            sortable: true,
            width: '150px',
            align: 'right',
            formatter: (value: number) => {
                return value ? '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$0.00';
            }
        }
    ] as TableColumn[]);

    /**
     * Config de tabla de miel por tipo
     */
    mielPorTipoTableConfig = computed<TableConfig>(() => ({
        loading: this.isLoading(),
        loadingMessage: 'Cargando datos de entregas...',
        emptyMessage: 'No hay entregas registradas',
        striped: true,
        hoverable: true,
        stickyHeader: false,
        size: 'md'
    }));

    // ============================================================================
    // EFFECTS
    // ============================================================================

    constructor() {
        // Cargar catálogos de estados y municipios
        this.loadCatalogos();

        // Establecer tab inicial cuando se abre el modal
        effect(() => {
            if (this.isOpen()) {
                this.activeTab.set(this.initialTab());
                this.loadApicultorDetalle();
            }
        });
    }

    // ============================================================================
    // METHODS - DATA LOADING
    // ============================================================================

    /**
     * Cargar catálogos de estados y municipios
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

        // Cargar municipios
        this.municipioService.getAllMunicipios()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (municipios) => {
                    const map = new Map<string, string>();
                    municipios.forEach(municipio => {
                        const key = `${municipio.estado_codigo}-${municipio.clave_municipio}`;
                        map.set(key, municipio.nombreMunicipio);
                    });
                    this.municipiosMap.set(map);
                },
                error: (error) => console.error('Error al cargar municipios:', error)
            });
    }

    /**
     * Cargar detalle completo del apicultor
     */
    private loadApicultorDetalle(): void {
        const apicultorId = this.apicultor().id;
        this.isLoading.set(true);

        this.apicultorService.getApicultorById(apicultorId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (detalle) => {
                    this.apicultorDetalle.set(detalle);
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar detalle del apicultor:', error);
                    this.isLoading.set(false);
                }
            });

        // Cargar entregas de miel del apicultor
        this.loadEntradasMiel(apicultorId);
    }

    /**
     * Cargar entregas de miel del apicultor
     */
    private loadEntradasMiel(apicultorId: string): void {
        this.entradaMielService.getEntradas({ apicultorId })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.entradasMiel.set(response.data);
                },
                error: (error) => {
                    console.error('Error al cargar entregas de miel:', error);
                    this.entradasMiel.set([]);
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
        this.apicultorDetalle.set(null);
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
     * Prevenir cierre al hacer click dentro del modal
     */
    onModalClick(event: MouseEvent): void {
        event.stopPropagation();
    }

    /**
     * Crear nuevo apiario (navega con apicultorId pre-seleccionado)
     * ✅ Usa ruta dinámica según el rol del usuario
     */
    crearNuevoApiario(): void {
        const apicultorId = this.apicultor().id;
        const baseRoute = this.getBaseRoute();

        // ✅ Navegar primero y luego cerrar modal cuando la navegación se complete
        this.router.navigate([`${baseRoute}/apiarios/nuevo`], {
            queryParams: { apicultorId }
        }).then(() => {
            this.onClose(); // Cerrar modal DESPUÉS de navegar
        });
    }

    /**
     * ✅ Obtener ruta base según el rol del usuario
     */
    private getBaseRoute(): string {
        const currentUser = this.authService.getCurrentUser();
        return currentUser?.role === 'ACOPIADOR' ? '/acopiador' : '/admin';
    }

    /**
     * Obtener texto formateado de certificación
     */
    getCertificacionTexto(valor: string | null): string {
        return valor ? 'Sí' : 'No';
    }

    /**
     * Obtener variante de badge para certificación
     */
    getCertificacionVariant(valor: string | null): 'success' | 'danger' {
        return valor ? 'success' : 'danger';
    }
}
