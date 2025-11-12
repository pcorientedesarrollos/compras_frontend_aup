/**
 * ============================================================================
 * 🐝 APICULTOR DETAIL COMPONENT - SISTEMA OAXACA MIEL v2.0
 * ============================================================================
 *
 * Formulario para crear y editar apicultores
 *
 * CAMBIOS v2.0:
 * - Campo 'codigo' eliminado del form (se genera automáticamente)
 * - Campo 'nombre' dividido en: nombre, apellidoPaterno, apellidoMaterno
 * - Campos 'estadoCodigo' y 'municipioCodigo' ahora obligatorios
 * - Select-autocomplete para estados y municipios (cascada)
 * - Campos renombrados: senasica → idRasmiel, ippSiniga → uppSiniiga
 * - Proveedores: por defecto muestra seleccionados, botón "Mostrar Todos"
 *
 * CARACTERÍSTICAS:
 * - Formulario reactivo con validaciones v2.0
 * - Multi-select de proveedores (gestión de vínculos N:N)
 * - Validación de CURP (18 caracteres)
 * - RFC opcional (sin validación estricta)
 * - Modo CREATE y EDIT
 *
 * ============================================================================
 */

import { Component, computed, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';

// Modelos
import {
    ApicultorAPI,
    CreateApicultorRequest,
    UpdateApicultorRequest,
    ProveedorAPI,
    EstadoAPI,
    MunicipioAPI,
    estadosToOptions,
    municipiosToOptions,
    EstadoOption,
    MunicipioOption
} from '../../../../core/models/index';

// Servicios
import { ApicultorService } from '../../../../core/services/apicultor.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { EstadoService } from '../../../../core/services/estado.service';
import { MunicipioService } from '../../../../core/services/municipio.service';
import { AuthService } from '../../../../core/services/auth.service';

type FormMode = 'create' | 'edit';

@Component({
    selector: 'app-apicultor-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent,
    ],
    templateUrl: './apicultor-detail.component.html',
    styleUrl: './apicultor-detail.component.css'
})
export class ApicultorDetailComponent implements OnInit {
    private fb = inject(FormBuilder);
    private apicultorService = inject(ApicultorService);
    private proveedorService = inject(ProveedorService);
    private estadoService = inject(EstadoService);
    private municipioService = inject(MunicipioService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Modo del formulario */
    mode = signal<FormMode>('create');

    /** ID del apicultor en modo edición */
    apicultorId = signal<string | null>(null);

    /** Apicultor actual (en modo edición) */
    currentApicultor = signal<ApicultorAPI | null>(null);

    /** Estado de carga */
    isLoading = signal<boolean>(false);

    /** Estado de guardado */
    isSaving = signal<boolean>(false);

    /** Lista de proveedores disponibles */
    proveedoresDisponibles = signal<ProveedorAPI[]>([]);

    /** IDs de proveedores seleccionados */
    selectedProveedorIds = signal<number[]>([]);

    /** Mostrar todos los proveedores (toggle) */
    showAllProveedores = signal<boolean>(false);

    /** Término de búsqueda de proveedores */
    proveedorSearchTerm = signal<string>('');

    /** Lista de estados disponibles */
    estados = signal<EstadoOption[]>([]);

    /** Lista de municipios disponibles (según estado seleccionado) */
    municipios = signal<MunicipioOption[]>([]);

    // ============================================================================
    // FORM
    // ============================================================================

    apicultorForm!: FormGroup;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Título de la página */
    pageTitle = computed(() =>
        this.mode() === 'create' ? 'Nuevo Apicultor' : 'Editar Apicultor'
    );

    /** Texto del botón submit */
    submitButtonText = computed(() =>
        this.mode() === 'create' ? 'Crear Apicultor' : 'Actualizar Apicultor'
    );

    /** Si el formulario es válido (signal reactivo) */
    isFormValid = signal<boolean>(false);

    /** Proveedores filtrados disponibles (activos) */
    proveedoresActivos = computed(() =>
        this.proveedoresDisponibles().filter(p => p.deleteProve === 0)
    );

    /** Proveedores que se mostrarán (seleccionados o todos según toggle) */
    proveedoresToShow = computed(() => {
        const activos = this.proveedoresActivos();
        const selected = this.selectedProveedorIds();
        const searchTerm = this.proveedorSearchTerm().toLowerCase();

        // Si no está activado "Mostrar Todos", solo mostrar seleccionados
        if (!this.showAllProveedores()) {
            const selectedProveedores = activos.filter(p => selected.includes(p.idProveedor));
            // Aplicar búsqueda si existe
            if (searchTerm) {
                return selectedProveedores.filter(p =>
                    p.nombre.toLowerCase().includes(searchTerm)
                );
            }
            return selectedProveedores;
        }

        // Mostrar todos con búsqueda si existe
        if (searchTerm) {
            return activos.filter(p =>
                p.nombre.toLowerCase().includes(searchTerm)
            );
        }
        return activos;
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.initForm();
        this.loadEstados();
        this.loadProveedores();
        this.checkMode();
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Inicializar formulario reactivo v2.0
     * CAMBIOS: codigo eliminado, nombre dividido, campos renombrados
     */
    private initForm(): void {
        this.apicultorForm = this.fb.group({
            // IDENTIFICACIÓN
            estatus: ['ACTIVO', Validators.required],
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
            apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
            apellidoMaterno: ['', [Validators.maxLength(100)]],
            curp: ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]],
            rfc: ['', [Validators.maxLength(13)]],
            idRasmiel: ['', [Validators.maxLength(50)]],
            uppSiniiga: ['', [Validators.maxLength(50)]],

            // UBICACIÓN
            estadoCodigo: ['', Validators.required],
            municipioCodigo: ['', Validators.required], // NO disabled inicialmente
            direccion: ['']
        });

        // Escuchar cambios en estadoCodigo para cargar municipios
        this.apicultorForm.get('estadoCodigo')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(estadoCodigo => {
                this.onEstadoChange(estadoCodigo);
            });

        // Escuchar cambios en el estado del formulario para actualizar signal
        this.apicultorForm.statusChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.isFormValid.set(this.apicultorForm.valid);
            });

        // Actualizar estado inicial
        this.isFormValid.set(this.apicultorForm.valid);
    }

    /**
     * Determinar modo (create/edit) según la ruta
     * SEGURIDAD: ACOPIADOR no puede editar apicultores
     */
    private checkMode(): void {
        const id = this.route.snapshot.paramMap.get('id');
        const currentUser = this.authService.getCurrentUser();
        const isAcopiador = currentUser?.role === 'ACOPIADOR';

        if (id && id !== 'nuevo') {
            // BLOQUEO: Si es ACOPIADOR y está intentando editar, redirigir a lista
            if (isAcopiador) {
                console.warn('ACOPIADOR intentó acceder a edición de apicultor - redirigiendo a lista');
                this.router.navigate(['/acopiador/apicultores']);
                return;
            }

            this.mode.set('edit');
            this.apicultorId.set(id);
            this.loadApicultor(id);
        } else {
            this.mode.set('create');
        }
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    /**
     * Cargar catálogo de estados
     */
    private loadEstados(): void {
        this.estadoService
            .getAllEstados()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (estados) => {
                    this.estados.set(estadosToOptions(estados));
                },
                error: (error) => {
                    console.error('Error al cargar estados:', error);
                }
            });
    }

    /**
     * Cargar municipios según el estado seleccionado (cascada)
     */
    private onEstadoChange(estadoCodigo: string): void {
        // Limpiar municipio seleccionado
        this.apicultorForm.patchValue({ municipioCodigo: '' });
        this.municipios.set([]);

        if (!estadoCodigo) {
            return;
        }

        // Cargar municipios del estado seleccionado
        this.municipioService
            .getMunicipiosByEstado(estadoCodigo)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (municipios) => {
                    this.municipios.set(municipiosToOptions(municipios));
                },
                error: (error) => {
                    console.error('Error al cargar municipios:', error);
                }
            });
    }

    /**
     * Cargar lista de proveedores disponibles
     */
    private loadProveedores(): void {
        this.proveedorService
            .getProveedoresActivos()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (proveedores) => {
                    this.proveedoresDisponibles.set(proveedores);
                },
                error: (error) => {
                    console.error('Error al cargar proveedores:', error);
                }
            });
    }

    /**
     * Cargar datos del apicultor (modo edición)
     */
    private loadApicultor(id: string): void {
        this.isLoading.set(true);

        this.apicultorService
            .getApicultorById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apicultor) => {
                    this.currentApicultor.set(apicultor);
                    this.patchFormValues(apicultor);

                    // Cargar proveedores seleccionados
                    const proveedorIds = apicultor.proveedores.map(p => p.proveedorId);
                    this.selectedProveedorIds.set(proveedorIds);

                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar apicultor:', error);
                    this.router.navigate(['/admin/apicultores']);
                    this.isLoading.set(false);
                }
            });
    }

    /**
     * Rellenar formulario con datos del apicultor v2.0
     */
    private patchFormValues(apicultor: ApicultorAPI): void {
        this.apicultorForm.patchValue({
            estatus: apicultor.estatus,
            nombre: apicultor.nombre,
            apellidoPaterno: apicultor.apellidoPaterno,
            apellidoMaterno: apicultor.apellidoMaterno || '',
            curp: apicultor.curp,
            rfc: apicultor.rfc || '',
            idRasmiel: apicultor.idRasmiel || '',
            uppSiniiga: apicultor.uppSiniiga || '',
            estadoCodigo: apicultor.estadoCodigo,
            municipioCodigo: apicultor.municipioCodigo,
            direccion: apicultor.direccion || ''
        });

        // Cargar municipios del estado actual
        if (apicultor.estadoCodigo) {
            this.municipioService
                .getMunicipiosByEstado(apicultor.estadoCodigo)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (municipios) => {
                        this.municipios.set(municipiosToOptions(municipios));
                    }
                });
        }

        // Deshabilitar CURP en modo edición (no se puede cambiar)
        this.apicultorForm.get('curp')?.disable();
    }

    // ============================================================================
    // FORM SUBMIT
    // ============================================================================

    /**
     * Enviar formulario
     */
    onSubmit(): void {
        if (!this.apicultorForm.valid) {
            this.apicultorForm.markAllAsTouched();
            return;
        }

        if (this.mode() === 'create') {
            this.createApicultor();
        } else {
            this.updateApicultor();
        }
    }

    /**
     * Crear nuevo apicultor v2.0
     * IMPORTANTE: Campo 'codigo' NO se envía (se genera automáticamente)
     */
    private createApicultor(): void {
        this.isSaving.set(true);

        const formValue = this.apicultorForm.getRawValue();

        // ✅ VALIDAR DUPLICADOS: CURP + Nombre Completo
        this.validateDuplicates(formValue.curp, formValue.nombre, formValue.apellidoPaterno, formValue.apellidoMaterno)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (isDuplicate) => {
                    if (isDuplicate) {
                        alert('Ya existe un apicultor con el mismo CURP o nombre completo.');
                        this.isSaving.set(false);
                        return;
                    }

                    // No hay duplicados, proceder con la creación
                    const request: CreateApicultorRequest = {
                        nombre: formValue.nombre,
                        apellidoPaterno: formValue.apellidoPaterno,
                        apellidoMaterno: formValue.apellidoMaterno || undefined,
                        curp: formValue.curp,
                        rfc: formValue.rfc || undefined,
                        estadoCodigo: formValue.estadoCodigo,
                        municipioCodigo: formValue.municipioCodigo,
                        direccion: formValue.direccion || undefined,
                        idRasmiel: formValue.idRasmiel || undefined,
                        uppSiniiga: formValue.uppSiniiga || undefined,
                        estatus: formValue.estatus,
                        proveedorIds: this.selectedProveedorIds().length > 0
                            ? this.selectedProveedorIds()
                            : undefined
                    };

                    this.apicultorService
                        .createApicultor(request)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe({
                            next: (apicultor) => {
                                this.router.navigate(['/admin/apicultores']);
                                this.isSaving.set(false);
                            },
                            error: (error) => {
                                console.error('Error al crear apicultor:', error);
                                this.isSaving.set(false);
                            }
                        });
                },
                error: (error) => {
                    console.error('Error al validar duplicados:', error);
                    this.isSaving.set(false);
                }
            });
    }

    /**
     * Actualizar apicultor existente v2.0
     * nombreCompleto se recalcula automáticamente en el backend
     */
    private updateApicultor(): void {
        if (!this.apicultorId()) return;

        this.isSaving.set(true);

        const formValue = this.apicultorForm.getRawValue();

        // ✅ VALIDAR DUPLICADOS: Solo Nombre Completo (CURP no se puede cambiar en edición)
        this.validateDuplicates(
            this.currentApicultor()?.curp || '', // CURP original (no cambia)
            formValue.nombre,
            formValue.apellidoPaterno,
            formValue.apellidoMaterno,
            this.apicultorId()! // Excluir el ID actual de la validación
        )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (isDuplicate) => {
                    if (isDuplicate) {
                        alert('Ya existe otro apicultor con el mismo nombre completo.');
                        this.isSaving.set(false);
                        return;
                    }

                    // No hay duplicados, proceder con la actualización
                    const request: UpdateApicultorRequest = {
                        nombre: formValue.nombre,
                        apellidoPaterno: formValue.apellidoPaterno,
                        apellidoMaterno: formValue.apellidoMaterno || undefined,
                        rfc: formValue.rfc || undefined,
                        estadoCodigo: formValue.estadoCodigo,
                        municipioCodigo: formValue.municipioCodigo,
                        direccion: formValue.direccion || undefined,
                        idRasmiel: formValue.idRasmiel || undefined,
                        uppSiniiga: formValue.uppSiniiga || undefined,
                        estatus: formValue.estatus,
                        proveedorIds: this.selectedProveedorIds() // Siempre enviamos para gestionar vínculos
                    };

                    this.apicultorService
                        .updateApicultor(this.apicultorId()!, request)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe({
                            next: (apicultor) => {
                                this.router.navigate(['/admin/apicultores']);
                                this.isSaving.set(false);
                            },
                            error: (error) => {
                                console.error('Error al actualizar apicultor:', error);
                                this.isSaving.set(false);
                            }
                        });
                },
                error: (error) => {
                    console.error('Error al validar duplicados:', error);
                    this.isSaving.set(false);
                }
            });
    }

    // ============================================================================
    // VALIDACIÓN DE DUPLICADOS
    // ============================================================================

    /**
     * ✅ Validar duplicados por CURP + Nombre Completo
     *
     * @param curp CURP a validar
     * @param nombre Primer nombre
     * @param apellidoPaterno Apellido paterno
     * @param apellidoMaterno Apellido materno (opcional)
     * @param excludeId ID a excluir de la validación (en modo edición)
     * @returns Observable<boolean> true si existe duplicado, false si no
     */
    private validateDuplicates(
        curp: string,
        nombre: string,
        apellidoPaterno: string,
        apellidoMaterno: string | null,
        excludeId?: string
    ): Observable<boolean> {
        return new Observable<boolean>(observer => {
            // Obtener todos los apicultores
            this.apicultorService
                .getAllApicultores()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (apicultores) => {
                        // Construir nombre completo a validar
                        const nombreCompletoNuevo = `${nombre} ${apellidoPaterno} ${apellidoMaterno || ''}`.trim().toLowerCase();

                        // Buscar duplicados
                        const duplicado = apicultores.find(ap => {
                            // Excluir el apicultor actual en modo edición
                            if (excludeId && ap.id === excludeId) {
                                return false;
                            }

                            // Validar por CURP (solo en modo crear, ya que en editar el CURP está deshabilitado)
                            if (!excludeId && ap.curp.toLowerCase() === curp.toLowerCase()) {
                                return true;
                            }

                            // Validar por nombre completo (siempre)
                            const nombreCompletoExistente = ap.nombreCompleto.trim().toLowerCase();
                            return nombreCompletoExistente === nombreCompletoNuevo;
                        });

                        observer.next(!!duplicado);
                        observer.complete();
                    },
                    error: (error) => {
                        observer.error(error);
                    }
                });
        });
    }

    // ============================================================================
    // PROVEEDORES SELECTION
    // ============================================================================

    /**
     * Verificar si un proveedor está seleccionado
     */
    isProveedorSelected(proveedorId: number): boolean {
        return this.selectedProveedorIds().includes(proveedorId);
    }

    /**
     * Toggle selección de proveedor
     */
    toggleProveedor(proveedorId: number): void {
        const current = this.selectedProveedorIds();

        if (current.includes(proveedorId)) {
            // Quitar
            this.selectedProveedorIds.set(current.filter(id => id !== proveedorId));
        } else {
            // Agregar
            this.selectedProveedorIds.set([...current, proveedorId]);
        }
    }

    /**
     * Seleccionar todos los proveedores
     */
    selectAllProveedores(): void {
        const allIds = this.proveedoresActivos().map(p => p.idProveedor);
        this.selectedProveedorIds.set(allIds);
    }

    /**
     * Deseleccionar todos los proveedores
     */
    clearAllProveedores(): void {
        this.selectedProveedorIds.set([]);
    }

    /**
     * Toggle mostrar todos los proveedores
     */
    toggleShowAllProveedores(): void {
        this.showAllProveedores.set(!this.showAllProveedores());
        // Limpiar búsqueda al cambiar vista
        this.proveedorSearchTerm.set('');
    }

    /**
     * Actualizar término de búsqueda de proveedores
     */
    onProveedorSearch(term: string): void {
        this.proveedorSearchTerm.set(term);
    }

    // ============================================================================
    // FORM HELPERS
    // ============================================================================

    /**
     * Verificar si un campo tiene error
     */
    hasError(fieldName: string, errorType: string): boolean {
        const field = this.apicultorForm.get(fieldName);
        return !!(field?.hasError(errorType) && field?.touched);
    }

    /**
     * Obtener mensaje de error para un campo
     */
    getErrorMessage(fieldName: string): string {
        const field = this.apicultorForm.get(fieldName);

        if (!field || !field.errors || !field.touched) {
            return '';
        }

        if (field.hasError('required')) {
            return 'Este campo es obligatorio';
        }

        if (field.hasError('minlength')) {
            const minLength = field.errors['minlength'].requiredLength;
            return `Mínimo ${minLength} caracteres`;
        }

        if (field.hasError('maxlength')) {
            const maxLength = field.errors['maxlength'].requiredLength;
            return `Máximo ${maxLength} caracteres`;
        }

        return 'Campo inválido';
    }

    // ============================================================================
    // NAVIGATION
    // ============================================================================

    /**
     * Cancelar y volver al listado
     */
    cancel(): void {
        if (confirm('¿Deseas cancelar? Los cambios no guardados se perderán.')) {
            this.router.navigate(['/admin/apicultores']);
        }
    }
}