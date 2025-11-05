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
import { BeeLoaderComponent } from '../../../shared/components/bee-loader/bee-loader.component';

@Component({
  selector: 'app-detalle-llegada',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IconComponent, BeeLoaderComponent],
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
              <div class="flex-1">
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

              <!-- 🚀 Botón Finalizar Todo - DESHABILITADO TEMPORALMENTE POR PROBLEMAS DE UX -->
              <!-- @if (salidasListasParaFinalizar().length > 0) {
                <div class="mr-4">
                  <button
                    (click)="abrirModalFinalizarTodo()"
                    [disabled]="finalizandoTodo()"
                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg">
                    <app-icon name="shield-check" size="lg" />
                    <div class="text-left">
                      <div class="text-sm font-bold">Finalizar Todas</div>
                      <div class="text-xs opacity-90">{{ salidasListasParaFinalizar().length }} salidas listas</div>
                    </div>
                  </button>
                </div>
              } -->

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
        <app-bee-loader
          [fullscreen]="false"
          [message]="'Cargando detalle de llegada...'"
          [animation]="'bee-lieve'" />
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
                              [disabled]="finalizandoSalidaId() === salida.salidaId"
                              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                              @if (finalizandoSalidaId() === salida.salidaId) {
                                <app-icon name="arrow-path" size="sm" className="animate-spin" />
                                <span>Finalizando...</span>
                              } @else {
                                <app-icon name="check-circle" size="sm" />
                                <span>Finalizar Salida</span>
                              }
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
                                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tara (kg)</th>
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
                                          <del class="text-gray-400">{{ tambor.floracionNombre || 'N/A' }}</del>
                                          <div class="font-semibold text-amber-700">{{ tambor.floracionVerificadaNombre || tambor.floracionNombre || 'N/A' }}</div>
                                        </div>
                                      }
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap">
                                      @if (!tambor.verificado || !tambor.tieneDiferencias) {
                                        <div class="text-sm text-gray-700">{{ tambor.colorNombre || 'N/A' }}</div>
                                      } @else {
                                        <div class="text-xs">
                                          <del class="text-gray-400">{{ tambor.colorNombre || 'N/A' }}</del>
                                          <div class="font-semibold text-amber-700">{{ tambor.colorVerificadoNombre || tambor.colorNombre || 'N/A' }}</div>
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
                                        <div class="text-sm text-gray-900">{{ tambor.taraCapturada || 0 | number: '1.2-2' }}</div>
                                      } @else {
                                        <div class="text-xs">
                                          <del class="text-gray-400">{{ tambor.taraCapturada || 0 | number: '1.2-2' }}</del>
                                          <div class="font-semibold text-amber-700">{{ tambor.taraVerificada || tambor.taraCapturada || 0 | number: '1.2-2' }}</div>
                                        </div>
                                      }
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-right">
                                      @if (!tambor.verificado || !tambor.tieneDiferencias) {
                                        <div class="text-sm text-gray-900">{{ tambor.humedadPromedio | number: '1.2-2' }}%</div>
                                      } @else {
                                        <div class="text-xs">
                                          <del class="text-gray-400">{{ tambor.humedadPromedio | number: '1.2-2' }}%</del>
                                          <div class="font-semibold text-amber-700">{{ tambor.humedadVerificada || tambor.humedadPromedio | number: '1.2-2' }}%</div>
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

                  <!-- Tara Verificada -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tara Verificada (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      formControlName="taraVerificada"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-honey-primary focus:border-transparent"
                      placeholder="0.00">
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

      <!-- 🚀 Modal Finalizar Todo -->
      @if (modalFinalizarTodo()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div class="bg-green-600 p-4 flex items-center justify-between">
              <h3 class="text-xl font-bold text-white flex items-center gap-2">
                <app-icon name="shield-check" size="lg" className="text-white" />
                Finalizar Todas las Salidas
              </h3>
              @if (!finalizandoTodo()) {
                <button
                  (click)="cerrarModalFinalizarTodo()"
                  class="text-white hover:text-gray-200 transition-colors">
                  <app-icon name="x-mark" size="lg" />
                </button>
              }
            </div>

            <div class="p-6 space-y-4">
              @if (!finalizandoTodo()) {
                <!-- Confirmación -->
                <div class="text-center">
                  <div class="bg-green-50 rounded-lg p-4 mb-4">
                    <p class="text-lg font-semibold text-gray-800 mb-2">
                      ¿Deseas finalizar todas las salidas verificadas?
                    </p>
                    <p class="text-gray-600">
                      Se procesarán <span class="font-bold text-green-600">{{ salidasListasParaFinalizar().length }}</span> salidas
                    </p>
                  </div>

                  <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div class="flex items-start gap-2">
                      <app-icon name="exclamation-triangle" size="md" className="text-amber-600 mt-0.5" />
                      <p class="text-sm text-amber-800 text-left">
                        Esta acción marcará todas las salidas como <strong>VERIFICADAS</strong> y no se podrá deshacer.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Botones -->
                <div class="flex gap-3 justify-end">
                  <button
                    type="button"
                    (click)="cerrarModalFinalizarTodo()"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    (click)="finalizarTodasLasSalidas()"
                    class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2">
                    <app-icon name="check-circle" size="md" />
                    <span>Confirmar y Finalizar</span>
                  </button>
                </div>
              } @else {
                <!-- Progress Bar -->
                <div class="text-center">
                  <div class="mb-4">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                    <p class="text-lg font-semibold text-gray-800 mb-1">
                      Finalizando salidas...
                    </p>
                    <p class="text-gray-600">
                      {{ progresoFinalizacion().actual }} de {{ progresoFinalizacion().total }}
                    </p>
                  </div>

                  <!-- Barra de progreso -->
                  <div class="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                      class="bg-green-600 rounded-full h-4 transition-all duration-300 flex items-center justify-center"
                      [style.width.%]="(progresoFinalizacion().actual / progresoFinalizacion().total) * 100">
                      <span class="text-xs text-white font-semibold">
                        {{ ((progresoFinalizacion().actual / progresoFinalizacion().total) * 100).toFixed(0) }}%
                      </span>
                    </div>
                  </div>

                  <p class="text-sm text-gray-500 mt-4">
                    Por favor, no cierres esta ventana...
                  </p>
                </div>
              }
            </div>
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
  finalizandoSalidaId = signal<string | null>(null); // 🎯 Para feedback individual
  modalVerificacion = signal(false);
  tamborSeleccionado = signal<TamborParaVerificar | null>(null);
  salidaSeleccionadaId = signal<string>('');

  // 🚀 Signals para "Finalizar Todo"
  modalFinalizarTodo = signal(false);
  finalizandoTodo = signal(false);
  progresoFinalizacion = signal({ actual: 0, total: 0 });

  floraciones = signal<Floracion[]>([]);
  colores = signal<ColorMiel[]>([]);

  // 🎯 Computed: Obtener salidas listas para finalizar
  salidasListasParaFinalizar = computed(() => {
    const llegada = this.llegada();
    if (!llegada) return [];

    const salidas: SalidaConTambores[] = [];
    llegada.proveedores.forEach(proveedor => {
      proveedor.salidas.forEach(salida => {
        if (this.todosTamboresVerificados(salida)) {
          salidas.push(salida);
        }
      });
    });
    return salidas;
  });

  // Control de expansión
  private proveedoresExpandidos = signal<Set<number>>(new Set());
  private salidasExpandidas = signal<Set<string>>(new Set());

  // Formulario de verificación
  formVerificacion: FormGroup = this.fb.group({
    kilosVerificados: [null, [Validators.min(0)]],
    taraVerificada: [null, [Validators.min(0)]], // ← NUEVO: Campo para capturar tara
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
      taraVerificada: formValue.taraVerificada || undefined, // ← NUEVO: Enviar tara verificada
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
    this.finalizandoSalidaId.set(salidaId); // 🎯 Marcar esta salida como procesando

    this.verificacionService.finalizarVerificacionSalida(salidaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resumen) => {
          // ✅ No depender del folio en la respuesta (backend solo envía success/message)
          const mensaje = resumen?.folio
            ? `Salida ${resumen.folio} finalizada exitosamente`
            : 'Salida finalizada exitosamente';

          this.notificationService.showSuccess(mensaje);
          this.finalizandoSalidaId.set(null);

          // 🎯 Verificar si esta era la última salida pendiente
          const salidasRestantes = this.salidasListasParaFinalizar();
          if (salidasRestantes.length === 1 && salidasRestantes[0].salidaId === salidaId) {
            // Esta es la última salida, redirigir a verificaciones completadas
            setTimeout(() => {
              this.notificationService.showSuccess('¡Todas las verificaciones completadas! Redirigiendo...');
              this.router.navigate(['/verificador/verificadas']);
            }, 1000);
          } else {
            // Recargar llegada para mostrar estado actualizado
            const choferId = this.route.snapshot.paramMap.get('choferId');
            if (choferId) {
              this.cargarDetalleLlegada(choferId);
            }
          }
        },
        error: (error) => {
          console.error('Error al finalizar salida:', error);
          this.notificationService.showError('Error al finalizar la salida');
          this.finalizandoSalidaId.set(null);
        }
      });
  }

  /**
   * Volver a la lista de llegadas
   */
  volver(): void {
    this.router.navigate(['/verificador/en-transito']);
  }

  // ============================================================================
  // 🚀 FINALIZAR TODO - PROCESO EN LOTE
  // ============================================================================

  /**
   * Abrir modal de confirmación para finalizar todas las salidas
   */
  abrirModalFinalizarTodo(): void {
    this.modalFinalizarTodo.set(true);
  }

  /**
   * Cerrar modal de finalizar todo
   */
  cerrarModalFinalizarTodo(): void {
    if (!this.finalizandoTodo()) {
      this.modalFinalizarTodo.set(false);
      this.progresoFinalizacion.set({ actual: 0, total: 0 });
    }
  }

  /**
   * Finalizar todas las salidas listas (con todos los tambores verificados)
   * Procesa de forma secuencial para mantener control del progreso
   */
  async finalizarTodasLasSalidas(): Promise<void> {
    const salidas = this.salidasListasParaFinalizar();
    if (salidas.length === 0) return;

    this.finalizandoTodo.set(true);
    this.progresoFinalizacion.set({ actual: 0, total: salidas.length });

    const resultados = {
      exitosas: 0,
      fallidas: 0,
      errores: [] as string[]
    };

    // Procesar salidas secuencialmente
    for (let i = 0; i < salidas.length; i++) {
      const salida = salidas[i];

      try {
        await this.finalizarSalidaPromise(salida.salidaId);
        resultados.exitosas++;
      } catch (error: any) {
        resultados.fallidas++;
        resultados.errores.push(`${salida.folio}: ${error.message || 'Error desconocido'}`);
        console.error(`Error al finalizar salida ${salida.folio}:`, error);
      }

      // Actualizar progreso
      this.progresoFinalizacion.set({ actual: i + 1, total: salidas.length });
    }

    // Finalizar proceso
    this.finalizandoTodo.set(false);
    this.modalFinalizarTodo.set(false);

    // Mostrar resumen
    if (resultados.fallidas === 0) {
      this.notificationService.showSuccess(
        `✅ Todas las salidas finalizadas exitosamente (${resultados.exitosas}/${salidas.length})`
      );

      // 🎯 Redirigir a verificaciones completadas después de finalizar todo
      setTimeout(() => {
        this.notificationService.showSuccess('¡Todas las verificaciones completadas! Redirigiendo...');
        this.router.navigate(['/verificador/verificadas']);
      }, 1500);
    } else {
      this.notificationService.showWarning(
        `⚠️ Proceso completado: ${resultados.exitosas} exitosas, ${resultados.fallidas} fallidas`
      );
      // Mostrar errores en consola
      console.error('Errores al finalizar salidas:', resultados.errores);

      // Recargar llegada para mostrar salidas pendientes
      const choferId = this.route.snapshot.paramMap.get('choferId');
      if (choferId) this.cargarDetalleLlegada(choferId);
    }
  }

  /**
   * Convertir Observable a Promise para uso secuencial
   */
  private finalizarSalidaPromise(salidaId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.verificacionService.finalizarVerificacionSalida(salidaId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (resumen) => resolve(resumen),
          error: (error) => reject(error)
        });
    });
  }
}
