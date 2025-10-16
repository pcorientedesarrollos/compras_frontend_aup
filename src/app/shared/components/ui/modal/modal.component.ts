/**
 * ============================================================================
 * 🪟 MODAL COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Componente modal reutilizable con overlay y gestión de eventos
 * 
 * USO:
 * <app-modal [isOpen]="showModal()" (closed)="onCloseModal()">
 *   <div modal-header>Título del Modal</div>
 *   <div modal-body>Contenido</div>
 *   <div modal-footer>Botones de acción</div>
 * </app-modal>
 * 
 * ============================================================================
 */

import { Component, computed, input, output, effect, HostListener, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ModalSize } from './types/modal.types';

@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [CommonModule, IconComponent],
    templateUrl: './modal.component.html',
    styleUrl: './modal.component.css'
})
export class ModalComponent {
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Controla si el modal está abierto */
    isOpen = input<boolean>(false);

    /** Tamaño del modal */
    size = input<ModalSize>('md');

    /** Título del modal (alternativa a usar modal-header) */
    title = input<string>('');

    /** Mostrar botón X de cerrar en header */
    showCloseButton = input<boolean>(true);

    /** Cerrar al hacer click en el backdrop */
    closeOnBackdrop = input<boolean>(true);

    /** Cerrar al presionar ESC */
    closeOnEscape = input<boolean>(true);

    /** Mostrar footer por defecto */
    showFooter = input<boolean>(true);

    /** Clases CSS adicionales */
    customClass = input<string>('');

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    /** Evento cuando se cierra el modal */
    closed = output<void>();

    /** Evento cuando se abre el modal */
    opened = output<void>();

    // ============================================================================
    // COMPUTED PROPERTIES
    // ============================================================================

    /** Clases CSS del modal según tamaño */
    modalClasses = computed(() => {
        const sizeMap = {
            'sm': 'max-w-md',
            'md': 'max-w-lg',
            'lg': 'max-w-2xl',
            'xl': 'max-w-4xl',
            'full': 'max-w-full mx-4'
        };

        const classes = ['modal-content', sizeMap[this.size()]];

        if (this.customClass()) {
            classes.push(this.customClass());
        }

        return classes.join(' ');
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    constructor() {
        // Efecto para gestionar body scroll cuando se abre/cierra
        effect(() => {
            if (this.isOpen()) {
                document.body.style.overflow = 'hidden';
                this.opened.emit();
            } else {
                document.body.style.overflow = '';
            }
        });

        // Limpiar al destruir
        this.destroyRef.onDestroy(() => {
            document.body.style.overflow = '';
        });
    }

    // ============================================================================
    // HOST LISTENERS
    // ============================================================================

    /**
     * Listener para tecla ESC
     */
    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: KeyboardEvent): void {
        if (this.isOpen() && this.closeOnEscape()) {
            event.preventDefault();
            this.close();
        }
    }

    // ============================================================================
    // METHODS
    // ============================================================================

    /**
     * Cerrar el modal
     */
    close(): void {
        this.closed.emit();
    }

    /**
     * Manejar click en el backdrop
     */
    onBackdropClick(event: MouseEvent): void {
        if (this.closeOnBackdrop() && event.target === event.currentTarget) {
            this.close();
        }
    }

    /**
     * Prevenir propagación de eventos desde el contenido del modal
     */
    onModalContentClick(event: MouseEvent): void {
        event.stopPropagation();
    }
}