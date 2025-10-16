import { Component, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { IconComponent } from '../../ui/icon/icon.component';
import { IconName } from '../../ui/icon/types/icon.types';

@Component({
    selector: 'app-dashboard-navbar',
    standalone: true,
    imports: [
        CommonModule,
        IconComponent
    ],
    templateUrl: './dashboard-navbar.component.html',
    styleUrl: './dashboard-navbar.component.css'
})
export class DashboardNavbarComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    // Output para emitir evento de toggle al padre
    toggleSidebarEvent = output<void>();

    // Usuario actual
    currentUser = computed(() => this.authService.getCurrentUser());

    // Iniciales del usuario para avatar
    userInitials = computed(() => {
        const user = this.currentUser();
        if (!user) return '?';

        const names = user.nombre.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return user.nombre.substring(0, 2).toUpperCase();
    });

    // Color del badge según rol
    roleBadgeClass = computed(() => {
        const role = this.currentUser()?.role;

        switch (role) {
            case 'ADMINISTRADOR':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'ACOPIADOR':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'APICULTOR':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'MIELERA':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    });

    // Icono del rol para badge (opcional, para futuro uso)
    roleIcon = computed<IconName>(() => {
        const role = this.currentUser()?.role;
        switch (role) {
            case 'ADMINISTRADOR':
                return 'crown';
            case 'ACOPIADOR':
                return 'building-office';
            case 'APICULTOR':
                return 'bee';
            case 'MIELERA':
                return 'honey';
            default:
                return 'user-circle';
        }
    });

    // Nombre del rol en español
    roleDisplayName = computed(() => {
        const role = this.currentUser()?.role;

        switch (role) {
            case 'ADMINISTRADOR':
                return 'Administrador';
            case 'ACOPIADOR':
                return 'Acopiador';
            case 'APICULTOR':
                return 'Apicultor';
            case 'MIELERA':
                return 'Mielera';
            default:
                return role;
        }
    });

    /**
     * Emitir evento para toggle del sidebar
     */
    onToggleSidebar(): void {
        this.toggleSidebarEvent.emit();
    }

    /**
     * Cerrar sesión
     */
    onLogout(): void {
            this.authService.logout();
        
    }
}