import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApicultorDeProveedor } from '../../../core/models';

@Component({
    selector: 'app-mis-apicultores',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './mis-apicultores.component.html'
})
export class MisApicultoresComponent implements OnInit {
    private proveedorService = inject(ProveedorService);
    private authService = inject(AuthService);
    private destroyRef = inject(DestroyRef);

    // Signals
    apicultores = signal<ApicultorDeProveedor[]>([]);
    loading = signal<boolean>(false);
    totalApicultores = signal<number>(0);
    apicultoresActivos = signal<number>(0);

    // Filtros
    searchTerm = signal<string>('');
    filtroEstado = signal<string>('Todos');
    filtroEstatusApicultor = signal<string>('Todos');
    filtroEstatusVinculo = signal<string>('Todos');

    // Modal
    showModal = signal<boolean>(false);
    apicultorSeleccionado = signal<ApicultorDeProveedor | null>(null);

    ngOnInit(): void {
        this.cargarApicultores();
    }

    cargarApicultores(): void {
        this.loading.set(true);

        const currentUser = this.authService.getCurrentUser();
        if (!currentUser?.proveedorId) {
            this.loading.set(false);
            return;
        }

        // ✅ PATRÓN CORRECTO: Usar ProveedorService con paginación alta
        this.proveedorService.getApicultoresDeProveedor(currentUser.proveedorId, {
            page: 1,
            limit: 9999
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    // ✅ El servicio retorna ApicultoresDeProveedorResponse con .data
                    this.apicultores.set(response.data);
                    this.actualizarEstadisticas();
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                }
            });
    }

    actualizarEstadisticas(): void {
        const total = this.apicultores().length;
        const activos = this.apicultores().filter(a =>
            a.estatus === 'ACTIVO' && a.estatusVinculo === 'ACTIVO'
        ).length;

        this.totalApicultores.set(total);
        this.apicultoresActivos.set(activos);
    }

    get apicultoresFiltrados(): ApicultorDeProveedor[] {
        return this.apicultores().filter(apicultor => {
            const matchSearch = !this.searchTerm() ||
                apicultor.apicultorNombre.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
                apicultor.apicultorCodigo.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
                apicultor.apicultorCurp.toLowerCase().includes(this.searchTerm().toLowerCase());

            const matchEstado = this.filtroEstado() === 'Todos' ||
                apicultor.estadoCodigo === this.filtroEstado();

            const matchEstatusApicultor = this.filtroEstatusApicultor() === 'Todos' ||
                apicultor.estatus === this.filtroEstatusApicultor();

            const matchEstatusVinculo = this.filtroEstatusVinculo() === 'Todos' ||
                apicultor.estatusVinculo === this.filtroEstatusVinculo();

            return matchSearch && matchEstado && matchEstatusApicultor && matchEstatusVinculo;
        });
    }

    abrirModal(apicultor: ApicultorDeProveedor): void {
        this.apicultorSeleccionado.set(apicultor);
        this.showModal.set(true);
    }

    cerrarModal(): void {
        this.showModal.set(false);
        this.apicultorSeleccionado.set(null);
    }

    desvincularApicultor(vinculoId: string): void {
        // TODO: Implementar cuando exista endpoint DELETE /api/acopiadores/vinculos/:id
        console.warn('Desvincular pendiente - endpoint no disponible aún');
        this.cerrarModal();
    }

    limpiarFiltros(): void {
        this.searchTerm.set('');
        this.filtroEstado.set('Todos');
        this.filtroEstatusApicultor.set('Todos');
        this.filtroEstatusVinculo.set('Todos');
    }
}