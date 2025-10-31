/**
 * ============================================================================
 * 🏠 APIARIO DETAIL MODAL - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Modal para ver detalles completos de un apiario
 *
 * CARACTERÍSTICAS:
 * - Vista de solo lectura
 * - Información del apicultor asociado
 * - Datos de ubicación GPS con enlace a Google Maps
 * - Información de colmenas y producción
 *
 * ============================================================================
 */

import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { ApiarioDetailAPI } from '../../../../core/models/index';

@Component({
    selector: 'app-apiario-detail-modal',
    standalone: true,
    imports: [
        CommonModule,
        IconComponent
    ],
    templateUrl: './apiario-detail-modal.component.html',
    styleUrl: './apiario-detail-modal.component.css'
})
export class ApiarioDetailModalComponent {
    // ============================================================================
    // INPUTS & OUTPUTS
    // ============================================================================

    @Input() apiario: ApiarioDetailAPI | null = null;
    @Input() isOpen: boolean = false;
    @Output() close = new EventEmitter<void>();

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** URL de Google Maps */
    googleMapsUrl = computed(() => {
        if (!this.apiario || !this.apiario.latitud || !this.apiario.longitud) {
            return null;
        }
        return `https://www.google.com/maps?q=${this.apiario.latitud},${this.apiario.longitud}`;
    });

    /** Tiene coordenadas GPS válidas */
    hasValidCoordinates = computed(() => {
        return this.apiario &&
               this.apiario.latitud != null &&
               this.apiario.longitud != null &&
               this.apiario.latitud !== 0 &&
               this.apiario.longitud !== 0;
    });

    /** Nombre completo del apicultor */
    apicultorNombreCompleto = computed(() => {
        if (!this.apiario?.apicultor) return 'N/A';
        return `${this.apiario.apicultorCodigo} - ${this.apiario.apicultorNombre}`;
    });

    // ============================================================================
    // METHODS
    // ============================================================================

    /**
     * Cerrar modal
     */
    onClose(): void {
        this.close.emit();
    }

    /**
     * Prevenir cierre al hacer clic dentro del modal
     */
    onModalContentClick(event: MouseEvent): void {
        event.stopPropagation();
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString: string | null): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Formatear número con decimales
     */
    formatNumber(value: number | null | undefined, decimals: number = 2): string {
        if (value == null) return 'N/A';
        return value.toLocaleString('es-MX', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
}
