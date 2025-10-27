/**
 * ============================================================================
 * 📊 DASHBOARD VERIFICADOR - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente principal del módulo de Verificación
 * Contiene sidebar con 2 secciones:
 * 1. En Tránsito (salidas pendientes de verificar)
 * 2. Verificadas (historial de verificaciones completadas)
 *
 * ============================================================================
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-verificador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-64 bg-white shadow-lg">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-honey-dark">Verificación</h2>
          <p class="text-sm text-gray-600 mt-1">Gestión de Salidas</p>
        </div>

        <nav class="p-4 space-y-2">
          <!-- En Tránsito -->
          <button
            (click)="navigateTo('en-transito')"
            [class.bg-honey-primary]="currentSection() === 'en-transito'"
            [class.text-white]="currentSection() === 'en-transito'"
            [class.text-gray-700]="currentSection() !== 'en-transito'"
            [class.hover:bg-honey-primary]="currentSection() !== 'en-transito'"
            [class.hover:text-white]="currentSection() !== 'en-transito'"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div class="flex-1 text-left">
              <div class="font-semibold">En Tránsito</div>
              <div class="text-xs opacity-80">Pendientes de verificar</div>
            </div>
            @if (countEnTransito() > 0) {
              <span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {{ countEnTransito() }}
              </span>
            }
          </button>

          <!-- Verificadas -->
          <button
            (click)="navigateTo('verificadas')"
            [class.bg-honey-primary]="currentSection() === 'verificadas'"
            [class.text-white]="currentSection() === 'verificadas'"
            [class.text-gray-700]="currentSection() !== 'verificadas'"
            [class.hover:bg-honey-primary]="currentSection() !== 'verificadas'"
            [class.hover:text-white]="currentSection() !== 'verificadas'"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1 text-left">
              <div class="font-semibold">Verificadas</div>
              <div class="text-xs opacity-80">Historial completado</div>
            </div>
          </button>
        </nav>

        <!-- Información adicional -->
        <div class="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
          <div class="text-xs text-gray-600">
            <p class="font-semibold mb-1">Resumen del día</p>
            <div class="flex justify-between">
              <span>Verificadas hoy:</span>
              <span class="font-bold text-honey-dark">{{ todayVerified() }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Contenido Principal -->
      <main class="flex-1 overflow-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class DashboardVerificadorComponent implements OnInit {
  private router = inject(Router);

  // Signals para estado reactivo
  currentSection = signal<'en-transito' | 'verificadas'>('en-transito');
  countEnTransito = signal(0);
  todayVerified = signal(0);

  ngOnInit(): void {
    // Cargar contadores iniciales
    this.loadCounters();

    // Detectar sección actual basada en la URL
    this.detectCurrentSection();
  }

  /**
   * Navegar a una sección específica
   */
  navigateTo(section: 'en-transito' | 'verificadas'): void {
    this.currentSection.set(section);
    this.router.navigate(['/verificador', section]);
  }

  /**
   * Detectar sección actual según la URL
   */
  private detectCurrentSection(): void {
    const url = this.router.url;
    if (url.includes('verificadas')) {
      this.currentSection.set('verificadas');
    } else {
      this.currentSection.set('en-transito');
    }
  }

  /**
   * Cargar contadores (TODO: integrar con backend)
   */
  private loadCounters(): void {
    // TODO: Llamar al servicio para obtener contadores reales
    // this.verificacionService.getSalidasEnTransito(1, 1).subscribe(...)
    // this.verificacionService.getMisVerificaciones({ fechaDesde: today }).subscribe(...)
  }
}
