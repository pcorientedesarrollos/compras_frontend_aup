/**
 * ============================================================================
 * ✅ VERIFICACIONES COMPLETADAS - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente que muestra el historial de verificaciones completadas
 * con funcionalidad de búsqueda, filtros, paginación y vista de detalle
 *
 * ============================================================================
 */

import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { VerificacionService } from '../../../core/services/verificacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { VerificacionResponse } from '../../../core/models/verificador.model';

@Component({
  selector: 'app-verificaciones-completadas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Verificaciones Completadas</h1>
        <p class="text-gray-600 mt-1">Historial de tus verificaciones realizadas - Migra cada verificación a AUP</p>
      </div>

      <!-- Filtros y Búsqueda -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Búsqueda -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Buscar por folio, proveedor o chofer..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent">
          </div>

          <!-- Fecha Desde -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              [(ngModel)]="fechaDesde"
              (ngModelChange)="onFilterChange()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent">
          </div>

          <!-- Fecha Hasta -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              [(ngModel)]="fechaHasta"
              (ngModelChange)="onFilterChange()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent">
          </div>
        </div>

        <!-- Botón Refrescar -->
        <div class="mt-4 flex justify-end">
          <button
            (click)="loadVerificaciones()"
            [disabled]="loading()"
            class="bg-honey-primary hover:bg-honey-dark text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <svg class="w-5 h-5" [class.animate-spin]="loading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ loading() ? 'Cargando...' : 'Refrescar' }}</span>
          </button>
        </div>
      </div>

      <!-- Resumen Estadístico -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow-md p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Verificaciones</p>
              <p class="text-2xl font-bold text-gray-800">{{ verificaciones().length }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Tambores Verificados</p>
              <p class="text-2xl font-bold text-gray-800">{{ totalTambores() }}</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Con Diferencias</p>
              <p class="text-2xl font-bold text-yellow-600">{{ totalConDiferencias() }}</p>
            </div>
            <div class="bg-yellow-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Kilos Verificados</p>
              <p class="text-2xl font-bold text-green-600">{{ totalKilos() | number: '1.2-2' }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-honey-primary mx-auto mb-4"></div>
              <p class="text-gray-600">Cargando verificaciones...</p>
            </div>
          </div>
        } @else if (verificacionesFiltradas().length === 0) {
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-lg font-semibold text-gray-700 mb-1">No hay verificaciones</h3>
            <p class="text-gray-500">No se encontraron verificaciones completadas</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N°
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folio
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Verificación
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chofer
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tambores
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diferencias
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kilos
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (verificacion of verificacionesPaginadas(); track verificacion.verificacionId) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-bold text-honey-dark">#{{ verificacion.numeroVerificacion }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ verificacion.salidaFolio }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-600">{{ verificacion.fechaVerificacion | date: 'dd/MM/yyyy HH:mm' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ verificacion.proveedorNombre }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ verificacion.choferNombre }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <div class="flex flex-col gap-1">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Total: {{ verificacion.cantidadTambores }}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      @if (verificacion.cantidadConDiferencias > 0) {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠️ {{ verificacion.cantidadConDiferencias }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Sin diferencias
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="text-sm font-semibold text-gray-900">
                        {{ verificacion.kilosTotalesVerificados | number: '1.2-2' }} kg
                      </div>
                      @if (verificacion.diferenciaTotal !== 0) {
                        <div class="text-xs" [class.text-red-600]="verificacion.diferenciaTotal < 0" [class.text-green-600]="verificacion.diferenciaTotal > 0">
                          {{ verificacion.diferenciaTotal > 0 ? '+' : '' }}{{ verificacion.diferenciaTotal | number: '1.2-2' }} kg
                          ({{ verificacion.porcentajeDiferencia | number: '1.1-1' }}%)
                        </div>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          (click)="verDetalle(verificacion.verificacionId)"
                          class="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1"
                          title="Ver detalle de la verificación">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </button>
                        <span class="text-gray-300">|</span>
                        <button
                          (click)="migrarVerificacion(verificacion)"
                          class="bg-gradient-to-r from-honey-primary to-honey-dark hover:from-honey-dark hover:to-honey-primary text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 group"
                          title="Migrar esta verificación a AUP">
                          <svg class="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Migrar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">
                Mostrando <span class="font-semibold">{{ startIndex() + 1 }}</span> a
                <span class="font-semibold">{{ endIndex() }}</span> de
                <span class="font-semibold">{{ verificacionesFiltradas().length }}</span> resultados
              </div>

              <div class="flex gap-2">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage() === 1"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Anterior
                </button>

                @for (page of pages(); track page) {
                  <button
                    (click)="goToPage(page)"
                    [class.bg-honey-primary]="currentPage() === page"
                    [class.text-white]="currentPage() === page"
                    [class.border-honey-primary]="currentPage() === page"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    {{ page }}
                  </button>
                }

                <button
                  (click)="nextPage()"
                  [disabled]="currentPage() === totalPages()"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class VerificacionesCompletadasComponent implements OnInit {
  private verificacionService = inject(VerificacionService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals
  verificaciones = signal<VerificacionResponse[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  fechaDesde = signal('');
  fechaHasta = signal('');
  currentPage = signal(1);
  pageSize = signal(10);

  // Computed signals - Filtros
  verificacionesFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase();
    let filtered = this.verificaciones();

    if (term) {
      filtered = filtered.filter(v =>
        v.salidaFolio.toLowerCase().includes(term) ||
        v.proveedorNombre.toLowerCase().includes(term) ||
        v.choferNombre.toLowerCase().includes(term)
      );
    }

    return filtered;
  });

  // Computed signals - Estadísticas
  totalTambores = computed(() =>
    this.verificaciones().reduce((sum, v) => sum + v.cantidadTambores, 0)
  );

  totalConDiferencias = computed(() =>
    this.verificaciones().reduce((sum, v) => sum + v.cantidadConDiferencias, 0)
  );

  totalKilos = computed(() =>
    this.verificaciones().reduce((sum, v) => sum + v.kilosTotalesVerificados, 0)
  );

  // Computed signals - Paginación
  totalPages = computed(() => Math.ceil(this.verificacionesFiltradas().length / this.pageSize()));
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.verificacionesFiltradas().length));

  verificacionesPaginadas = computed(() => {
    return this.verificacionesFiltradas().slice(this.startIndex(), this.endIndex());
  });

  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    this.loadVerificaciones();
  }

  /**
   * Cargar verificaciones desde el backend
   */
  loadVerificaciones(): void {
    this.loading.set(true);

    const params: any = { page: 1, limit: 100 };

    if (this.fechaDesde()) params.fechaDesde = this.fechaDesde();
    if (this.fechaHasta()) params.fechaHasta = this.fechaHasta();

    this.verificacionService.getMisVerificaciones(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.verificaciones.set(response.data);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar verificaciones:', error);
          this.notificationService.showError('Error al cargar el historial de verificaciones');
          this.loading.set(false);
        }
      });
  }

  /**
   * Manejar cambios en la búsqueda
   */
  onSearchChange(): void {
    this.currentPage.set(1);
  }

  /**
   * Manejar cambios en los filtros
   */
  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadVerificaciones();
  }

  /**
   * Navegar a la página anterior
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  /**
   * Navegar a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
    }
  }

  /**
   * Ir a una página específica
   */
  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  /**
   * Ver detalle de una verificación
   */
  verDetalle(verificacionId: string): void {
    this.router.navigate(['/verificador/detalle', verificacionId]);
  }

  /**
   * Migrar una verificación específica a AUP
   */
  migrarVerificacion(verificacion: VerificacionResponse): void {
    this.router.navigate(['/verificador/migracion-aup'], {
      state: { verificacion }
    });
  }
}
