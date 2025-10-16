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
}

interface QuickAction {
    title: string;
    description: string;
    icon: string;
    route: string;
    color: string;
}

@Component({
    selector: 'app-apicultor-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './apicultor-dashboard.component.html',
    styleUrl: './apicultor-dashboard.component.css'
})
export class ApicultorDashboardComponent {
    private authService = inject(AuthService);

    currentUser = computed(() => this.authService.getCurrentUser());

    // Métricas del apicultor (placeholder)
    metrics: MetricCard[] = [
        {
            title: 'Mis Apiarios',
            value: '8',
            icon: '🏞️',
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Total Colmenas',
            value: '240',
            icon: '🐝',
            color: 'text-amber-600',
            bgColor: 'bg-amber-100'
        },
        {
            title: 'Proveedores',
            value: '3',
            icon: '🏢',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Producción Estimada',
            value: '1,450 kg',
            icon: '🍯',
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        }
    ];

    // Acciones rápidas
    quickActions: QuickAction[] = [
        {
            title: 'Nuevo Apiario',
            description: 'Registrar nuevo apiario',
            icon: '➕',
            route: '/apicultor/apiarios/nuevo',
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            title: 'Mis Apiarios',
            description: 'Ver y gestionar apiarios',
            icon: '🏞️',
            route: '/apicultor/apiarios',
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            title: 'Mis Proveedores',
            description: 'Ver proveedores vinculados',
            icon: '🔗',
            route: '/apicultor/proveedores',
            color: 'bg-purple-500 hover:bg-purple-600'
        },
        {
            title: 'Mi Perfil',
            description: 'Actualizar información',
            icon: '👤',
            route: '/apicultor/perfil',
            color: 'bg-gray-500 hover:bg-gray-600'
        }
    ];
}