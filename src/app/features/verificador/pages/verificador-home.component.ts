/**
 * ============================================================================
 * 🏠 VERIFICADOR HOME - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Dashboard principal del verificador con métricas y estadísticas
 * Se muestra al entrar al módulo de verificación
 *
 * ============================================================================
 */

import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { VerificacionService } from '../../../core/services/verificacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';

@Component({
  selector: 'app-verificador-home',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="p-6">
      <!-- Header con bienvenida -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Bienvenido, {{ currentUser()?.nombre }}
            </h1>
            <p class="text-gray-600 mt-1">Panel de Verificación de Salidas</p>
          </div>
          <div class="flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-sm">
            <app-icon name="user-circle" size="lg" className="text-honey-primary"></app-icon>
            <div>
              <p class="text-sm text-gray-600">Rol</p>
              <p class="font-semibold text-gray-900">{{ currentUser()?.role }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Métricas principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- En Tránsito -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
             (click)="navigateTo('/verificador/en-transito')">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-amber-100 p-3 rounded-full">
              <app-icon name="shopping-bag" size="lg" className="text-amber-600"></app-icon>
            </div>
            @if (loading()) {
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
            }
          </div>
          <h3 class="text-sm font-medium text-gray-600 mb-1">En Tránsito</h3>
          <p class="text-3xl font-bold text-gray-900">{{ metrics().enTransito }}</p>
          <p class="text-sm text-gray-500 mt-2">Salidas pendientes de verificar</p>
        </div>

        <!-- Verificadas Hoy -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
             (click)="navigateTo('/verificador/verificadas')">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-green-100 p-3 rounded-full">
              <app-icon name="check-circle" size="lg" className="text-green-600"></app-icon>
            </div>
            @if (loading()) {
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            }
          </div>
          <h3 class="text-sm font-medium text-gray-600 mb-1">Verificadas Hoy</h3>
          <p class="text-3xl font-bold text-gray-900">{{ metrics().verificadasHoy }}</p>
          <p class="text-sm text-gray-500 mt-2">Completadas en el día</p>
        </div>

        <!-- Total Tambores Verificados -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-blue-100 p-3 rounded-full">
              <app-icon name="hashtag" size="lg" className="text-blue-600"></app-icon>
            </div>
            @if (loading()) {
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            }
          </div>
          <h3 class="text-sm font-medium text-gray-600 mb-1">Tambores del Día</h3>
          <p class="text-3xl font-bold text-gray-900">{{ metrics().tamboresHoy }}</p>
          <p class="text-sm text-gray-500 mt-2">Total verificados</p>
        </div>

        <!-- Kilos Verificados Hoy -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-purple-100 p-3 rounded-full">
              <app-icon name="scale" size="lg" className="text-purple-600"></app-icon>
            </div>
            @if (loading()) {
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            }
          </div>
          <h3 class="text-sm font-medium text-gray-600 mb-1">Kilos del Día</h3>
          <p class="text-3xl font-bold text-gray-900">{{ metrics().kilosHoy | number: '1.0-0' }}</p>
          <p class="text-sm text-gray-500 mt-2">Kilogramos verificados</p>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Salidas en Tránsito -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center gap-3 mb-4">
            <app-icon name="shopping-bag" size="lg" className="text-honey-primary"></app-icon>
            <h2 class="text-xl font-bold text-gray-900">Salidas en Tránsito</h2>
          </div>
          <p class="text-gray-600 mb-4">
            Tienes <span class="font-bold text-honey-primary">{{ metrics().enTransito }}</span> salidas esperando verificación
          </p>
          <button
            (click)="navigateTo('/verificador/en-transito')"
            class="w-full bg-honey-primary hover:bg-honey-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
            <app-icon name="arrow-right" size="md" className="text-white"></app-icon>
            <span>Ver Salidas en Tránsito</span>
          </button>
        </div>

        <!-- Historial -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center gap-3 mb-4">
            <app-icon name="check-circle" size="lg" className="text-green-600"></app-icon>
            <h2 class="text-xl font-bold text-gray-900">Historial de Verificaciones</h2>
          </div>
          <p class="text-gray-600 mb-4">
            Consulta el historial completo de tus verificaciones realizadas
          </p>
          <button
            (click)="navigateTo('/verificador/verificadas')"
            class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
            <app-icon name="document-text" size="md" className="text-white"></app-icon>
            <span>Ver Verificaciones Completadas</span>
          </button>
        </div>
      </div>

      <!-- Información Adicional -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center gap-3 mb-4">
          <app-icon name="information-circle" size="lg" className="text-blue-600"></app-icon>
          <h2 class="text-xl font-bold text-gray-900">Guía de Verificación</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-start gap-3">
            <div class="bg-green-100 p-2 rounded-lg shrink-0">
              <app-icon name="check" size="md" className="text-green-600"></app-icon>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-1">Sin Diferencias</h3>
              <p class="text-sm text-gray-600">
                Marca el check simple cuando el tambor coincide exactamente con lo declarado
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="bg-yellow-100 p-2 rounded-lg shrink-0">
              <app-icon name="exclamation-triangle" size="md" className="text-yellow-600"></app-icon>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-1">Con Diferencias</h3>
              <p class="text-sm text-gray-600">
                Usa el formulario completo para registrar los datos reales verificados
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="bg-blue-100 p-2 rounded-lg shrink-0">
              <app-icon name="pencil" size="md" className="text-blue-600"></app-icon>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-1">Editable</h3>
              <p class="text-sm text-gray-600">
                Puedes modificar una verificación mientras la salida esté en tránsito
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="bg-purple-100 p-2 rounded-lg shrink-0">
              <app-icon name="bolt" size="md" className="text-purple-600"></app-icon>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-1">Finalizar</h3>
              <p class="text-sm text-gray-600">
                Solo puedes finalizar cuando todos los tambores estén verificados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerificadorHomeComponent implements OnInit {
  private verificacionService = inject(VerificacionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals
  loading = signal(false);
  currentUser = computed(() => this.authService.getCurrentUser());

  // Métricas
  metrics = signal({
    enTransito: 0,
    verificadasHoy: 0,
    tamboresHoy: 0,
    kilosHoy: 0
  });

  ngOnInit(): void {
    this.loadMetrics();
  }

  /**
   * Cargar métricas del dashboard
   */
  loadMetrics(): void {
    this.loading.set(true);

    // Obtener fecha de hoy
    const today = new Date().toISOString().split('T')[0];

    // Cargar llegadas en tránsito
    this.verificacionService.getLlegadas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (llegadas) => {
          const totalTambores = llegadas.reduce((sum, l) => sum + l.cantidadTamboresTotal, 0);
          this.metrics.update(m => ({
            ...m,
            enTransito: totalTambores
          }));
        },
        error: (error) => console.error('Error al cargar llegadas en tránsito:', error)
      });

    // Cargar verificaciones del día
    this.verificacionService.getMisVerificaciones({
      fechaDesde: today,
      fechaHasta: today,
      limit: 100
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const verificaciones = response.data || [];
          const totalTambores = verificaciones.reduce((sum, v) => sum + v.cantidadTambores, 0);
          const totalKilos = verificaciones.reduce((sum, v) => sum + v.kilosTotalesVerificados, 0);

          this.metrics.update(m => ({
            ...m,
            verificadasHoy: verificaciones.length,
            tamboresHoy: totalTambores,
            kilosHoy: totalKilos
          }));

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar verificaciones del día:', error);
          this.loading.set(false);
        }
      });
  }

  /**
   * Navegar a una ruta
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
