/**
 * ============================================================================
 * 🐝 APIARIO DETAIL COMPONENT - SISTEMA OAXACA MIEL
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

import { Component, computed, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';

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

type FormMode = 'create' | 'edit';

@Component({
    selector: 'app-apiario-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent,
    ],
    templateUrl: './apiario-detail.component.html',
    styleUrl: './apiario-detail.component.css'
})
export class ApiarioDetailComponent implements OnInit {
    private fb = inject(FormBuilder);
    private apiarioService = inject(ApiarioService);
    private apicultorService = inject(ApicultorService);
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

    /** Si el formulario es válido */
    isFormValid = computed(() => this.apiarioForm?.valid || false);

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
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Inicializar formulario reactivo
     */
    private initForm(): void {
        this.apiarioForm = this.fb.group({
            apicultorId: ['', Validators.required],
            nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            colmenas: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
            latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
            longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]]
        });
    }

    /**
     * Determinar modo (create/edit) según la ruta
     */
    private checkMode(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id && id !== 'nuevo') {
            this.mode.set('edit');
            this.apiarioId.set(id);
            this.loadApiario(id);
        } else {
            this.mode.set('create');
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
     * Rellenar formulario con datos del apiario
     */
    private patchFormValues(apiario: ApiarioDetailAPI): void {
        this.apiarioForm.patchValue({
            apicultorId: apiario.apicultorId,
            nombre: apiario.nombre,
            colmenas: apiario.colmenas,
            latitud: apiario.latitud,
            longitud: apiario.longitud
        });

        // Deshabilitar apicultorId en modo edición (no se puede cambiar)
        this.apiarioForm.get('apicultorId')?.disable();
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
     * Crear nuevo apiario
     */
    private createApiario(): void {
        this.isSaving.set(true);

        const formValue = this.apiarioForm.getRawValue();
        const request: CreateApiarioRequest = {
            apicultorId: formValue.apicultorId,
            nombre: formValue.nombre,
            colmenas: formValue.colmenas,
            latitud: parseFloat(formValue.latitud),
            longitud: parseFloat(formValue.longitud)
        };

        this.apiarioService
            .createApiario(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apiario) => {
                    this.router.navigate(['/admin/apiarios']);
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
     * Actualizar apiario existente
     */
    private updateApiario(): void {
        if (!this.apiarioId()) return;

        this.isSaving.set(true);

        const formValue = this.apiarioForm.getRawValue();
        const request: UpdateApiarioRequest = {
            nombre: formValue.nombre,
            colmenas: formValue.colmenas,
            latitud: parseFloat(formValue.latitud),
            longitud: parseFloat(formValue.longitud)
        };

        this.apiarioService
            .updateApiario(this.apiarioId()!, request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apiario) => {
                    this.router.navigate(['/admin/apiarios']);
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
            this.router.navigate(['/admin/apiarios']);
        }
    }
}