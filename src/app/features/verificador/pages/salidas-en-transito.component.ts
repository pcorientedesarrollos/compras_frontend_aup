/**
 * ============================================================================
 * LLEGADAS EN TRÁNSITO - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente que muestra las llegadas de chofer agrupadas
 * Cada card representa una llegada con datos resumidos
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
import { LlegadaChoferResponse, EstadoLlegada } from '../../../core/models/verificador.model';
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';
import { BeeLoaderComponent } from '../../../shared/components/bee-loader/bee-loader.component';

@Component({
  selector: 'app-salidas-en-transito',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, BeeLoaderComponent],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Llegadas en Tránsito</h1>
        <p class="text-gray-600 mt-1">Selecciona una llegada de chofer para verificar</p>
      </div>

      <!-- Filtros y Búsqueda -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Búsqueda -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div class="relative">
              <app-icon
                name="magnifying-glass"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size="md" />
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
                placeholder="Buscar por nombre de chofer..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent">
            </div>
          </div>

          <!-- Botón Refrescar -->
          <div class="flex items-end">
            <button
              (click)="loadLlegadas()"
              [disabled]="loading()"
              class="w-full bg-honey-primary hover:bg-honey-dark text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <app-icon
                [name]="loading() ? 'arrow-path' : 'arrow-path'"
                [className]="loading() ? 'animate-spin' : ''"
                size="md" />
              <span>{{ loading() ? 'Cargando...' : 'Refrescar' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Grid de Llegadas -->
      @if (loading()) {
        <app-bee-loader
          [fullscreen]="false"
          [message]="'Cargando llegadas en tránsito...'"
          [animation]="'bee-looking'" />
      } @else if (llegadasFiltradas().length === 0) {
        <div class="bg-white rounded-lg shadow-md">
          <div class="text-center py-12">
            <app-icon name="shopping-bag" className="text-gray-300 mx-auto mb-4" size="2xl" />
            <h3 class="text-lg font-semibold text-gray-700 mb-1">No hay llegadas en tránsito</h3>
            <p class="text-gray-500">No se encontraron llegadas pendientes de verificar</p>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (llegada of llegadasFiltradas(); track llegada.choferId) {
            <div
              class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer border-l-4"
              [class.border-amber-500]="llegada.estadoGeneral === 'PENDIENTE'"
              [class.border-blue-500]="llegada.estadoGeneral === 'EN_VERIFICACION'"
              [class.border-green-500]="llegada.estadoGeneral === 'VERIFICADA'"
              (click)="verDetalleLlegada(llegada.choferId)">

              <!-- Header del Card -->
              <div class="p-4 border-b border-gray-200">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <app-icon name="user" size="md" className="text-honey-primary" />
                      {{ llegada.choferNombre }}
                    </h3>
                    @if (llegada.choferAlias) {
                      <p class="text-sm text-gray-500 mt-1">"{{ llegada.choferAlias }}"</p>
                    }
                  </div>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    [class.bg-amber-100]="llegada.estadoGeneral === 'PENDIENTE'"
                    [class.text-amber-800]="llegada.estadoGeneral === 'PENDIENTE'"
                    [class.bg-blue-100]="llegada.estadoGeneral === 'EN_VERIFICACION'"
                    [class.text-blue-800]="llegada.estadoGeneral === 'EN_VERIFICACION'"
                    [class.bg-green-100]="llegada.estadoGeneral === 'VERIFICADA'"
                    [class.text-green-800]="llegada.estadoGeneral === 'VERIFICADA'">
                    {{ getEstadoLabel(llegada.estadoGeneral) }}
                  </span>
                </div>
                <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <app-icon name="clock" size="sm" className="text-gray-400" />
                  {{ llegada.fechaLlegada | date: 'dd/MM/yyyy HH:mm' }}
                </div>
              </div>

              <!-- Estadísticas -->
              <div class="p-4 grid grid-cols-2 gap-3">
                <!-- Proveedores -->
                <div class="bg-purple-50 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <app-icon name="building-office" size="sm" className="text-purple-600" />
                    <span class="text-xs text-purple-600 font-medium">Proveedores</span>
                  </div>
                  <p class="text-2xl font-bold text-purple-700">{{ llegada.cantidadProveedores }}</p>
                </div>

                <!-- Salidas -->
                <div class="bg-blue-50 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <app-icon name="document-text" size="sm" className="text-blue-600" />
                    <span class="text-xs text-blue-600 font-medium">Salidas</span>
                  </div>
                  <p class="text-2xl font-bold text-blue-700">{{ llegada.cantidadSalidas }}</p>
                </div>

                <!-- Tambores -->
                <div class="bg-amber-50 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <app-icon name="shopping-bag" size="sm" className="text-amber-600" />
                    <span class="text-xs text-amber-600 font-medium">Tambores</span>
                  </div>
                  <p class="text-2xl font-bold text-amber-700">{{ llegada.cantidadTamboresTotal }}</p>
                </div>

                <!-- Kilos -->
                <div class="bg-green-50 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <app-icon name="scale" size="sm" className="text-green-600" />
                    <span class="text-xs text-green-600 font-medium">Kilos</span>
                  </div>
                  <p class="text-lg font-bold text-green-700">{{ llegada.kilosTotales | number: '1.0-0' }}</p>
                </div>
              </div>

              <!-- Progreso de Verificación -->
              @if (llegada.estadoGeneral !== 'PENDIENTE') {
                <div class="px-4 pb-4">
                  <div class="bg-gray-100 rounded-lg p-3">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-xs font-medium text-gray-600">Progreso</span>
                      <span class="text-xs font-semibold text-gray-700">
                        {{ calcularTamboresVerificados(llegada) }} / {{ llegada.cantidadTamboresTotal }}
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-honey-primary rounded-full h-2 transition-all duration-300"
                        [style.width.%]="calcularProgreso(llegada)">
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- Footer con botón de acción -->
              <div class="p-4 bg-gray-50 border-t border-gray-200">
                <button
                  (click)="verDetalleLlegada(llegada.choferId); $event.stopPropagation()"
                  class="w-full bg-honey-primary hover:bg-honey-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <app-icon name="check-circle" size="md" />
                  <span>Verificar Llegada</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SalidasEnTransitoComponent implements OnInit {
  private verificacionService = inject(VerificacionService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals
  llegadas = signal<LlegadaChoferResponse[]>([]);
  loading = signal(false);
  searchTerm = signal('');

  // Computed signals
  llegadasFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.llegadas();

    return this.llegadas().filter(llegada =>
      llegada.choferNombre.toLowerCase().includes(term) ||
      (llegada.choferAlias && llegada.choferAlias.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void {
    this.loadLlegadas();
  }

  /**
   * Cargar llegadas desde el backend
   */
  loadLlegadas(): void {
    this.loading.set(true);

    this.verificacionService.getLlegadas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (llegadas) => {
          this.llegadas.set(llegadas);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar llegadas:', error);
          this.notificationService.showError('Error al cargar las llegadas en tránsito');
          this.loading.set(false);
        }
      });
  }

  /**
   * Manejar cambios en la búsqueda
   */
  onSearchChange(): void {
    // Búsqueda reactiva automática mediante computed
  }

  /**
   * Ver detalle de una llegada
   */
  verDetalleLlegada(choferId: string): void {
    this.router.navigate(['/verificador/llegada', choferId]);
  }

  /**
   * Calcular total de tambores verificados en una llegada
   */
  calcularTamboresVerificados(llegada: LlegadaChoferResponse): number {
    return llegada.salidas.reduce((sum, salida) => sum + salida.tamboresVerificados, 0);
  }

  /**
   * Calcular porcentaje de progreso de verificación
   */
  calcularProgreso(llegada: LlegadaChoferResponse): number {
    const verificados = this.calcularTamboresVerificados(llegada);
    return (verificados / llegada.cantidadTamboresTotal) * 100;
  }

  /**
   * Obtener label del estado en español
   */
  getEstadoLabel(estado: EstadoLlegada): string {
    const labels: Record<EstadoLlegada, string> = {
      'PENDIENTE': 'Pendiente',
      'EN_VERIFICACION': 'En Verificación',
      'VERIFICADA': 'Verificada'
    };
    return labels[estado] || estado;
  }
}
