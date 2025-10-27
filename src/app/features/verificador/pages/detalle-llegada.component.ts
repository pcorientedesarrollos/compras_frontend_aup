/**
 * ============================================================================
 * DETALLE DE LLEGADA - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Vista jerárquica de una llegada de chofer
 * Organización: Chofer → Proveedores → Salidas → Tambores
 * Permite verificar tambores y finalizar salidas
 *
 * ============================================================================
 */

import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { VerificacionService } from '../../../core/services/verificacion.service';
import { EntradaMielService } from '../../../core/services/entrada-miel.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  DetalleLlegadaParaVerificar,
  ProveedorEnLlegada,
  SalidaConTambores,
  TamborParaVerificar,
  VerificarTamborDTO
} from '../../../core/models/verificador.model';
import { Floracion, ColorMiel } from '../../../core/models/entrada-miel.model';
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';

@Component({
  selector: 'app-detalle-llegada',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IconComponent],
  template: `
    <div class="p-6">
      <!-- Header con botón volver -->
      <div class="mb-6">
        <button
          (click)="volver()"
          class="mb-4 flex items-center gap-2 text-honey-primary hover:text-honey-dark transition-colors">
          <app-icon name="arrow-left" size="md" />
          <span class="font-medium">Volver a Llegadas</span>
        </button>

        @if (llegada()) {
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <app-icon name="user" size="xl" className="text-honey-primary" />
                  {{ llegada()!.choferNombre }}
                </h1>
                @if (llegada()!.choferAlias) {
                  <p class="text-gray-600 mt-1 ml-12">"{{ llegada()!.choferAlias }}"</p>
                }
                <div class="mt-2 ml-12 flex items-center gap-2 text-sm text-gray-500">
                  <app-icon name="clock" size="sm" className="text-gray-400" />
                  Llegada: {{ llegada()!.fechaLlegada | date: 'dd/MM/yyyy HH:mm' }}
                </div>
              </div>

              <!-- Resumen General -->
              <div class="flex gap-4">
                <div class="text-center bg-purple-50 rounded-lg px-4 py-3">
                  <app-icon name="building-office" size="md" className="text-purple-600 mx-auto mb-1" />
                  <p class="text-2xl font-bold text-purple-700">{{ llegada()!.resumen.cantidadProveedores }}</p>
                  <p class="text-xs text-purple-600">Proveedores</p>
                </div>
                <div class="text-center bg-blue-50 rounded-lg px-4 py-3">
                  <app-icon name="document-text" size="md" className="text-blue-600 mx-auto mb-1" />
                  <p class="text-2xl font-bold text-blue-700">{{ llegada()!.resumen.cantidadSalidas }}</p>
                  <p class="text-xs text-blue-600">Salidas</p>
                </div>
                <div class="text-center bg-amber-50 rounded-lg px-4 py-3">
                  <app-icon name="shopping-bag" size="md" className="text-amber-600 mx-auto mb-1" />
                  <p class="text-2xl font-bold text-amber-700">{{ llegada()!.resumen.cantidadTamboresTotal }}</p>
                  <p class="text-xs text-amber-600">Tambores</p>
                </div>
                <div class="text-center bg-green-50 rounded-lg px-4 py-3">
                  <app-icon name="scale" size="md" className="text-green-600 mx-auto mb-1" />
                  <p class="text-2xl font-bold text-green-700">{{ llegada()!.resumen.kilosTotales | number: '1.0-0' }}</p>
                  <p class="text-xs text-green-600">Kilos</p>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-honey-primary mx-auto mb-4"></div>
            <p class="text-gray-600">Cargando detalle de llegada...</p>
          </div>
        </div>
      }

      <!-- Proveedores (Jerárquico) -->
      @if (llegada()) {
        <div class="space-y-6">
          @for (proveedor of llegada()!.proveedores; track proveedor.proveedorId) {
            <div class="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-purple-500">
              <!-- Header del Proveedor -->
              <div class="bg-purple-50 p-4 border-b border-purple-100">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <app-icon name="building-office" size="lg" className="text-purple-600" />
                    <div>
                      <h2 class="text-xl font-bold text-purple-900">{{ proveedor.proveedorNombre }}</h2>
                      <div class="flex gap-4 mt-1 text-sm text-purple-700">
                        <span>{{ proveedor.resumenProveedor.cantidadSalidas }} salidas</span>
                        <span>{{ proveedor.resumenProveedor.cantidadTambores }} tambores</span>
                        <span>{{ proveedor.resumenProveedor.kilosTotales | number: '1.2-2' }} kg</span>
                      </div>
                    </div>
                  </div>
                  <button
                    (click)="toggleProveedor(proveedor.proveedorId)"
                    class="p-2 hover:bg-purple-100 rounded-lg transition-colors">
                    <app-icon
                      [name]="proveedorExpandido(proveedor.proveedorId) ? 'chevron-up' : 'chevron-down'"
                      size="md"
                      className="text-purple-600" />
                  </button>
                </div>
              </div>

              <!-- Salidas del Proveedor -->
              @if (proveedorExpandido(proveedor.proveedorId)) {
                <div class="p-4 space-y-4">
                  @for (salida of proveedor.salidas; track salida.salidaId) {
                    <div class="bg-gray-50 rounded-lg border border-gray-200">
                      <!-- Header de Salida -->
                      <div class="bg-blue-50 p-3 border-b border-blue-100 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <app-icon name="document-text" size="md" className="text-blue-600" />
                          <div>
                            <h3 class="font-semibold text-blue-900">{{ salida.folio }}</h3>
                            <p class="text-xs text-blue-700">{{ salida.fecha | date: 'dd/MM/yyyy' }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          @if (todosTamboresVerificados(salida)) {
                            <button
                              (click)="finalizarSalida(salida.salidaId)"
                              [disabled]="procesando()"
                              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                              <app-icon name="check-circle" size="sm" />
                              <span>Finalizar Salida</span>
                            </button>
                          }
                          <button
                            (click)="toggleSalida(salida.salidaId)"
                            class="p-2 hover:bg-blue-100 rounded-lg transition-colors">
                            <app-icon
                              [name]="salidaExpandida(salida.salidaId) ? 'chevron-up' : 'chevron-down'"
                              size="md"
                              className="text-blue-600" />
                          </button>
                        </div>
                      </div>

                      <!-- Tambores de la Salida -->
                      @if (salidaExpandida(salida.salidaId)) {
                        <div class="p-4">
                          <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                              <thead class="bg-gray-100">
                                <tr>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tambor</th>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo Miel</th>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Floración</th>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Kilos</th>
                                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Humedad %</th>
                                  <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Clasificación</th>
                                  <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                  <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                              </thead>
                              <tbody class="bg-white divide-y divide-gray-200">
                                @for (tambor of salida.tambores; track tambor.detalleId) {
                                  <tr
                                    [class.bg-green-50]="tambor.verificado && !tambor.tieneDiferencias"
                                    [class.bg-yellow-50]="tambor.verificado && tambor.tieneDiferencias">
                                    <td class="px-4 py-3 whitespace-nowrap">
                                      <div class="text-sm font-medium text-gray-900">{{ tambor.tamborConsecutivo }}</div>
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap">
                                      <div class="text-sm text-gray-700">{{ tambor.tipoMielNombre }}</div>
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap">
                                      @if (!tambor.verificado || !tambor.tieneDiferencias) {
                                        <div class="text-sm text-gray-700">{{ tambor.floracionNombre || 'N/A' }}</div>
                                      } @else {
                                        <div class="text-xs">
                                          <del class="text-gray-400">{{ tambor.floracionNombre }}</del>
                                          <div class="font-semibold text-amber-700">{{ tambor.floracionVerificadaNombre }}</div>
                                        </div>
                                      }
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap">
                                      @if (!tambor.verificado || !tambor.tieneDiferencias) {
                                        <div class="text-sm text-gray-700">{{ tambor.colorNombre || 'N/A' }}</div>
                                      } @else {
                                        <div class="text-xs">
                                          <del class="text-gray-400">{{ tambor.colorNombre }}</del>
                                          <div class="font-semibold text-amber-700">{{ tambor.colorVerificadoNombre }}</div>
                                        </div>
                                      }
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-right">
                                      @if (!tambor.verificado || !tambor.tieneDiferencias) {
                                        <div class="text-sm font-medium text-gray-900">{{ tambor.kilosDeclarados | number: '1.2-2' }}</div>
                                      } @else {
                                        <div class="text-xs">
                                          <del class="text-gray-400">{{ tambor.kilosDeclarados | number: '1.2-2' }}</del>
                                          <div class="font-semibold text-amber-700">{{ tambor.kilosVerificados | number: '1.2-2' }}</div>
                                        </div>
                                      }
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-right">
                                      @if (!tambor.verificado || !tambor.tieneDiferencias) {
                                        <div class="text-sm text-gray-900">{{ tambor.humedadPromedio | number: '1.2-2' }}%</div>
                                      } @else {
                                        <div class="text-xs">
                                          <del class="text-gray-400">{{ tambor.humedadPromedio | number: '1.2-2' }}%</del>
                                          <div class="font-semibold text-amber-700">{{ tambor.humedadVerificada | number: '1.2-2' }}%</div>
                                        </div>
                                      }
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-center">
                                      <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                        [class.bg-green-100]="(tambor.clasificacionVerificada || tambor.clasificacion) === 'EXPORTACION'"
                                        [class.text-green-800]="(tambor.clasificacionVerificada || tambor.clasificacion) === 'EXPORTACION'"
                                        [class.bg-blue-100]="(tambor.clasificacionVerificada || tambor.clasificacion) === 'NACIONAL'"
                                        [class.text-blue-800]="(tambor.clasificacionVerificada || tambor.clasificacion) === 'NACIONAL'">
                                        {{ tambor.clasificacionVerificada || tambor.clasificacion }}
                                      </span>
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-center">
                                      @if (!tambor.verificado) {
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                          Pendiente
                                        </span>
                                      } @else if (tambor.tieneDiferencias) {
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                          Con diferencias
                                        </span>
                                      } @else {
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                          Conforme
                                        </span>
                                      }
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-center">
                                      @if (!tambor.verificado) {
                                        <div class="flex gap-2 justify-center">
                                          <button
                                            (click)="verificarSinDiferencias(salida.salidaId, tambor)"
                                            [disabled]="procesando()"
                                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                            title="Marcar como conforme">
                                            <app-icon name="check" size="sm" />
                                            OK
                                          </button>
                                          <button
                                            (click)="abrirModalVerificar(salida.salidaId, tambor)"
                                            [disabled]="procesando()"
                                            class="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                            title="Registrar diferencias">
                                            <app-icon name="pencil" size="sm" />
                                            Diferencias
                                          </button>
                                        </div>
                                      } @else {
                                        <span class="text-green-600 font-semibold flex items-center justify-center gap-1">
                                          <app-icon name="check-circle" size="md" />
                                        </span>
                                      }
                                    </td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Modal de Verificación con Diferencias -->
      @if (modalVerificacion()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="bg-honey-primary p-4 flex items-center justify-between">
              <h3 class="text-xl font-bold text-white flex items-center gap-2">
                <app-icon name="pencil" size="lg" className="text-white" />
                Registrar Diferencias - {{ tamborSeleccionado()?.tamborConsecutivo }}
              </h3>
              <button
                (click)="cerrarModal()"
                class="text-white hover:text-gray-200 transition-colors">
                <app-icon name="x-mark" size="lg" />
              </button>
            </div>

            <form [formGroup]="formVerificacion" (ngSubmit)="verificarConDiferencias()" class="p-6 space-y-4">
              <!-- Datos Declarados (Solo lectura) -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <app-icon name="document-text" size="md" className="text-gray-600" />
                  Datos Declarados
                </h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-600">Kilos:</span>
                    <span class="ml-2 font-semibold">{{ tamborSeleccionado()?.kilosDeclarados | number: '1.2-2' }} kg</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Humedad:</span>
                    <span class="ml-2 font-semibold">{{ tamborSeleccionado()?.humedadPromedio | number: '1.2-2' }}%</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Floración:</span>
                    <span class="ml-2 font-semibold">{{ tamborSeleccionado()?.floracionNombre || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Color:</span>
                    <span class="ml-2 font-semibold">{{ tamborSeleccionado()?.colorNombre || 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <!-- Datos Verificados (Formulario) -->
              <div class="space-y-4">
                <h4 class="font-semibold text-gray-700 flex items-center gap-2">
                  <app-icon name="check-circle" size="md" className="text-honey-primary" />
                  Datos Verificados
                </h4>

                <div class="grid grid-cols-2 gap-4">
                  <!-- Kilos Verificados -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Kilos Verificados</label>
                    <input
                      type="number"
                      step="0.01"
                      formControlName="kilosVerificados"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent"
                      [placeholder]="(tamborSeleccionado()?.kilosDeclarados || 0).toString()">
                  </div>

                  <!-- Humedad Verificada -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Humedad Verificada (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      formControlName="humedadVerificada"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent"
                      [placeholder]="(tamborSeleccionado()?.humedadPromedio || 0).toString()">
                  </div>

                  <!-- Floración Verificada -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Floración Verificada</label>
                    <select
                      formControlName="floracionVerificadaId"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent">
                      <option [value]="null">{{ tamborSeleccionado()?.floracionNombre || 'Sin cambios' }}</option>
                      @for (floracion of floraciones(); track floracion.idFloracion) {
                        <option [value]="floracion.idFloracion">{{ floracion.floracion }}</option>
                      }
                    </select>
                  </div>

                  <!-- Color Verificado -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Color Verificado</label>
                    <select
                      formControlName="colorVerificadoId"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent">
                      <option [value]="null">{{ tamborSeleccionado()?.colorNombre || 'Sin cambios' }}</option>
                      @for (color of colores(); track color.idColor) {
                        <option [value]="color.idColor">{{ color.color }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Observaciones -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones del Verificador</label>
                  <textarea
                    formControlName="observacionesVerificador"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent"
                    placeholder="Describe las diferencias encontradas..."></textarea>
                </div>
              </div>

              <!-- Botones -->
              <div class="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  (click)="cerrarModal()"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="procesando()"
                  class="px-6 py-2 bg-honey-primary hover:bg-honey-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  <app-icon name="check-circle" size="md" />
                  <span>{{ procesando() ? 'Guardando...' : 'Guardar Verificación' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class DetalleLlegadaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private verificacionService = inject(VerificacionService);
  private entradaMielService = inject(EntradaMielService);
  private notificationService = inject(NotificationService);

  // Signals
  llegada = signal<DetalleLlegadaParaVerificar | null>(null);
  loading = signal(false);
  procesando = signal(false);
  modalVerificacion = signal(false);
  tamborSeleccionado = signal<TamborParaVerificar | null>(null);
  salidaSeleccionadaId = signal<string>('');

  floraciones = signal<Floracion[]>([]);
  colores = signal<ColorMiel[]>([]);

  // Control de expansión
  private proveedoresExpandidos = signal<Set<number>>(new Set());
  private salidasExpandidas = signal<Set<string>>(new Set());

  // Formulario de verificación
  formVerificacion: FormGroup = this.fb.group({
    kilosVerificados: [null, [Validators.min(0)]],
    humedadVerificada: [null, [Validators.min(0), Validators.max(100)]],
    floracionVerificadaId: [null],
    colorVerificadoId: [null],
    observacionesVerificador: ['']
  });

  ngOnInit(): void {
    const choferId = this.route.snapshot.paramMap.get('choferId');
    if (choferId) {
      this.cargarDetalleLlegada(choferId);
      this.cargarCatalogos();
    }
  }

  /**
   * Cargar detalle completo de la llegada
   */
  cargarDetalleLlegada(choferId: string): void {
    this.loading.set(true);

    this.verificacionService.getDetalleLlegada(choferId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (llegada) => {
          this.llegada.set(llegada);
          // Expandir todos los proveedores por defecto
          const proveedorIds = new Set(llegada.proveedores.map(p => p.proveedorId));
          this.proveedoresExpandidos.set(proveedorIds);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar detalle:', error);
          this.notificationService.showError('Error al cargar el detalle de la llegada');
          this.loading.set(false);
        }
      });
  }

  /**
   * Cargar catálogos (floraciones y colores)
   */
  cargarCatalogos(): void {
    this.entradaMielService.getFloraciones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (floraciones) => this.floraciones.set(floraciones),
        error: (error) => console.error('Error al cargar floraciones:', error)
      });

    this.entradaMielService.getColores()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (colores) => this.colores.set(colores),
        error: (error) => console.error('Error al cargar colores:', error)
      });
  }

  /**
   * Toggle expansión de proveedor
   */
  toggleProveedor(proveedorId: number): void {
    const expandidos = new Set(this.proveedoresExpandidos());
    if (expandidos.has(proveedorId)) {
      expandidos.delete(proveedorId);
    } else {
      expandidos.add(proveedorId);
    }
    this.proveedoresExpandidos.set(expandidos);
  }

  proveedorExpandido(proveedorId: number): boolean {
    return this.proveedoresExpandidos().has(proveedorId);
  }

  /**
   * Toggle expansión de salida
   */
  toggleSalida(salidaId: string): void {
    const expandidas = new Set(this.salidasExpandidas());
    if (expandidas.has(salidaId)) {
      expandidas.delete(salidaId);
    } else {
      expandidas.add(salidaId);
    }
    this.salidasExpandidas.set(expandidas);
  }

  salidaExpandida(salidaId: string): boolean {
    return this.salidasExpandidas().has(salidaId);
  }

  /**
   * Verificar tambor sin diferencias (marca como conforme)
   */
  verificarSinDiferencias(salidaId: string, tambor: TamborParaVerificar): void {
    const data: VerificarTamborDTO = { verificado: true };

    this.procesando.set(true);
    this.verificacionService.verificarTambor(salidaId, tambor.detalleId, data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Tambor verificado como conforme');
          this.procesando.set(false);
          // Recargar llegada
          const choferId = this.route.snapshot.paramMap.get('choferId');
          if (choferId) this.cargarDetalleLlegada(choferId);
        },
        error: (error) => {
          console.error('Error al verificar tambor:', error);
          this.notificationService.showError('Error al verificar el tambor');
          this.procesando.set(false);
        }
      });
  }

  /**
   * Abrir modal para registrar diferencias
   */
  abrirModalVerificar(salidaId: string, tambor: TamborParaVerificar): void {
    this.tamborSeleccionado.set(tambor);
    this.salidaSeleccionadaId.set(salidaId);
    this.formVerificacion.reset();
    this.modalVerificacion.set(true);
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    this.modalVerificacion.set(false);
    this.tamborSeleccionado.set(null);
    this.salidaSeleccionadaId.set('');
    this.formVerificacion.reset();
  }

  /**
   * Verificar tambor con diferencias
   */
  verificarConDiferencias(): void {
    if (!this.tamborSeleccionado() || !this.salidaSeleccionadaId()) return;

    const formValue = this.formVerificacion.value;
    const data: VerificarTamborDTO = {
      verificado: true,
      kilosVerificados: formValue.kilosVerificados || undefined,
      humedadVerificada: formValue.humedadVerificada || undefined,
      floracionVerificadaId: formValue.floracionVerificadaId || undefined,
      colorVerificadoId: formValue.colorVerificadoId || undefined,
      observacionesVerificador: formValue.observacionesVerificador || undefined
    };

    this.procesando.set(true);
    this.verificacionService.verificarTambor(
      this.salidaSeleccionadaId(),
      this.tamborSeleccionado()!.detalleId,
      data
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Tambor verificado con diferencias registradas');
          this.procesando.set(false);
          this.cerrarModal();
          // Recargar llegada
          const choferId = this.route.snapshot.paramMap.get('choferId');
          if (choferId) this.cargarDetalleLlegada(choferId);
        },
        error: (error) => {
          console.error('Error al verificar tambor:', error);
          this.notificationService.showError('Error al verificar el tambor');
          this.procesando.set(false);
        }
      });
  }

  /**
   * Verificar si todos los tambores de una salida están verificados
   */
  todosTamboresVerificados(salida: SalidaConTambores): boolean {
    return salida.tambores.every(t => t.verificado);
  }

  /**
   * Finalizar verificación de una salida
   */
  finalizarSalida(salidaId: string): void {
    this.procesando.set(true);

    this.verificacionService.finalizarVerificacionSalida(salidaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resumen) => {
          this.notificationService.showSuccess(`Salida ${resumen.folio} finalizada exitosamente`);
          this.procesando.set(false);
          // Recargar llegada
          const choferId = this.route.snapshot.paramMap.get('choferId');
          if (choferId) this.cargarDetalleLlegada(choferId);
        },
        error: (error) => {
          console.error('Error al finalizar salida:', error);
          this.notificationService.showError('Error al finalizar la salida');
          this.procesando.set(false);
        }
      });
  }

  /**
   * Volver a la lista de llegadas
   */
  volver(): void {
    this.router.navigate(['/verificador/en-transito']);
  }
}
