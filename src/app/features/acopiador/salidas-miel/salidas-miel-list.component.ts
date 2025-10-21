/**
 * ============================================================================
 * 📦 SALIDAS MIEL LIST COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Listado de salidas de miel con:
 * - Vista COMPACTA tipo tabla (no cards)
 * - Resumen de kilos por tipo de miel
 * - Filtros (fecha, estado, chofer)
 * - Paginación backend
 * - Acciones (Ver detalle, Finalizar, Cancelar)
 * 
 * ============================================================================
 */

import { Component, signal, inject, DestroyRef, OnInit, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Componentes reutilizables
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';

// Modelos
import {
    SalidaMielListItem,
    SalidaMielFilterParams,
    EstadoSalida,
    ResumenKilosPorTipo
} from '../../../core/models/salida-miel.model';

// Servicios
import { SalidaMielService } from '../../../core/services/salida-miel.service';
import { InventarioService } from '../../../core/services/inventario.service';

@Component({
    selector: 'app-salidas-miel-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IconComponent
    ],
    templateUrl: './salidas-miel-list.component.html',
    styleUrl: './salidas-miel-list.component.css'
})
export class SalidasMielListComponent implements OnInit {
    private salidaMielService = inject(SalidaMielService);
    private inventarioService = inject(InventarioService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Lista de salidas */
    salidas = signal<SalidaMielListItem[]>([]);

    /** Estado de carga */
    loading = signal(false);

    /** Paginación */
    currentPage = signal(1);
    pageSize = signal(15); // Más registros por página en tabla compacta
    totalItems = signal(0);
    totalPages = signal(0);

    /** Filtros */
    filterEstado = signal<EstadoSalida | ''>('');
    filterFechaInicio = signal('');
    filterFechaFin = signal('');
    filterChofer = signal('');

    /** Salida seleccionada para modal */
    selectedSalidaId = signal<string | null>(null);

    /** Kilos disponibles totales del inventario */
    kilosDisponiblesTotales = signal<number>(0);

    /**
     * Math para template
     */
    Math = Math;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Enum para template */
    readonly EstadoSalida = EstadoSalida;

    /**
     * Resumen de kilos totales por estado
     */
    resumenKilosPorEstado = computed(() => {
        const salidas = this.salidas();
        const resumen = {
            [EstadoSalida.BORRADOR]: 0,
            [EstadoSalida.EN_TRANSITO]: 0,
            [EstadoSalida.ENTREGADA]: 0,
            [EstadoSalida.CANCELADA]: 0
        };

        salidas.forEach(salida => {
            resumen[salida.estado] += salida.totalKilos;
        });

        return resumen;
    });

    /**
     * Total de kilos en todas las salidas visibles
     */
    totalKilosVisibles = computed(() => {
        return this.salidas().reduce((sum, salida) => sum + salida.totalKilos, 0);
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadSalidas();
        this.loadInventarioTotales();
    }

    // ============================================================================
    // METHODS - DATA LOADING
    // ============================================================================

    /**
     * Cargar salidas con filtros y paginación
     */
    loadSalidas(): void {
        this.loading.set(true);

        const params: SalidaMielFilterParams = {
            page: this.currentPage(),
            limit: this.pageSize()
        };

        // Aplicar filtros
        if (this.filterEstado()) {
            params.estado = this.filterEstado() as EstadoSalida;
        }

        if (this.filterFechaInicio()) {
            params.fechaInicio = this.filterFechaInicio();
        }

        if (this.filterFechaFin()) {
            params.fechaFin = this.filterFechaFin();
        }

        if (this.filterChofer()) {
            params.choferId = this.filterChofer();
        }

        this.salidaMielService.getSalidas(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.salidas.set(response.data);
                    this.totalItems.set(response.pagination.total);
                    this.totalPages.set(response.pagination.totalPages);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    alert('Error al cargar salidas de miel');
                }
            });
    }

    /**
     * Cargar totales de inventario disponible
     */
    loadInventarioTotales(): void {
        this.inventarioService.getResumenInventario()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.kilosDisponiblesTotales.set(response.totales.kilosDisponibles);
                },
                error: () => {
                    // Silenciar error, mantener en 0
                    this.kilosDisponiblesTotales.set(0);
                }
            });
    }

    // ============================================================================
    // METHODS - FILTROS Y PAGINACIÓN
    // ============================================================================

    /**
     * Aplicar filtros
     */
    applyFilters(): void {
        this.currentPage.set(1); // Reset a página 1
        this.loadSalidas();
    }

    /**
     * Limpiar filtros
     */
    clearFilters(): void {
        this.filterEstado.set('');
        this.filterFechaInicio.set('');
        this.filterFechaFin.set('');
        this.filterChofer.set('');
        this.currentPage.set(1);
        this.loadSalidas();
    }

    /**
     * Cambiar página
     */
    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages()) return;
        this.currentPage.set(page);
        this.loadSalidas();
    }

    /**
     * Array de páginas para paginador
     */
    getPageNumbers(): number[] {
        const total = this.totalPages();
        const current = this.currentPage();
        const delta = 2; // Páginas a mostrar alrededor de la actual

        const pages: number[] = [];

        for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
            pages.push(i);
        }

        return pages;
    }

    // ============================================================================
    // METHODS - ACCIONES
    // ============================================================================

    /**
     * Navegar a crear nueva salida
     */
    crearNuevaSalida(): void {
        this.router.navigate(['/acopiador/salidas-miel/nueva']);
    }

    /**
     * Ver detalle de una salida (modal)
     */
    verDetalle(id: string): void {
        this.selectedSalidaId.set(id);
        // TODO: Abrir modal de detalle
        console.log('Ver detalle:', id);
    }

    /**
     * Finalizar una salida (cambiar de BORRADOR a EN_TRANSITO)
     */
    finalizarSalida(salida: SalidaMielListItem): void {
        if (salida.estado !== EstadoSalida.BORRADOR) {
            alert('Solo se pueden finalizar salidas en estado BORRADOR');
            return;
        }

        if (!confirm(`¿Está seguro de finalizar la salida ${salida.folio}?\n\nEsta acción descontará el inventario usando FIFO y NO es reversible.`)) {
            return;
        }

        this.salidaMielService.finalizarSalida(salida.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    alert(`Salida ${salida.folio} finalizada exitosamente`);
                    this.loadSalidas();
                },
                error: (error) => {
                    alert(`Error al finalizar la salida: ${error.error?.message || 'Error desconocido'}`);
                }
            });
    }

    /**
     * Cancelar una salida (solo desde BORRADOR)
     */
    cancelarSalida(salida: SalidaMielListItem): void {
        if (salida.estado !== EstadoSalida.BORRADOR) {
            alert('Solo se pueden cancelar salidas en estado BORRADOR');
            return;
        }

        if (!confirm(`¿Está seguro de cancelar la salida ${salida.folio}?`)) {
            return;
        }

        this.salidaMielService.cancelarSalida(salida.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    alert('Salida cancelada exitosamente');
                    this.loadSalidas();
                },
                error: () => {
                    alert('Error al cancelar la salida');
                }
            });
    }

    /**
     * Editar salida (solo BORRADOR)
     */
    editarSalida(id: string): void {
        this.router.navigate(['/acopiador/salidas-miel/editar', id]);
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Clase CSS para badge de estado
     */
    getEstadoBadgeClass(estado: EstadoSalida): string {
        return this.salidaMielService.getEstadoBadgeClass(estado);
    }

    /**
     * Verificar si una salida es editable
     */
    esEditable(estado: EstadoSalida): boolean {
        return this.salidaMielService.esEditable(estado);
    }

    /**
     * Verificar si una salida se puede finalizar
     */
    esFinalizable(estado: EstadoSalida): boolean {
        return this.salidaMielService.esFinalizable(estado);
    }

    /**
     * Verificar si una salida se puede cancelar
     */
    esCancelable(estado: EstadoSalida): boolean {
        return this.salidaMielService.esCancelable(estado);
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString: string): string {
        return this.salidaMielService.formatDate(dateString);
    }

    /**
     * Formatear moneda
     */
    formatCurrency(value: number): string {
        return this.salidaMielService.formatCurrency(value);
    }

    /**
     * Formatear kilos con validación
     */
    formatKilos(kilos: number | undefined): string {
        if (kilos === undefined || kilos === null) {
            return '0.00 kg';
        }
        return `${kilos.toFixed(2)} kg`;
    }
}