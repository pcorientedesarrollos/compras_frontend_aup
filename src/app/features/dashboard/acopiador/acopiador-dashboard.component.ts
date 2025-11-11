import { Component, inject, computed, signal, OnInit, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';
import { BeeLoaderComponent } from '../../../shared/components/bee-loader/bee-loader.component';
import { IconName } from '../../../shared/components/ui/icon/types/icon.types';

interface MetricCard {
    title: string;
    value: string;
    icon: IconName;
    color: string;
    bgColor: string;
    subtitle?: string;
}

@Component({
    selector: 'app-acopiador-dashboard',
    standalone: true,
    imports: [CommonModule, IconComponent, BeeLoaderComponent],
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
            const mes = this.selectedMonth();
            const anio = this.selectedYear();

            if (this.isInitialized && mes && anio) {
                this.loadDashboardMetrics();
            }
        }, { allowSignalWrites: true });
    }

    ngOnInit(): void {
        this.loadDashboardMetrics();
        this.isInitialized = true;
    }

    /**
     * Cargar métricas del dashboard desde el backend usando API consolidada
     */
    loadDashboardMetrics(): void {
        this.loading.set(true);

        const params = {
            mes: this.selectedMonth(),
            anio: this.selectedYear()
        };

        this.dashboardService.getAcopiadorMetricsConsolidado(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    // 🎯 Construir métricas con datos reales de la API
                    const metricsData: MetricCard[] = [
                        {
                            title: 'Apicultores Vinculados',
                            value: data.apicultoresVinculados.total.toString(),
                            icon: 'bee',
                            color: 'text-green-600',
                            bgColor: 'bg-green-100'
                        },
                        {
                            title: 'Entradas de Miel',
                            value: data.entradasMiel.totalEntradas.toString(),
                            subtitle: `${data.entradasMiel.totalKilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg · $${data.entradasMiel.totalCompras.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`,
                            icon: 'shopping-bag',
                            color: 'text-amber-600',
                            bgColor: 'bg-amber-100'
                        },
                        {
                            title: 'Inventario',
                            value: data.inventario.kilosTotal.toLocaleString('es-MX', { maximumFractionDigits: 0 }) + ' kg',
                            subtitle: `${data.inventario.kilosDisponibles.toLocaleString('es-MX', { maximumFractionDigits: 0 })} disponibles / ${data.inventario.kilosUsados.toLocaleString('es-MX', { maximumFractionDigits: 0 })} usados`,
                            icon: 'scale',
                            color: 'text-orange-600',
                            bgColor: 'bg-orange-100'
                        },
                        {
                            title: 'Tipos de Miel',
                            value: data.inventario.tiposMielUnicos.toString(),
                            icon: 'tag',
                            color: 'text-purple-600',
                            bgColor: 'bg-purple-100'
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
