import { Component, inject, computed, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/services/auth.service';
import { DashboardService, AdminMetricasResponse } from '../../../core/services/dashboard.service';
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';
import { BeeLoaderComponent } from '../../../shared/components/bee-loader/bee-loader.component';
import { IconName } from '../../../shared/components/ui/icon/types/icon.types';

interface MetricCard {
    title: string;
    value: string;
    icon: IconName;
    color: string;
    bgColor: string;
    change?: string;
    changeType?: 'positive' | 'negative';
    subtitle?: string;
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
     * Cargar métricas del dashboard desde el backend usando API consolidada
     */
    loadDashboardMetrics(): void {
        this.loading.set(true);

        this.dashboardService.getAdminMetricsConsolidado()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    // 🎯 Construir métricas con datos reales de la API consolidada
                    const metricsData: MetricCard[] = [
                        {
                            title: 'Total Apicultores',
                            value: data.apicultores.total.toString(),
                            subtitle: `${data.apicultores.activos} activos / ${data.apicultores.inactivos} inactivos`,
                            icon: 'bee',
                            color: 'text-green-600',
                            bgColor: 'bg-green-100'
                        },
                        {
                            title: 'Apiarios Registrados',
                            value: data.apiarios.total.toString(),
                            icon: 'map-pin',
                            color: 'text-blue-600',
                            bgColor: 'bg-blue-100'
                        },
                        {
                            title: 'Proveedores',
                            value: data.proveedores.total.toString(),
                            subtitle: `${data.proveedores.acopiadores} acopiadores / ${data.proveedores.mieleras} mieleras`,
                            icon: 'building-office',
                            color: 'text-purple-600',
                            bgColor: 'bg-purple-100'
                        },
                        {
                            title: 'Colmenas Totales',
                            value: data.colmenas.total.toLocaleString('es-MX'),
                            subtitle: `Promedio: ${data.colmenas.promedioPorApiario.toFixed(1)} por apiario`,
                            icon: 'hashtag',
                            color: 'text-amber-600',
                            bgColor: 'bg-amber-100'
                        },
                        {
                            title: 'Kilos Disponibles',
                            value: data.inventario.kilosDisponibles.toLocaleString('es-MX', { maximumFractionDigits: 0 }),
                            subtitle: `${data.inventario.kilosUsados.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg usados`,
                            icon: 'scale',
                            color: 'text-orange-600',
                            bgColor: 'bg-orange-100'
                        },
                        {
                            title: 'Tambores Disponibles',
                            value: data.inventario.tamboresDisponibles.toString(),
                            subtitle: `${data.inventario.tamboresTotal} totales / ${data.inventario.tiposMielUnicos} tipos`,
                            icon: 'shopping-bag',
                            color: 'text-indigo-600',
                            bgColor: 'bg-indigo-100'
                        },
                        {
                            title: 'Entradas de Miel',
                            value: data.entradasMiel.totalEntradas.toString(),
                            subtitle: `${data.entradasMiel.totalKilosIngresados.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg ingresados`,
                            icon: 'truck',
                            color: 'text-teal-600',
                            bgColor: 'bg-teal-100'
                        },
                        {
                            title: 'Usuarios del Sistema',
                            value: data.usuarios.total.toString(),
                            subtitle: `${data.usuarios.administradores} admins / ${data.usuarios.verificadores} verificadores`,
                            icon: 'users',
                            color: 'text-pink-600',
                            bgColor: 'bg-pink-100'
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
