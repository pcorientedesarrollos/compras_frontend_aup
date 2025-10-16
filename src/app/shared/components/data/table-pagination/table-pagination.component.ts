/**
 * ============================================================================
 * 📄 TABLE PAGINATION COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Componente de paginación reutilizable
 * 
 * FEATURES:
 * - Navegación por páginas (primera, anterior, siguiente, última)
 * - Selector de tamaño de página
 * - Información de registros mostrados
 * - Botones con estados disabled
 * - Responsive
 * 
 * USO:
 * <app-table-pagination
 *   [currentPage]="currentPage()"
 *   [pageSize]="pageSize()"
 *   [totalItems]="totalItems()"
 *   [pageSizeOptions]="[5, 10, 25, 50]"
 *   (pageChange)="onPageChange($event)"
 *   (pageSizeChange)="onPageSizeChange($event)">
 * </app-table-pagination>
 * 
 * ============================================================================
 */

import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../ui/icon/icon.component';

/**
 * Evento de cambio de página
 */
export interface PageChangeEvent {
    page: number;
    pageSize: number;
}

@Component({
    selector: 'app-table-pagination',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IconComponent
    ],
    templateUrl: './table-pagination.component.html',
    styleUrl: './table-pagination.component.css'
})
export class TablePaginationComponent {

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Página actual (1-indexed) */
    currentPage = input.required<number>();

    /** Tamaño de página (registros por página) */
    pageSize = input.required<number>();

    /** Total de registros */
    totalItems = input.required<number>();

    /** Opciones de tamaño de página */
    pageSizeOptions = input<number[]>([5, 10, 25, 50, 100]);

    /** Mostrar selector de tamaño */
    showPageSize = input<boolean>(true);

    /** Mostrar información de registros */
    showInfo = input<boolean>(true);

    /** Máximo de botones de página a mostrar */
    maxPageButtons = input<number>(5);

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    /** Evento cuando cambia la página */
    pageChange = output<PageChangeEvent>();

    /** Evento cuando cambia el tamaño de página */
    pageSizeChange = output<number>();

    // ============================================================================
    // COMPUTED PROPERTIES
    // ============================================================================

    /** Total de páginas */
    totalPages = computed(() =>
        Math.ceil(this.totalItems() / this.pageSize())
    );

    /** Página es la primera */
    isFirstPage = computed(() => this.currentPage() <= 1);

    /** Página es la última */
    isLastPage = computed(() => this.currentPage() >= this.totalPages());

    /** Índice del primer registro mostrado */
    startIndex = computed(() =>
        (this.currentPage() - 1) * this.pageSize() + 1
    );

    /** Índice del último registro mostrado */
    endIndex = computed(() =>
        Math.min(this.currentPage() * this.pageSize(), this.totalItems())
    );

    /** Array de números de página a mostrar */
    pageNumbers = computed(() => {
        const total = this.totalPages();
        const current = this.currentPage();
        const max = this.maxPageButtons();

        if (total <= max) {
            // Mostrar todas las páginas
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        // Calcular rango de páginas a mostrar
        const half = Math.floor(max / 2);
        let start = Math.max(1, current - half);
        let end = Math.min(total, start + max - 1);

        // Ajustar si estamos cerca del final
        if (end - start < max - 1) {
            start = Math.max(1, end - max + 1);
        }

        const pages: (number | string)[] = [];

        // Siempre mostrar primera página
        if (start > 1) {
            pages.push(1);
            if (start > 2) {
                pages.push('...');
            }
        }

        // Páginas del rango
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Siempre mostrar última página
        if (end < total) {
            if (end < total - 1) {
                pages.push('...');
            }
            pages.push(total);
        }

        return pages;
    });

    /** Texto de información de registros */
    infoText = computed(() => {
        const total = this.totalItems();

        if (total === 0) {
            return 'No hay registros';
        }

        if (total === 1) {
            return '1 registro';
        }

        const start = this.startIndex();
        const end = this.endIndex();

        return `${start}-${end} de ${total} registros`;
    });

    // ============================================================================
    // METHODS - NAVIGATION
    // ============================================================================

    goToFirstPage(): void {
        if (!this.isFirstPage()) {
            this.goToPage(1);
        }
    }

    goToPreviousPage(): void {
        if (!this.isFirstPage()) {
            this.goToPage(this.currentPage() - 1);
        }
    }

    goToNextPage(): void {
        if (!this.isLastPage()) {
            this.goToPage(this.currentPage() + 1);
        }
    }

    goToLastPage(): void {
        if (!this.isLastPage()) {
            this.goToPage(this.totalPages());
        }
    }

    goToPage(page: number | string): void {
        if (typeof page === 'string') return; // Ignorar '...'

        if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
            this.pageChange.emit({
                page,
                pageSize: this.pageSize()
            });
        }
    }

    onPageSizeChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const newSize = parseInt(select.value, 10);

        this.pageSizeChange.emit(newSize);

        // Emitir también pageChange para recargar con el nuevo tamaño
        this.pageChange.emit({
            page: 1, // Volver a la primera página
            pageSize: newSize
        });
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    isPageNumber(page: number | string): page is number {
        return typeof page === 'number';
    }
}