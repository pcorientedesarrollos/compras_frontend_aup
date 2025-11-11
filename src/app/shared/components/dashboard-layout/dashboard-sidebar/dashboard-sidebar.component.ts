import { Component, inject, computed, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SidebarService } from '../../../../core/services/sidebar.service';
import { IconComponent } from '../../ui/icon/icon.component';
import { IconName } from '../../ui/icon/types/icon.types';

interface MenuItem {
    icon: IconName;
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
        RouterLinkActive,
        IconComponent
    ],
    templateUrl: './dashboard-sidebar.component.html',
    styleUrl: './dashboard-sidebar.component.css'
})
export class DashboardSidebarComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
    private sidebarService = inject(SidebarService); // 🔄 Para el toggle collapse

    // Input para recibir estado del sidebar
    isOpen = input<boolean>(false);
    isCollapsed = input<boolean>(false); // 🎯 Nuevo input para estado colapsado

    // Output para cerrar sidebar en mobile
    closeSidebarEvent = output<void>();

    // Usuario actual
    currentUser = computed(() => this.authService.getCurrentUser());

    // Icono del rol actual para el header
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
            case 'VERIFICADOR':
                return 'check-circle';
            default:
                return 'user-circle';
        }
    });

    // Menú dinámico según rol
    menuItems = computed<MenuItem[]>(() => {
        const role = this.currentUser()?.role;

        if (role === 'ADMINISTRADOR') {
            return [
                { icon: 'chart-bar', label: 'Dashboard', route: '/dashboard/admin' },
                { icon: 'building-office', label: 'Proveedores', route: '/admin/proveedores' },
                { icon: 'bee', label: 'Apicultores', route: '/admin/apicultores' },
                { icon: 'map-pin', label: 'Apiarios', route: '/admin/apiarios' },
                { icon: 'users', label: 'Usuarios', route: '/admin/usuarios' },  // ✅ NUEVO
                { icon: 'user-circle', label: 'Mi Perfil', route: '/perfil' },   // ✅ NUEVO
                // { icon: 'document-text', label: 'Reportes', route: '/admin/reportes' },
                // { icon: 'cog-6-tooth', label: 'Configuración', route: '/admin/configuracion' },
            ];
        }

        if (role === 'ACOPIADOR') {
            return [
                { icon: 'chart-bar', label: 'Dashboard', route: '/dashboard/acopiador' },
                { icon: 'bee', label: 'Apicultores', route: '/acopiador/apicultores' },
                { icon: 'map-pin', label: 'Ver Apiarios', route: '/acopiador/apiarios' },
                { icon: 'shopping-bag', label: 'Entradas de Miel', route: '/acopiador/entradas-miel' },
                { icon: 'tag', label: 'Asignación Tambores', route: '/acopiador/asignacion-tambores' },
                { icon: 'clipboard', label: 'Tambores Disponibles', route: '/acopiador/tambores-disponibles' },
                { icon: 'folder', label: 'Salidas de Miel', route: '/acopiador/salidas-miel' },
                { icon: 'user-circle', label: 'Mi Perfil', route: '/perfil' },  // ✅ NUEVO
            ];
        }

        if (role === 'APICULTOR') {
            return [
                { icon: 'chart-bar', label: 'Dashboard', route: '/dashboard/apicultor' },
                { icon: 'map-pin', label: 'Mis Apiarios', route: '/apicultor/apiarios' },
                { icon: 'plus', label: 'Nuevo Apiario', route: '/apicultor/apiarios/nuevo' },
                { icon: 'building-office', label: 'Mis Proveedores', route: '/apicultor/proveedores' },
                { icon: 'user-circle', label: 'Mi Perfil', route: '/perfil' }  // ✅ Ruta unificada
            ];
        }

        if (role === 'MIELERA') {
            return [
                { icon: 'chart-bar', label: 'Dashboard', route: '/dashboard/mielera' },
                { icon: 'honey', label: 'Producción', route: '/mielera/produccion' },
                { icon: 'shopping-bag', label: 'Compras', route: '/mielera/compras' },
                { icon: 'document-text', label: 'Reportes', route: '/mielera/reportes' },
                { icon: 'user-circle', label: 'Mi Perfil', route: '/perfil' }  // ✅ NUEVO
            ];
        }

        if (role === 'VERIFICADOR') {
            return [
                { icon: 'home', label: 'Dashboard', route: '/verificador' },
                { icon: 'shopping-bag', label: 'En Tránsito', route: '/verificador/en-transito' },
                { icon: 'check-circle', label: 'Verificadas', route: '/verificador/verificadas' },
                { icon: 'user-circle', label: 'Mi Perfil', route: '/perfil' }  // ✅ NUEVO
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

    /**
     * Cerrar sesión
     */
    onLogout(): void {
        this.authService.logout();
    }

    /**
     * 🔄 Toggle collapse del sidebar (solo desktop)
     */
    toggleCollapse(): void {
        this.sidebarService.toggleCollapse();
    }
}