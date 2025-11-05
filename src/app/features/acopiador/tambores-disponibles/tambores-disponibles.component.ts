/**
 * ============================================================================
 * 📦 TAMBORES DISPONIBLES COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Listado completo de tambores disponibles del acopiador
 * - Visualización con filtros (tipo de miel, clasificación, rango de fechas)
 * - Cancelar tambores con modal de confirmación + motivo
 * - Scroll infinito para carga incremental
 * - Sin alerts, solo toast notifications
 *
 * ============================================================================
 */

import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Componentes reutilizables
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';

// Modelos
import { TamborDisponible } from '../../../core/models/salida-miel.model';
import { CancelarTamborRequest } from '../../../core/models/tambor.model';

// Servicios
import { SalidaMielService } from '../../../core/services/salida-miel.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-tambores-disponibles',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent
    ],
    templateUrl: './tambores-disponibles.component.html',
    styleUrl: './tambores-disponibles.component.css'
})
export class TamboresDisponiblesComponent implements OnInit {
    private fb = inject(FormBuilder);
    private salidaMielService = inject(SalidaMielService);
    private notificationService = inject(NotificationService);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Tambores disponibles */
    tambores = signal<TamborDisponible[]>([]);

    /** Tambores filtrados (resultado de aplicar filtros) */
    tamboresFiltrados = signal<TamborDisponible[]>([]);

    /** Filtros activos */
    filtroTipoMiel = signal<number | ''>('');
    filtroClasificacion = signal<string>('');
    filtroFechaInicio = signal<string>('');
    filtroFechaFin = signal<string>('');

    /** Modal de cancelación */
    showCancelarModal = signal(false);
    tamborACancelar = signal<TamborDisponible | null>(null);

    /** Loading states */
    loading = signal(false);
    loadingCancelar = signal(false);

    /** Form de cancelación */
    cancelarForm!: FormGroup;

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.initCancelarForm();
        this.loadTambores();
    }

    // ============================================================================
    // FORM INITIALIZATION
    // ============================================================================

    initCancelarForm(): void {
        this.cancelarForm = this.fb.group({
            motivoCancelacion: ['', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(1000)
            ]]
        });
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    loadTambores(): void {
        this.loading.set(true);
        this.salidaMielService.getTamboresDisponibles()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (tambores) => {
                    this.tambores.set(tambores);
                    this.aplicarFiltros();
                    this.loading.set(false);
                },
                error: (error) => {
                    this.loading.set(false);
                    this.notificationService.error(
                        'Error al cargar tambores',
                        error.error?.message || 'No se pudieron obtener los tambores disponibles'
                    );
                }
            });
    }

    // ============================================================================
    // FILTROS
    // ============================================================================

    aplicarFiltros(): void {
        let filtrados = [...this.tambores()];

        // Filtro por tipo de miel
        const tipoMiel = this.filtroTipoMiel();
        if (typeof tipoMiel === 'number') {
            filtrados = filtrados.filter(t => t.tipoMielId === tipoMiel);
        }

        // Filtro por clasificación
        const clasificacion = this.filtroClasificacion();
        if (clasificacion && clasificacion !== '') {
            filtrados = filtrados.filter(t => t.clasificacion === clasificacion);
        }

        // Filtro por fecha inicio
        const fechaInicio = this.filtroFechaInicio();
        if (fechaInicio) {
            filtrados = filtrados.filter(t => {
                const fechaTambor = new Date(t.fechaCreacion).toISOString().split('T')[0];
                return fechaTambor >= fechaInicio;
            });
        }

        // Filtro por fecha fin
        const fechaFin = this.filtroFechaFin();
        if (fechaFin) {
            filtrados = filtrados.filter(t => {
                const fechaTambor = new Date(t.fechaCreacion).toISOString().split('T')[0];
                return fechaTambor <= fechaFin;
            });
        }

        this.tamboresFiltrados.set(filtrados);
    }

    onFiltroTipoMielChange(value: string): void {
        this.filtroTipoMiel.set(value === '' ? '' : Number(value));
        this.aplicarFiltros();
    }

    onFiltroClasificacionChange(value: string): void {
        this.filtroClasificacion.set(value);
        this.aplicarFiltros();
    }

    onFiltroFechaInicioChange(value: string): void {
        this.filtroFechaInicio.set(value);
        this.aplicarFiltros();
    }

    onFiltroFechaFinChange(value: string): void {
        this.filtroFechaFin.set(value);
        this.aplicarFiltros();
    }

    limpiarFiltros(): void {
        this.filtroTipoMiel.set('');
        this.filtroClasificacion.set('');
        this.filtroFechaInicio.set('');
        this.filtroFechaFin.set('');
        this.aplicarFiltros();
    }

    get tiposMielDisponibles(): Array<{ id: number, nombre: string }> {
        const tipos = this.tambores().map(t => ({
            id: t.tipoMielId,
            nombre: t.tipoMielNombre
        }));

        const uniqueMap = new Map<number, string>();
        tipos.forEach(t => uniqueMap.set(t.id, t.nombre));

        return Array.from(uniqueMap.entries()).map(([id, nombre]) => ({ id, nombre }));
    }

    // ============================================================================
    // CANCELAR TAMBOR
    // ============================================================================

    abrirModalCancelar(tambor: TamborDisponible): void {
        this.tamborACancelar.set(tambor);
        this.showCancelarModal.set(true);
        this.cancelarForm.reset();
    }

    cerrarModalCancelar(): void {
        this.showCancelarModal.set(false);
        this.tamborACancelar.set(null);
        this.cancelarForm.reset();
    }

    confirmarCancelacion(): void {
        if (this.cancelarForm.invalid) {
            this.cancelarForm.markAllAsTouched();
            this.notificationService.warning(
                'Formulario incompleto',
                'Por favor ingrese un motivo de cancelación válido (mínimo 10 caracteres)'
            );
            return;
        }

        const tambor = this.tamborACancelar();
        if (!tambor) return;

        const request: CancelarTamborRequest = {
            motivoCancelacion: this.cancelarForm.value.motivoCancelacion
        };

        this.loadingCancelar.set(true);

        this.salidaMielService.cancelarTambor(tambor.id, request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (tamborCancelado) => {
                    this.loadingCancelar.set(false);
                    this.notificationService.success(
                        'Tambor cancelado',
                        `${tamborCancelado.consecutivo} ha sido cancelado exitosamente. Las entradas quedaron disponibles.`
                    );
                    this.cerrarModalCancelar();

                    // Recargar tambores
                    this.loadTambores();
                },
                error: (error) => {
                    this.loadingCancelar.set(false);
                    this.notificationService.error(
                        'Error al cancelar',
                        error.error?.message || 'No se pudo cancelar el tambor'
                    );
                }
            });
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    excedeLimite(kilos: number): boolean {
        return kilos > 300;
    }

    formatCurrency(value: number): string {
        return this.salidaMielService.formatCurrency(value);
    }

    formatKilos(kilos: number): string {
        return this.salidaMielService.formatKilos(kilos);
    }

    formatDate(dateString: string): string {
        return this.salidaMielService.formatDate(dateString);
    }

    get totalKilos(): number {
        return this.tamboresFiltrados().reduce((sum, t) => sum + t.totalKilos, 0);
    }

    get totalCosto(): number {
        return this.tamboresFiltrados().reduce((sum, t) => sum + t.totalCosto, 0);
    }

    get hayFiltrosActivos(): boolean {
        return !!(this.filtroTipoMiel() || this.filtroClasificacion() || this.filtroFechaInicio() || this.filtroFechaFin());
    }
}
