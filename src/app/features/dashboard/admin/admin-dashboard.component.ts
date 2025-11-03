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
    icon: IconName; // 🎯 Ahora usa IconName en lugar de emoji
    color: string;
    bgColor: string;
    change?: string;
    changeType?: 'positive' | 'negative';
}

interface QuickAction {
    title: string;
    description: string;
    icon: IconName; // 🎯 Ahora usa IconName
    route: string;
    color: string;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, IconComponent, BeeLoaderComponent],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
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
            title: 'Nuevo Apicultor',
            description: 'Registrar nuevo apicultor',
            icon: 'user-plus',
            route: '/admin/apicultores',
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            title: 'Ver Apicultores',
            description: 'Gestionar apicultores registrados',
            icon: 'bee',
            route: '/admin/apicultores',
            color: 'bg-amber-500 hover:bg-amber-600'
        },
        {
            title: 'Ver Apiarios',
            description: 'Consultar ubicaciones de apiarios',
            icon: 'map-pin',
            route: '/admin/apiarios',
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            title: 'Proveedores',
            description: 'Gestionar acopiadores y mieleras',
            icon: 'building-office',
            route: '/admin/proveedores',
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

        this.dashboardService.getAdminMetrics()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    // 🎯 Construir métricas con datos reales
                    const metricsData: MetricCard[] = [
                        {
                            title: 'Total Apicultores',
                            value: data.totalApicultores?.toString() || '0',
                            icon: 'bee',
                            color: 'text-green-600',
                            bgColor: 'bg-green-100'
                        },
                        {
                            title: 'Apiarios Activos',
                            value: data.totalApiarios?.toString() || '0',
                            icon: 'map-pin',
                            color: 'text-blue-600',
                            bgColor: 'bg-blue-100'
                        },
                        {
                            title: 'Proveedores',
                            value: data.totalProveedores?.toString() || '0',
                            icon: 'building-office',
                            color: 'text-purple-600',
                            bgColor: 'bg-purple-100'
                        },
                        {
                            title: 'Colmenas Totales',
                            value: data.totalColmenas?.toString() || '0',
                            icon: 'hashtag',
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
                            title: 'Tambores Disponibles',
                            value: data.totalTamboresDisponibles?.toString() || '0',
                            icon: 'shopping-bag',
                            color: 'text-indigo-600',
                            bgColor: 'bg-indigo-100'
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
