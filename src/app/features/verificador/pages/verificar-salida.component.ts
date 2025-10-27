/**
 * ============================================================================
 * VERIFICAR SALIDA (DEPRECADO) - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * NOTA: Este componente ya no se usa.
 * Ahora la verificación se realiza desde detalle-llegada.component.ts
 * que muestra la vista jerárquica completa (Chofer → Proveedores → Salidas → Tambores)
 *
 * Este archivo se mantiene solo para evitar errores de compilación.
 *
 * ============================================================================
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-verificar-salida',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              Este componente ha sido reemplazado por la nueva vista de llegadas.
              <a routerLink="/verificador/en-transito" class="font-medium underline text-yellow-700 hover:text-yellow-600">
                Ir a Llegadas en Tránsito
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerificarSalidaComponent {}
