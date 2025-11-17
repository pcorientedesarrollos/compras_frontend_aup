/**
 * ============================================================================
 * 📊 DIFERENCIAS DE PRECIO COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Auditoría de diferencias entre precios oficiales y capturados
 * Solo accesible para ADMINISTRADORES
 *
 * TABS:
 * 1. Dashboard - Estadísticas globales, KPIs, gráficas
 * 2. Detalle - Tabla con filtros y paginación
 *
 * ============================================================================
 */

import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Servicios
import { DiferenciasPrecioService } from '../services/diferencias-precio.service';
import { NotificationService } from '../../../core/services/notification.service';

// Modelos
import {
  DiferenciaPrecio,
  EstadisticasDiferencias,
  FiltrosDiferenciasPrecio,
  PaginationMeta
} from '../../../core/models/diferencias-precio.model';

// Componentes
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';

@Component({
  selector: 'app-diferencias-precio',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './diferencias-precio.component.html'
})
export class DiferenciasPrecioComponent implements OnInit {
  private diferenciasPrecioService = inject(DiferenciasPrecioService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Exponer funciones globales para usar en el template
  Math = Math;
  parseInt = parseInt;

  // ============================================================================
  // TAB MANAGEMENT
  // ============================================================================
  activeTab = signal<'dashboard' | 'detalle'>('dashboard');

  /**
   * Cambiar de tab
   */
  setActiveTab(tab: 'dashboard' | 'detalle'): void {
    this.activeTab.set(tab);

    // Cargar datos según el tab activo
    if (tab === 'dashboard') {
      this.loadEstadisticas();
    } else {
      this.loadDiferencias();
    }
  }

  // ============================================================================
  // DASHBOARD - STATE
  // ============================================================================
  estadisticas = signal<EstadisticasDiferencias | null>(null);
  loadingEstadisticas = signal(false);

  // Filtros de fecha para dashboard
  fechaInicioDashboard = signal<string>('');
  fechaFinDashboard = signal<string>('');

  // ============================================================================
  // DETALLE - STATE
  // ============================================================================
  diferencias = signal<DiferenciaPrecio[]>([]);
  pagination = signal<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  loadingDiferencias = signal(false);

  // Filtros para detalle
  filtros = signal<FiltrosDiferenciasPrecio>({
    page: 1,
    limit: 20,
    sortBy: 'fechaRegistro',
    sortOrder: 'desc'
  });

  // Valores temporales para los filtros del formulario
  filtroProveedorId = signal<number | null>(null);
  filtroTipoMielId = signal<number | null>(null);
  filtroClasificacion = signal<'EXPORTACION' | 'NACIONAL' | null>(null);
  filtroFechaInicio = signal<string>('');
  filtroFechaFin = signal<string>('');

  // ============================================================================
  // LIFECYCLE
  // ============================================================================
  ngOnInit(): void {
    // Cargar estadísticas por defecto
    this.loadEstadisticas();
  }

  // ============================================================================
  // DASHBOARD - METHODS
  // ============================================================================

  /**
   * Cargar estadísticas globales
   */
  loadEstadisticas(): void {
    this.loadingEstadisticas.set(true);

    const fechaInicio = this.fechaInicioDashboard() || undefined;
    const fechaFin = this.fechaFinDashboard() || undefined;

    this.diferenciasPrecioService.getEstadisticas(fechaInicio, fechaFin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.estadisticas.set(data);
          this.loadingEstadisticas.set(false);
        },
        error: (error) => {
          console.error('Error al cargar estadísticas:', error);
          this.notificationService.error(
            'Error al cargar',
            'No se pudieron obtener las estadísticas'
          );
          this.loadingEstadisticas.set(false);
        }
      });
  }

  /**
   * Aplicar filtros de fecha en dashboard
   */
  aplicarFiltrosFechasDashboard(): void {
    this.loadEstadisticas();
  }

  /**
   * Limpiar filtros de fechas en dashboard
   */
  limpiarFiltrosFechasDashboard(): void {
    this.fechaInicioDashboard.set('');
    this.fechaFinDashboard.set('');
    this.loadEstadisticas();
  }

  // ============================================================================
  // DETALLE - METHODS
  // ============================================================================

  /**
   * Cargar diferencias con filtros
   */
  loadDiferencias(): void {
    this.loadingDiferencias.set(true);

    this.diferenciasPrecioService.getDiferencias(this.filtros())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.diferencias.set(response.diferencias);
          this.pagination.set(response.pagination);
          this.loadingDiferencias.set(false);
        },
        error: (error) => {
          console.error('Error al cargar diferencias:', error);
          this.notificationService.error(
            'Error al cargar',
            'No se pudieron obtener las diferencias'
          );
          this.loadingDiferencias.set(false);
        }
      });
  }

  /**
   * Aplicar filtros de búsqueda
   */
  aplicarFiltros(): void {
    this.filtros.update(f => ({
      ...f,
      proveedorId: this.filtroProveedorId() || undefined,
      tipoMielId: this.filtroTipoMielId() || undefined,
      clasificacion: this.filtroClasificacion() || undefined,
      fechaInicio: this.filtroFechaInicio() || undefined,
      fechaFin: this.filtroFechaFin() || undefined,
      page: 1  // Reset a la primera página
    }));

    this.loadDiferencias();
  }

  /**
   * Limpiar todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroProveedorId.set(null);
    this.filtroTipoMielId.set(null);
    this.filtroClasificacion.set(null);
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');

    this.filtros.set({
      page: 1,
      limit: 20,
      sortBy: 'fechaRegistro',
      sortOrder: 'desc'
    });

    this.loadDiferencias();
  }

  /**
   * Cambiar de página
   */
  cambiarPagina(page: number): void {
    this.filtros.update(f => ({ ...f, page }));
    this.loadDiferencias();
  }

  /**
   * Cambiar límite de registros por página
   */
  cambiarLimite(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const limit = parseInt(select.value);

    this.filtros.update(f => ({ ...f, limit, page: 1 }));
    this.loadDiferencias();
  }

  // ============================================================================
  // HELPERS - GETTERS
  // ============================================================================

  /**
   * Clase CSS para badge de clasificación
   */
  getClasificacionBadgeClass(clasificacion: 'EXPORTACION' | 'NACIONAL'): string {
    return clasificacion === 'EXPORTACION'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';
  }

  /**
   * Clase CSS para diferencia (positiva = rojo, negativa = amarillo)
   */
  getDiferenciaBadgeClass(diferencia: number): string {
    return diferencia > 0
      ? 'text-red-600'  // Ganancia = más gasto = rojo
      : 'text-yellow-600';  // Pérdida = menos pago = amarillo
  }

  /**
   * Determinar si la desviación es crítica (>10%)
   */
  isCritica(porcentaje: number): boolean {
    return Math.abs(porcentaje) > 10;
  }

  /**
   * Navegar al detalle de la entrada
   */
  verDetalleEntrada(entradaId: string): void {
    this.router.navigate(['/acopiador/entradas-miel', entradaId]);
  }

  /**
   * Array de números de página para paginación
   */
  getPaginationArray(): number[] {
    const totalPages = this.pagination().totalPages;
    const currentPage = this.pagination().page;
    const pages: number[] = [];

    // Mostrar máximo 5 páginas
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}
