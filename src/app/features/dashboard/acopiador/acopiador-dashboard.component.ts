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
    selector: 'app-acopiador-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './acopiador-dashboard.component.html',
    styleUrl: './acopiador-dashboard.component.css'
})
export class AcopiadorDashboardComponent {
    private authService = inject(AuthService);

    currentUser = computed(() => this.authService.getCurrentUser());

    // Métricas del acopiador (placeholder)
    metrics: MetricCard[] = [
        {
            title: 'Apicultores Vinculados',
            value: '45',
            icon: '🐝',
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Apiarios Totales',
            value: '128',
            icon: '🏞️',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Compras Este Mes',
            value: '2,450 kg',
            icon: '📦',
            color: 'text-amber-600',
            bgColor: 'bg-amber-100'
        },
        {
            title: 'Colmenas Activas',
            value: '3,840',
            icon: '🔢',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        }
    ];

    // Acciones rápidas
    quickActions: QuickAction[] = [
        {
            title: 'Vincular Apicultor',
            description: 'Agregar nuevo apicultor a mi red',
            icon: '🔗',
            route: '/acopiador/vincular',
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            title: 'Apicultores',
            description: 'Gestionar mis apicultores vinculados',
            icon: '🐝',
            route: '/acopiador/apicultores',
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            title: 'Ver Apiarios',
            description: 'Ubicación de apiarios',
            icon: '🗺️',
            route: '/acopiador/apiarios',
            color: 'bg-purple-500 hover:bg-purple-600'
        },
        {
            title: 'Registrar Compra',
            description: 'Nueva compra de miel',
            icon: '➕',
            route: '/acopiador/compras/nueva',
            color: 'bg-amber-500 hover:bg-amber-600'
        }
    ];
}