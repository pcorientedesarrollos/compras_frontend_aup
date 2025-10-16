import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    // Estado del sidebar (abierto/cerrado)
    private isOpenSignal = signal<boolean>(false);

    // Computed para leer el estado
    public isOpen = computed(() => this.isOpenSignal());

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
}