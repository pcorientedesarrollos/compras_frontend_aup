import { Component, inject, computed, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';
import { BeeLoaderComponent } from '../../../shared/components/bee-loader/bee-loader.component';
import { IconName } from '../../../shared/components/ui/icon/types/icon.types';

interface MetricCard {
    title: string;
    value: string;
    icon: IconName; // ✅ SVG icons
    color: string;
    bgColor: string;
}

interface QuickAction {
    title: string;
    description: string;
    icon: IconName; // ✅ SVG icons
    route: string;
    color: string;
}

@Component({
    selector: 'app-acopiador-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, IconComponent, BeeLoaderComponent],
    templateUrl: './acopiador-dashboard.component.html',
    styleUrl: './acopiador-dashboard.component.css'
})
export class AcopiadorDashboardComponent implements OnInit {
    private authService = inject(AuthService);
    private dashboardService = inject(DashboardService);
    private destroyRef = inject(DestroyRef);

    currentUser = computed(() => this.authService.getCurrentUser());

    // 🎯 Signals para datos dinámicos
    loading = signal(true);
    metrics = signal<MetricCard[]>([]);

    // Acciones rápidas (con iconos SVG)
    quickActions: QuickAction[] = [
        {
            title: 'Mis Apicultores',
            description: 'Gestionar apicultores vinculados',
            icon: 'bee',
            route: '/acopiador/apicultores',
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            title: 'Ver Apiarios',
            description: 'Ubicación de apiarios en mapa',
            icon: 'map-pin',
            route: '/acopiador/apiarios',
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            title: 'Entradas de Miel',
            description: 'Registrar nuevas compras',
            icon: 'shopping-bag',
            route: '/acopiador/entradas-miel',
            color: 'bg-amber-500 hover:bg-amber-600'
        },
        {
            title: 'Salidas de Miel',
            description: 'Gestionar envíos',
            icon: 'folder',
            route: '/acopiador/salidas-miel',
            color: 'bg-purple-500 hover:bg-purple-600'
        }
    ];

    ngOnInit(): void {
        this.loadDashboardMetrics();
    }

    /**
     * Cargar métricas del dashboard desde el backend
     */
    loadDashboardMetrics(): void {
        this.loading.set(true);

        const user = this.currentUser();
        const proveedorId = user?.proveedorId;

        if (!proveedorId) {
            console.warn('Usuario acopiador sin proveedorId asociado');
            this.loading.set(false);
            return;
        }

        this.dashboardService.getAcopiadorMetrics(proveedorId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    // 🎯 Construir métricas con datos reales
                    const metricsData: MetricCard[] = [
                        {
                            title: 'Apicultores Vinculados',
                            value: data.totalApicultores?.toString() || '0',
                            icon: 'bee',
                            color: 'text-green-600',
                            bgColor: 'bg-green-100'
                        },
                        {
                            title: 'Entradas de Miel',
                            value: data.totalEntradasMiel?.toString() || '0',
                            icon: 'shopping-bag',
                            color: 'text-amber-600',
                            bgColor: 'bg-amber-100'
                        },
                        {
                            title: 'Kilos en Inventario',
                            value: new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(data.totalKilosInventario || 0),
                            icon: 'scale',
                            color: 'text-orange-600',
                            bgColor: 'bg-orange-100'
                        },
                        {
                            title: 'Tipos de Miel',
                            value: data.totalTamboresDisponibles?.toString() || '0',
                            icon: 'tag',
                            color: 'text-purple-600',
                            bgColor: 'bg-purple-100'
                        }
                    ];

                    this.metrics.set(metricsData);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar métricas del dashboard:', error);
                    this.loading.set(false);
                }
            });
    }
}
