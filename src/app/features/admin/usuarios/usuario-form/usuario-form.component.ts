/**
 * ============================================================================
 * 👤 USUARIO FORM COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Formulario para crear/editar usuarios (Solo ADMINISTRADOR)
 *
 * FUNCIONALIDADES:
 * 1. Crear nuevo usuario con validación de password
 * 2. Editar usuario existente (sin cambiar password)
 * 3. Validación de formulario reactiva
 * 4. Selección de rol con campos dinámicos
 * 5. Campos condicionales según rol (proveedorId, apicultorId, verificadorId)
 *
 * ============================================================================
 */

import { Component, inject, signal, DestroyRef, OnInit, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// Servicios
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { ApicultorService } from '../../../../core/services/apicultor.service';
import { NotificationService } from '../../../../core/services/notification.service';

// Modelos
import {
    CreateUserRequest,
    UpdateUserRequest,
    User,
    UserRole,
    ROLE_OPTIONS,
    validatePasswordStrength
} from '../../../../core/models/user.model';
import { ProveedorAPI } from '../../../../core/models/proveedor.model';
import { ApicultorAPI } from '../../../../core/models/apicultor.model';

// Componentes
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';

@Component({
    selector: 'app-usuario-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent
    ],
    templateUrl: './usuario-form.component.html',
    styleUrl: './usuario-form.component.css'
})
export class UsuarioFormComponent implements OnInit {
    private usuarioService = inject(UsuarioService);
    private proveedorService = inject(ProveedorService);
    private apicultorService = inject(ApicultorService);
    private notificationService = inject(NotificationService);
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Modo: 'create' | 'edit' */
    mode = signal<'create' | 'edit'>('create');

    /** ID del usuario en modo edición */
    userId = signal<string | null>(null);

    /** Usuario actual (en modo edición) */
    currentUser = signal<User | null>(null);

    /** Estado de carga */
    isLoading = signal<boolean>(false);

    /** Validez del formulario */
    formValid = signal<boolean>(false);

    /** Mensajes */
    errorMessage = signal<string | null>(null);

    /** Errores de validación de contraseña */
    passwordErrors = signal<string[]>([]);

    /** Rol seleccionado (signal para reactividad) */
    selectedRoleSignal = signal<UserRole | null>(null);

    /** Listas para selects */
    proveedores = signal<ProveedorAPI[]>([]);
    apicultores = signal<ApicultorAPI[]>([]);

    // ============================================================================
    // FORMS
    // ============================================================================

    /** Formulario principal */
    usuarioForm!: FormGroup;

    // ============================================================================
    // CONSTANTS
    // ============================================================================

    /** Opciones de roles */
    roleOptions = ROLE_OPTIONS;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /**
     * Título de la página según modo
     */
    pageTitle = computed(() => {
        return this.mode() === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario';
    });

    /**
     * ¿Mostrar campo proveedorId?
     */
    showProveedorField = computed(() => {
        const role = this.selectedRoleSignal();
        return role === 'ACOPIADOR' || role === 'MIELERA';
    });

    /**
     * ¿Mostrar campo apicultorId?
     */
    showApicultorField = computed(() => {
        const role = this.selectedRoleSignal();
        return role === 'APICULTOR';
    });

    /**
     * ¿Mostrar campo verificadorId?
     */
    showVerificadorField = computed(() => {
        const role = this.selectedRoleSignal();
        return role === 'VERIFICADOR';
    });

    /**
     * ¿La contraseña es válida?
     */
    isPasswordValid = computed(() => {
        if (this.mode() === 'edit') return true; // No se valida en edición
        const errors = this.passwordErrors();
        return errors.length === 0;
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.initForm();
        this.checkMode();
        this.setupFormValidation();
        this.loadSelectData();
    }

    // ============================================================================
    // FORM INITIALIZATION
    // ============================================================================

    /**
     * Inicializar formulario
     */
    private initForm(): void {
        this.usuarioForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            email: ['', [Validators.email, Validators.maxLength(255)]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            role: ['', Validators.required],
            proveedorId: [null],
            apicultorId: [null],
            verificadorId: [null]
        });
    }

    /**
     * Configurar validación reactiva
     */
    private setupFormValidation(): void {
        // Validación general del formulario
        this.usuarioForm.statusChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                const isValid = this.usuarioForm.valid &&
                    (this.mode() === 'edit' || this.isPasswordValid());
                this.formValid.set(isValid);
            });

        // Validación de contraseña (solo en modo creación)
        this.usuarioForm.get('password')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((password) => {
                if (this.mode() === 'create' && password) {
                    const validation = validatePasswordStrength(password);
                    this.passwordErrors.set(validation.errors);
                }
            });

        // Actualizar validaciones cuando cambia el rol
        this.usuarioForm.get('role')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((role: UserRole) => {
                // Actualizar signal del rol para reactividad en computed
                this.selectedRoleSignal.set(role);

                // Limpiar campos condicionales
                this.usuarioForm.patchValue({
                    proveedorId: null,
                    apicultorId: null,
                    verificadorId: null
                });

                // Actualizar validaciones según el rol
                this.updateConditionalValidators(role);
            });

        // Initial state
        this.formValid.set(this.usuarioForm.valid);
    }

    /**
     * Actualizar validadores condicionales según el rol
     */
    private updateConditionalValidators(role: UserRole): void {
        const proveedorIdControl = this.usuarioForm.get('proveedorId');
        const apicultorIdControl = this.usuarioForm.get('apicultorId');

        // Limpiar validadores previos
        proveedorIdControl?.clearValidators();
        apicultorIdControl?.clearValidators();

        // Agregar validadores según el rol
        if (role === 'ACOPIADOR' || role === 'MIELERA') {
            proveedorIdControl?.setValidators([Validators.required]);
        }

        if (role === 'APICULTOR') {
            apicultorIdControl?.setValidators([Validators.required]);
        }

        // Actualizar estado de validación
        proveedorIdControl?.updateValueAndValidity();
        apicultorIdControl?.updateValueAndValidity();
    }

    /**
     * Verificar modo (create o edit)
     */
    private checkMode(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.mode.set('edit');
            this.userId.set(id);
            this.loadUsuario(id);
            // En modo edición, password NO es obligatorio
            this.usuarioForm.get('password')?.clearValidators();
            this.usuarioForm.get('password')?.updateValueAndValidity();
        } else {
            this.mode.set('create');
        }
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    /**
     * Cargar usuario para edición
     */
    private loadUsuario(id: string): void {
        this.isLoading.set(true);

        this.usuarioService.getUsuarioById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (user) => {
                    this.currentUser.set(user);

                    // Actualizar signal del rol ANTES de patchValue
                    this.selectedRoleSignal.set(user.role);
                    this.updateConditionalValidators(user.role);

                    this.usuarioForm.patchValue({
                        username: user.username,
                        email: user.email || '',
                        nombre: user.nombre,
                        role: user.role,
                        proveedorId: user.proveedorId || null,
                        apicultorId: user.apicultorId || null,
                        verificadorId: user.verificadorId || null
                    });
                    // Username NO se puede editar
                    this.usuarioForm.get('username')?.disable();
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar usuario:', error);
                    this.errorMessage.set('Error al cargar usuario');
                    this.isLoading.set(false);
                }
            });
    }

    /**
     * Cargar datos para selects
     */
    private loadSelectData(): void {
        // Cargar proveedores
        this.proveedorService.getProveedoresActivos()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (proveedores: ProveedorAPI[]) => this.proveedores.set(proveedores),
                error: (error: any) => console.error('Error al cargar proveedores:', error)
            });

        // Cargar apicultores
        this.apicultorService.getAllApicultores()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (apicultores: ApicultorAPI[]) => this.apicultores.set(apicultores),
                error: (error: any) => console.error('Error al cargar apicultores:', error)
            });
    }

    // ============================================================================
    // FORM SUBMISSION
    // ============================================================================

    /**
     * Submit del formulario
     */
    onSubmit(): void {
        if (!this.usuarioForm.valid || (this.mode() === 'create' && !this.isPasswordValid())) {
            this.usuarioForm.markAllAsTouched();
            return;
        }

        if (this.mode() === 'create') {
            this.createUsuario();
        } else {
            this.updateUsuario();
        }
    }

    /**
     * Crear usuario
     */
    private createUsuario(): void {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        const formValue = this.usuarioForm.value;
        const data: CreateUserRequest = {
            username: formValue.username,
            email: formValue.email || undefined,
            password: formValue.password,
            nombre: formValue.nombre,
            role: formValue.role,
            // proveedorId es number (int), asegurar tipo correcto
            proveedorId: formValue.proveedorId ? Number(formValue.proveedorId) : undefined,
            apicultorId: formValue.apicultorId || undefined,
            verificadorId: formValue.verificadorId || undefined
        };

        this.usuarioService.createUsuario(data)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.notificationService.success('Usuario creado exitosamente');
                    this.router.navigate(['/admin/usuarios']);
                },
                error: (error) => {
                    console.error('Error al crear usuario:', error);
                    const message = error.message || 'Error al crear usuario';
                    this.notificationService.error(message);
                    this.isLoading.set(false);
                }
            });
    }

    /**
     * Actualizar usuario
     */
    private updateUsuario(): void {
        const id = this.userId();
        if (!id) return;

        this.isLoading.set(true);
        this.errorMessage.set(null);

        const formValue = this.usuarioForm.getRawValue();
        const data: UpdateUserRequest = {
            email: formValue.email || undefined,
            nombre: formValue.nombre,
            role: formValue.role,
            // proveedorId es number (int), asegurar tipo correcto
            proveedorId: formValue.proveedorId ? Number(formValue.proveedorId) : null,
            apicultorId: formValue.apicultorId || null,
            verificadorId: formValue.verificadorId || null
        };

        this.usuarioService.updateUsuario(id, data)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.notificationService.success('Usuario actualizado exitosamente');
                    this.router.navigate(['/admin/usuarios']);
                },
                error: (error) => {
                    console.error('Error al actualizar usuario:', error);
                    const message = error.message || 'Error al actualizar usuario';
                    this.notificationService.error(message);
                    this.isLoading.set(false);
                }
            });
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    /**
     * Cancelar y volver a la lista
     */
    cancel(): void {
        this.router.navigate(['/admin/usuarios']);
    }

    /**
     * Verificar si un campo tiene error
     */
    hasError(field: string, errorType: string): boolean {
        const control = this.usuarioForm.get(field);
        return !!(control?.hasError(errorType) && (control?.touched || control?.dirty));
    }
}
