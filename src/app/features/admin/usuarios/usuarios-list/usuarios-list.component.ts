/**
 * ============================================================================
 * 👥 USUARIOS LIST COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Lista de usuarios con funcionalidades de gestión (Solo ADMINISTRADOR)
 *
 * FUNCIONALIDADES:
 * 1. Tabla con paginación de usuarios
 * 2. Filtros: rol, estado, búsqueda
 * 3. Crear nuevo usuario
 * 4. Editar usuario existente
 * 5. Activar/Desactivar usuario
 * 6. Restablecer contraseña (admin)
 *
 * ============================================================================
 */

import { Component, inject, signal, DestroyRef, OnInit, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Servicios
import { UsuarioService } from '../../../../core/services/usuario.service';

// Modelos
import {
    User,
    UserFilterParams,
    UserRole,
    ROLE_LABELS
} from '../../../../core/models/user.model';

// Componentes compartidos
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';

@Component({
    selector: 'app-usuarios-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IconComponent,
        BadgeComponent
    ],
    templateUrl: './usuarios-list.component.html',
    styleUrl: './usuarios-list.component.css'
})
export class UsuariosListComponent implements OnInit {
    private usuarioService = inject(UsuarioService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Lista de usuarios */
    usuarios = signal<User[]>([]);

    /** Estado de carga */
    isLoading = signal<boolean>(false);

    /** Paginación */
    currentPage = signal<number>(1);
    totalPages = signal<number>(1);
    totalRecords = signal<number>(0);
    pageSize = signal<number>(10);

    /** Filtros */
    searchText = signal<string>('');
    selectedRole = signal<UserRole | ''>('');
    selectedStatus = signal<boolean | null>(null);

    /** Mensajes */
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);

    /** Usuario seleccionado para acciones */
    selectedUserId = signal<string | null>(null);

    /** Modal de confirmación */
    showConfirmModal = signal<boolean>(false);
    confirmModalAction = signal<'toggle' | 'reset' | null>(null);

    /** Nueva contraseña para reset */
    newPasswordForReset = signal<string>('');

    // ============================================================================
    // CONSTANTS
    // ============================================================================

    /** Math para template */
    Math = Math;

    /** Opciones de rol */
    roleOptions: { value: UserRole | ''; label: string }[] = [
        { value: '', label: 'Todos los roles' },
        { value: 'ADMINISTRADOR', label: 'Administrador' },
        { value: 'ACOPIADOR', label: 'Acopiador' },
        { value: 'APICULTOR', label: 'Apicultor' },
        { value: 'MIELERA', label: 'Mielera' },
        { value: 'VERIFICADOR', label: 'Verificador' }
    ];

    /** Opciones de estado */
    statusOptions: { value: boolean | null; label: string }[] = [
        { value: null, label: 'Todos los estados' },
        { value: true, label: 'Activos' },
        { value: false, label: 'Inactivos' }
    ];

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /**
     * Usuario seleccionado para acciones
     */
    selectedUser = computed(() => {
        const id = this.selectedUserId();
        return this.usuarios().find(u => u.id === id) || null;
    });

    /**
     * ¿Hay filtros activos?
     */
    hasActiveFilters = computed(() => {
        return this.searchText() !== '' ||
            this.selectedRole() !== '' ||
            this.selectedStatus() !== null;
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadUsuarios();
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    /**
     * Cargar usuarios con filtros y paginación
     */
    loadUsuarios(): void {
        this.isLoading.set(true);
        this.clearMessages();

        const params: UserFilterParams = {
            page: this.currentPage(),
            limit: this.pageSize(),
            search: this.searchText() || undefined,
            role: this.selectedRole() || undefined,
            activo: this.selectedStatus() !== null ? this.selectedStatus()! : undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };

        this.usuarioService.getUsuarios(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.usuarios.set(response.data);
                    this.currentPage.set(response.pagination.page);
                    this.totalPages.set(response.pagination.totalPages);
                    this.totalRecords.set(response.pagination.total);
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al cargar usuarios:', error);
                    this.errorMessage.set('Error al cargar usuarios');
                    this.isLoading.set(false);
                }
            });
    }

    // ============================================================================
    // FILTERS
    // ============================================================================

    /**
     * Aplicar filtros
     */
    applyFilters(): void {
        this.currentPage.set(1);
        this.loadUsuarios();
    }

    /**
     * Limpiar filtros
     */
    clearFilters(): void {
        this.searchText.set('');
        this.selectedRole.set('');
        this.selectedStatus.set(null);
        this.currentPage.set(1);
        this.loadUsuarios();
    }

    /**
     * Manejar cambio de búsqueda
     */
    onSearchChange(value: string): void {
        this.searchText.set(value);
        this.applyFilters();
    }

    /**
     * Manejar cambio de rol
     */
    onRoleChange(value: string): void {
        this.selectedRole.set(value as UserRole | '');
        this.applyFilters();
    }

    /**
     * Manejar cambio de estado
     */
    onStatusChange(value: string): void {
        if (value === 'true') {
            this.selectedStatus.set(true);
        } else if (value === 'false') {
            this.selectedStatus.set(false);
        } else {
            this.selectedStatus.set(null);
        }
        this.applyFilters();
    }

    // ============================================================================
    // PAGINATION
    // ============================================================================

    /**
     * Ir a página anterior
     */
    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
            this.loadUsuarios();
        }
    }

    /**
     * Ir a página siguiente
     */
    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
            this.loadUsuarios();
        }
    }

    /**
     * Ir a página específica
     */
    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
            this.loadUsuarios();
        }
    }

    // ============================================================================
    // CRUD ACTIONS
    // ============================================================================

    /**
     * Crear nuevo usuario
     */
    createUsuario(): void {
        this.router.navigate(['/admin/usuarios/nuevo']);
    }

    /**
     * Editar usuario
     */
    editUsuario(userId: string): void {
        this.router.navigate(['/admin/usuarios', userId, 'edit']);
    }

    /**
     * Abrir modal para activar/desactivar usuario
     */
    confirmToggleStatus(userId: string): void {
        this.selectedUserId.set(userId);
        this.confirmModalAction.set('toggle');
        this.showConfirmModal.set(true);
    }

    /**
     * Ejecutar activar/desactivar usuario
     */
    executeToggleStatus(): void {
        const user = this.selectedUser();
        if (!user) return;

        this.isLoading.set(true);
        this.showConfirmModal.set(false);

        this.usuarioService.toggleUserStatus(user.id, !user.activo)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updatedUser) => {
                    this.successMessage.set(
                        `Usuario ${updatedUser.activo ? 'activado' : 'desactivado'} correctamente`
                    );
                    this.loadUsuarios();
                },
                error: (error) => {
                    console.error('Error al cambiar estado del usuario:', error);
                    this.errorMessage.set(error.error?.message || 'Error al cambiar estado');
                    this.isLoading.set(false);
                }
            });
    }

    /**
     * Abrir modal para restablecer contraseña
     */
    confirmResetPassword(userId: string): void {
        this.selectedUserId.set(userId);
        this.confirmModalAction.set('reset');
        this.newPasswordForReset.set('');
        this.showConfirmModal.set(true);
    }

    /**
     * Ejecutar restablecer contraseña
     */
    executeResetPassword(): void {
        const user = this.selectedUser();
        const newPassword = this.newPasswordForReset();

        if (!user || !newPassword) return;

        this.isLoading.set(true);
        this.showConfirmModal.set(false);

        this.usuarioService.resetPassword(user.id, newPassword)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.successMessage.set(response.message || 'Contraseña restablecida correctamente');
                    this.newPasswordForReset.set('');
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error al restablecer contraseña:', error);
                    this.errorMessage.set(error.error?.message || 'Error al restablecer contraseña');
                    this.isLoading.set(false);
                }
            });
    }

    /**
     * Cerrar modal de confirmación
     */
    closeConfirmModal(): void {
        this.showConfirmModal.set(false);
        this.confirmModalAction.set(null);
        this.selectedUserId.set(null);
        this.newPasswordForReset.set('');
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    /**
     * Obtener label del rol
     */
    getRoleLabel(role: UserRole): string {
        return ROLE_LABELS[role] || role;
    }

    /**
     * Obtener variant del badge según el rol
     */
    getRoleBadgeVariant(role: UserRole): 'success' | 'warning' | 'info' | 'danger' | 'default' {
        const variants: Record<UserRole, 'success' | 'warning' | 'info' | 'danger'> = {
            'ADMINISTRADOR': 'danger',
            'ACOPIADOR': 'success',
            'APICULTOR': 'warning',
            'MIELERA': 'info',
            'VERIFICADOR': 'info'
        };
        return variants[role] || 'default';
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Limpiar mensajes
     */
    private clearMessages(): void {
        this.successMessage.set(null);
        this.errorMessage.set(null);
    }
}
