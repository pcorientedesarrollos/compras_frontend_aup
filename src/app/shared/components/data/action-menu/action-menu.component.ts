/**
 * ============================================================================
 * ⚡ ACTION MENU COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Menú desplegable de acciones para filas de tabla
 * 
 * FEATURES:
 * - Secciones con headers
 * - Iconos + labels
 * - Estados disabled/visible
 * - Click outside to close
 * - Confirmación para acciones peligrosas
 * - Posicionamiento automático
 * 
 * USO:
 * <app-action-menu
 *   [config]="menuConfig()"
 *   [row]="rowData"
 *   [isOpen]="isMenuOpen()"
 *   (actionClick)="handleAction($event)"
 *   (closed)="onMenuClosed()">
 * </app-action-menu>
 * 
 * ============================================================================
 */

import { Component, computed, input, output, signal, effect, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../ui/icon/icon.component';
import { ActionMenuConfig, ActionItem, ActionSection } from '../honey-table/types/action.types';

@Component({
    selector: 'app-action-menu',
    standalone: true,
    imports: [
        CommonModule,
        IconComponent
    ],
    templateUrl: './action-menu.component.html',
    styleUrl: './action-menu.component.css'
})
export class ActionMenuComponent {
    private elementRef = inject(ElementRef);

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Configuración del menú */
    config = input.required<ActionMenuConfig>();

    /** Datos de la fila (para evaluar disabled/visible) */
    row = input<any>(null);

    /** Si el menú está abierto */
    isOpen = input.required<boolean>();

    /** Posición del menú (auto-detecta si no se especifica) */
    position = input<'left' | 'right'>('right');

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    /** Evento cuando se hace click en una acción */
    actionClick = output<string>();

    /** Evento cuando se cierra el menú */
    closed = output<void>();

    // ============================================================================
    // STATE
    // ============================================================================

    /** Acción esperando confirmación */
    pendingAction = signal<ActionItem | null>(null);

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Secciones procesadas con items visibles */
    sections = computed(() => {
        const cfg = this.config();
        const rowData = this.row();

        if (!cfg) return [];

        // Si hay secciones definidas
        if (cfg.sections && cfg.sections.length > 0) {
            return cfg.sections
                .map(section => ({
                    ...section,
                    items: section.items.filter(item => this.isItemVisible(item, rowData))
                }))
                .filter(section => section.items.length > 0);
        }

        // Si solo hay items sin secciones
        if (cfg.items && cfg.items.length > 0) {
            return [{
                label: '',
                items: cfg.items.filter(item => this.isItemVisible(item, rowData))
            }];
        }

        return [];
    });

    /** Si hay alguna sección/item para mostrar */
    hasContent = computed(() =>
        this.sections().some(section => section.items.length > 0)
    );

    // ============================================================================
    // EFFECTS
    // ============================================================================

    constructor() {
        // Efecto para manejar el cierre del menú
        effect(() => {
            if (!this.isOpen()) {
                this.pendingAction.set(null);
            }
        });
    }

    // ============================================================================
    // HOST LISTENERS
    // ============================================================================

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.isOpen()) return;

        const clickedInside = this.elementRef.nativeElement.contains(event.target);
        if (!clickedInside) {
            this.closeMenu();
        }
    }

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        if (this.isOpen()) {
            this.closeMenu();
        }
    }

    // ============================================================================
    // METHODS - ACTIONS
    // ============================================================================

    onItemClick(item: ActionItem, event: Event): void {
        event.stopPropagation();

        // Verificar si está disabled
        if (this.isItemDisabled(item, this.row())) {
            return;
        }

        // Si requiere confirmación
        if (item.confirm) {
            this.pendingAction.set(item);
            return;
        }

        // Ejecutar acción directamente
        this.executeAction(item);
    }

    executeAction(item: ActionItem): void {
        this.actionClick.emit(item.key);
        this.closeMenu();
    }

    confirmAction(): void {
        const action = this.pendingAction();
        if (action) {
            this.executeAction(action);
        }
    }

    cancelAction(): void {
        this.pendingAction.set(null);
    }

    closeMenu(): void {
        this.closed.emit();
    }

    // ============================================================================
    // METHODS - HELPERS
    // ============================================================================

    isItemVisible(item: ActionItem, row: any): boolean {
        if (item.visible === undefined) return true;

        if (typeof item.visible === 'boolean') {
            return item.visible;
        }

        return item.visible(row);
    }

    isItemDisabled(item: ActionItem, row: any): boolean {
        if (item.disabled === undefined) return false;

        if (typeof item.disabled === 'boolean') {
            return item.disabled;
        }

        return item.disabled(row);
    }

    getItemClasses(item: ActionItem): string {
        const classes = ['menu-item'];

        if (this.isItemDisabled(item, this.row())) {
            classes.push('disabled');
        }

        if (item.variant) {
            classes.push(`variant-${item.variant}`);
        }

        return classes.join(' ');
    }

    trackByKey(index: number, item: ActionItem): string {
        return item.key;
    }

    trackBySectionLabel(index: number, section: ActionSection): string {
        return section.label + index;
    }
}