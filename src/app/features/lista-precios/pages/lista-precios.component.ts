/**
 * ============================================================================
 * 💰 LISTA DE PRECIOS COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente para gestionar precios por tipo de miel
 * API v2.0: Estructura de 2 niveles (tipos de miel → precios por clasificación)
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
import {
  TipoMielResumen,
  PrecioDetalle,
  HistorialPrecio
} from '../../../core/models/lista-precios.model';

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

  // =====================
  // NIVEL 1: Tipos de miel
  // =====================
  private tiposMielSignal = signal<TipoMielResumen[]>([]);
  tiposMiel = computed(() => this.tiposMielSignal() ?? []);
  loading = signal<boolean>(false);

  // =====================
  // NIVEL 2: Modal de precios por tipo
  // =====================
  showPreciosModal = signal<boolean>(false);
  preciosLoading = signal<boolean>(false);
  preciosData = signal<PrecioDetalle[]>([]);
  selectedTipoMiel = signal<TipoMielResumen | null>(null);
  savingIds = signal<Set<string>>(new Set());

  // =====================
  // Modal de historial
  // =====================
  showHistorialModal = signal<boolean>(false);
  historialLoading = signal<boolean>(false);
  historialData = signal<HistorialPrecio[]>([]);
  selectedPrecio = signal<PrecioDetalle | null>(null);

  ngOnInit(): void {
    this.loadTiposMiel();
  }

  /**
   * Nivel 1: Cargar lista de tipos de miel
   */
  loadTiposMiel(): void {
    this.loading.set(true);

    this.listaPreciosService.getTiposMiel()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tipos) => {
          this.tiposMielSignal.set(tipos || []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar tipos de miel:', error);
          this.notificationService.error(
            'Error al cargar',
            'No se pudo obtener la lista de tipos de miel'
          );
          this.tiposMielSignal.set([]);
          this.loading.set(false);
        }
      });
  }

  /**
   * Nivel 2: Abrir modal de precios de un tipo de miel
   */
  verPrecios(tipo: TipoMielResumen): void {
    this.selectedTipoMiel.set(tipo);
    this.showPreciosModal.set(true);
    this.preciosLoading.set(true);
    this.preciosData.set([]);

    this.listaPreciosService.getPreciosPorTipo(tipo.tipoMielId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (precios) => {
          this.preciosData.set(precios || []);
          this.preciosLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar precios:', error);
          this.notificationService.error(
            'Error al cargar',
            'No se pudo obtener los precios del tipo de miel'
          );
          this.preciosLoading.set(false);
        }
      });
  }

  /**
   * Cerrar modal de precios
   */
  cerrarPrecios(): void {
    this.showPreciosModal.set(false);
    this.selectedTipoMiel.set(null);
    this.preciosData.set([]);
    // Recargar lista de tipos por si hubo cambios
    this.loadTiposMiel();
  }

  /**
   * Guardar precio individual
   */
  guardarPrecio(precio: PrecioDetalle): void {
    if (!precio.id) {
      this.notificationService.warning(
        'Sin registro',
        'Este precio no tiene registro. Contacte al administrador.'
      );
      return;
    }

    if (precio.precio < 0) {
      this.notificationService.warning(
        'Precio inválido',
        'El precio no puede ser negativo'
      );
      return;
    }

    this.savingIds.update(ids => new Set(ids).add(precio.id!));

    this.listaPreciosService.updatePrecio(precio.id, precio.precio)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (precioActualizado) => {
          // Actualizar en la lista de precios del modal
          this.preciosData.update(precios =>
            precios.map(p => p.id === precioActualizado.id
              ? { ...p, precio: precioActualizado.precio, fechaInicio: precioActualizado.fechaUltimaActualizacion }
              : p
            )
          );

          this.notificationService.success(
            'Precio actualizado',
            `${precio.clasificacionNombre} guardado correctamente`
          );

          this.savingIds.update(ids => {
            const newIds = new Set(ids);
            newIds.delete(precio.id!);
            return newIds;
          });
        },
        error: (error) => {
          console.error('Error al guardar precio:', error);
          this.notificationService.error(
            'Error al guardar',
            `No se pudo actualizar el precio de ${precio.clasificacionNombre}`
          );

          this.savingIds.update(ids => {
            const newIds = new Set(ids);
            newIds.delete(precio.id!);
            return newIds;
          });
        }
      });
  }

  /**
   * Verificar si un precio está guardando
   */
  isSaving(id: string | null): boolean {
    if (!id) return false;
    return this.savingIds().has(id);
  }

  /**
   * Manejar cambio en input de precio
   */
  onPrecioChange(precio: PrecioDetalle, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);

    if (!isNaN(value)) {
      precio.precio = value;
    } else {
      precio.precio = 0;
      input.value = '0';
    }
  }

  /**
   * Abrir modal de historial
   */
  verHistorial(precio: PrecioDetalle): void {
    if (!precio.id) {
      this.notificationService.warning(
        'Sin historial',
        'Este precio no tiene registro de historial'
      );
      return;
    }

    this.selectedPrecio.set(precio);
    this.showHistorialModal.set(true);
    this.historialLoading.set(true);
    this.historialData.set([]);

    this.listaPreciosService.getHistorial(precio.id)
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
    this.selectedPrecio.set(null);
    this.historialData.set([]);
  }

  /**
   * Obtener clase CSS para badge de clasificación
   */
  getClasificacionBadgeClass(clasificacion: string): string {
    switch (clasificacion) {
      case 'EXPORTACION_1': return 'bg-green-100 text-green-800';
      case 'EXPORTACION_2': return 'bg-blue-100 text-blue-800';
      case 'NACIONAL': return 'bg-amber-100 text-amber-800';
      case 'INDUSTRIA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
