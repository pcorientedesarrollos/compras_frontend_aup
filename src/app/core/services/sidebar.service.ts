import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    // Estado del sidebar (abierto/cerrado) - Solo para mobile
    private isOpenSignal = signal<boolean>(false);

    // Estado del sidebar (colapsado/expandido) - Para desktop
    private isCollapsedSignal = signal<boolean>(this.loadCollapsedState());

    // Computed para leer el estado
    public isOpen = computed(() => this.isOpenSignal());
    public isCollapsed = computed(() => this.isCollapsedSignal());

    /**
     * Alternar estado del sidebar
     */
    toggle(): void {
        this.isOpenSignal.update(value => !value);
    }

    /**
     * Abrir sidebar
     */
    open(): void {
        this.isOpenSignal.set(true);
    }

    /**
     * Cerrar sidebar
     */
    close(): void {
        this.isOpenSignal.set(false);
    }

    /**
     * Cerrar sidebar en desktop automáticamente
     * (útil para responsive)
     */
    closeOnDesktop(): void {
        if (window.innerWidth >= 1024) {
            this.close();
        }
    }

    /**
     * Inicializar estado según tamaño de pantalla
     */
    initializeState(): void {
        // En desktop, el sidebar está siempre visible (no overlay)
        // En mobile/tablet, está cerrado por defecto
        const isDesktop = window.innerWidth >= 1024;
        this.isOpenSignal.set(isDesktop);
    }

    // ============================================================================
    // 🔄 FUNCIONES DE COLAPSAR (DESKTOP)
    // ============================================================================

    /**
     * Alternar estado colapsado del sidebar
     */
    toggleCollapse(): void {
        this.isCollapsedSignal.update(value => {
            const newValue = !value;
            this.saveCollapsedState(newValue);
            return newValue;
        });
    }

    /**
     * Colapsar sidebar (solo iconos)
     */
    collapse(): void {
        this.isCollapsedSignal.set(true);
        this.saveCollapsedState(true);
    }

    /**
     * Expandir sidebar (iconos + texto)
     */
    expand(): void {
        this.isCollapsedSignal.set(false);
        this.saveCollapsedState(false);
    }

    /**
     * Cargar estado colapsado desde localStorage
     */
    private loadCollapsedState(): boolean {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    }

    /**
     * Guardar estado colapsado en localStorage
     */
    private saveCollapsedState(collapsed: boolean): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem('sidebar-collapsed', collapsed.toString());
    }
}