/**
 * ============================================================================
 * 🍞 TOAST NOTIFICATION COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente para mostrar notificaciones toast
 * Se incluye en el layout principal (app.component)
 *
 * ============================================================================
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/types/icon.types';
import { NotificationService, NotificationType } from '../../../../core/services/notification.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule, IconComponent],
    templateUrl: './toast.component.html',
    styleUrl: './toast.component.css'
})
export class ToastComponent {
    private notificationService = inject(NotificationService);

    notifications = this.notificationService.getNotifications;

    /**
     * Cerrar notificación
     */
    close(id: string): void {
        this.notificationService.remove(id);
    }

    /**
     * Obtener icono según tipo
     */
    getIcon(type: NotificationType): IconName {
        const icons: Record<NotificationType, IconName> = {
            success: 'check-circle',
            error: 'x-circle',
            info: 'information-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type];
    }

    /**
     * Obtener clases CSS según tipo
     */
    getClasses(type: NotificationType): string {
        const classes: Record<NotificationType, string> = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        };
        return classes[type];
    }

    /**
     * Obtener clases del icono según tipo
     */
    getIconClasses(type: NotificationType): string {
        const classes: Record<NotificationType, string> = {
            success: 'text-green-600',
            error: 'text-red-600',
            info: 'text-blue-600',
            warning: 'text-yellow-600'
        };
        return classes[type];
    }
}
