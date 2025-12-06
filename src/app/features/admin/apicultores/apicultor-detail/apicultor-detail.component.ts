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
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';

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
    MunicipioOption,
    CreateApiarioRequest
} from '../../../../core/models/index';

// Servicios
import { ApicultorService } from '../../../../core/services/apicultor.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { EstadoService } from '../../../../core/services/estado.service';
import { MunicipioService } from '../../../../core/services/municipio.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiarioService } from '../../../../core/services/apiario.service';
import { NotificationService } from '../../../../core/services/notification.service';

type FormMode = 'create' | 'edit';

@Component({
    selector: 'app-apicultor-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent,
        ModalComponent,
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
    private apiarioService = inject(ApiarioService);
    private notificationService = inject(NotificationService);
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

    /** Verificar si el usuario es ACOPIADOR */
    isAcopiador = computed(() => {
        const user = this.authService.getCurrentUser();
        return user?.role === 'ACOPIADOR';
    });

    /** Lista de estados disponibles */
    estados = signal<EstadoOption[]>([]);

    /** Lista de municipios disponibles (según estado seleccionado) */
    municipios = signal<MunicipioOption[]>([]);

    // ============================================================================
    // APIARIOS (Solo en modo CREATE) - Tabla dinámica
    // ============================================================================

    /** Estado de obtención de ubicación GPS */
    isGettingLocation = signal<boolean>(false);

    /** Índice del apiario al que se le está obteniendo ubicación */
    gettingLocationIndex = signal<number>(-1);

    /** Modal de confirmación para cancelar */
    showCancelModal = signal<boolean>(false);

    /** Totales calculados de apiarios */
    totalColmenas = signal<number>(0);
    totalProduccionAnual = signal<number>(0);

    // ============================================================================
    // MODAL DE PROGRESO (Guardado de apiarios)
    // ============================================================================

    /** Mostrar modal de progreso */
    showProgressModal = signal<boolean>(false);

    /** Progreso actual (0-100) */
    progressPercent = signal<number>(0);

    /** Contador de apiarios guardados */
    apiariosSaved = signal<number>(0);

    /** Total de apiarios a guardar */
    apiariosTotal = signal<number>(0);

    /** Mensaje de progreso actual */
    progressMessage = signal<string>('');

    // ============================================================================
    // FORM
    // ============================================================================

    apicultorForm!: FormGroup;
    apiariosForm!: FormGroup; // Contiene FormArray de apiarios

    /** Getter para el FormArray de apiarios */
    get apiariosArray(): FormArray {
        return this.apiariosForm.get('apiarios') as FormArray;
    }

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
                this.updateFormValidity();
            });

        // Inicializar formulario de apiarios (para modo CREATE)
        this.initApiariosForm();

        // Actualizar estado inicial
        this.updateFormValidity();
    }

    /**
     * Inicializar formulario con FormArray de apiarios (tabla dinámica)
     */
    private initApiariosForm(): void {
        this.apiariosForm = this.fb.group({
            apiarios: this.fb.array([])
        });

        // Agregar un apiario inicial vacío
        this.addApiario();

        // Escuchar cambios en el FormArray para actualizar totales y validez
        this.apiariosForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.updateTotales();
                this.updateFormValidity();
            });
    }

    /**
     * Crear un FormGroup para un apiario individual
     */
    private createApiarioFormGroup(): FormGroup {
        return this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            colmenas: [null, [Validators.required, Validators.min(1), Validators.max(10000)]],
            produccion: [null, [Validators.required, Validators.min(0.01), Validators.max(1000)]],
            latitud: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
            longitud: [null, [Validators.required, Validators.min(-180), Validators.max(180)]]
        });
    }

    /**
     * Agregar un nuevo apiario a la tabla
     */
    addApiario(): void {
        this.apiariosArray.push(this.createApiarioFormGroup());
    }

    /**
     * Eliminar un apiario de la tabla
     */
    removeApiario(index: number): void {
        if (this.apiariosArray.length > 1) {
            this.apiariosArray.removeAt(index);
        } else {
            this.notificationService.warning('Mínimo requerido', 'Debe tener al menos un apiario.');
        }
    }

    /**
     * Actualizar totales de colmenas y producción anual
     */
    private updateTotales(): void {
        const apiarios = this.apiariosArray.value;
        let totalCol = 0;
        let totalProd = 0;

        apiarios.forEach((apiario: { colmenas: number; produccion: number }) => {
            const colmenas = apiario.colmenas || 0;
            const produccion = apiario.produccion || 0;
            totalCol += colmenas;
            totalProd += colmenas * produccion;
        });

        this.totalColmenas.set(totalCol);
        this.totalProduccionAnual.set(totalProd);
    }

    /**
     * Calcular producción anual de un apiario específico
     */
    getProduccionAnual(index: number): number {
        const apiario = this.apiariosArray.at(index);
        const colmenas = apiario.get('colmenas')?.value || 0;
        const produccion = apiario.get('produccion')?.value || 0;
        return colmenas * produccion;
    }

    /**
     * Actualizar validez del formulario combinado
     * En modo CREATE: apicultorForm + al menos 1 apiario válido
     * En modo EDIT: solo apicultorForm
     */
    private updateFormValidity(): void {
        if (this.mode() === 'create') {
            const apiariosValid = this.apiariosArray.length > 0 && this.apiariosArray.valid;
            this.isFormValid.set(this.apicultorForm.valid && apiariosValid);
        } else {
            this.isFormValid.set(this.apicultorForm.valid);
        }
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

                    // Si es ACOPIADOR, pre-seleccionar su proveedor automáticamente
                    if (this.isAcopiador() && proveedores.length === 1 && !this.apicultorId()) {
                        this.selectedProveedorIds.set([proveedores[0].idProveedor]);
                    }
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
                    this.notificationService.error('Error', 'No se pudo cargar la información del apicultor.');
                    this.navigateToList();
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

        // Validar apiarios en modo CREATE
        if (this.mode() === 'create') {
            if (this.apiariosArray.length === 0) {
                this.notificationService.warning('Apiarios requeridos', 'Debe agregar al menos un apiario.');
                return;
            }
            if (!this.apiariosArray.valid) {
                this.apiariosArray.controls.forEach(control => {
                    (control as FormGroup).markAllAsTouched();
                });
                this.notificationService.warning('Datos incompletos', 'Complete todos los campos de los apiarios.');
                return;
            }
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
                        this.notificationService.error(
                            'Duplicado detectado',
                            'Ya existe un apicultor con el mismo CURP o nombre completo.'
                        );
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
                                // Crear los apiarios con barra de progreso
                                this.createApiariosForApicultor(apicultor.id);
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
     * Crear múltiples apiarios con barra de progreso
     */
    private createApiariosForApicultor(apicultorId: string): void {
        const apiarios = this.apiariosArray.value;
        const total = apiarios.length;

        // Inicializar modal de progreso
        this.apiariosTotal.set(total);
        this.apiariosSaved.set(0);
        this.progressPercent.set(0);
        this.progressMessage.set('Iniciando...');
        this.showProgressModal.set(true);

        // Crear observables para cada apiario
        const apiarioRequests: Observable<unknown>[] = apiarios.map(
            (apiario: { nombre: string; colmenas: number; produccion: number; latitud: number; longitud: number }) => {
                const request: CreateApiarioRequest = {
                    apicultorId: apicultorId,
                    nombre: apiario.nombre,
                    colmenas: apiario.colmenas,
                    produccion: apiario.produccion,
                    latitud: apiario.latitud,
                    longitud: apiario.longitud
                };
                return this.apiarioService.createApiario(request).pipe(
                    catchError(error => {
                        console.error(`Error al crear apiario ${apiario.nombre}:`, error);
                        return of({ error: true, nombre: apiario.nombre });
                    })
                );
            }
        );

        // Ejecutar secuencialmente para mostrar progreso
        this.executeApiariosSequentially(apiarioRequests, 0, total, []);
    }

    /**
     * Ejecutar creación de apiarios secuencialmente
     */
    private executeApiariosSequentially(
        requests: Observable<unknown>[],
        index: number,
        total: number,
        errors: string[]
    ): void {
        if (index >= requests.length) {
            // Todos completados
            this.finishApiariosCreation(errors, total);
            return;
        }

        const apiarioNombre = this.apiariosArray.at(index).get('nombre')?.value || `Apiario ${index + 1}`;
        this.progressMessage.set(`Guardando: ${apiarioNombre}`);

        requests[index].pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (result) => {
                const saved = index + 1;
                this.apiariosSaved.set(saved);
                this.progressPercent.set(Math.round((saved / total) * 100));

                // Verificar si hubo error
                if (result && typeof result === 'object' && 'error' in result && 'nombre' in result) {
                    errors.push(result.nombre as string);
                }

                // Continuar con el siguiente
                this.executeApiariosSequentially(requests, index + 1, total, errors);
            },
            error: () => {
                errors.push(apiarioNombre);
                const saved = index + 1;
                this.apiariosSaved.set(saved);
                this.progressPercent.set(Math.round((saved / total) * 100));
                this.executeApiariosSequentially(requests, index + 1, total, errors);
            }
        });
    }

    /**
     * Finalizar creación de apiarios
     */
    private finishApiariosCreation(errors: string[], total: number): void {
        this.progressMessage.set('¡Completado!');
        this.isSaving.set(false);

        // Esperar un momento para que el usuario vea el 100%
        setTimeout(() => {
            this.showProgressModal.set(false);

            if (errors.length === 0) {
                this.notificationService.success(
                    'Apicultor creado',
                    `El apicultor y sus ${total} apiario(s) se han creado correctamente.`
                );
            } else if (errors.length < total) {
                this.notificationService.warning(
                    'Creación parcial',
                    `El apicultor se creó. ${total - errors.length} de ${total} apiarios guardados. Errores en: ${errors.join(', ')}`
                );
            } else {
                this.notificationService.warning(
                    'Apicultor creado',
                    'El apicultor se creó pero hubo errores al crear los apiarios.'
                );
            }

            this.navigateToList();
        }, 500);
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
                        this.notificationService.error(
                            'Duplicado detectado',
                            'Ya existe otro apicultor con el mismo nombre completo.'
                        );
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
                            next: () => {
                                this.notificationService.success('Apicultor actualizado', 'Los cambios se han guardado correctamente.');
                                this.navigateToList();
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
    // APIARIO HELPERS (Tabla dinámica)
    // ============================================================================

    /**
     * Verificar si un campo del apiario tiene error
     */
    hasApiarioError(index: number, fieldName: string, errorType: string): boolean {
        const apiario = this.apiariosArray.at(index);
        const field = apiario?.get(fieldName);
        return !!(field?.hasError(errorType) && field?.touched);
    }

    /**
     * Obtener mensaje de error para campo de apiario
     */
    getApiarioErrorMessage(index: number, fieldName: string): string {
        const apiario = this.apiariosArray.at(index);
        const field = apiario?.get(fieldName);

        if (!field || !field.errors || !field.touched) {
            return '';
        }

        if (field.hasError('required')) {
            return 'Requerido';
        }

        if (field.hasError('min')) {
            const min = field.errors['min'].min;
            return `Mín: ${min}`;
        }

        if (field.hasError('max')) {
            const max = field.errors['max'].max;
            return `Máx: ${max}`;
        }

        if (field.hasError('minlength')) {
            const minLength = field.errors['minlength'].requiredLength;
            return `Mín ${minLength} chars`;
        }

        if (field.hasError('maxlength')) {
            const maxLength = field.errors['maxlength'].requiredLength;
            return `Máx ${maxLength} chars`;
        }

        return 'Inválido';
    }

    /**
     * Verificar si un apiario tiene algún error
     */
    hasApiarioErrors(index: number): boolean {
        const apiario = this.apiariosArray.at(index);
        return apiario?.invalid && apiario?.touched;
    }

    /**
     * Obtener ubicación GPS actual para un apiario específico
     */
    getCurrentLocation(index: number): void {
        if (!navigator.geolocation) {
            this.notificationService.error('No soportado', 'Geolocalización no soportada por el navegador');
            return;
        }

        this.isGettingLocation.set(true);
        this.gettingLocationIndex.set(index);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const apiario = this.apiariosArray.at(index);
                apiario.patchValue({
                    latitud: parseFloat(position.coords.latitude.toFixed(6)),
                    longitud: parseFloat(position.coords.longitude.toFixed(6))
                });
                apiario.get('latitud')?.markAsTouched();
                apiario.get('longitud')?.markAsTouched();
                this.isGettingLocation.set(false);
                this.gettingLocationIndex.set(-1);
            },
            (error) => {
                console.error('Error al obtener ubicación:', error);
                this.notificationService.error('Error GPS', 'No se pudo obtener la ubicación');
                this.isGettingLocation.set(false);
                this.gettingLocationIndex.set(-1);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    /**
     * Verificar si se está obteniendo ubicación para un índice específico
     */
    isGettingLocationFor(index: number): boolean {
        return this.isGettingLocation() && this.gettingLocationIndex() === index;
    }

    // ============================================================================
    // NAVIGATION
    // ============================================================================

    /**
     * Cancelar y volver al listado
     */
    cancel(): void {
        this.showCancelModal.set(true);
    }

    /**
     * Confirmar cancelación y navegar al listado
     */
    confirmCancel(): void {
        this.showCancelModal.set(false);
        this.navigateToList();
    }

    /**
     * Cerrar modal de cancelación
     */
    closeCancelModal(): void {
        this.showCancelModal.set(false);
    }

    /**
     * Navegar al listado según el rol del usuario
     */
    private navigateToList(): void {
        const user = this.authService.getCurrentUser();
        if (user?.role === 'ACOPIADOR') {
            this.router.navigate(['/acopiador/apicultores']);
        } else {
            this.router.navigate(['/admin/apicultores']);
        }
    }
}