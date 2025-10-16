import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MetricCard {
    title: string;
    value: string;
    icon: string;
    color: string;
    bgColor: string;
    change?: string;
    changeType?: 'positive' | 'negative';
}

interface QuickAction {
    title: string;
    description: string;
    icon: string;
    route: string;
    color: string;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
    private authService = inject(AuthService);

    currentUser = computed(() => this.authService.getCurrentUser());

    // Métricas del sistema (placeholder - conectar con backend más adelante)
    metrics: MetricCard[] = [
        {
            title: 'Total Apicultores',
            value: '156',
            icon: '🐝',
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            change: '+12%',
            changeType: 'positive'
        },
        {
            title: 'Apiarios Activos',
            value: '423',
            icon: '🏞️',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            change: '+8%',
            changeType: 'positive'
        },
        {
            title: 'Proveedores',
            value: '24',
            icon: '🏢',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            title: 'Usuarios Sistema',
            value: '89',
            icon: '👥',
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            change: '+3',
            changeType: 'positive'
        }
    ];

    // Acciones rápidas
    quickActions: QuickAction[] = [
        {
            title: 'Crear Usuario',
            description: 'Agregar nuevo usuario al sistema',
            icon: '➕',
            route: '/admin/usuarios/nuevo',
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            title: 'Ver Apicultores',
            description: 'Gestionar apicultores registrados',
            icon: '🐝',
            route: '/admin/apicultores',
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            title: 'Reportes',
            description: 'Generar reportes y estadísticas',
            icon: '📊',
            route: '/admin/reportes',
            color: 'bg-purple-500 hover:bg-purple-600'
        },
        {
            title: 'Configuración',
            description: 'Ajustes del sistema',
            icon: '⚙️',
            route: '/admin/configuracion',
            color: 'bg-gray-500 hover:bg-gray-600'
        }
    ];
}