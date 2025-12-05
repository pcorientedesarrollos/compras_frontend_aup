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

import { Component, signal, computed, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { BeeLoaderComponent } from '../../../../shared/components/bee-loader/bee-loader.component';

// Modelos
import {
    EntradaMielAPI,
    EntradaMielDetailAPI,
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
        IconComponent,
        BeeLoaderComponent
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

    /** Lista completa de entradas (sin filtrar) */
    entradasCompletas = signal<EntradaMielAPI[]>([]);

    /** Lista de entradas filtradas (computed) */
    entradas = computed(() => {
        let filtered = this.entradasCompletas();

        // Filtro por búsqueda (folio o apicultor)
        const search = this.searchTerm().toLowerCase().trim();
        if (search) {
            filtered = filtered.filter(e =>
                e.folio.toLowerCase().includes(search) ||
                e.apicultorNombre.toLowerCase().includes(search)
            );
        }

        // Filtro por estado ('' = Todos)
        const estado = this.filterEstado();
        if (estado !== '') {
            filtered = filtered.filter(e => e.estado === estado);
        }

        // Filtro por estado de uso (TODOS / DISPONIBLES / ASIGNADOS)
        const estadoUso = this.filterEstadoUso();
        if (estadoUso === 'DISPONIBLES') {
            filtered = filtered.filter(e => e.todosDetallesUsados === false);
        } else if (estadoUso === 'ASIGNADOS') {
            filtered = filtered.filter(e => e.todosDetallesUsados === true);
        }
        // Si es 'TODOS', no se aplica filtro

        return filtered;
    });

    /** Estado de carga */
    loading = signal(false);

    /** Paginación */
    currentPage = signal(1);
    pageSize = signal(10);
    totalItems = computed(() => this.entradas().length);
    totalPages = computed(() => Math.ceil(this.entradas().length / this.pageSize()));

    /** Filtros */
    searchTerm = signal('');
    filterEstado = signal<EstadoEntrada | ''>(''); // '' = Todos
    filterEstadoUso = signal<'TODOS' | 'DISPONIBLES' | 'ASIGNADOS'>('TODOS'); // Por defecto TODOS

    /** Detalle seleccionado (para modal) */
    entradaDetalle = signal<EntradaMielDetailAPI | null>(null);
    loadingDetalle = signal(false);

    /** Modal de confirmación para eliminar entrada */
    showDeleteModal = signal(false);
    entradaParaEliminar = signal<EntradaMielDetailAPI | null>(null);
    motivoEliminacion = signal('');

    /** Modal de confirmación para cancelar detalle individual */
    showCancelDetalleModal = signal(false);
    detalleParaCancelar = signal<any | null>(null);
    motivoCancelacionDetalle = signal('');

    /**
    * Math para template
    */
    Math = Math;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Enum para template */
    readonly EstadoEntrada = EstadoEntrada;

    /** Entradas paginadas (para mostrar en tabla) */
    entradasPaginadas = computed(() => {
        const filtered = this.entradas();
        const start = (this.currentPage() - 1) * this.pageSize();
        const end = start + this.pageSize();
        return filtered.slice(start, end);
    });

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
     * Cargar TODAS las entradas (sin paginación backend)
     * El filtrado y paginación se hace en frontend
     */
    loadEntradas(): void {
        this.loading.set(true);

        const params: EntradaMielFilterParams = {
            page: 1,
            limit: 9999, // Traer todas
            sortBy: 'fecha',
            sortOrder: 'desc'
        };

        this.entradaMielService.getEntradas(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.entradasCompletas.set(response.data);
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
     * Aplicar filtros (automático con computed)
     * Solo resetea la página actual
     */
    applyFilters(): void {
        this.currentPage.set(1); // Reset a página 1
    }

    /**
     * Limpiar filtros
     */
    clearFilters(): void {
        this.searchTerm.set('');
        this.filterEstado.set(''); // Default: Todos
        this.filterEstadoUso.set('TODOS'); // Default: TODOS
        this.currentPage.set(1);
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
     * Navegar a editar entrada existente
     */
    editarEntrada(id: string): void {
        this.router.navigate(['/acopiador/entradas-miel/editar', id]);
    }

    /**
     * Ver detalle de una entrada
     */
    verDetalle(id: string): void {
        this.loadingDetalle.set(true);
        this.entradaDetalle.set(null);

        this.entradaMielService.getEntradaById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (detalle) => {
                    this.entradaDetalle.set(detalle);
                    this.loadingDetalle.set(false);
                },
                error: () => {
                    this.loadingDetalle.set(false);
                    alert('Error al cargar el detalle de la entrada');
                }
            });
    }

    /**
     * Cerrar modal de detalle
     */
    cerrarDetalle(): void {
        this.entradaDetalle.set(null);
    }

    /**
     * Abrir modal de confirmación para eliminar entrada
     */
    eliminarEntrada(entrada: EntradaMielDetailAPI): void {
        if (entrada.estado === EstadoEntrada.CANCELADO) {
            return;
        }

        this.entradaParaEliminar.set(entrada);
        this.motivoEliminacion.set('');
        this.showDeleteModal.set(true);
    }

    /**
     * Confirmar eliminación de entrada
     */
    confirmarEliminacion(): void {
        const entrada = this.entradaParaEliminar();
        const motivo = this.motivoEliminacion().trim();

        if (!entrada) return;

        if (motivo.length < 10) {
            return; // Validación en template
        }

        this.loading.set(true);

        this.entradaMielService.cancelarEntrada(entrada.id, motivo)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.showDeleteModal.set(false);
                    this.cerrarDetalle();
                    this.loadEntradas();
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                }
            });
    }

    /**
     * Cancelar eliminación
     */
    cancelarEliminacion(): void {
        this.showDeleteModal.set(false);
        this.entradaParaEliminar.set(null);
        this.motivoEliminacion.set('');
    }

    /**
     * Abrir modal para cancelar detalle individual
     */
    cancelarDetalleIndividual(detalle: any): void {
        this.detalleParaCancelar.set(detalle);
        this.motivoCancelacionDetalle.set('');
        this.showCancelDetalleModal.set(true);
    }

    /**
     * Confirmar cancelación de detalle individual
     */
    confirmarCancelacionDetalle(): void {
        const detalle = this.detalleParaCancelar();
        const motivo = this.motivoCancelacionDetalle().trim();

        if (!detalle) return;

        if (motivo.length < 10) {
            return; // Validación en template
        }

        this.loading.set(true);

        this.entradaMielService.cancelarDetalle(detalle.id, motivo)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.showCancelDetalleModal.set(false);
                    this.detalleParaCancelar.set(null);
                    this.motivoCancelacionDetalle.set('');

                    // Recargar el detalle actualizado
                    if (this.entradaDetalle()) {
                        this.verDetalle(this.entradaDetalle()!.id);
                    }

                    // Recargar lista de entradas
                    this.loadEntradas();
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                }
            });
    }

    /**
     * Cancelar operación de cancelar detalle
     */
    cancelarOperacionDetalle(): void {
        this.showCancelDetalleModal.set(false);
        this.detalleParaCancelar.set(null);
        this.motivoCancelacionDetalle.set('');
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

    /**
     * Calcular total de kilos de una entrada
     */
    getTotalKilos(detalle: EntradaMielDetailAPI): number {
        return detalle.detalles.reduce((sum, d) => sum + d.kilos, 0);
    }

    /**
     * Obtener clase CSS para badge de estado de uso
     */
    getEstadoUsoBadgeClass(entrada: EntradaMielAPI): string {
        if (entrada.todosDetallesUsados) {
            return 'bg-gray-100 text-gray-800';
        } else if (entrada.cantidadDetallesDisponibles > 0) {
            return 'bg-green-100 text-green-800';
        }
        return 'bg-yellow-100 text-yellow-800';
    }

    /**
     * Obtener texto para badge de estado de uso
     */
    getEstadoUsoText(entrada: EntradaMielAPI): string {
        const disponibles = entrada.cantidadDetallesDisponibles;
        const usados = entrada.cantidadDetallesUsados;
        const total = entrada.cantidadDetalles;

        if (entrada.todosDetallesUsados) {
            return `${usados}/${total} usados`;
        } else if (disponibles === total) {
            return `${disponibles}/${total} disponibles`;
        } else {
            return `${disponibles}/${total} disponibles`;
        }
    }

    /**
     * Verificar si se puede editar la entrada
     * Solo se puede editar si tiene al menos un detalle disponible
     */
    puedeEditarEntrada(entrada: EntradaMielAPI): boolean {
        return entrada.estado === EstadoEntrada.ACTIVO && entrada.cantidadDetallesDisponibles > 0;
    }
}