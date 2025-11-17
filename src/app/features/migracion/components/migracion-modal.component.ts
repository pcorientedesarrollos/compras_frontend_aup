/**
 * ============================================================================
 * MODAL DE MIGRACIÓN - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Modal para confirmar y ejecutar la migración de una salida verificada
 * al sistema legacy (apicultores2025)
 *
 * ============================================================================
 */

import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MigracionTamboresService } from '../services/migracion-tambores.service';
import { NotificationService } from '../../../core/services/notification.service';
import { VerificacionResponse } from '../../../core/models/verificador.model';
import { MigracionSalidaResponse } from '../../../core/models/migracion-tambores.model';

@Component({
  selector: 'app-migracion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
         (click)="onBackdropClick($event)">

      <!-- Modal Container -->
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
           (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="bg-gradient-to-r from-honey-primary to-honey-dark px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Migrar a Sistema Legacy (AUP)
            </h2>
            <button
              (click)="cerrar()"
              [disabled]="migrando()"
              class="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
              title="Cerrar">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6">
          @if (!migracionCompleta()) {
            <!-- Información de la Verificación -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 class="text-lg font-semibold text-blue-900 mb-3">Resumen de la Verificación</h3>

              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium text-blue-800">Folio:</span>
                  <span class="ml-2 text-blue-900">{{ verificacion.salidaFolio }}</span>
                </div>
                <div>
                  <span class="font-medium text-blue-800">N° Verificación:</span>
                  <span class="ml-2 text-blue-900">#{{ verificacion.numeroVerificacion }}</span>
                </div>
                <div>
                  <span class="font-medium text-blue-800">Proveedor:</span>
                  <span class="ml-2 text-blue-900">{{ verificacion.proveedorNombre }}</span>
                </div>
                <div>
                  <span class="font-medium text-blue-800">Chofer:</span>
                  <span class="ml-2 text-blue-900">{{ verificacion.choferNombre }}</span>
                </div>
                <div>
                  <span class="font-medium text-blue-800">Tambores:</span>
                  <span class="ml-2 text-blue-900 font-semibold">{{ verificacion.cantidadTambores }}</span>
                </div>
                <div>
                  <span class="font-medium text-blue-800">Kilos Totales:</span>
                  <span class="ml-2 text-blue-900 font-semibold">{{ verificacion.kilosTotalesVerificados | number: '1.2-2' }} kg</span>
                </div>
              </div>

              @if (verificacion.cantidadConDiferencias > 0) {
                <div class="mt-3 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                  <p class="text-sm text-yellow-800 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <strong>Atención:</strong> Esta verificación tiene {{ verificacion.cantidadConDiferencias }} tambor(es) con diferencias.
                  </p>
                </div>
              }
            </div>

            <!-- Observaciones -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Observaciones de la Migración (opcional)
              </label>
              <textarea
                [(ngModel)]="observaciones"
                [disabled]="migrando()"
                rows="3"
                placeholder="Agrega cualquier observación relevante sobre esta migración..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"></textarea>
              <p class="text-xs text-gray-500 mt-1">
                Estas observaciones quedarán registradas en el historial de migración
              </p>
            </div>

            <!-- Advertencia -->
            <div class="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
              <div class="flex gap-3">
                <svg class="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 class="text-sm font-semibold text-amber-800 mb-1">
                    Importante: Proceso de Migración
                  </h4>
                  <ul class="text-sm text-amber-700 space-y-1 list-disc list-inside">
                    <li>Se crearán registros en <strong>8 tablas</strong> del sistema legacy</li>
                    <li>El proceso es <strong>irreversible</strong></li>
                    <li>Validación automática antes de aceptar los datos</li>
                    <li>Quedará registrado en el historial de auditoría</li>
                  </ul>
                </div>
              </div>
            </div>

          } @else {
            <!-- Resultado de la Migración -->
            <div class="mb-6">
              @if (resultadoMigracion() && resultadoMigracion()!.data.tamboresExitosos === resultadoMigracion()!.data.totalTambores) {
                <!-- Migración Exitosa (100% de tambores exitosos) -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="bg-green-500 rounded-full p-2">
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-green-900">Migración Exitosa</h3>
                      <p class="text-sm text-green-700">{{ resultadoMigracion()!.message }}</p>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="font-medium text-gray-700">Folio generado:</span>
                      <span class="font-mono text-green-700">{{ resultadoMigracion()!.data.folio }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="font-medium text-gray-700">ID Almacén Encabezado:</span>
                      <span class="font-mono text-green-700">{{ resultadoMigracion()!.data.idAlmacenEncabezado }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="font-medium text-gray-700">ID Reporte Descarga:</span>
                      <span class="font-mono text-green-700">{{ resultadoMigracion()!.data.idReporteDescarga }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="font-medium text-gray-700">Tambores migrados:</span>
                      <span class="font-semibold text-green-700">{{ resultadoMigracion()!.data.tamboresExitosos }} / {{ resultadoMigracion()!.data.totalTambores }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="font-medium text-gray-700">Peso total neto:</span>
                      <span class="font-semibold text-green-700">{{ resultadoMigracion()!.data.totales.pesoTotalNeto | number: '1.2-2' }} kg</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="font-medium text-gray-700">Fecha de migración:</span>
                      <span class="text-gray-600">{{ resultadoMigracion()!.data.fechaVerificacion | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
                    </div>
                  </div>
                </div>
              } @else if (resultadoMigracion() && resultadoMigracion()!.data.tamboresExitosos > 0 && resultadoMigracion()!.data.tamboresFallidos > 0) {
                <!-- Migración Parcial (algunos tambores exitosos, algunos fallidos) -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="bg-yellow-500 rounded-full p-2">
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-yellow-900">Migración Parcial</h3>
                      <p class="text-sm text-yellow-700">{{ resultadoMigracion()!.message }}</p>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg p-4 space-y-2 mb-3">
                    <div class="flex justify-between text-sm">
                      <span class="font-medium text-gray-700">Tambores exitosos:</span>
                      <span class="font-semibold text-green-600">{{ resultadoMigracion()!.data.tamboresExitosos }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="font-medium text-gray-700">Tambores fallidos:</span>
                      <span class="font-semibold text-red-600">{{ resultadoMigracion()!.data.tamboresFallidos }}</span>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg p-4">
                    <h4 class="font-semibold text-yellow-900 mb-2">Tambores fallidos:</h4>
                    <ul class="list-disc list-inside space-y-1 text-sm text-yellow-800">
                      @for (tambor of resultadoMigracion()!.data.tambores; track tambor.tamborId) {
                        @if (tambor.estado === 'FALLIDO') {
                          <li>{{ tambor.consecutivo }} - {{ tambor.tipoMiel }}</li>
                        }
                      }
                    </ul>
                  </div>
                </div>
              } @else {
                <!-- Migración Fallida (todos los tambores fallaron) -->
                <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="bg-red-500 rounded-full p-2">
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-red-900">Migración Fallida</h3>
                      <p class="text-sm text-red-700">No se pudo migrar ningún tambor</p>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg p-4">
                    <h4 class="font-semibold text-red-900 mb-2">Tambores fallidos:</h4>
                    <ul class="list-disc list-inside space-y-1 text-sm text-red-800">
                      @for (tambor of resultadoMigracion()!.data.tambores; track tambor.tamborId) {
                        @if (tambor.estado === 'FALLIDO') {
                          <li>{{ tambor.consecutivo }} - {{ tambor.tipoMiel }}</li>
                        }
                      }
                    </ul>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          @if (!migracionCompleta()) {
            <button
              (click)="cerrar()"
              [disabled]="migrando()"
              class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Cancelar
            </button>
            <button
              (click)="confirmarMigracion()"
              [disabled]="migrando()"
              class="bg-gradient-to-r from-honey-primary to-honey-dark hover:from-honey-dark hover:to-honey-primary text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              @if (migrando()) {
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Migrando...</span>
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Confirmar Migración</span>
              }
            </button>
          } @else {
            <button
              (click)="cerrarConRecarga()"
              class="bg-honey-primary hover:bg-honey-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors">
              Cerrar
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class MigracionModalComponent {
  private migracionService = inject(MigracionTamboresService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  @Input({ required: true }) verificacion!: VerificacionResponse;
  @Output() close = new EventEmitter<boolean>();

  // State
  observaciones = signal('');
  migrando = signal(false);
  migracionCompleta = signal(false);
  resultadoMigracion = signal<MigracionSalidaResponse | null>(null);

  /**
   * Cerrar modal al hacer clic en el backdrop
   */
  onBackdropClick(event: MouseEvent): void {
    if (!this.migrando()) {
      this.cerrar();
    }
  }

  /**
   * Cerrar modal sin recargar
   */
  cerrar(): void {
    if (!this.migrando()) {
      this.close.emit(false);
    }
  }

  /**
   * Cerrar modal y recargar listado
   */
  cerrarConRecarga(): void {
    this.close.emit(true);
  }

  /**
   * Confirmar y ejecutar la migración
   */
  confirmarMigracion(): void {
    this.migrando.set(true);

    this.migracionService.migrarSalida(
      this.verificacion.verificacionId,
      this.observaciones() || undefined
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.resultadoMigracion.set(response);
          this.migracionCompleta.set(true);
          this.migrando.set(false);

          // Determinar el estado según tamboresExitosos vs tamboresFallidos
          const exitosos = response.data.tamboresExitosos;
          const total = response.data.totalTambores;

          if (exitosos === total) {
            // Todos exitosos
            this.notificationService.showSuccess(
              'Migración completada exitosamente'
            );
          } else if (exitosos > 0 && exitosos < total) {
            // Algunos exitosos, algunos fallidos
            this.notificationService.showWarning(
              'Migración completada parcialmente. Revisa los tambores fallidos.'
            );
          } else {
            // Todos fallidos
            this.notificationService.showError(
              'La migración falló. No se pudo migrar ningún tambor.'
            );
          }
        },
        error: (error) => {
          console.error('Error en la migración:', error);
          this.notificationService.showError(
            error.error?.message || 'Error al realizar la migración'
          );
          this.migrando.set(false);
        }
      });
  }
}
