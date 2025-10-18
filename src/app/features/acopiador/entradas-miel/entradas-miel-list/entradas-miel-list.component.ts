/**
 * ============================================================================
 * 📦 ENTRADAS MIEL LIST COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Listado de entradas de miel con:
 * - Filtros (fecha, apicultor, estado)
 * - Paginación backend
 * - Botón crear nueva entrada
 * - Acciones (Ver detalle, Cancelar)
 * 
 * ============================================================================
 */

import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';

// Modelos
import {
    EntradaMielAPI,
    EntradaMielFilterParams,
    EstadoEntrada
} from '../../../../core/models/index';

// Servicios
import { EntradaMielService } from '../../../../core/services/entrada-miel.service';

@Component({
    selector: 'app-entradas-miel-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IconComponent
    ],
    templateUrl: './entradas-miel-list.component.html',
    styleUrl: './entradas-miel-list.component.css'
})
export class EntradasMielListComponent implements OnInit {
    private entradaMielService = inject(EntradaMielService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Lista de entradas */
    entradas = signal<EntradaMielAPI[]>([]);

    /** Estado de carga */
    loading = signal(false);

    /** Paginación */
    currentPage = signal(1);
    pageSize = signal(10);
    totalItems = signal(0);
    totalPages = signal(0);

    /** Filtros */
    searchTerm = signal('');
    filterEstado = signal<EstadoEntrada | ''>('');
    filterFechaInicio = signal('');
    filterFechaFin = signal('');

    /**
    * Math para template
    */
    Math = Math;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Enum para template */
    readonly EstadoEntrada = EstadoEntrada;

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadEntradas();
    }

    // ============================================================================
    // METHODS - DATA LOADING
    // ============================================================================

    /**
     * Cargar entradas con filtros y paginación
     */
    loadEntradas(): void {
        this.loading.set(true);

        const params: EntradaMielFilterParams = {
            page: this.currentPage(),
            limit: this.pageSize()
        };

        // Aplicar filtros
        if (this.filterEstado()) {
            params.estado = this.filterEstado() as EstadoEntrada;
        }

        if (this.filterFechaInicio()) {
            params.fechaInicio = this.filterFechaInicio();
        }

        if (this.filterFechaFin()) {
            params.fechaFin = this.filterFechaFin();
        }

        // Ordenar por fecha descendente (más recientes primero)
        params.sortBy = 'fecha';
        params.sortOrder = 'desc';

        this.entradaMielService.getEntradas(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.entradas.set(response.data);
                    this.totalItems.set(response.pagination.total);
                    this.totalPages.set(response.pagination.totalPages);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    alert('Error al cargar entradas de miel');
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
        this.loadEntradas();
    }

    /**
     * Limpiar filtros
     */
    clearFilters(): void {
        this.filterEstado.set('');
        this.filterFechaInicio.set('');
        this.filterFechaFin.set('');
        this.currentPage.set(1);
        this.loadEntradas();
    }

    /**
     * Cambiar página
     */
    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages()) return;
        this.currentPage.set(page);
        this.loadEntradas();
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
     * Navegar a crear nueva entrada
     */
    crearNuevaEntrada(): void {
        this.router.navigate(['/acopiador/entradas-miel/nueva']);
    }

    /**
     * Ver detalle de una entrada
     */
    verDetalle(id: string): void {
        // TODO: Implementar modal o página de detalle
        console.log('Ver detalle:', id);
    }

    /**
     * Cancelar una entrada
     */
    cancelarEntrada(entrada: EntradaMielAPI): void {
        if (entrada.estado === EstadoEntrada.CANCELADO) {
            alert('Esta entrada ya está cancelada');
            return;
        }

        const motivo = prompt('Ingrese el motivo de cancelación (mínimo 10 caracteres):');

        if (!motivo || motivo.length < 10) {
            alert('Debe ingresar un motivo válido de al menos 10 caracteres');
            return;
        }

        if (!confirm(`¿Está seguro de cancelar la entrada ${entrada.folio}?`)) {
            return;
        }

        this.entradaMielService.cancelarEntrada(entrada.id, motivo)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    alert('Entrada cancelada exitosamente');
                    this.loadEntradas();
                },
                error: () => {
                    alert('Error al cancelar la entrada');
                }
            });
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Clase CSS para badge de estado
     */
    getEstadoBadgeClass(estado: EstadoEntrada): string {
        return estado === EstadoEntrada.ACTIVO
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    }

    /**
     * Formatear moneda
     */
    formatCurrency(value: number): string {
        return `$${value.toFixed(2)}`;
    }
}