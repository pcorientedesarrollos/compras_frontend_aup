/**
 * ============================================================================
 * 📦 SALIDAS MIEL CREATE COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Formulario para crear/editar salida de miel con TAMBORES:
 * - TODO EN UNA PANTALLA (igual que entradas)
 * - Tabla dinámica de tambores disponibles
 * - Añadir/quitar tambores inline
 * - Capturar tara por tambor
 * - Guardar encabezado + detalles en UN SOLO SUBMIT
 *
 * ============================================================================
 */

import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// Componentes reutilizables
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';

// Modelos
import {
    CreateSalidaMielRequest,
    AddTamborToSalidaRequest,
    TamborDisponible
} from '../../../core/models/salida-miel.model';

// Servicios
import { SalidaMielService } from '../../../core/services/salida-miel.service';
import { ChoferService } from '../../../core/services/chofer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ChoferSelectOption } from '../../../core/models';

interface TamborEnTabla extends TamborDisponible {
    taraCapturada: number;
    selected: boolean;
}

@Component({
    selector: 'app-salidas-miel-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        IconComponent
    ],
    templateUrl: './salidas-miel-create.component.html',
    styleUrl: './salidas-miel-create.component.css'
})
export class SalidasMielCreateComponent implements OnInit {
    private fb = inject(FormBuilder);
    private salidaMielService = inject(SalidaMielService);
    private choferService = inject(ChoferService);
    private notificationService = inject(NotificationService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // FORM
    // ============================================================================

    salidaForm!: FormGroup;

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** ID de salida (si estamos editando) */
    salidaId = signal<string | null>(null);

    /** Modo edición */
    isEditMode = signal(false);

    /** Choferes activos */
    choferes = signal<ChoferSelectOption[]>([]);

    /** Tambores disponibles con estado de selección */
    tambores = signal<TamborEnTabla[]>([]);

    /** Filtros */
    filtroTipoMiel = signal<number | ''>('');
    filtroClasificacion = signal<string>('');

    /** Loading states */
    loading = signal(false);
    loadingChoferes = signal(false);
    loadingTambores = signal(false);

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.initForm();
        this.loadChoferes();
        this.loadTamboresDisponibles();

        // Verificar si estamos editando
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.salidaId.set(id);
            this.isEditMode.set(true);
            this.loadSalida(id);
        }
    }

    // ============================================================================
    // FORM INITIALIZATION
    // ============================================================================

    initForm(): void {
        this.salidaForm = this.fb.group({
            fecha: [this.getTodayDate(), [Validators.required]],
            choferId: ['', [Validators.required]],
            observaciones: ['', [Validators.maxLength(1000)]],
            observacionesChofer: ['', [Validators.maxLength(1000)]]
        });
    }

    getTodayDate(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    loadChoferes(): void {
        this.loadingChoferes.set(true);
        this.choferService.getChoferesActivos()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (choferes) => {
                    this.choferes.set(choferes);
                    this.loadingChoferes.set(false);
                },
                error: () => {
                    this.loadingChoferes.set(false);
                    this.notificationService.error('Error al cargar choferes', 'No se pudieron obtener los choferes activos');
                }
            });
    }

    loadTamboresDisponibles(): void {
        this.loadingTambores.set(true);
        this.salidaMielService.getTamboresDisponibles()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (tambores) => {
                    const tamboresConEstado: TamborEnTabla[] = tambores.map(t => ({
                        ...t,
                        taraCapturada: 0,
                        selected: false
                    }));
                    this.tambores.set(tamboresConEstado);
                    this.loadingTambores.set(false);
                },
                error: () => {
                    this.loadingTambores.set(false);
                    this.notificationService.error('Error al cargar tambores', 'No se pudieron obtener los tambores disponibles');
                }
            });
    }

    loadSalida(id: string): void {
        // TODO: Implementar carga de salida existente para edición
        // Por ahora, modo edición no soportado
        this.notificationService.warning('Modo edición no disponible', 'Por favor use el listado para gestionar salidas existentes');
        this.router.navigate(['/acopiador/salidas-miel']);
    }

    // ============================================================================
    // TABLA DE TAMBORES
    // ============================================================================

    toggleTambor(tambor: TamborEnTabla): void {
        const tamboresActuales = this.tambores();
        const index = tamboresActuales.findIndex(t => t.id === tambor.id);

        if (index !== -1) {
            tamboresActuales[index].selected = !tamboresActuales[index].selected;
            this.tambores.set([...tamboresActuales]);
        }
    }

    onTaraChange(tambor: TamborEnTabla, value: number): void {
        const tamboresActuales = this.tambores();
        const index = tamboresActuales.findIndex(t => t.id === tambor.id);

        if (index !== -1) {
            tamboresActuales[index].taraCapturada = value;
            this.tambores.set([...tamboresActuales]);
        }
    }

    get tamboresSeleccionados(): TamborEnTabla[] {
        return this.tambores().filter(t => t.selected);
    }

    get cantidadTambores(): number {
        return this.tamboresSeleccionados.length;
    }

    get totalKilos(): number {
        return this.tamboresSeleccionados.reduce((sum, t) => {
            const kilosNetos = Math.max(0, t.totalKilos - t.taraCapturada);
            return sum + kilosNetos;
        }, 0);
    }

    get totalCompra(): number {
        return this.tamboresSeleccionados.reduce((sum, t) => sum + t.totalCosto, 0);
    }

    calcularKilosNetos(tambor: TamborEnTabla): number {
        return Math.max(0, tambor.totalKilos - tambor.taraCapturada);
    }

    /**
     * Obtener tambores filtrados
     */
    get tamboresFiltrados(): TamborEnTabla[] {
        let filtrados = this.tambores();

        // Filtrar por tipo de miel
        const tipoMielFiltro = this.filtroTipoMiel();
        if (typeof tipoMielFiltro === 'number') {
            filtrados = filtrados.filter(t => t.tipoMielId === tipoMielFiltro);
        }

        // Filtrar por clasificación
        const clasificacionFiltro = this.filtroClasificacion();
        if (clasificacionFiltro && clasificacionFiltro !== '') {
            filtrados = filtrados.filter(t => t.clasificacion === clasificacionFiltro);
        }

        return filtrados;
    }

    /**
     * Obtener lista única de tipos de miel disponibles
     */
    get tiposMielDisponibles(): Array<{ id: number, nombre: string }> {
        const tipos = this.tambores().map(t => ({
            id: t.tipoMielId,
            nombre: t.tipoMielNombre
        }));

        // Eliminar duplicados
        const uniqueMap = new Map<number, string>();
        tipos.forEach(t => uniqueMap.set(t.id, t.nombre));

        return Array.from(uniqueMap.entries()).map(([id, nombre]) => ({ id, nombre }));
    }

    /**
     * Cambiar filtro de tipo de miel
     */
    onFiltroTipoMielChange(value: string): void {
        this.filtroTipoMiel.set(value === '' ? '' : Number(value));
    }

    /**
     * Cambiar filtro de clasificación
     */
    onFiltroClasificacionChange(value: string): void {
        this.filtroClasificacion.set(value);
    }

    /**
     * Limpiar filtros
     */
    limpiarFiltros(): void {
        this.filtroTipoMiel.set('');
        this.filtroClasificacion.set('');
    }

    // ============================================================================
    // SUBMIT
    // ============================================================================

    onSubmit(): void {
        // Validar formulario
        if (this.salidaForm.invalid) {
            this.salidaForm.markAllAsTouched();
            this.notificationService.warning('Formulario incompleto', 'Por favor complete todos los campos requeridos');
            return;
        }

        // Validar que haya tambores seleccionados
        if (this.tamboresSeleccionados.length === 0) {
            this.notificationService.warning('Sin tambores', 'Debe seleccionar al menos un tambor');
            return;
        }

        const formValue = this.salidaForm.value;

        // Crear solicitud de encabezado
        const request: CreateSalidaMielRequest = {
            fecha: formValue.fecha,
            choferId: formValue.choferId,
            observaciones: formValue.observaciones || undefined,
            observacionesChofer: formValue.observacionesChofer || undefined
        };

        this.loading.set(true);

        // 1. Crear encabezado
        this.salidaMielService.createSalida(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (salida) => {
                    // 2. Añadir tambores uno por uno
                    this.addTamboresSecuencialmente(salida.id, 0);
                },
                error: (error) => {
                    this.loading.set(false);
                    this.notificationService.error('Error al crear salida', error.error?.message || 'Error desconocido');
                }
            });
    }

    private addTamboresSecuencialmente(salidaId: string, index: number): void {
        const tambores = this.tamboresSeleccionados;

        if (index >= tambores.length) {
            // Todos los tambores añadidos, finalizar
            this.finalizarSalida(salidaId);
            return;
        }

        const tambor = tambores[index];
        const request: AddTamborToSalidaRequest = {
            tamborId: tambor.id,
            taraCapturada: tambor.taraCapturada || undefined
        };

        this.salidaMielService.addTambor(salidaId, request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    // Continuar con el siguiente tambor
                    this.addTamboresSecuencialmente(salidaId, index + 1);
                },
                error: (error) => {
                    this.loading.set(false);
                    this.notificationService.error('Error al añadir tambor', `${tambor.consecutivo}: ${error.error?.message || 'Error desconocido'}`);
                }
            });
    }

    private finalizarSalida(salidaId: string): void {
        this.salidaMielService.finalizarSalida(salidaId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (salida) => {
                    this.loading.set(false);
                    this.notificationService.success('Salida creada', `${salida.folio} creada y finalizada exitosamente`);
                    this.router.navigate(['/acopiador/salidas-miel']);
                },
                error: (error) => {
                    this.loading.set(false);
                    this.notificationService.warning('Error al finalizar', `Salida creada pero error al finalizar: ${error.error?.message || 'Error desconocido'}`);
                    this.router.navigate(['/acopiador/salidas-miel']);
                }
            });
    }

    // ============================================================================
    // NAVIGATION
    // ============================================================================

    cancelar(): void {
        if (confirm('¿Está seguro de cancelar? Se perderán los datos ingresados.')) {
            this.router.navigate(['/acopiador/salidas-miel']);
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    formatCurrency(value: number): string {
        return this.salidaMielService.formatCurrency(value);
    }

    formatKilos(kilos: number): string {
        return this.salidaMielService.formatKilos(kilos);
    }
}
