/**
 * ============================================================================
 * 👤 MI PERFIL COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente para ver y editar el perfil propio del usuario
 * Accesible para TODOS los roles autenticados
 *
 * FUNCIONALIDADES:
 * 1. Ver datos del usuario actual
 * 2. Editar nombre y email
 * 3. Cambiar contraseña
 *
 * ============================================================================
 */

import { Component, inject, signal, DestroyRef, OnInit, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Servicios
import { AuthService } from '../../../core/services/auth.service';

// Modelos
import {
    User,
    UpdateProfileRequest,
    ChangePasswordRequest,
    validatePasswordStrength
} from '../../../core/models/user.model';

// Componentes compartidos
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

@Component({
    selector: 'app-perfil',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent,
        BadgeComponent
    ],
    templateUrl: './perfil.component.html',
    styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Usuario actual */
    currentUser = signal<User | null>(null);

    /** Estado de carga */
    isLoading = signal<boolean>(false);

    /** Mensaje de éxito */
    successMessage = signal<string | null>(null);

    /** Mensaje de error */
    errorMessage = signal<string | null>(null);

    /** Modo edición para perfil */
    isEditingProfile = signal<boolean>(false);

    /** Modo edición para contraseña */
    isEditingPassword = signal<boolean>(false);

    /** Validez del formulario de perfil */
    profileFormValid = signal<boolean>(false);

    /** Validez del formulario de contraseña */
    passwordFormValid = signal<boolean>(false);

    /** Errores de validación de contraseña */
    passwordErrors = signal<string[]>([]);

    // ============================================================================
    // FORMS
    // ============================================================================

    /** Formulario de edición de perfil */
    profileForm!: FormGroup;

    /** Formulario de cambio de contraseña */
    passwordForm!: FormGroup;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /**
     * Texto del rol en español
     */
    roleLabel = computed(() => {
        const user = this.currentUser();
        if (!user) return '';

        const roleLabels: Record<string, string> = {
            'ADMINISTRADOR': 'Administrador',
            'ACOPIADOR': 'Acopiador',
            'APICULTOR': 'Apicultor',
            'MIELERA': 'Mielera',
            'VERIFICADOR': 'Verificador'
        };

        return roleLabels[user.role] || user.role;
    });

    /**
     * Badge variant según el rol
     */
    roleBadgeVariant = computed(() => {
        const user = this.currentUser();
        if (!user) return 'default' as const;

        const variants: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
            'ADMINISTRADOR': 'danger',
            'ACOPIADOR': 'success',
            'APICULTOR': 'warning',
            'MIELERA': 'info',
            'VERIFICADOR': 'info'
        };

        return variants[user.role] || 'default' as const;
    });

    /**
     * Verificar si la nueva contraseña es válida
     */
    isNewPasswordValid = computed(() => {
        const errors = this.passwordErrors();
        return errors.length === 0;
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.initForms();
        this.loadUserProfile();
        this.setupFormValidation();
    }

    // ============================================================================
    // FORM INITIALIZATION
    // ============================================================================

    /**
     * Inicializar formularios
     */
    private initForms(): void {
        // Formulario de perfil
        this.profileForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            email: ['', [Validators.email, Validators.maxLength(255)]]
        });

        // Formulario de contraseña
        this.passwordForm = this.fb.group({
            oldPassword: ['', [Validators.required, Validators.minLength(8)]],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]]
        });
    }

    /**
     * Configurar validación reactiva de formularios
     */
    private setupFormValidation(): void {
        // Validación de formulario de perfil
        this.profileForm.statusChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.profileFormValid.set(this.profileForm.valid);
            });

        // Validación de formulario de contraseña
        this.passwordForm.statusChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.passwordFormValid.set(this.passwordForm.valid && this.passwordsMatch());
            });

        // Validación de fortaleza de nueva contraseña
        this.passwordForm.get('newPassword')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((password) => {
                if (password) {
                    const validation = validatePasswordStrength(password);
                    this.passwordErrors.set(validation.errors);
                } else {
                    this.passwordErrors.set([]);
                }
            });

        // Initial state
        this.profileFormValid.set(this.profileForm.valid);
        this.passwordFormValid.set(false);
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    /**
     * Cargar perfil del usuario
     */
    private loadUserProfile(): void {
        this.isLoading.set(true);

        this.authService.getProfile()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (user) => {
                    this.currentUser.set(user);
                    this.profileForm.patchValue({
                        nombre: user.nombre,
                        email: user.email || ''
                    });
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar perfil:', error);
                    this.errorMessage.set('Error al cargar el perfil');
                    this.isLoading.set(false);
                }
            });
    }

    // ============================================================================
    // EVENT HANDLERS - PROFILE
    // ============================================================================

    /**
     * Activar modo edición de perfil
     */
    enableProfileEdit(): void {
        this.isEditingProfile.set(true);
        this.clearMessages();
    }

    /**
     * Cancelar edición de perfil
     */
    cancelProfileEdit(): void {
        this.isEditingProfile.set(false);
        const user = this.currentUser();
        if (user) {
            this.profileForm.patchValue({
                nombre: user.nombre,
                email: user.email || ''
            });
        }
        this.clearMessages();
    }

    /**
     * Guardar cambios de perfil
     */
    saveProfile(): void {
        if (!this.profileForm.valid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.clearMessages();

        const data: UpdateProfileRequest = {
            nombre: this.profileForm.value.nombre,
            email: this.profileForm.value.email || undefined
        };

        this.authService.updateProfile(data)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (user) => {
                    this.currentUser.set(user);
                    this.isEditingProfile.set(false);
                    this.successMessage.set('Perfil actualizado correctamente');
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al actualizar perfil:', error);
                    this.errorMessage.set(error.error?.message || 'Error al actualizar el perfil');
                    this.isLoading.set(false);
                }
            });
    }

    // ============================================================================
    // EVENT HANDLERS - PASSWORD
    // ============================================================================

    /**
     * Activar modo edición de contraseña
     */
    enablePasswordEdit(): void {
        this.isEditingPassword.set(true);
        this.passwordForm.reset();
        this.clearMessages();
    }

    /**
     * Cancelar edición de contraseña
     */
    cancelPasswordEdit(): void {
        this.isEditingPassword.set(false);
        this.passwordForm.reset();
        this.clearMessages();
    }

    /**
     * Cambiar contraseña
     */
    changePassword(): void {
        if (!this.passwordForm.valid || !this.passwordsMatch() || !this.isNewPasswordValid()) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.clearMessages();

        const data: ChangePasswordRequest = {
            oldPassword: this.passwordForm.value.oldPassword,
            newPassword: this.passwordForm.value.newPassword
        };

        this.authService.changePassword(data)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.isEditingPassword.set(false);
                    this.passwordForm.reset();
                    this.successMessage.set(response.message || 'Contraseña actualizada correctamente');
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cambiar contraseña:', error);
                    this.errorMessage.set(error.error?.message || 'Error al cambiar la contraseña');
                    this.isLoading.set(false);
                }
            });
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Verificar si las contraseñas coinciden
     */
    passwordsMatch(): boolean {
        const newPassword = this.passwordForm.value.newPassword;
        const confirmPassword = this.passwordForm.value.confirmPassword;
        return newPassword === confirmPassword;
    }

    /**
     * Limpiar mensajes
     */
    private clearMessages(): void {
        this.successMessage.set(null);
        this.errorMessage.set(null);
    }

    /**
     * Verificar si un campo tiene error
     */
    hasError(form: FormGroup, field: string, errorType: string): boolean {
        const control = form.get(field);
        return !!(control?.hasError(errorType) && (control?.touched || control?.dirty));
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}
