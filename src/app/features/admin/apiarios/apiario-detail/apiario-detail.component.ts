/**
 * ============================================================================
 * 🏠 APIARIO DETAIL COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Formulario para crear y editar apiarios
 * 
 * CARACTERÍSTICAS:
 * - Formulario reactivo con validaciones
 * - Select de apicultores ACTIVOS
 * - Geolocalización DUAL:
 *   1. Input manual (latitud/longitud)
 *   2. Botón "Usar mi ubicación" (Geolocation API)
 * - Modo CREATE y EDIT
 * 
 * ============================================================================
 */

import { Component, computed, signal, inject, DestroyRef, OnInit, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { AutocompleteSelectComponent } from '../../../../shared/components/ui/autocomplete-select/autocomplete-select.component';

// Modelos
import {
    ApiarioDetailAPI,
    CreateApiarioRequest,
    UpdateApiarioRequest,
    ApicultorAPI
} from '../../../../core/models/index';

// Servicios
import { ApiarioService } from '../../../../core/services/apiario.service';
import { ApicultorService } from '../../../../core/services/apicultor.service';
import { AuthService } from '../../../../core/services/auth.service';

type FormMode = 'create' | 'edit';

@Component({
    selector: 'app-apiario-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent,
        AutocompleteSelectComponent,
    ],
    templateUrl: './apiario-detail.component.html',
    styleUrl: './apiario-detail.component.css'
})
export class ApiarioDetailComponent implements OnInit {
    private fb = inject(FormBuilder);
    private apiarioService = inject(ApiarioService);
    private apicultorService = inject(ApicultorService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Modo del formulario */
    mode = signal<FormMode>('create');

    /** ID del apiario en modo edición */
    apiarioId = signal<string | null>(null);

    /** Apiario actual (en modo edición) */
    currentApiario = signal<ApiarioDetailAPI | null>(null);

    /** Estado de carga */
    isLoading = signal<boolean>(false);

    /** Estado de guardado */
    isSaving = signal<boolean>(false);

    /** Lista de apicultores disponibles */
    apicultoresDisponibles = signal<ApicultorAPI[]>([]);

    /** Estado de geolocalización */
    isGettingLocation = signal<boolean>(false);

    /** Error de geolocalización */
    geolocationError = signal<string | null>(null);

    /** ✅ SIGNAL para validez del formulario (REACTIVO) */
    private formValidSignal = signal<boolean>(false);

    /** ✅ Nombre del apicultor pre-seleccionado (cuando viene por query param) */
    apicultorPreseleccionadoNombre = signal<string | null>(null);

    // ============================================================================
    // FORM
    // ============================================================================

    apiarioForm!: FormGroup;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Título de la página */
    pageTitle = computed(() =>
        this.mode() === 'create' ? 'Nuevo Apiario' : 'Editar Apiario'
    );

    /** Texto del botón submit */
    submitButtonText = computed(() =>
        this.mode() === 'create' ? 'Crear Apiario' : 'Actualizar Apiario'
    );

    /** ✅ Si el formulario es válido (AHORA REACTIVO) */
    isFormValid = computed(() => this.formValidSignal());

    /** Apicultores filtrados disponibles (ACTIVOS) */
    apicultoresActivos = computed(() =>
        this.apicultoresDisponibles().filter(a => a.estatus === 'ACTIVO')
    );

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.initForm();
        this.loadApicultores();
        this.checkMode();
        this.setupFormValidation();
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Inicializar formulario reactivo v2.0
     * ✅ CAMBIOS: Agregado campo 'produccion', latitud/longitud opcionales
     */
    private initForm(): void {
        this.apiarioForm = this.fb.group({
            apicultorId: ['', Validators.required],
            nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            colmenas: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
            produccion: [null, [Validators.min(0)]], // ✅ NUEVO: Producción (opcional)
            latitud: [null, [Validators.min(-90), Validators.max(90)]],  // Opcional
            longitud: [null, [Validators.min(-180), Validators.max(180)]]  // Opcional
        });
    }

    /**
     * ✅ NUEVO: Configurar validación reactiva del formulario
     */
    private setupFormValidation(): void {
        // Suscribirse a cambios de validez del formulario
        this.apiarioForm.statusChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.formValidSignal.set(this.apiarioForm.valid);
            });

        // Actualizar estado inicial
        this.formValidSignal.set(this.apiarioForm.valid);
    }

    /**
     * Determinar modo (create/edit) según la ruta
     * ✅ NUEVO: Detectar query param apicultorId para pre-selección
     */
    private checkMode(): void {
        const id = this.route.snapshot.paramMap.get('id');
        const apicultorIdFromQuery = this.route.snapshot.queryParamMap.get('apicultorId');

        if (id && id !== 'nuevo') {
            this.mode.set('edit');
            this.apiarioId.set(id);
            this.loadApiario(id);
        } else {
            this.mode.set('create');

            // ✅ Si viene apicultorId por query params, pre-seleccionar y bloquear
            if (apicultorIdFromQuery) {
                this.preSelectApicultor(apicultorIdFromQuery);
            }
        }
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    /**
     * Cargar lista de apicultores disponibles
     */
    private loadApicultores(): void {
        this.apicultorService
            .getAllApicultores()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apicultores) => {
                    this.apicultoresDisponibles.set(apicultores);
                },
                error: (error) => {
                    console.error('Error al cargar apicultores:', error);
                }
            });
    }

    /**
     * Cargar datos del apiario (modo edición)
     */
    private loadApiario(id: string): void {
        this.isLoading.set(true);

        this.apiarioService
            .getApiarioById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apiario) => {
                    this.currentApiario.set(apiario);
                    this.patchFormValues(apiario);
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar apiario:', error);
                    this.router.navigate(['/admin/apiarios']);
                    this.isLoading.set(false);
                }
            });
    }

    /**
     * Rellenar formulario con datos del apiario v2.0
     * ✅ Ahora también carga el nombre del apicultor para mostrar en UI
     */
    private patchFormValues(apiario: ApiarioDetailAPI): void {
        this.apiarioForm.patchValue({
            apicultorId: apiario.apicultorId,
            nombre: apiario.nombre,
            colmenas: apiario.colmenas,
            produccion: apiario.produccion || null, // ✅ NUEVO
            latitud: apiario.latitud || null,
            longitud: apiario.longitud || null
        });

        // ✅ Guardar nombre del apicultor para mostrar en modo edición
        if (apiario.apicultorNombre) {
            this.apicultorPreseleccionadoNombre.set(
                `${apiario.apicultorCodigo} - ${apiario.apicultorNombre}`
            );
        }

        // Deshabilitar apicultorId en modo edición (no se puede cambiar)
        this.apiarioForm.get('apicultorId')?.disable();
    }

    /**
     * ✅ Pre-seleccionar apicultor cuando viene por query param
     * Esto ocurre cuando se crea desde el modal de apicultor
     */
    private preSelectApicultor(apicultorId: string): void {
        // Pre-llenar el campo
        this.apiarioForm.patchValue({
            apicultorId: apicultorId
        });

        // Deshabilitar el campo para que no se pueda cambiar
        this.apiarioForm.get('apicultorId')?.disable();

        // Usar effect para actualizar el nombre cuando los apicultores estén cargados
        effect(() => {
            const apicultores = this.apicultoresDisponibles();
            if (apicultores.length > 0) {
                const apicultor = apicultores.find(a => a.id === apicultorId);
                if (apicultor) {
                    this.apicultorPreseleccionadoNombre.set(apicultor.nombreCompleto);
                }
            }
        }, { allowSignalWrites: true });
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    /**
     * ✅ Obtener ruta base según el rol del usuario
     */
    private getBaseRoute(): string {
        const currentUser = this.authService.getCurrentUser();
        return currentUser?.role === 'ACOPIADOR' ? '/acopiador' : '/admin';
    }

    // ============================================================================
    // GEOLOCALIZACIÓN
    // ============================================================================

    /**
     * Obtener ubicación actual del usuario
     */
    getCurrentLocation(): void {
        // Verificar si el navegador soporta geolocalización
        if (!navigator.geolocation) {
            this.geolocationError.set('Tu navegador no soporta geolocalización');
            return;
        }

        this.isGettingLocation.set(true);
        this.geolocationError.set(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Éxito: rellenar los campos
                this.apiarioForm.patchValue({
                    latitud: position.coords.latitude,
                    longitud: position.coords.longitude
                });
                this.isGettingLocation.set(false);
            },
            (error) => {
                // Error: mostrar mensaje
                this.isGettingLocation.set(false);

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        this.geolocationError.set('Permiso denegado. Por favor habilita la ubicación en tu navegador.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        this.geolocationError.set('Ubicación no disponible.');
                        break;
                    case error.TIMEOUT:
                        this.geolocationError.set('Tiempo de espera agotado.');
                        break;
                    default:
                        this.geolocationError.set('Error desconocido al obtener ubicación.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // ============================================================================
    // FORM SUBMIT
    // ============================================================================

    /**
     * Enviar formulario
     */
    onSubmit(): void {
        if (!this.apiarioForm.valid) {
            this.apiarioForm.markAllAsTouched();
            return;
        }

        if (this.mode() === 'create') {
            this.createApiario();
        } else {
            this.updateApiario();
        }
    }

    /**
     * Crear nuevo apiario v2.0
     * ✅ Incluye campo produccion
     */
    private createApiario(): void {
        this.isSaving.set(true);

        const formValue = this.apiarioForm.getRawValue();
        const request: CreateApiarioRequest = {
            apicultorId: formValue.apicultorId,
            nombre: formValue.nombre,
            colmenas: formValue.colmenas,
            produccion: formValue.produccion != null ? formValue.produccion : undefined, // ✅ Envía 0 si es válido
            latitud: formValue.latitud ? parseFloat(formValue.latitud) : 0,
            longitud: formValue.longitud ? parseFloat(formValue.longitud) : 0
        };

        this.apiarioService
            .createApiario(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apiario) => {
                    const baseRoute = this.getBaseRoute();
                    this.router.navigate([`${baseRoute}/apiarios`]);
                    this.isSaving.set(false);
                },
                error: (error) => {
                    console.error('Error al crear apiario:', error);
                    alert('Error al crear el apiario. Verifica que el apicultor esté activo.');
                    this.isSaving.set(false);
                }
            });
    }

    /**
     * Actualizar apiario existente v2.0
     * ✅ Incluye campo produccion
     */
    private updateApiario(): void {
        if (!this.apiarioId()) return;

        this.isSaving.set(true);

        const formValue = this.apiarioForm.getRawValue();
        const request: UpdateApiarioRequest = {
            nombre: formValue.nombre,
            colmenas: formValue.colmenas,
            produccion: formValue.produccion != null ? formValue.produccion : undefined, // ✅ Envía 0 si es válido
            latitud: formValue.latitud ? parseFloat(formValue.latitud) : undefined,
            longitud: formValue.longitud ? parseFloat(formValue.longitud) : undefined
        };

        this.apiarioService
            .updateApiario(this.apiarioId()!, request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apiario) => {
                    const baseRoute = this.getBaseRoute();
                    this.router.navigate([`${baseRoute}/apiarios`]);
                    this.isSaving.set(false);
                },
                error: (error) => {
                    console.error('Error al actualizar apiario:', error);
                    alert('Error al actualizar el apiario.');
                    this.isSaving.set(false);
                }
            });
    }

    // ============================================================================
    // FORM HELPERS
    // ============================================================================

    /**
     * Verificar si un campo tiene error
     */
    hasError(fieldName: string, errorType: string): boolean {
        const field = this.apiarioForm.get(fieldName);
        return !!(field?.hasError(errorType) && field?.touched);
    }

    /**
     * Obtener mensaje de error para un campo
     */
    getErrorMessage(fieldName: string): string {
        const field = this.apiarioForm.get(fieldName);

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

        if (field.hasError('min')) {
            const min = field.errors['min'].min;
            return `Valor mínimo: ${min}`;
        }

        if (field.hasError('max')) {
            const max = field.errors['max'].max;
            return `Valor máximo: ${max}`;
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
            const baseRoute = this.getBaseRoute();
            this.router.navigate([`${baseRoute}/apiarios`]);
        }
    }

    /**
     * ✅ NUEVO: Regresar al listado sin confirmación
     */
    goBack(): void {
        const baseRoute = this.getBaseRoute();
        this.router.navigate([`${baseRoute}/apiarios`]);
    }

    /**
     * ✅ NUEVO: Formatear label del apicultor para el autocomplete
     */
    formatApicultorLabel = (apicultor: ApicultorAPI): string => {
        return `${apicultor.codigo} - ${apicultor.nombre}`;
    };
}