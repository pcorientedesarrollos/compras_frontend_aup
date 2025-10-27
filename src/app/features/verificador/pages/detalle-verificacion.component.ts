/**
 * ============================================================================
 * 📄 DETALLE VERIFICACIÓN - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente de solo lectura para ver el detalle completo de una
 * verificación ya completada. Muestra comparación entre datos declarados
 * y verificados, con indicadores de diferencias.
 *
 * ============================================================================
 */

import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { VerificacionService } from '../../../core/services/verificacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DetalleVerificacionResponse } from '../../../core/models/verificador.model';

@Component({
  selector: 'app-detalle-verificacion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-100 p-6">
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-honey-primary mx-auto mb-4"></div>
            <p class="text-gray-600">Cargando detalle...</p>
          </div>
        </div>
      } @else if (detalle()) {
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-800">Detalle de Verificación</h1>
              <p class="text-gray-600 mt-1">
                Verificación #{{ detalle()!.numeroVerificacion }} - {{ detalle()!.salidaFolio }}
              </p>
            </div>
            <button
              (click)="volver()"
              class="text-gray-600 hover:text-gray-800 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </button>
          </div>

          <!-- Información General -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-sm text-gray-600">Proveedor</p>
              <p class="font-semibold text-gray-800">{{ detalle()!.proveedor.nombre }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Chofer</p>
              <p class="font-semibold text-gray-800">
                {{ detalle()!.chofer.nombre }}
                @if (detalle()!.chofer.alias) {
                  <span class="text-sm text-gray-500">"{{ detalle()!.chofer.alias }}"</span>
                }
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Fecha Salida</p>
              <p class="font-semibold text-gray-800">{{ detalle()!.fechaSalida | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Fecha Verificación</p>
              <p class="font-semibold text-gray-800">{{ detalle()!.fechaVerificacion | date: 'dd/MM/yyyy HH:mm' }}</p>
            </div>
          </div>

          <!-- Verificador -->
          <div class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600">Verificado por</p>
            <p class="font-semibold text-gray-800">
              {{ detalle()!.verificador.nombre }} - {{ detalle()!.verificador.empresa }}
            </p>
          </div>
        </div>

        <!-- Resumen -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow-md p-4">
            <p class="text-sm text-gray-600 mb-1">Total Tambores</p>
            <p class="text-2xl font-bold text-gray-800">{{ detalle()!.resumen.cantidadTambores }}</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-4">
            <p class="text-sm text-gray-600 mb-1">Con Diferencias</p>
            <p class="text-2xl font-bold text-yellow-600">{{ detalle()!.resumen.cantidadConDiferencias }}</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-4">
            <p class="text-sm text-gray-600 mb-1">Sin Diferencias</p>
            <p class="text-2xl font-bold text-green-600">{{ detalle()!.resumen.cantidadSinDiferencias }}</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-4">
            <p class="text-sm text-gray-600 mb-1">Diferencia Total</p>
            <p class="text-2xl font-bold"
               [class.text-red-600]="detalle()!.resumen.diferenciaTotal < 0"
               [class.text-green-600]="detalle()!.resumen.diferenciaTotal > 0"
               [class.text-gray-600]="detalle()!.resumen.diferenciaTotal === 0">
              {{ detalle()!.resumen.diferenciaTotal > 0 ? '+' : '' }}{{ detalle()!.resumen.diferenciaTotal | number: '1.2-2' }} kg
            </p>
            <p class="text-sm text-gray-500">{{ detalle()!.resumen.porcentajeDiferencia | number: '1.1-1' }}%</p>
          </div>
        </div>

        <!-- Lista de Tambores -->
        <div class="space-y-4 mb-6">
          @for (tambor of detalle()!.tambores; track tambor.detalleId; let i = $index) {
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
              <!-- Header -->
              <div class="px-6 py-4 border-b border-gray-200"
                   [class.bg-yellow-50]="tambor.tieneDiferencias"
                   [class.bg-green-50]="!tambor.tieneDiferencias">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                         [class.bg-yellow-500]="tambor.tieneDiferencias"
                         [class.bg-green-500]="!tambor.tieneDiferencias">
                      {{ i + 1 }}
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-800">
                        {{ tambor.tamborOriginal.consecutivo }}
                      </h3>
                    </div>
                  </div>
                  @if (tambor.tieneDiferencias) {
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                      ⚠️ Con Diferencias
                    </span>
                  } @else {
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      ✓ Sin Diferencias
                    </span>
                  }
                </div>
              </div>

              <!-- Contenido -->
              <div class="p-6">
                @if (tambor.tieneDiferencias) {
                  <!-- Comparación: Declarado vs Verificado -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Columna Declarado -->
                    <div class="bg-blue-50 rounded-lg p-4">
                      <h4 class="font-semibold text-blue-900 mb-3">📝 Declarado</h4>
                      <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                          <span class="text-gray-600">Kilos:</span>
                          <span class="font-semibold">{{ tambor.tamborOriginal.kilosDeclarados | number: '1.2-2' }} kg</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Humedad:</span>
                          <span class="font-semibold">{{ tambor.tamborOriginal.humedadDeclarada | number: '1.1-1' }}%</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Floración:</span>
                          <span class="font-semibold">{{ tambor.tamborOriginal.floracionDeclarada || 'N/A' }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Color:</span>
                          <span class="font-semibold">{{ tambor.tamborOriginal.colorDeclarado || 'N/A' }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Clasificación:</span>
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                [class.bg-green-100]="tambor.tamborOriginal.clasificacionDeclarada === 'EXPORTACION'"
                                [class.text-green-800]="tambor.tamborOriginal.clasificacionDeclarada === 'EXPORTACION'"
                                [class.bg-orange-100]="tambor.tamborOriginal.clasificacionDeclarada === 'NACIONAL'"
                                [class.text-orange-800]="tambor.tamborOriginal.clasificacionDeclarada === 'NACIONAL'">
                            {{ tambor.tamborOriginal.clasificacionDeclarada }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Columna Verificado -->
                    <div class="bg-green-50 rounded-lg p-4">
                      <h4 class="font-semibold text-green-900 mb-3">✅ Verificado</h4>
                      <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                          <span class="text-gray-600">Kilos:</span>
                          <span class="font-semibold">
                            {{ tambor.tamborVerificado!.kilosVerificados | number: '1.2-2' }} kg
                            @if (tambor.diferencias!.kilos !== 0) {
                              <span class="text-xs ml-1" [class.text-red-600]="tambor.diferencias!.kilos < 0" [class.text-green-600]="tambor.diferencias!.kilos > 0">
                                ({{ tambor.diferencias!.kilos > 0 ? '+' : '' }}{{ tambor.diferencias!.kilos | number: '1.2-2' }})
                              </span>
                            }
                          </span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Humedad:</span>
                          <span class="font-semibold">
                            {{ tambor.tamborVerificado!.humedadVerificada | number: '1.1-1' }}%
                            @if (tambor.diferencias!.humedad !== 0) {
                              <span class="text-xs ml-1" [class.text-red-600]="tambor.diferencias!.humedad < 0" [class.text-green-600]="tambor.diferencias!.humedad > 0">
                                ({{ tambor.diferencias!.humedad > 0 ? '+' : '' }}{{ tambor.diferencias!.humedad | number: '1.1-1' }})
                              </span>
                            }
                          </span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Floración:</span>
                          <span class="font-semibold">
                            {{ tambor.tamborVerificado!.floracionVerificada || 'N/A' }}
                            @if (tambor.diferencias!.cambioFloracion) {
                              <span class="text-xs ml-1 text-yellow-600">(Cambió)</span>
                            }
                          </span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Color:</span>
                          <span class="font-semibold">
                            {{ tambor.tamborVerificado!.colorVerificado || 'N/A' }}
                            @if (tambor.diferencias!.cambioColor) {
                              <span class="text-xs ml-1 text-yellow-600">(Cambió)</span>
                            }
                          </span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Clasificación:</span>
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                [class.bg-green-100]="tambor.tamborVerificado!.clasificacionVerificada === 'EXPORTACION'"
                                [class.text-green-800]="tambor.tamborVerificado!.clasificacionVerificada === 'EXPORTACION'"
                                [class.bg-orange-100]="tambor.tamborVerificado!.clasificacionVerificada === 'NACIONAL'"
                                [class.text-orange-800]="tambor.tamborVerificado!.clasificacionVerificada === 'NACIONAL'">
                            {{ tambor.tamborVerificado!.clasificacionVerificada }}
                            @if (tambor.diferencias!.cambioClasificacion) {
                              <span class="ml-1">(Cambió)</span>
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Observaciones -->
                  @if (tambor.observacionesVerificador) {
                    <div class="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p class="text-sm font-semibold text-gray-700 mb-1">Observaciones del Verificador:</p>
                      <p class="text-sm text-gray-700">{{ tambor.observacionesVerificador }}</p>
                    </div>
                  }
                } @else {
                  <!-- Sin diferencias -->
                  <div class="text-center py-4">
                    <p class="text-gray-600">
                      ✅ Este tambor fue verificado sin diferencias. Los datos declarados coinciden con los datos reales.
                    </p>
                    @if (tambor.observacionesVerificador) {
                      <p class="text-sm text-gray-500 mt-2">{{ tambor.observacionesVerificador }}</p>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Observaciones Generales -->
        @if (detalle()!.observacionesGenerales) {
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">Observaciones Generales</h3>
            <p class="text-gray-700">{{ detalle()!.observacionesGenerales }}</p>
          </div>
        }
      }
    </div>
  `
})
export class DetalleVerificacionComponent implements OnInit {
  private verificacionService = inject(VerificacionService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // Signals
  detalle = signal<DetalleVerificacionResponse | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const verificacionId = this.route.snapshot.params['id'];
    if (verificacionId) {
      this.cargarDetalle(verificacionId);
    }
  }

  /**
   * Cargar detalle de la verificación
   */
  cargarDetalle(id: string): void {
    this.loading.set(true);

    this.verificacionService.getDetalleVerificacion(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar detalle:', error);
          this.notificationService.showError('Error al cargar el detalle de la verificación');
          this.loading.set(false);
          this.volver();
        }
      });
  }

  /**
   * Volver a la lista de verificaciones completadas
   */
  volver(): void {
    this.router.navigate(['/verificador/verificadas']);
  }
}
