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

    /** Dirección del dropdown (up/down) - se calcula automáticamente */
    dropdownDirection = signal<'up' | 'down'>('down');

    /** ✅ Posición fija calculada del menú */
    menuPosition = signal<{ top?: string; bottom?: string; left?: string; right?: string } | null>(null);

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

        // ✅ Efecto para calcular dirección del dropdown cuando se abre
        effect(() => {
            if (this.isOpen()) {
                // Esperar un tick para que el DOM se actualice
                setTimeout(() => {
                    this.calculateDropdownDirection();
                }, 0);
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

    @HostListener('window:scroll', ['$event'])
    @HostListener('window:resize', ['$event'])
    onScrollOrResize(): void {
        if (this.isOpen()) {
            // Recalcular posición cuando hay scroll o resize
            this.calculateDropdownDirection();
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

    /**
     * ✅ Calcular automáticamente si el menú debe abrirse hacia arriba o abajo
     * y su posición fija basado en el espacio disponible en la ventana
     */
    private calculateDropdownDirection(): void {
        // Buscar el botón trigger (padre del componente)
        const triggerButton = this.elementRef.nativeElement.closest('.action-menu-trigger')?.querySelector('button');
        if (!triggerButton) return;

        const buttonRect = triggerButton.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - buttonRect.bottom;
        const menuHeight = 200; // Altura estimada del menú

        const position = this.position();

        // Calcular posición horizontal
        let horizontalPos: { left?: string; right?: string } = {};
        if (position === 'left') {
            horizontalPos = { left: `${buttonRect.left}px` };
        } else {
            horizontalPos = { right: `${window.innerWidth - buttonRect.right}px` };
        }

        // Si hay suficiente espacio abajo, abrir hacia abajo
        if (spaceBelow >= menuHeight + 20) {
            this.dropdownDirection.set('down');
            this.menuPosition.set({
                top: `${buttonRect.bottom + 8}px`, // 8px de separación
                ...horizontalPos
            });
        } else {
            // Abrir hacia arriba
            this.dropdownDirection.set('up');
            this.menuPosition.set({
                bottom: `${window.innerHeight - buttonRect.top + 8}px`, // 8px de separación
                ...horizontalPos
            });
        }
    }
}