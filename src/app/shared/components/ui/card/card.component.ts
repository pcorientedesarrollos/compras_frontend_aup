/**
 * ============================================================================
 * 🎴 CARD COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Componente contenedor reutilizable con secciones opcionales
 * 
 * USO:
 * <app-card [hoverable]="true">
 *   <div card-header>Título</div>
 *   <div card-body>Contenido</div>
 *   <div card-footer>Acciones</div>
 * </app-card>
 * 
 * ============================================================================
 */

import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './card.component.html',
    styleUrl: './card.component.css'
})
export class CardComponent {

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Efecto hover (eleva la card) */
    hoverable = input<boolean>(false);

    /** Padding del body (none | sm | md | lg) */
    padding = input<'none' | 'sm' | 'md' | 'lg'>('md');

    /** Eliminar sombra */
    noShadow = input<boolean>(false);

    /** Borde de color (opcional) */
    borderColor = input<string>('');

    /** Clases CSS adicionales */
    customClass = input<string>('');

    // ============================================================================
    // COMPUTED PROPERTIES
    // ============================================================================

    /** Clases CSS dinámicas de la card */
    cardClasses = computed(() => {
        const classes: string[] = ['card-base'];

        if (this.hoverable()) {
            classes.push('card-hoverable');
        }

        if (this.noShadow()) {
            classes.push('card-no-shadow');
        }

        if (this.borderColor()) {
            classes.push('card-border');
        }

        if (this.customClass()) {
            classes.push(this.customClass());
        }

        return classes.join(' ');
    });

    /** Clases CSS del body según padding */
    bodyClasses = computed(() => {
        const paddingMap = {
            'none': 'p-0',
            'sm': 'p-3',
            'md': 'p-6',
            'lg': 'p-8'
        };

        return `card-body ${paddingMap[this.padding()]}`;
    });

    /** Estilo del borde de color */
    borderStyle = computed(() => {
        if (this.borderColor()) {
            return { 'border-left': `4px solid ${this.borderColor()}` };
        }
        return {};
    });
}