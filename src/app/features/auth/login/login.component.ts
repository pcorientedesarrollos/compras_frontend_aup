import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { BeeLoaderComponent } from '../../../shared/components/bee-loader/bee-loader.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BeeLoaderComponent
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);

    // Estado reactivo con signals
    isLoading = signal(false);
    errorMessage = signal<string | null>(null);
    showPassword = signal(false);

    // Formulario reactivo
    loginForm: FormGroup = this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        rememberMe: [false]
    });

    /**
     * Enviar formulario de login
     */
    onSubmit(): void {
        // Limpiar mensaje de error previo
        this.errorMessage.set(null);

        // Validar formulario
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);

        const credentials = {
            username: this.loginForm.value.username,
            password: this.loginForm.value.password
        };

        this.authService.login(credentials)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.isLoading.set(false);

                    // Obtener URL de retorno o redirigir según rol
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'];

                    if (returnUrl) {
                        this.router.navigate([returnUrl]);
                    } else {
                        this.redirectByRole(response.user.role);
                    }
                },
                error: (error) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(
                        error.message || 'Usuario o contraseña incorrectos'
                    );

                    // Limpiar contraseña por seguridad
                    this.loginForm.patchValue({ password: '' });
                }
            });
    }

    /**
     * Redirigir según el rol del usuario
     */
    private redirectByRole(role: string): void {
        switch (role) {
            case 'ADMINISTRADOR':
                this.router.navigate(['/dashboard/admin']);
                break;
            case 'ACOPIADOR':
                this.router.navigate(['/dashboard/acopiador']);
                break;
            case 'APICULTOR':
                this.router.navigate(['/dashboard/apicultor']);
                break;
            case 'MIELERA':
                this.router.navigate(['/dashboard/mielera']);
                break;
            case 'VERIFICADOR':
                this.router.navigate(['/verificador']);
                break;
            default:
                this.router.navigate(['/dashboard']);
        }
    }

    /**
     * Toggle visibilidad de contraseña
     */
    togglePasswordVisibility(): void {
        this.showPassword.update(value => !value);
    }

    /**
     * Verificar si un campo tiene error
     */
    hasError(field: string, error: string): boolean {
        const control = this.loginForm.get(field);
        return !!(control?.hasError(error) && control?.touched);
    }

    /**
     * Obtener mensaje de error para un campo
     */
    getErrorMessage(field: string): string {
        const control = this.loginForm.get(field);

        if (control?.hasError('required')) {
            return 'Este campo es requerido';
        }

        if (control?.hasError('minlength')) {
            const minLength = control.errors?.['minlength'].requiredLength;
            return `Mínimo ${minLength} caracteres`;
        }

        return '';
    }
}