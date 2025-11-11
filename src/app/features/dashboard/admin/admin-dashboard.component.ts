import { Component, inject, computed, signal, OnInit, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, IconComponent, BeeLoaderComponent],
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

    // 📅 Signals para filtro de mes/año
    selectedMonth = signal<number>(new Date().getMonth() + 1); // 1-12
    selectedYear = signal<number>(new Date().getFullYear());

    // Computed para mostrar fecha formateada
    displayDate = computed(() => {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return `${monthNames[this.selectedMonth() - 1]} ${this.selectedYear()}`;
    });

    // Computed para verificar si estamos en el mes actual
    isCurrentMonth = computed(() => {
        const now = new Date();
        return this.selectedMonth() === now.getMonth() + 1 &&
               this.selectedYear() === now.getFullYear();
    });

    // Flag para evitar doble carga en inicialización
    private isInitialized = false;

    constructor() {
        // 🔄 Effect para recargar métricas cuando cambie mes/año
        effect(() => {
            // Leer los signals para registrar dependencias
            const mes = this.selectedMonth();
            const anio = this.selectedYear();

            // Solo recargar si ya se inicializó (evita llamada doble en ngOnInit)
            if (this.isInitialized && mes && anio) {
                this.loadDashboardMetrics();
            }
        }, { allowSignalWrites: true });
    }

    ngOnInit(): void {
        this.loadDashboardMetrics();
        this.isInitialized = true; // Marcar como inicializado después de la primera carga
    }

    /**
     * Cargar métricas del dashboard desde el backend usando API consolidada
     */
    loadDashboardMetrics(): void {
        this.loading.set(true);

        // Enviar mes y año como query params
        const params = {
            mes: this.selectedMonth(),
            anio: this.selectedYear()
        };

        this.dashboardService.getAdminMetricsConsolidado(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    // 🎯 Construir métricas con datos reales de la API consolidada
                    // Orden: Proveedores → Apiarios → Apicultores → resto (igual que sidebar)
                    const metricsData: MetricCard[] = [
                        {
                            title: 'Proveedores',
                            value: data.proveedores.total.toString(),
                            subtitle: `${data.proveedores.acopiadores} acopiadores / ${data.proveedores.mieleras} mieleras`,
                            icon: 'building-office',
                            color: 'text-purple-600',
                            bgColor: 'bg-purple-100'
                        },
                        {
                            title: 'Apiarios Registrados',
                            value: data.apiarios.total.toString(),
                            icon: 'map-pin',
                            color: 'text-blue-600',
                            bgColor: 'bg-blue-100'
                        },
                        {
                            title: 'Total Apicultores',
                            value: data.apicultores.total.toString(),
                            subtitle: `${data.apicultores.activos} activos / ${data.apicultores.inactivos} inactivos`,
                            icon: 'bee',
                            color: 'text-green-600',
                            bgColor: 'bg-green-100'
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
                            title: 'Verificaciones',
                            value: data.verificaciones.total.toString(),
                            subtitle: `${data.verificaciones.enTransito} en tránsito / ${data.verificaciones.verificadas} verificadas`,
                            icon: 'check-circle',
                            color: 'text-emerald-600',
                            bgColor: 'bg-emerald-100'
                        },
                        {
                            title: 'Tambores',
                            value: data.tambores.total.toString(),
                            subtitle: `${data.tambores.activos} activos / ${data.tambores.asignados} asignados / ${data.tambores.entregados} entregados`,
                            icon: 'inbox',
                            color: 'text-cyan-600',
                            bgColor: 'bg-cyan-100'
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

    /**
     * 📅 Navegar al mes anterior
     */
    previousMonth(): void {
        let mes = this.selectedMonth();
        let anio = this.selectedYear();

        mes--;
        if (mes < 1) {
            mes = 12;
            anio--;
        }

        this.selectedMonth.set(mes);
        this.selectedYear.set(anio);
    }

    /**
     * 📅 Navegar al mes actual
     */
    goToCurrentMonth(): void {
        const now = new Date();
        this.selectedMonth.set(now.getMonth() + 1);
        this.selectedYear.set(now.getFullYear());
    }

    /**
     * 📅 Navegar al mes siguiente
     */
    nextMonth(): void {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // No permitir avanzar más allá del mes actual
        if (this.selectedMonth() === currentMonth && this.selectedYear() === currentYear) {
            return;
        }

        let mes = this.selectedMonth();
        let anio = this.selectedYear();

        mes++;
        if (mes > 12) {
            mes = 1;
            anio++;
        }

        this.selectedMonth.set(mes);
        this.selectedYear.set(anio);
    }

    /**
     * 📅 Verificar si el botón "Siguiente" debe estar deshabilitado
     */
    isNextMonthDisabled = computed(() => {
        const now = new Date();
        return this.selectedMonth() === now.getMonth() + 1 &&
               this.selectedYear() === now.getFullYear();
    });
}
