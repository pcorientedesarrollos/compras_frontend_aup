/**
 * ============================================================================
 * 📦 SALIDAS MIEL LIST COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Listado de salidas de miel con TAMBORES:
 * - Vista compacta tipo tabla
 * - Filtros (fecha, estado)
 * - Paginación backend
 * - Acciones según estado:
 *   - EN_PROCESO: Editar, Finalizar, Cancelar
 *   - FINALIZADA: Marcar en Tránsito
 *   - EN_TRANSITO: Solo ver
 *   - VERIFICADA: Solo ver
 *
 * ============================================================================
 */

import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
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
    EstadoSalida
} from '../../../core/models/salida-miel.model';

// Servicios
import { SalidaMielService } from '../../../core/services/salida-miel.service';
import { NotificationService } from '../../../core/services/notification.service';

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
    private notificationService = inject(NotificationService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Lista de salidas */
    salidas = signal<SalidaMielListItem[]>([]);

    /** Estado de carga */
    loading = signal(false);
    processingAction = signal(false);

    /** Paginación */
    currentPage = signal(1);
    pageSize = signal(15);
    totalItems = signal(0);
    totalPages = signal(0);

    /** Filtros */
    filterEstado = signal<EstadoSalida | ''>('');
    filterFechaInicio = signal('');
    filterFechaFin = signal('');

    /** Math para template */
    Math = Math;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Enum para template */
    readonly EstadoSalida = EstadoSalida;

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadSalidas();
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    loadSalidas(): void {
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

        this.loading.set(true);

        this.salidaMielService.getSalidas(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.salidas.set(response.data);
                    this.currentPage.set(response.pagination.page);
                    this.totalItems.set(response.pagination.total);
                    this.totalPages.set(response.pagination.totalPages);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    this.notificationService.error('Error al cargar salidas', 'No se pudieron obtener las salidas de miel');
                }
            });
    }

    // ============================================================================
    // FILTERS
    // ============================================================================

    onFilterChange(): void {
        this.currentPage.set(1);
        this.loadSalidas();
    }

    clearFilters(): void {
        this.filterEstado.set('');
        this.filterFechaInicio.set('');
        this.filterFechaFin.set('');
        this.currentPage.set(1);
        this.loadSalidas();
    }

    // ============================================================================
    // PAGINATION
    // ============================================================================

    goToPage(page: number): void {
        this.currentPage.set(page);
        this.loadSalidas();
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.goToPage(this.currentPage() - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.goToPage(this.currentPage() + 1);
        }
    }

    // ============================================================================
    // ACTIONS
    // ============================================================================

    /**
     * Ir a crear nueva salida
     */
    crearNuevaSalida(): void {
        this.router.navigate(['/acopiador/salidas-miel/nueva']);
    }

    /**
     * Editar salida (solo EN_PROCESO)
     */
    editarSalida(salida: SalidaMielListItem): void {
        if (!this.salidaMielService.esEditable(salida.estado)) {
            this.notificationService.warning('No se puede editar', 'Solo se pueden editar salidas en estado EN PROCESO');
            return;
        }

        this.router.navigate(['/acopiador/salidas-miel', salida.id]);
    }

    /**
     * Ver detalle de salida (por ahora redirige a editar)
     */
    verDetalle(salida: SalidaMielListItem): void {
        // Por ahora solo permite ver salidas EN_PROCESO (editar)
        if (salida.estado === 'EN_PROCESO') {
            this.editarSalida(salida);
        } else {
            this.notificationService.info('Ver Detalle', `Salida ${salida.folio} - Estado: ${this.getEstadoLabel(salida.estado)}`);
        }
    }

    /**
     * Finalizar salida (EN_PROCESO → FINALIZADA)
     */
    finalizarSalida(salida: SalidaMielListItem): void {
        if (!this.salidaMielService.esFinalizable(salida.estado)) {
            this.notificationService.warning('No se puede finalizar', 'Solo se pueden finalizar salidas en estado EN PROCESO');
            return;
        }

        if (!confirm(`¿Está seguro de finalizar la salida ${salida.folio}?\n\nUna vez finalizada NO podrá añadir o quitar tambores.`)) {
            return;
        }

        this.processingAction.set(true);

        this.salidaMielService.finalizarSalida(salida.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.processingAction.set(false);
                    this.notificationService.success('Salida finalizada', `${salida.folio} finalizada exitosamente`);
                    this.loadSalidas();
                },
                error: (error) => {
                    this.processingAction.set(false);
                    this.notificationService.error('Error al finalizar', error.error?.message || 'Error desconocido');
                }
            });
    }

    /**
     * Marcar como en tránsito (FINALIZADA → EN_TRANSITO)
     */
    marcarEnTransito(salida: SalidaMielListItem): void {
        if (!this.salidaMielService.puedeMarcarEnTransito(salida.estado)) {
            this.notificationService.warning('No se puede marcar en tránsito', 'Solo se pueden marcar en tránsito las salidas FINALIZADAS');
            return;
        }

        if (!confirm(`¿Confirma que el chofer recogió la carga de la salida ${salida.folio}?`)) {
            return;
        }

        this.processingAction.set(true);

        this.salidaMielService.marcarEnTransito(salida.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.processingAction.set(false);
                    this.notificationService.success('En tránsito', `${salida.folio} marcada como EN TRÁNSITO`);
                    this.loadSalidas();
                },
                error: (error) => {
                    this.processingAction.set(false);
                    this.notificationService.error('Error al marcar en tránsito', error.error?.message || 'Error desconocido');
                }
            });
    }

    /**
     * Cancelar salida (solo EN_PROCESO)
     */
    cancelarSalida(salida: SalidaMielListItem): void {
        if (!this.salidaMielService.esCancelable(salida.estado)) {
            this.notificationService.warning('No se puede cancelar', 'Solo se pueden cancelar salidas en estado EN PROCESO');
            return;
        }

        if (!confirm(`¿Está seguro de CANCELAR la salida ${salida.folio}?\n\nEsta acción NO se puede deshacer.\nTodos los tambores volverán a estado ACTIVO.`)) {
            return;
        }

        this.processingAction.set(true);

        this.salidaMielService.cancelarSalida(salida.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.processingAction.set(false);
                    this.notificationService.success('Salida cancelada', `${salida.folio} cancelada exitosamente`);
                    this.loadSalidas();
                },
                error: (error) => {
                    this.processingAction.set(false);
                    this.notificationService.error('Error al cancelar', error.error?.message || 'Error desconocido');
                }
            });
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    getEstadoBadgeClass(estado: EstadoSalida): string {
        return this.salidaMielService.getEstadoBadgeClass(estado);
    }

    getEstadoLabel(estado: EstadoSalida): string {
        return this.salidaMielService.getEstadoLabel(estado);
    }

    formatDate(dateString: string): string {
        return this.salidaMielService.formatDate(dateString);
    }

    formatCurrency(value: number): string {
        return this.salidaMielService.formatCurrency(value);
    }

    formatKilos(kilos: number): string {
        return this.salidaMielService.formatKilos(kilos);
    }

    /**
     * Verificar si el usuario puede realizar acciones sobre una salida
     */
    puedeEditar(salida: SalidaMielListItem): boolean {
        return this.salidaMielService.esEditable(salida.estado);
    }

    puedeFinalizar(salida: SalidaMielListItem): boolean {
        return this.salidaMielService.esFinalizable(salida.estado);
    }

    puedeMarcarEnTransito(salida: SalidaMielListItem): boolean {
        return this.salidaMielService.puedeMarcarEnTransito(salida.estado);
    }

    puedeCancelar(salida: SalidaMielListItem): boolean {
        return this.salidaMielService.esCancelable(salida.estado);
    }
}
