/**
 * ============================================================================
 * 🔔 NOTIFICATION SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio para mostrar notificaciones toast (success, error, info, warning)
 * Alternativa profesional a alert()
 *
 * ============================================================================
 */

import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notifications = signal<Notification[]>([]);
    private idCounter = 0;

    /**
     * Obtener notificaciones activas
     */
    getNotifications = this.notifications.asReadonly();

    /**
     * Mostrar notificación de éxito
     */
    success(title: string, message?: string, duration = 3000): void {
        this.show('success', title, message, duration);
    }

    /**
     * Mostrar notificación de error
     */
    error(title: string, message?: string, duration = 5000): void {
        this.show('error', title, message, duration);
    }

    /**
     * Mostrar notificación informativa
     */
    info(title: string, message?: string, duration = 3000): void {
        this.show('info', title, message, duration);
    }

    /**
     * Mostrar notificación de advertencia
     */
    warning(title: string, message?: string, duration = 4000): void {
        this.show('warning', title, message, duration);
    }

    /**
     * Mostrar notificación genérica
     */
    private show(type: NotificationType, title: string, message?: string, duration = 3000): void {
        const notification: Notification = {
            id: `notification-${++this.idCounter}`,
            type,
            title,
            message,
            duration
        };

        this.notifications.update(notifications => [...notifications, notification]);

        // Auto-remover después de la duración especificada
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, duration);
        }
    }

    /**
     * Remover notificación por ID
     */
    remove(id: string): void {
        this.notifications.update(notifications =>
            notifications.filter(n => n.id !== id)
        );
    }

    /**
     * Limpiar todas las notificaciones
     */
    clear(): void {
        this.notifications.set([]);
    }

    /**
     * Aliases para compatibilidad
     */
    showSuccess(title: string, message?: string, duration = 3000): void {
        this.success(title, message, duration);
    }

    showError(title: string, message?: string, duration = 5000): void {
        this.error(title, message, duration);
    }

    showInfo(title: string, message?: string, duration = 3000): void {
        this.info(title, message, duration);
    }

    showWarning(title: string, message?: string, duration = 4000): void {
        this.warning(title, message, duration);
    }
}
