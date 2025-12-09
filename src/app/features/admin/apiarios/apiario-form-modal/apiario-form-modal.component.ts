/**
 * ============================================================================
 * 🏠 APIARIO FORM MODAL - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Modal para crear y editar apiarios desde el modal de apicultor
 *
 * CARACTERÍSTICAS:
 * - Formulario reactivo con validaciones
 * - Modo CREATE y EDIT
 * - Geolocalización (Geolocation API)
 * - Cálculo de producción anual en tiempo real
 * - Se abre desde el modal de apicultor (mantiene contexto)
 *
 * ============================================================================
 */

import { Component, computed, signal, inject, DestroyRef, input, output, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';

// Modelos
import {
    ApiarioDetailAPI,
    CreateApiarioRequest,
    UpdateApiarioRequest,
    ApicultorApiario
} from '../../../../core/models/index';

// Servicios
import { ApiarioService } from '../../../../core/services/apiario.service';
import { NotificationService } from '../../../../core/services/notification.service';

type FormMode = 'create' | 'edit';

@Component({
    selector: 'app-apiario-form-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent
    ],
    templateUrl: './apiario-form-modal.component.html',
    styleUrl: './apiario-form-modal.component.css'
})
export class ApiarioFormModalComponent {
    private fb = inject(FormBuilder);
    private apiarioService = inject(ApiarioService);
    private notificationService = inject(NotificationService);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // INPUTS / OUTPUTS
    // ============================================================================

    /** Si el modal está abierto */
    isOpen = input<boolean>(false);

    /** ID del apicultor (requerido para crear) */
    apicultorId = input.required<string>();

    /** Nombre del apicultor (para mostrar en UI) */
    apicultorNombre = input<string>('');

    /** Apiario a editar (null para crear nuevo) */
    apiario = input<ApicultorApiario | null>(null);

    /** Evento de cierre */
    close = output<void>();

    /** Evento de guardado exitoso */
    saved = output<void>();

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Modo del formulario */
    mode = signal<FormMode>('create');

    /** Estado de guardado */
    isSaving = signal<boolean>(false);

    /** Estado de carga (para edición) */
    isLoading = signal<boolean>(false);

    /** Estado de geolocalización */
    isGettingLocation = signal<boolean>(false);

    /** Error de geolocalización */
    geolocationError = signal<string | null>(null);

    /** Validez del formulario (reactivo) */
    private formValidSignal = signal<boolean>(false);

    /** Producción anual calculada en tiempo real */
    produccionAnualCalculada = signal<number>(0);

    // ============================================================================
    // FORM
    // ============================================================================

    apiarioForm!: FormGroup;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Título del modal */
    modalTitle = computed(() =>
        this.mode() === 'create' ? 'Nuevo Apiario' : 'Editar Apiario'
    );

    /** Subtítulo del modal */
    modalSubtitle = computed(() =>
        this.mode() === 'create' ? 'Registra un nuevo apiario' : 'Modifica los datos del apiario'
    );

    /** Texto del botón submit */
    submitButtonText = computed(() =>
        this.mode() === 'create' ? 'Crear Apiario' : 'Actualizar Apiario'
    );

    /** Si el formulario es válido */
    isFormValid = computed(() => this.formValidSignal());

    // ============================================================================
    // CONSTRUCTOR & EFFECTS
    // ============================================================================

    constructor() {
        this.initForm();

        // Efecto para inicializar cuando se abre el modal
        effect(() => {
            if (this.isOpen()) {
                const apiarioData = this.apiario();
                if (apiarioData) {
                    this.mode.set('edit');
                    this.patchFormValues(apiarioData);
                } else {
                    this.mode.set('create');
                    this.resetForm();
                }
            }
        });
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Inicializar formulario reactivo
     */
    private initForm(): void {
        this.apiarioForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            colmenas: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
            produccion: ['', [Validators.required, Validators.min(0.01), Validators.max(1000)]],
            latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
            longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]]
        });

        this.setupFormValidation();
    }

    /**
     * Configurar validación reactiva del formulario + cálculo de producción anual
     */
    private setupFormValidation(): void {
        // Suscribirse a cambios de validez del formulario
        this.apiarioForm.statusChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.formValidSignal.set(this.apiarioForm.valid);
            });

        // Calcular producción anual en tiempo real
        this.apiarioForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((values) => {
                const colmenas = values.colmenas || 0;
                const produccion = values.produccion || 0;
                this.produccionAnualCalculada.set(colmenas * produccion);
            });

        // Actualizar estado inicial
        this.formValidSignal.set(this.apiarioForm.valid);
    }

    /**
     * Resetear formulario para modo creación
     */
    private resetForm(): void {
        this.apiarioForm.reset({
            nombre: '',
            colmenas: 1,
            produccion: '',
            latitud: '',
            longitud: ''
        });
        this.produccionAnualCalculada.set(0);
        this.geolocationError.set(null);
    }

    /**
     * Rellenar formulario con datos del apiario (modo edición)
     */
    private patchFormValues(apiario: ApicultorApiario): void {
        this.apiarioForm.patchValue({
            nombre: apiario.nombre,
            colmenas: apiario.colmenas,
            produccion: apiario.produccion,
            latitud: apiario.latitud,
            longitud: apiario.longitud
        });
    }

    // ============================================================================
    // GEOLOCALIZACIÓN
    // ============================================================================

    /**
     * Obtener ubicación actual del usuario
     */
    getCurrentLocation(): void {
        if (!navigator.geolocation) {
            this.geolocationError.set('Tu navegador no soporta geolocalización');
            return;
        }

        this.isGettingLocation.set(true);
        this.geolocationError.set(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.apiarioForm.patchValue({
                    latitud: position.coords.latitude,
                    longitud: position.coords.longitude
                });
                this.isGettingLocation.set(false);
            },
            (error) => {
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
            apicultorId: this.apicultorId(),
            nombre: formValue.nombre,
            colmenas: formValue.colmenas,
            produccion: parseFloat(formValue.produccion),
            latitud: parseFloat(formValue.latitud),
            longitud: parseFloat(formValue.longitud)
        };

        this.apiarioService
            .createApiario(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.notificationService.success('Apiario creado exitosamente');
                    this.isSaving.set(false);
                    this.saved.emit();
                    this.onClose();
                },
                error: (error) => {
                    console.error('Error al crear apiario:', error);
                    this.notificationService.error('Error al crear el apiario. Verifica los datos.');
                    this.isSaving.set(false);
                }
            });
    }

    /**
     * Actualizar apiario existente
     */
    private updateApiario(): void {
        const apiarioData = this.apiario();
        if (!apiarioData) return;

        this.isSaving.set(true);

        const formValue = this.apiarioForm.getRawValue();
        const request: UpdateApiarioRequest = {
            nombre: formValue.nombre,
            colmenas: formValue.colmenas,
            produccion: parseFloat(formValue.produccion),
            latitud: parseFloat(formValue.latitud),
            longitud: parseFloat(formValue.longitud)
        };

        this.apiarioService
            .updateApiario(apiarioData.id, request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.notificationService.success('Apiario actualizado exitosamente');
                    this.isSaving.set(false);
                    this.saved.emit();
                    this.onClose();
                },
                error: (error) => {
                    console.error('Error al actualizar apiario:', error);
                    this.notificationService.error('Error al actualizar el apiario.');
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
    // MODAL HANDLERS
    // ============================================================================

    /**
     * Cerrar modal
     */
    onClose(): void {
        this.close.emit();
        this.resetForm();
        this.mode.set('create');
    }

    /**
     * Cerrar con Escape
     */
    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape' && !this.isSaving()) {
            this.onClose();
        }
    }

    /**
     * Prevenir cierre al hacer click dentro del modal
     */
    onModalClick(event: MouseEvent): void {
        event.stopPropagation();
    }
}
