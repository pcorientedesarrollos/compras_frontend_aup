/**
 * ============================================================================
 * 🚨 ALERT COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Componente reutilizable de alerta para notificaciones y mensajes
 * 
 * USO:
 * <app-alert type="success" [dismissible]="true" (closed)="onClose()">
 *   Operación completada exitosamente
 * </app-alert>
 * 
 * ============================================================================
 */

import { Component, computed, input, output, signal, effect, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/types/icon.types';
import { AlertType } from './types/alert.types';

@Component({
    selector: 'app-alert',
    standalone: true,
    imports: [CommonModule, IconComponent],
    templateUrl: './alert.component.html',
    styleUrl: './alert.component.css'
})
export class AlertComponent {
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Tipo de alerta */
    type = input<AlertType>('info');

    /** Título de la alerta (opcional) */
    title = input<string>('');

    /** Puede ser cerrada manualmente */
    dismissible = input<boolean>(true);

    /** Se cierra automáticamente */
    autoClose = input<boolean>(false);

    /** Duración en ms antes de cerrarse (solo si autoClose=true) */
    duration = input<number>(5000);

    /** Icono personalizado (si no se especifica, usa el default del tipo) */
    icon = input<IconName | undefined>(undefined);

    /** Clases CSS adicionales */
    customClass = input<string>('');

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    /** Evento cuando se cierra la alerta */
    closed = output<void>();

    // ============================================================================
    // STATE
    // ============================================================================

    /** Controla si la alerta está visible */
    isVisible = signal<boolean>(true);

    // ============================================================================
    // COMPUTED PROPERTIES
    // ============================================================================

    /** Clases CSS dinámicas de la alerta */
    alertClasses = computed(() => {
        const classes: string[] = [
            'alert-base',
            `alert-${this.type()}`,
        ];

        if (!this.isVisible()) {
            classes.push('alert-hidden');
        }

        if (this.customClass()) {
            classes.push(this.customClass());
        }

        return classes.join(' ');
    });

    /** Icono por defecto según el tipo de alerta */
    defaultIcon = computed<IconName>(() => {
        if (this.icon()) {
            return this.icon()!;
        }

        switch (this.type()) {
            case 'success':
                return 'check-circle';
            case 'error':
                return 'x-circle';
            case 'warning':
                return 'exclamation-triangle';
            case 'info':
                return 'information-circle';
            default:
                return 'information-circle';
        }
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    constructor() {
        // Efecto para auto-cerrar
        effect(() => {
            if (this.autoClose() && this.isVisible()) {
                const timeout = setTimeout(() => {
                    this.close();
                }, this.duration());

                // Limpiar timeout al destruir
                this.destroyRef.onDestroy(() => clearTimeout(timeout));
            }
        });
    }

    // ============================================================================
    // METHODS
    // ============================================================================

    /**
     * Cerrar la alerta
     */
    close(): void {
        this.isVisible.set(false);

        // Esperar animación antes de emitir evento
        setTimeout(() => {
            this.closed.emit();
        }, 300);
    }
}