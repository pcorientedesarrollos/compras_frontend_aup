/**
 * ============================================================================
 * 🔄 MIGRACIÓN SISTEMA AUP - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente para simular la migración de datos desde el sistema AUP antiguo
 * al nuevo sistema. Incluye barra de progreso y pasos detallados.
 *
 * NOTA: Esta es una SIMULACIÓN frontend. En producción, esto sería un proceso
 * real del backend con websockets para actualización en tiempo real.
 *
 * ============================================================================
 */

import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VerificacionResponse } from '../../../core/models/verificador.model';

interface PasoMigracion {
  id: number;
  titulo: string;
  descripcion: string;
  estado: 'pendiente' | 'en-proceso' | 'completado' | 'error';
  progreso: number;
  duracion: number; // milisegundos
  registrosProcesados?: number;
  registrosTotales?: number;
}

@Component({
  selector: 'app-migracion-aup',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-100 p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-honey-primary rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-800">Migración Sistema AUP</h1>
              <p class="text-gray-600 mt-1">
                Migración de verificación individual al sistema antiguo
              </p>
            </div>
          </div>

          <!-- Información de la Verificación -->
          @if (verificacion()) {
            <div class="bg-honey-50 border border-honey-200 rounded-lg p-4 mb-4">
              <h3 class="font-semibold text-gray-800 mb-3">Verificación a Migrar</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p class="text-gray-600">Folio Salida</p>
                  <p class="font-semibold text-gray-900">{{ verificacion()!.salidaFolio }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Proveedor</p>
                  <p class="font-semibold text-gray-900">{{ verificacion()!.proveedorNombre }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Chofer</p>
                  <p class="font-semibold text-gray-900">{{ verificacion()!.choferNombre }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Tambores</p>
                  <p class="font-semibold text-gray-900">{{ verificacion()!.cantidadTambores }} tambores</p>
                </div>
                <div>
                  <p class="text-gray-600">Kilos Verificados</p>
                  <p class="font-semibold text-gray-900">{{ verificacion()!.kilosTotalesVerificados | number: '1.2-2' }} kg</p>
                </div>
                <div>
                  <p class="text-gray-600">Fecha Verificación</p>
                  <p class="font-semibold text-gray-900">{{ verificacion()!.fechaVerificacion | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Con Diferencias</p>
                  <p class="font-semibold" [class.text-yellow-600]="verificacion()!.cantidadConDiferencias > 0" [class.text-green-600]="verificacion()!.cantidadConDiferencias === 0">
                    {{ verificacion()!.cantidadConDiferencias }} tambores
                  </p>
                </div>
                <div>
                  <p class="text-gray-600">Diferencia Total</p>
                  <p class="font-semibold" [class.text-red-600]="verificacion()!.diferenciaTotal < 0" [class.text-green-600]="verificacion()!.diferenciaTotal > 0" [class.text-gray-600]="verificacion()!.diferenciaTotal === 0">
                    {{ verificacion()!.diferenciaTotal > 0 ? '+' : '' }}{{ verificacion()!.diferenciaTotal | number: '1.2-2' }} kg
                  </p>
                </div>
              </div>
            </div>
          }

          @if (!migracionIniciada()) {
            <!-- Información pre-migración -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <h3 class="font-semibold text-blue-900 mb-2">Información Importante</h3>
                  <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Este proceso migrará esta verificación al sistema AUP antiguo</li>
                    <li>Se migrarán: datos del proveedor, chofer, tambores verificados y diferencias</li>
                    <li>Se generará un respaldo automático antes de iniciar</li>
                    <li>El proceso puede tardar algunos segundos</li>
                    <li><strong>NO cierre esta ventana</strong> hasta que finalice el proceso</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Botón Iniciar -->
            <button
              (click)="iniciarMigracion()"
              [disabled]="migracionIniciada()"
              class="w-full bg-honey-primary hover:bg-honey-dark text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span class="text-xl">MIGRAR SISTEMA DE AUP</span>
            </button>
          } @else {
            <!-- Progreso General -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-gray-700">Progreso General</span>
                <span class="text-sm font-bold text-honey-primary">{{ progresoGeneral() }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-honey-primary to-honey-dark transition-all duration-500 ease-out flex items-center justify-end px-2"
                  [style.width.%]="progresoGeneral()">
                  @if (progresoGeneral() > 5) {
                    <span class="text-xs font-bold text-white">{{ progresoGeneral() }}%</span>
                  }
                </div>
              </div>
            </div>

            <!-- Estado -->
            <div class="flex items-center gap-2">
              @if (migracionCompletada()) {
                <div class="flex items-center gap-2 text-green-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="font-semibold">Migración Completada Exitosamente</span>
                </div>
              } @else if (migracionConErrores()) {
                <div class="flex items-center gap-2 text-red-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-semibold">Migración Finalizada con Errores</span>
                </div>
              } @else {
                <div class="flex items-center gap-2 text-blue-600">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span class="font-semibold">Migración en Proceso...</span>
                </div>
              }
            </div>
          }
        </div>

        @if (migracionIniciada()) {
          <!-- Lista de Pasos -->
          <div class="space-y-3">
            @for (paso of pasos(); track paso.id) {
              <div class="bg-white rounded-lg shadow-md overflow-hidden"
                   [class.ring-2]="paso.estado === 'en-proceso'"
                   [class.ring-blue-500]="paso.estado === 'en-proceso'">
                <!-- Header del Paso -->
                <div class="px-6 py-4"
                     [class.bg-gray-50]="paso.estado === 'pendiente'"
                     [class.bg-blue-50]="paso.estado === 'en-proceso'"
                     [class.bg-green-50]="paso.estado === 'completado'"
                     [class.bg-red-50]="paso.estado === 'error'">
                  <div class="flex items-center gap-4">
                    <!-- Icono de Estado -->
                    <div class="flex-shrink-0">
                      @if (paso.estado === 'pendiente') {
                        <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span class="text-gray-600 font-bold">{{ paso.id }}</span>
                        </div>
                      } @else if (paso.estado === 'en-proceso') {
                        <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      } @else if (paso.estado === 'completado') {
                        <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      } @else if (paso.estado === 'error') {
                        <div class="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      }
                    </div>

                    <!-- Info del Paso -->
                    <div class="flex-1">
                      <h3 class="font-semibold text-gray-800">{{ paso.titulo }}</h3>
                      <p class="text-sm text-gray-600">{{ paso.descripcion }}</p>
                      @if (paso.registrosTotales) {
                        <p class="text-xs text-gray-500 mt-1">
                          {{ paso.registrosProcesados || 0 }} / {{ paso.registrosTotales }} registros
                        </p>
                      }
                    </div>

                    <!-- Porcentaje -->
                    @if (paso.estado !== 'pendiente') {
                      <div class="text-right">
                        <span class="text-2xl font-bold"
                              [class.text-blue-600]="paso.estado === 'en-proceso'"
                              [class.text-green-600]="paso.estado === 'completado'"
                              [class.text-red-600]="paso.estado === 'error'">
                          {{ paso.progreso }}%
                        </span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Barra de Progreso del Paso -->
                @if (paso.estado === 'en-proceso' || paso.estado === 'completado') {
                  <div class="px-6 pb-4">
                    <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        class="h-full transition-all duration-300"
                        [class.bg-blue-500]="paso.estado === 'en-proceso'"
                        [class.bg-green-500]="paso.estado === 'completado'"
                        [style.width.%]="paso.progreso">
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Resumen Final -->
          @if (migracionCompletada() || migracionConErrores()) {
            <div class="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 class="text-xl font-bold text-gray-800 mb-4">Resumen de Migración</h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div class="bg-blue-50 rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-1">Total de Pasos</p>
                  <p class="text-2xl font-bold text-blue-600">{{ pasos().length }}</p>
                </div>
                <div class="bg-green-50 rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-1">Completados</p>
                  <p class="text-2xl font-bold text-green-600">{{ pasosCompletados() }}</p>
                </div>
                <div class="bg-red-50 rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-1">Con Errores</p>
                  <p class="text-2xl font-bold text-red-600">{{ pasosConErrores() }}</p>
                </div>
              </div>

              @if (migracionCompletada()) {
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div class="flex items-start gap-3">
                    <svg class="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h4 class="font-semibold text-green-900 mb-2">Migración Exitosa</h4>
                      <p class="text-sm text-green-800">
                        Todos los datos han sido migrados correctamente. El sistema está listo para usar.
                      </p>
                    </div>
                  </div>
                </div>
              }

              <div class="mt-4 flex gap-3">
                <button
                  (click)="reiniciarMigracion()"
                  class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                  Reiniciar Migración
                </button>
                <button
                  routerLink="/verificador/verificadas"
                  class="flex-1 bg-honey-primary hover:bg-honey-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                  Volver a Verificadas
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class MigracionAupComponent implements OnInit {
  private router = inject(Router);

  // Signals
  verificacion = signal<VerificacionResponse | null>(null);
  migracionIniciada = signal(false);
  migracionCompletada = signal(false);
  migracionConErrores = signal(false);
  progresoGeneral = signal(0);

  ngOnInit(): void {
    // Recibir datos de navegación
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state && state['verificacion']) {
      this.verificacion.set(state['verificacion']);
    }
  }

  pasos = signal<PasoMigracion[]>([
    {
      id: 1,
      titulo: 'Validando Conexión',
      descripcion: 'Estableciendo conexión con el sistema AUP',
      estado: 'pendiente',
      progreso: 0,
      duracion: 1500
    },
    {
      id: 2,
      titulo: 'Generando Respaldo',
      descripcion: 'Creando respaldo de seguridad antes de migrar',
      estado: 'pendiente',
      progreso: 0,
      duracion: 2000
    },
    {
      id: 3,
      titulo: 'Migrando Datos de Proveedor',
      descripcion: 'Sincronizando información del proveedor',
      estado: 'pendiente',
      progreso: 0,
      duracion: 1500,
      registrosTotales: 1
    },
    {
      id: 4,
      titulo: 'Migrando Datos de Chofer',
      descripcion: 'Registrando información del chofer',
      estado: 'pendiente',
      progreso: 0,
      duracion: 1500,
      registrosTotales: 1
    },
    {
      id: 5,
      titulo: 'Migrando Salida',
      descripcion: 'Transfiriendo datos de la salida verificada',
      estado: 'pendiente',
      progreso: 0,
      duracion: 2000,
      registrosTotales: 1
    },
    {
      id: 6,
      titulo: 'Migrando Tambores Verificados',
      descripcion: 'Procesando tambores con sus datos verificados',
      estado: 'pendiente',
      progreso: 0,
      duracion: 3000,
      registrosTotales: this.verificacion()?.cantidadTambores || 0
    },
    {
      id: 7,
      titulo: 'Migrando Diferencias',
      descripcion: 'Registrando diferencias encontradas en verificación',
      estado: 'pendiente',
      progreso: 0,
      duracion: 2000,
      registrosTotales: this.verificacion()?.cantidadConDiferencias || 0
    },
    {
      id: 8,
      titulo: 'Validando Integridad',
      descripcion: 'Verificando consistencia de datos migrados',
      estado: 'pendiente',
      progreso: 0,
      duracion: 1500
    },
    {
      id: 9,
      titulo: 'Finalizando Migración',
      descripcion: 'Confirmando migración en sistema AUP',
      estado: 'pendiente',
      progreso: 0,
      duracion: 1500
    }
  ]);

  /**
   * Iniciar proceso de migración simulada
   */
  async iniciarMigracion(): Promise<void> {
    this.migracionIniciada.set(true);
    this.migracionCompletada.set(false);
    this.migracionConErrores.set(false);
    this.progresoGeneral.set(0);

    const totalPasos = this.pasos().length;

    for (let i = 0; i < totalPasos; i++) {
      await this.procesarPaso(i);

      // Actualizar progreso general
      const progreso = Math.round(((i + 1) / totalPasos) * 100);
      this.progresoGeneral.set(progreso);
    }

    // Finalizar
    this.migracionCompletada.set(true);
  }

  /**
   * Procesar un paso individual
   */
  private async procesarPaso(index: number): Promise<void> {
    const pasosActuales = [...this.pasos()];
    const paso = pasosActuales[index];

    // Marcar como en proceso
    paso.estado = 'en-proceso';
    paso.progreso = 0;
    this.pasos.set(pasosActuales);

    // Simular progreso incremental
    const incrementos = 20;
    const tiempoPorIncremento = paso.duracion / incrementos;

    for (let i = 0; i <= incrementos; i++) {
      await this.sleep(tiempoPorIncremento);

      const progreso = Math.round((i / incrementos) * 100);
      pasosActuales[index].progreso = progreso;

      // Actualizar registros procesados si aplica
      if (paso.registrosTotales) {
        pasosActuales[index].registrosProcesados = Math.round(
          (paso.registrosTotales * progreso) / 100
        );
      }

      this.pasos.set([...pasosActuales]);
    }

    // Marcar como completado
    pasosActuales[index].estado = 'completado';
    pasosActuales[index].progreso = 100;
    this.pasos.set([...pasosActuales]);
  }

  /**
   * Reiniciar migración
   */
  reiniciarMigracion(): void {
    const pasosReiniciados = this.pasos().map(paso => ({
      ...paso,
      estado: 'pendiente' as const,
      progreso: 0,
      registrosProcesados: 0
    }));

    this.pasos.set(pasosReiniciados);
    this.migracionIniciada.set(false);
    this.migracionCompletada.set(false);
    this.migracionConErrores.set(false);
    this.progresoGeneral.set(0);
  }

  /**
   * Contar pasos completados
   */
  pasosCompletados(): number {
    return this.pasos().filter(p => p.estado === 'completado').length;
  }

  /**
   * Contar pasos con errores
   */
  pasosConErrores(): number {
    return this.pasos().filter(p => p.estado === 'error').length;
  }

  /**
   * Helper para delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
