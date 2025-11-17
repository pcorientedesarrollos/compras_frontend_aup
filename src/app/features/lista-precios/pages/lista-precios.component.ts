/**
 * ============================================================================
 * 💰 LISTA DE PRECIOS COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente para gestionar precios por tipo de miel
 * Solo accesible para ADMINISTRADORES
 *
 * ============================================================================
 */

import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ListaPreciosService } from '../services/lista-precios.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TipoMielPrecio, HistorialPrecio } from '../../../core/models/lista-precios.model';

@Component({
  selector: 'app-lista-precios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-precios.component.html'
})
export class ListaPreciosComponent implements OnInit {
  private listaPreciosService = inject(ListaPreciosService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  // Signals privados
  private tiposMielSignal = signal<TipoMielPrecio[]>([]);

  // Signals públicos
  tiposMiel = computed(() => this.tiposMielSignal() ?? []);
  loading = signal<boolean>(false);
  savingIds = signal<Set<string>>(new Set());

  // Modal de historial
  showHistorialModal = signal<boolean>(false);
  historialLoading = signal<boolean>(false);
  historialData = signal<HistorialPrecio[]>([]);
  selectedTipo = signal<TipoMielPrecio | null>(null);

  ngOnInit(): void {
    this.loadListaPrecios();
  }

  /**
   * Cargar lista de precios
   */
  loadListaPrecios(): void {
    this.loading.set(true);

    this.listaPreciosService.getListaPrecios()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tipos) => {
          // Asegurar que siempre sea un array
          this.tiposMielSignal.set(tipos || []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar lista de precios:', error);
          this.notificationService.error(
            'Error al cargar',
            'No se pudo obtener la lista de precios'
          );
          // Asegurar que el array esté vacío en caso de error
          this.tiposMielSignal.set([]);
          this.loading.set(false);
        }
      });
  }

  /**
   * Guardar precio de un tipo de miel
   */
  guardarPrecio(tipo: TipoMielPrecio): void {
    // Validar precio
    if (tipo.precio < 0) {
      this.notificationService.warning(
        'Precio inválido',
        'El precio no puede ser negativo'
      );
      return;
    }

    // Marcar como guardando
    this.savingIds.update(ids => new Set(ids).add(tipo.id));

    this.listaPreciosService.updatePrecio(tipo.id, tipo.precio)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tipoActualizado) => {
          // Actualizar en la lista
          this.tiposMielSignal.update(tipos =>
            tipos.map(t => t.id === tipoActualizado.id ? tipoActualizado : t)
          );

          this.notificationService.success(
            'Precio actualizado',
            `Precio de ${tipo.tipoMielNombre} - ${tipo.clasificacion} guardado correctamente`
          );

          // Remover del set de guardando
          this.savingIds.update(ids => {
            const newIds = new Set(ids);
            newIds.delete(tipo.id);
            return newIds;
          });
        },
        error: (error) => {
          console.error('Error al guardar precio:', error);
          this.notificationService.error(
            'Error al guardar',
            `No se pudo actualizar el precio de ${tipo.tipoMielNombre}`
          );

          // Remover del set de guardando
          this.savingIds.update(ids => {
            const newIds = new Set(ids);
            newIds.delete(tipo.id);
            return newIds;
          });
        }
      });
  }

  /**
   * Verificar si un tipo está guardando
   */
  isSaving(id: string): boolean {
    return this.savingIds().has(id);
  }

  /**
   * Manejar cambio en input de precio
   */
  onPrecioChange(tipo: TipoMielPrecio, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);

    // Si el valor es válido, actualizar
    if (!isNaN(value)) {
      tipo.precio = value;
    } else {
      // Si está vacío o inválido, resetear a 0
      tipo.precio = 0;
      input.value = '0';
    }
  }

  /**
   * Abrir modal de historial
   */
  verHistorial(tipo: TipoMielPrecio): void {
    this.selectedTipo.set(tipo);
    this.showHistorialModal.set(true);
    this.historialLoading.set(true);
    this.historialData.set([]);

    this.listaPreciosService.getHistorial(tipo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (historial) => {
          this.historialData.set(historial || []);
          this.historialLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar historial:', error);
          this.notificationService.error(
            'Error al cargar historial',
            'No se pudo obtener el historial de cambios'
          );
          this.historialLoading.set(false);
        }
      });
  }

  /**
   * Cerrar modal de historial
   */
  cerrarHistorial(): void {
    this.showHistorialModal.set(false);
    this.selectedTipo.set(null);
    this.historialData.set([]);
  }
}
