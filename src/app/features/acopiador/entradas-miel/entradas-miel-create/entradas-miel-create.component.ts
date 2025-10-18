/**
 * ============================================================================
 * 📦 ENTRADAS MIEL CREATE COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Formulario para registrar nuevas entradas de miel
 * 
 * CARACTERÍSTICAS:
 * - FormArray dinámico para múltiples detalles
 * - Autocomplete de apicultores vinculados al proveedor
 * - Autocomplete de tipos de miel
 * - Cálculo automático de totales
 * - Validaciones custom (kilos > 0, humedad 0-100, precio > 0)
 * - Clasificación visual según humedad
 * 
 * ============================================================================
 */

import { Component, computed, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { AutocompleteSelectComponent } from '../../../../shared/components/ui/autocomplete-select/autocomplete-select.component';

// Modelos
import {
    CreateEntradaMielRequest,
    CreateEntradaMielDetalleRequest,
    ApicultorOption,
    TipoMielOption,
    ClasificacionMiel
} from '../../../../core/models/index';

import { TipoDeMiel, ApicultorDeProveedor } from '../../../../core/models/proveedor.model';

// Servicios
import { EntradaMielService } from '../../../../core/services/entrada-miel.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-entradas-miel-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent,
        AutocompleteSelectComponent
    ],
    templateUrl: './entradas-miel-create.component.html',
    styleUrl: './entradas-miel-create.component.css'
})
export class EntradasMielCreateComponent implements OnInit {
    private fb = inject(FormBuilder);
    private entradaMielService = inject(EntradaMielService);
    private proveedorService = inject(ProveedorService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Apicultores vinculados al proveedor (para autocomplete) */
    apicultores = signal<ApicultorOption[]>([]);

    /** Tipos de miel disponibles (catálogo) */
    tiposMiel = signal<TipoMielOption[]>([]);

    /** Estado de carga */
    loading = signal(false);

    /** Proveedor del usuario actual */
    proveedorId = signal<number | null>(null);

    /** Total general calculado */
    totalGeneral = computed(() => {
        let total = 0;
        this.detallesArray.controls.forEach(control => {
            const kilos = control.get('kilos')?.value || 0;
            const precio = control.get('precio')?.value || 0;
            total += kilos * precio;
        });
        return total;
    });

    // ============================================================================
    // FORM
    // ============================================================================

    form: FormGroup = this.fb.group({
        fecha: [this.getTodayDate(), Validators.required],
        apicultorId: [null, Validators.required],
        observaciones: [''],
        detalles: this.fb.array([])
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadProveedorId();
        this.loadTiposMiel();
        this.addDetalle(); // Agregar primer detalle por defecto
    }

    // ============================================================================
    // METHODS - DATA LOADING
    // ============================================================================

    /**
     * Obtener proveedorId del usuario actual
     */
    private loadProveedorId(): void {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser?.proveedorId) {
            alert('Error: Usuario sin proveedor asignado');
            this.router.navigate(['/dashboard/acopiador']);
            return;
        }

        this.proveedorId.set(currentUser.proveedorId);
        this.loadApicultores(currentUser.proveedorId);
    }

    /**
     * Cargar apicultores vinculados al proveedor
     */
    private loadApicultores(proveedorId: number): void {
        this.proveedorService.getApicultoresDeProveedor(proveedorId, {
            page: 1,
            limit: 9999
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    // Filtrar solo ACTIVOS y mapear a opciones
                    const opciones = response.data
                        .filter(a => a.estatus === 'ACTIVO' && a.estatusVinculo === 'ACTIVO')
                        .map(a => ({
                            id: a.apicultorId,
                            nombre: a.apicultorNombre,
                            codigo: a.apicultorCodigo
                        }));

                    this.apicultores.set(opciones);
                },
                error: () => {
                    alert('Error al cargar apicultores');
                }
            });
    }

    /**
     * Cargar catálogo de tipos de miel
     */
    private loadTiposMiel(): void {
        this.proveedorService.getTiposMiel()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (tipos) => {
                    const opciones = tipos.map(t => ({
                        id: t.idTipoDeMiel,
                        nombre: t.tipoDeMiel
                    }));
                    this.tiposMiel.set(opciones);
                },
                error: () => {
                    alert('Error al cargar tipos de miel');
                }
            });
    }

    // ============================================================================
    // FORM ARRAY - DETALLES
    // ============================================================================

    get detallesArray(): FormArray {
        return this.form.get('detalles') as FormArray;
    }

    /**
     * Agregar un nuevo detalle al FormArray
     */
    addDetalle(): void {
        const detalleGroup = this.fb.group({
            tipoMielId: [null, Validators.required],
            kilos: [null, [Validators.required, Validators.min(0.01)]],
            humedad: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
            precio: [null, [Validators.required, Validators.min(0.01)]],
            autorizado: [true],
            zona: [''],
            trazabilidad: [''],
            pesoLista: [null],
            bruto: [null],
            tara: [null],
            referencia: [''],
            observaciones: ['']
        });

        this.detallesArray.push(detalleGroup);
    }

    /**
     * Eliminar un detalle del FormArray
     */
    removeDetalle(index: number): void {
        if (this.detallesArray.length > 1) {
            this.detallesArray.removeAt(index);
        } else {
            alert('Debe haber al menos un detalle');
        }
    }

    /**
     * Calcular costo total de un detalle
     */
    calcularCostoDetalle(index: number): number {
        const detalle = this.detallesArray.at(index);
        const kilos = detalle.get('kilos')?.value || 0;
        const precio = detalle.get('precio')?.value || 0;
        return kilos * precio;
    }

    /**
     * Obtener clasificación según humedad
     */
    getClasificacion(index: number): ClasificacionMiel | null {
        const detalle = this.detallesArray.at(index);
        const humedad = detalle.get('humedad')?.value;

        if (humedad === null || humedad === undefined) return null;

        return humedad <= 18 ? ClasificacionMiel.CALIDAD : ClasificacionMiel.CONVENCIONAL;
    }

    /**
     * Clase CSS para badge de clasificación
     */
    getClasificacionBadgeClass(index: number): string {
        const clasificacion = this.getClasificacion(index);
        if (!clasificacion) return 'bg-gray-100 text-gray-800';

        return clasificacion === ClasificacionMiel.CALIDAD
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800';
    }

    // ============================================================================
    // FORM HELPERS
    // ============================================================================

    /**
     * Obtener fecha actual en formato YYYY-MM-DD
     */
    private getTodayDate(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Template function para autocomplete de apicultores
     */
    formatApicultor = (item: ApicultorOption): string => {
        return `${item.codigo} - ${item.nombre}`;
    }

    /**
     * Template function para autocomplete de tipos de miel
     */
    formatTipoMiel = (item: TipoMielOption): string => {
        return item.nombre;
    }

    // ============================================================================
    // SUBMIT
    // ============================================================================

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            alert('Por favor complete todos los campos requeridos correctamente');
            return;
        }

        if (!this.proveedorId()) {
            alert('Error: No se encontró el proveedor del usuario');
            return;
        }

        this.loading.set(true);

        const formValue = this.form.value;

        // Construir request
        const request: CreateEntradaMielRequest = {
            fecha: formValue.fecha,
            proveedorId: this.proveedorId()!,
            apicultorId: formValue.apicultorId,
            observaciones: formValue.observaciones || undefined,
            detalles: formValue.detalles.map((d: any) => ({
                tipoMielId: d.tipoMielId,
                kilos: d.kilos,
                humedad: d.humedad,
                precio: d.precio,
                autorizado: d.autorizado,
                zona: d.zona || undefined,
                trazabilidad: d.trazabilidad || undefined,
                pesoLista: d.pesoLista || undefined,
                bruto: d.bruto || undefined,
                tara: d.tara || undefined,
                referencia: d.referencia || undefined,
                observaciones: d.observaciones || undefined
            }))
        };

        // Enviar al backend
        this.entradaMielService.createEntrada(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    alert(`Entrada creada exitosamente. Folio: ${response.folio}`);
                    this.router.navigate(['/acopiador/entradas-miel']);
                },
                error: (error) => {
                    this.loading.set(false);
                    console.error('Error al crear entrada:', error);
                    alert('Error al crear la entrada de miel');
                }
            });
    }

    onCancel(): void {
        if (confirm('¿Desea cancelar? Se perderán los datos ingresados.')) {
            this.router.navigate(['/acopiador/entradas-miel']);
        }
    }
}