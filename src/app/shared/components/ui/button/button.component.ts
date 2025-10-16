/**
 * ============================================================================
 * 🔘 BUTTON COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Componente reutilizable de botón con múltiples variantes y estados
 * 
 * USO:
 * <app-button variant="primary" size="md" [loading]="isLoading()" (clicked)="handleClick()">
 *   Guardar
 * </app-button>
 * 
 * ============================================================================
 */

import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/types/icon.types';
import { ButtonVariant, ButtonSize, ButtonType } from './types/button.types';

@Component({
    selector: 'app-button',
    standalone: true,
    imports: [CommonModule, IconComponent],
    templateUrl: './button.component.html',
    styleUrl: './button.component.css'
})
export class ButtonComponent {

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Variante visual del botón */
    variant = input<ButtonVariant>('primary');

    /** Tamaño del botón */
    size = input<ButtonSize>('md');

    /** Tipo de botón HTML */
    type = input<ButtonType>('button');

    /** Estado deshabilitado */
    disabled = input<boolean>(false);

    /** Estado de carga (muestra spinner) */
    loading = input<boolean>(false);

    /** Ocupa todo el ancho disponible */
    fullWidth = input<boolean>(false);

    /** Icono a la izquierda del texto */
    iconLeft = input<IconName | undefined>(undefined);

    /** Icono a la derecha del texto */
    iconRight = input<IconName | undefined>(undefined);

    /** Clases CSS adicionales */
    customClass = input<string>('');

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    /** Evento de click */
    clicked = output<void>();

    // ============================================================================
    // COMPUTED PROPERTIES
    // ============================================================================

    /** Botón está deshabilitado (disabled o loading) */
    isDisabled = computed(() => this.disabled() || this.loading());

    /** Clases CSS dinámicas del botón */
    buttonClasses = computed(() => {
        const classes: string[] = [
            'button-base',
            `button-${this.variant()}`,
            `button-${this.size()}`,
        ];

        if (this.fullWidth()) {
            classes.push('w-full');
        }

        if (this.isDisabled()) {
            classes.push('button-disabled');
        }

        if (this.customClass()) {
            classes.push(this.customClass());
        }

        return classes.join(' ');
    });

    /** Tamaño del icono según el tamaño del botón */
    iconSize = computed<'sm' | 'md' | 'lg'>(() => {
        switch (this.size()) {
            case 'sm':
                return 'sm';
            case 'lg':
                return 'lg';
            default:
                return 'md';
        }
    });

    // ============================================================================
    // METHODS
    // ============================================================================

    /**
     * Manejar click del botón
     */
    handleClick(): void {
        if (!this.isDisabled()) {
            this.clicked.emit();
        }
    }
}