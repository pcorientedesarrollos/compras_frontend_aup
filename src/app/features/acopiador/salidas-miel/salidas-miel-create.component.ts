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

    /** Salida cargada (para edición) */
    salidaCargada = signal<any>(null);

    /** Choferes activos */
    choferes = signal<ChoferSelectOption[]>([]);

    /** Tambores disponibles con estado de selección */
    tambores = signal<TamborEnTabla[]>([]);

    /** Tambores actuales de la salida (en modo edición) */
    tamboresActuales = signal<any[]>([]);

    /** Filtros */
    filtroTipoMiel = signal<number | ''>('');
    filtroClasificacion = signal<string>('');

    /** Loading states */
    loading = signal(false);
    loadingChoferes = signal(false);
    loadingTambores = signal(false);
    loadingSalida = signal(false);

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
        this.loadingSalida.set(true);
        this.salidaMielService.getSalidaById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (salida) => {
                    console.log('Salida cargada:', salida); // Debug
                    this.salidaCargada.set(salida);

                    // Verificar si se puede editar
                    if (salida.estado === 'EN_TRANSITO' || salida.estado === 'VERIFICADA') {
                        this.notificationService.warning(
                            'Solo lectura',
                            'Esta salida no se puede editar porque ya está en tránsito o verificada'
                        );
                    }

                    // Convertir fecha ISO a YYYY-MM-DD si es necesario
                    const fechaFormateada = salida.fecha.split('T')[0];

                    // Cargar datos del formulario
                    // IMPORTANTE: El backend envía choferId directamente, no como objeto
                    this.salidaForm.patchValue({
                        fecha: fechaFormateada,
                        choferId: salida.choferId,
                        observaciones: salida.observaciones || '',
                        observacionesChofer: salida.observacionesChofer || ''
                    });

                    // Deshabilitar campos si no se puede editar el encabezado
                    if (!this.puedeEditarEncabezado()) {
                        this.salidaForm.disable();
                    }

                    // Cargar tambores actuales
                    this.tamboresActuales.set(salida.detalles || []);

                    this.loadingSalida.set(false);
                },
                error: (error) => {
                    this.loadingSalida.set(false);
                    this.notificationService.error('Error al cargar salida', error.error?.message || 'No se pudo obtener la salida');
                    this.router.navigate(['/acopiador/salidas-miel']);
                }
            });
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
        // Total de kilos NETOS (peso del tambor sin tara)
        return this.tamboresSeleccionados.reduce((sum, t) => sum + t.totalKilos, 0);
    }

    get totalCompra(): number {
        return this.tamboresSeleccionados.reduce((sum, t) => sum + t.totalCosto, 0);
    }

    calcularKilosNetos(tambor: TamborEnTabla): number {
        return tambor.totalKilos + tambor.taraCapturada; // En SALIDAS: PN + Tara = PB
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

        // Validar que TODOS los tambores tengan tara capturada
        const tamboresSinTara = this.tamboresSeleccionados.filter(t => !t.taraCapturada || t.taraCapturada <= 0);
        if (tamboresSinTara.length > 0) {
            this.notificationService.warning(
                'Tara incompleta',
                `Debe capturar la tara de todos los tambores seleccionados (${tamboresSinTara.length} pendiente${tamboresSinTara.length > 1 ? 's' : ''})`
            );
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
    // EDICIÓN - ELIMINAR TAMBORES
    // ============================================================================

    /**
     * Eliminar tambor de la salida (solo en modo edición)
     */
    eliminarTamborActual(detalle: any): void {
        if (!this.puedeEditar()) {
            this.notificationService.warning(
                'No se puede eliminar',
                'Esta salida no se puede editar en su estado actual'
            );
            return;
        }

        if (!confirm(`¿Está seguro de eliminar el tambor ${detalle.tamborId}?\n\nEl tambor volverá a estar ACTIVO y disponible.`)) {
            return;
        }

        const salidaId = this.salidaId();
        if (!salidaId) return;

        this.loading.set(true);

        this.salidaMielService.removeTambor(salidaId, detalle.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (salidaActualizada) => {
                    this.loading.set(false);
                    this.notificationService.success('Tambor eliminado', 'El tambor ha sido removido de la salida');

                    // Actualizar tambores actuales
                    this.tamboresActuales.set(salidaActualizada.detalles || []);

                    // Recargar tambores disponibles
                    this.loadTamboresDisponibles();
                },
                error: (error) => {
                    this.loading.set(false);
                    this.notificationService.error('Error al eliminar', error.error?.message || 'No se pudo eliminar el tambor');
                }
            });
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Verificar si la salida se puede editar (añadir/quitar tambores)
     * Solo se permite en estado EN_PROCESO
     */
    puedeEditar(): boolean {
        const salida = this.salidaCargada();
        if (!salida) return true; // Modo crear

        // Solo se puede editar si está EN_PROCESO
        return salida.estado === 'EN_PROCESO';
    }

    /**
     * Verificar si se puede modificar el encabezado (fecha, chofer, observaciones)
     * Solo se permite en estado EN_PROCESO
     */
    puedeEditarEncabezado(): boolean {
        const salida = this.salidaCargada();
        if (!salida) return true; // Modo crear

        return salida.estado === 'EN_PROCESO';
    }

    /**
     * Verificar si es solo lectura (EN_TRANSITO o VERIFICADA)
     */
    esSoloLectura(): boolean {
        const salida = this.salidaCargada();
        if (!salida) return false;

        return salida.estado === 'EN_TRANSITO' || salida.estado === 'VERIFICADA';
    }

    /**
     * Verificar si un tambor excede el límite recomendado (300kg)
     */
    excedeLimite(kilos: number): boolean {
        return kilos > 300;
    }

    /**
     * Calcular total de kilos de tambores actuales
     */
    getTotalKilosTamboresActuales(): number {
        return this.tamboresActuales().reduce((sum, t) => sum + t.kilosDeclarados, 0);
    }

    /**
     * Calcular total de costo de tambores actuales
     */
    getTotalCostoTamboresActuales(): number {
        return this.tamboresActuales().reduce((sum, t) => sum + t.costoTotal, 0);
    }

    formatCurrency(value: number): string {
        return this.salidaMielService.formatCurrency(value);
    }

    formatKilos(kilos: number): string {
        return this.salidaMielService.formatKilos(kilos);
    }

    /**
     * Clase CSS para badge de clasificación
     */
    getClasificacionBadgeClass(clasificacion: string): string {
        switch (clasificacion) {
            case 'EXPORTACION_1':
                return 'text-green-700 bg-green-100';
            case 'EXPORTACION_2':
                return 'text-blue-700 bg-blue-100';
            case 'NACIONAL':
                return 'text-amber-700 bg-amber-100';
            case 'INDUSTRIA':
                return 'text-red-700 bg-red-100';
            default:
                return 'text-gray-700 bg-gray-100';
        }
    }

    /**
     * Etiqueta legible para clasificación
     */
    getClasificacionLabel(clasificacion: string): string {
        switch (clasificacion) {
            case 'EXPORTACION_1':
                return 'EXPORTACIÓN 1';
            case 'EXPORTACION_2':
                return 'EXPORTACIÓN 2';
            case 'NACIONAL':
                return 'NACIONAL';
            case 'INDUSTRIA':
                return 'INDUSTRIA';
            default:
                return clasificacion;
        }
    }
}
