/**
 * ============================================================================
 * 🏷️ BADGE COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Componente reutilizable de badge/etiqueta para estados y categorías
 * 
 * USO:
 * <app-badge variant="success" size="md" [dot]="true">
 *   ACTIVO
 * </app-badge>
 * 
 * ============================================================================
 */

import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/types/icon.types';
import { BadgeVariant, BadgeSize } from './types/badge.types';

@Component({
    selector: 'app-badge',
    standalone: true,
    imports: [CommonModule, IconComponent],
    templateUrl: './badge.component.html',
    styleUrl: './badge.component.css'
})
export class BadgeComponent {

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Variante visual del badge */
    variant = input<BadgeVariant>('default');

    /** Tamaño del badge */
    size = input<BadgeSize>('md');

    /** Mostrar punto indicator a la izquierda */
    dot = input<boolean>(false);

    /** Icono a la izquierda del texto */
    icon = input<IconName | undefined>(undefined);

    /** Badge puede ser removido (muestra X) */
    removable = input<boolean>(false);

    /** Clases CSS adicionales */
    customClass = input<string>('');

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    /** Evento cuando se remueve el badge */
    removed = output<void>();

    // ============================================================================
    // COMPUTED PROPERTIES
    // ============================================================================

    /** Clases CSS dinámicas del badge */
    badgeClasses = computed(() => {
        const classes: string[] = [
            'badge-base',
            `badge-${this.variant()}`,
            `badge-${this.size()}`,
        ];

        if (this.customClass()) {
            classes.push(this.customClass());
        }

        return classes.join(' ');
    });

    /** Tamaño del icono según el tamaño del badge */
    iconSize = computed<'sm' | 'md' | 'lg'>(() => {
        switch (this.size()) {
            case 'sm':
                return 'sm';
            case 'lg':
                return 'md';
            default:
                return 'sm';
        }
    });

    // ============================================================================
    // METHODS
    // ============================================================================

    /**
     * Manejar click en botón de remover
     */
    handleRemove(event: Event): void {
        event.stopPropagation();
        this.removed.emit();
    }
}