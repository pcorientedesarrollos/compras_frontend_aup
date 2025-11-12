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
                    // 🎯 Construir métricas detalladas con datos reales de la API
                    const metricsData: MetricCard[] = [
                        // 1. Apicultores Vinculados
                        {
                            title: 'Apicultores Vinculados',
                            value: data.apicultoresVinculados.total.toString(),
                            icon: 'bee',
                            color: 'text-green-600',
                            bgColor: 'bg-green-100'
                        },
                        // 2. Total Entradas de Miel
                        {
                            title: 'Total Entradas de Miel',
                            value: data.entradasMiel.totalEntradas.toString(),
                            icon: 'truck',
                            color: 'text-teal-600',
                            bgColor: 'bg-teal-100'
                        },
                        // 3. Total Kilos Comprados
                        {
                            title: 'Total Kilos Comprados',
                            value: data.entradasMiel.totalKilos.toLocaleString('es-MX', { maximumFractionDigits: 1 }) + ' kg',
                            subtitle: `Promedio: ${data.entradasMiel.promedioKilosPorEntrada.toFixed(1)} kg/entrada`,
                            icon: 'scale',
                            color: 'text-orange-600',
                            bgColor: 'bg-orange-100'
                        },
                        // 4. Total Compras (dinero)
                        {
                            title: 'Total Compras',
                            value: '$' + data.entradasMiel.totalCompras.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                            subtitle: `Promedio: $${data.entradasMiel.promedioPrecioPorKilo.toFixed(2)}/kg`,
                            icon: 'currency-dollar',
                            color: 'text-green-700',
                            bgColor: 'bg-green-100'
                        },
                        // 5. Tambores Disponibles
                        {
                            title: 'Tambores Disponibles',
                            value: data.tambores.activos.toString(),
                            icon: 'inbox',
                            color: 'text-cyan-600',
                            bgColor: 'bg-cyan-100'
                        },
                        // 6. Tambores Asignados
                        {
                            title: 'Tambores Asignados',
                            value: data.tambores.asignados.toString(),
                            icon: 'shopping-bag',
                            color: 'text-indigo-600',
                            bgColor: 'bg-indigo-100'
                        },
                        // 7. Tambores Entregados
                        {
                            title: 'Tambores Entregados',
                            value: data.tambores.entregados.toString(),
                            icon: 'shield-check',
                            color: 'text-emerald-600',
                            bgColor: 'bg-emerald-100'
                        },
                        // 8. Total Tambores
                        {
                            title: 'Total Tambores',
                            value: data.tambores.total.toString(),
                            icon: 'squares-plus',
                            color: 'text-violet-600',
                            bgColor: 'bg-violet-100'
                        },
                        // 9. Kilos Disponibles
                        {
                            title: 'Kilos Disponibles',
                            value: data.inventario.kilosDisponibles.toLocaleString('es-MX', { maximumFractionDigits: 1 }) + ' kg',
                            icon: 'arrow-trending-up',
                            color: 'text-lime-600',
                            bgColor: 'bg-lime-100'
                        },
                        // 10. Kilos Usados en Tambores
                        {
                            title: 'Kilos Usados en Tambores',
                            value: data.inventario.kilosUsados.toLocaleString('es-MX', { maximumFractionDigits: 1 }) + ' kg',
                            icon: 'tag',
                            color: 'text-yellow-600',
                            bgColor: 'bg-yellow-100'
                        },
                        // 11. Kilos Totales
                        {
                            title: 'Kilos Totales',
                            value: data.inventario.kilosTotal.toLocaleString('es-MX', { maximumFractionDigits: 1 }) + ' kg',
                            icon: 'calculator',
                            color: 'text-slate-600',
                            bgColor: 'bg-slate-100'
                        },
                        // 12. Tipos de Miel
                        {
                            title: 'Tipos de Miel',
                            value: data.inventario.tiposMielUnicos.toString(),
                            icon: 'sparkles',
                            color: 'text-purple-600',
                            bgColor: 'bg-purple-100'
                        },
                        // 13. Salidas en Tránsito
                        {
                            title: 'Salidas en Tránsito',
                            value: data.verificaciones.enTransito.toString(),
                            icon: 'clock',
                            color: 'text-orange-600',
                            bgColor: 'bg-orange-100'
                        },
                        // 14. Salidas Verificadas
                        {
                            title: 'Salidas Verificadas',
                            value: data.verificaciones.verificadas.toString(),
                            icon: 'check-circle',
                            color: 'text-green-600',
                            bgColor: 'bg-green-100'
                        },
                        // 15. Total Salidas
                        {
                            title: 'Total Salidas',
                            value: data.verificaciones.total.toString(),
                            icon: 'document-text',
                            color: 'text-gray-600',
                            bgColor: 'bg-gray-100'
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
