/**
 * ============================================================================
 * HISTORIAL DE MIGRACIONES - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente para visualizar el historial completo de migraciones
 * realizadas al sistema legacy (apicultores2025)
 *
 * ============================================================================
 */

import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MigracionTamboresService } from '../services/migracion-tambores.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HistorialMigracion } from '../../../core/models/migracion-tambores.model';

@Component({
  selector: 'app-historial-migracion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Historial de Migraciones</h1>
        <p class="text-gray-600 mt-1">Registro completo de todas las migraciones realizadas al sistema legacy (AUP)</p>
      </div>

      <!-- Estadísticas Rápidas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow-md p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Migraciones</p>
              <p class="text-2xl font-bold text-gray-800">{{ historial().length }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Exitosas</p>
              <p class="text-2xl font-bold text-green-600">{{ exitosas() }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Parciales</p>
              <p class="text-2xl font-bold text-yellow-600">{{ parciales() }}</p>
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
              <p class="text-sm text-gray-600">Fallidas</p>
              <p class="text-2xl font-bold text-red-600">{{ fallidas() }}</p>
            </div>
            <div class="bg-red-100 p-3 rounded-full">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón Refrescar -->
      <div class="mb-6 flex justify-end">
        <button
          (click)="loadHistorial()"
          [disabled]="loading()"
          class="bg-honey-primary hover:bg-honey-dark text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          <svg class="w-5 h-5" [class.animate-spin]="loading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ loading() ? 'Cargando...' : 'Refrescar' }}</span>
        </button>
      </div>

      <!-- Tabla de Historial -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-honey-primary mx-auto mb-4"></div>
              <p class="text-gray-600">Cargando historial...</p>
            </div>
          </div>
        } @else if (historial().length === 0) {
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-lg font-semibold text-gray-700 mb-1">No hay migraciones</h3>
            <p class="text-gray-500">Aún no se han realizado migraciones al sistema legacy</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Migración
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folio Salida
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tambores
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exitosos
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fallidos
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Reporte
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (item of historial(); track item.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ item.fechaMigracion | date: 'dd/MM/yyyy' }}</div>
                      <div class="text-xs text-gray-500">{{ item.fechaMigracion | date: 'HH:mm:ss' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ item.salidaFolio }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ item.totalTambores }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {{ item.tamboresExitosos }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [class.bg-red-100]="item.tamboresFallidos > 0"
                            [class.text-red-800]="item.tamboresFallidos > 0"
                            [class.bg-gray-100]="item.tamboresFallidos === 0"
                            [class.text-gray-600]="item.tamboresFallidos === 0">
                        {{ item.tamboresFallidos }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      @if (item.estado === 'EXITOSO') {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Exitoso
                        </span>
                      } @else if (item.estado === 'PARCIAL') {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠ Parcial
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ Fallida
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <div class="text-sm text-gray-600">{{ item.idReporteDescarga }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-600">{{ item.usuarioNombre }}</div>
                    </td>
                  </tr>

                  <!-- Fila expandible para errores -->
                  @if (item.errorMensaje) {
                    <tr class="bg-red-50">
                      <td colspan="8" class="px-6 py-3">
                        <div>
                          <span class="text-xs font-semibold text-red-700">Error:</span>
                          <p class="text-xs text-red-600 mt-1">{{ item.errorMensaje }}</p>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class HistorialMigracionComponent implements OnInit {
  private migracionService = inject(MigracionTamboresService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  // State
  historial = signal<HistorialMigracion[]>([]);
  loading = signal(false);

  // Computed - Estadísticas
  exitosas = signal(0);
  parciales = signal(0);
  fallidas = signal(0);

  ngOnInit(): void {
    this.loadHistorial();
  }

  /**
   * Cargar historial de migraciones
   */
  loadHistorial(): void {
    this.loading.set(true);

    this.migracionService.getHistorial()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.historial.set(data);
          this.calcularEstadisticas(data);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar historial:', error);
          this.notificationService.showError('Error al cargar el historial de migraciones');
          this.loading.set(false);
        }
      });
  }

  /**
   * Calcular estadísticas del historial
   */
  private calcularEstadisticas(data: HistorialMigracion[]): void {
    const exitosas = data.filter(m => m.estado === 'EXITOSO').length;
    const parciales = data.filter(m => m.estado === 'PARCIAL').length;
    const fallidas = data.filter(m => m.estado === 'FALLIDO').length;

    this.exitosas.set(exitosas);
    this.parciales.set(parciales);
    this.fallidas.set(fallidas);
  }
}
