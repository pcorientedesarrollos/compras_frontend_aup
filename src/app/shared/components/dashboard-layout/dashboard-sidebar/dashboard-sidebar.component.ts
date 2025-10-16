import { Component, inject, computed, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

interface MenuItem {
    icon: string;
    label: string;
    route: string;
    badge?: string;
    badgeClass?: string;
}

@Component({
    selector: 'app-dashboard-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive
    ],
    templateUrl: './dashboard-sidebar.component.html',
    styleUrl: './dashboard-sidebar.component.css'
})
export class DashboardSidebarComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    // Input para recibir estado del sidebar
    isOpen = input<boolean>(false);

    // Output para cerrar sidebar en mobile
    closeSidebarEvent = output<void>();

    // Usuario actual
    currentUser = computed(() => this.authService.getCurrentUser());

    // Menú dinámico según rol
    menuItems = computed<MenuItem[]>(() => {
        const role = this.currentUser()?.role;

        if (role === 'ADMINISTRADOR') {
            return [
                { icon: '📊', label: 'Dashboard', route: '/dashboard/admin' },
                { icon: '👥', label: 'Usuarios', route: '/admin/usuarios' },
                { icon: '🐝', label: 'Apicultores', route: '/admin/apicultores' },
                { icon: '🏢', label: 'Proveedores', route: '/admin/proveedores' },
                { icon: '🏞️', label: 'Apiarios', route: '/admin/apiarios' },
                { icon: '📋', label: 'Reportes', route: '/admin/reportes' },
                { icon: '⚙️', label: 'Configuración', route: '/admin/configuracion' }
            ];
        }

        if (role === 'ACOPIADOR') {
            return [
                { icon: '📊', label: 'Dashboard', route: '/dashboard/acopiador' },
                { icon: '🐝', label: 'Mis Apicultores', route: '/acopiador/apicultores' },
                { icon: '🔗', label: 'Vincular Apicultor', route: '/acopiador/vincular' },
                { icon: '🏞️', label: 'Ver Apiarios', route: '/acopiador/apiarios' },
                { icon: '📦', label: 'Compras de Miel', route: '/acopiador/compras' }
            ];
        }

        if (role === 'APICULTOR') {
            return [
                { icon: '📊', label: 'Dashboard', route: '/dashboard/apicultor' },
                { icon: '🏞️', label: 'Mis Apiarios', route: '/apicultor/apiarios' },
                { icon: '➕', label: 'Nuevo Apiario', route: '/apicultor/apiarios/nuevo' },
                { icon: '🏢', label: 'Mis Proveedores', route: '/apicultor/proveedores' },
                { icon: '👤', label: 'Mi Perfil', route: '/apicultor/perfil' }
            ];
        }

        return [];
    });

    /**
     * Manejar click en item del menú
     * Cierra sidebar en mobile después de navegar
     */
    onMenuItemClick(route: string): void {
        this.router.navigate([route]);
        this.closeSidebarEvent.emit();
    }

    /**
     * Verificar si la ruta está activa
     */
    isRouteActive(route: string): boolean {
        return this.router.url === route;
    }
}