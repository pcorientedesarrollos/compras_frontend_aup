/**
 * ============================================================================
 * 🐝 APICULTOR DETAIL COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Formulario para crear y editar apicultores
 * 
 * CARACTERÍSTICAS:
 * - Formulario reactivo con validaciones
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

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';

// Modelos
import {
    ApicultorAPI,
    CreateApicultorRequest,
    UpdateApicultorRequest,
    ProveedorAPI
} from '../../../../core/models/index';

// Servicios
import { ApicultorService } from '../../../../core/services/apicultor.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';

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

    /** Si el formulario es válido */
    isFormValid = computed(() => this.apicultorForm?.valid || false);

    /** Proveedores filtrados disponibles (activos) */
    proveedoresActivos = computed(() =>
        this.proveedoresDisponibles().filter(p => p.deleteProve === 0)
    );

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.initForm();
        this.loadProveedores();
        this.checkMode();
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Inicializar formulario reactivo
     */
    private initForm(): void {
        this.apicultorForm = this.fb.group({
            codigo: ['', [Validators.required, Validators.minLength(3)]],
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            curp: ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]],
            rfc: [''], // RFC opcional, sin validación estricta
            estadoCodigo: [''],
            municipioCodigo: [''],
            direccion: [''],
            senasica: [''],
            ippSiniga: [''],
            estatus: ['ACTIVO', Validators.required]
        });
    }

    /**
     * Determinar modo (create/edit) según la ruta
     */
    private checkMode(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id && id !== 'nuevo') {
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
     * Rellenar formulario con datos del apicultor
     */
    private patchFormValues(apicultor: ApicultorAPI): void {
        this.apicultorForm.patchValue({
            codigo: apicultor.codigo,
            nombre: apicultor.nombre,
            curp: apicultor.curp,
            rfc: apicultor.rfc || '',
            estadoCodigo: apicultor.estadoCodigo || '',
            municipioCodigo: apicultor.municipioCodigo || '',
            direccion: apicultor.direccion || '',
            senasica: apicultor.senasica || '',
            ippSiniga: apicultor.ippSiniga || '',
            estatus: apicultor.estatus
        });

        // Deshabilitar código y CURP en modo edición (no se pueden cambiar)
        this.apicultorForm.get('codigo')?.disable();
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
     * Crear nuevo apicultor
     */
    private createApicultor(): void {
        this.isSaving.set(true);

        const formValue = this.apicultorForm.getRawValue();
        const request: CreateApicultorRequest = {
            codigo: formValue.codigo,
            nombre: formValue.nombre,
            curp: formValue.curp,
            rfc: formValue.rfc || undefined,
            estadoCodigo: formValue.estadoCodigo || undefined,
            municipioCodigo: formValue.municipioCodigo || undefined,
            direccion: formValue.direccion || undefined,
            senasica: formValue.senasica || undefined,
            ippSiniga: formValue.ippSiniga || undefined,
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
    }

    /**
     * Actualizar apicultor existente
     */
    private updateApicultor(): void {
        if (!this.apicultorId()) return;

        this.isSaving.set(true);

        const formValue = this.apicultorForm.getRawValue();
        const request: UpdateApicultorRequest = {
            nombre: formValue.nombre,
            rfc: formValue.rfc || undefined,
            estadoCodigo: formValue.estadoCodigo || undefined,
            municipioCodigo: formValue.municipioCodigo || undefined,
            direccion: formValue.direccion || undefined,
            senasica: formValue.senasica || undefined,
            ippSiniga: formValue.ippSiniga || undefined,
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