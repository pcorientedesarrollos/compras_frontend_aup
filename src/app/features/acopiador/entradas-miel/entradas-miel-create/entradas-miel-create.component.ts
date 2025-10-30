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
    ClasificacionMiel,
    Floracion,
    ColorMiel
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

    /** Floraciones disponibles (catálogo) */
    floraciones = signal<Floracion[]>([]);

    /** Colores de miel disponibles (catálogo) */
    colores = signal<ColorMiel[]>([]);

    /** Estado de carga */
    loading = signal(false);

    /** Proveedor del usuario actual */
    proveedorId = signal<number | null>(null);

    /** Total PB (Peso Bruto) calculado */
    totalPB = signal(0);

    /** Total Tara calculado */
    totalTara = signal(0);

    /** Total PN (Peso Neto) calculado */
    totalPN = signal(0);

    /** Importe total calculado */
    importeTotal = signal(0);

    // ============================================================================
    // FORM
    // ============================================================================

    form: FormGroup = this.fb.group({
        fecha: [this.getTodayDate(), Validators.required],
        apicultorId: [null, Validators.required],
        tipoMielId: [null, Validators.required],
        numeroTambores: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
        precioPromedio: [null, [Validators.required, Validators.min(0.01)]],
        observaciones: [''],
        tambores: this.fb.array([])
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadProveedorId();
        this.loadTiposMiel();
        this.loadFloraciones();
        this.loadColores();
        this.setupNumeroTamboresWatcher();
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

    /**
     * Cargar catálogo de floraciones
     */
    private loadFloraciones(): void {
        this.entradaMielService.getFloraciones()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (floraciones) => {
                    this.floraciones.set(floraciones);
                },
                error: () => {
                    alert('Error al cargar floraciones');
                }
            });
    }

    /**
     * Cargar catálogo de colores
     */
    private loadColores(): void {
        this.entradaMielService.getColores()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (colores) => {
                    this.colores.set(colores);
                },
                error: () => {
                    alert('Error al cargar colores');
                }
            });
    }

    /**
     * Configurar watcher para generar tambores dinámicamente
     */
    private setupNumeroTamboresWatcher(): void {
        this.form.get('numeroTambores')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((numero: number) => {
                if (numero && numero > 0 && numero <= 100) {
                    this.generarTambores(numero);
                }
            });

        // Watcher para recalcular totales cuando cambien los tambores
        this.tamboresArray.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.recalcularTotales();
            });

        // Watcher para recalcular importe cuando cambie el precio promedio
        this.form.get('precioPromedio')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.recalcularTotales();
            });
    }

    /**
     * Recalcular todos los totales
     */
    private recalcularTotales(): void {
        let sumaPB = 0;
        let sumaTara = 0;
        let sumaPN = 0;

        this.tamboresArray.controls.forEach(control => {
            const bruto = control.get('bruto')?.value || 0;
            const tara = control.get('tara')?.value || 0;
            sumaPB += bruto;
            sumaTara += tara;
            sumaPN += (bruto - tara);
        });

        this.totalPB.set(sumaPB);
        this.totalTara.set(sumaTara);
        this.totalPN.set(sumaPN);

        const precioPromedio = this.form.get('precioPromedio')?.value || 0;
        this.importeTotal.set(sumaPN * precioPromedio);
    }

    // ============================================================================
    // FORM ARRAY - TAMBORES
    // ============================================================================

    get tamboresArray(): FormArray {
        return this.form.get('tambores') as FormArray;
    }

    /**
     * Generar N tambores dinámicamente
     */
    generarTambores(cantidad: number): void {
        this.tamboresArray.clear();

        for (let i = 0; i < cantidad; i++) {
            const tamborGroup = this.fb.group({
                bruto: [null, [Validators.required, Validators.min(0.01)]],
                tara: [null, [Validators.required, Validators.min(0)]],
                floracionId: [null],
                humedad: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
                colorId: [null]
            });

            this.tamboresArray.push(tamborGroup);
        }
    }

    /**
     * Calcular Peso Neto de un tambor (PB - T)
     */
    calcularPesoNeto(index: number): number {
        const tambor = this.tamboresArray.at(index);
        const bruto = tambor.get('bruto')?.value || 0;
        const tara = tambor.get('tara')?.value || 0;
        return bruto - tara;
    }

    /**
     * Obtener clasificación según humedad
     */
    getClasificacion(index: number): ClasificacionMiel | null {
        const tambor = this.tamboresArray.at(index);
        const humedad = tambor.get('humedad')?.value;

        if (humedad === null || humedad === undefined) return null;

        return humedad <= 20 ? ClasificacionMiel.EXPORTACION : ClasificacionMiel.NACIONAL;
    }

    /**
     * Clase CSS para badge de clasificación
     */
    getClasificacionBadgeClass(index: number): string {
        const clasificacion = this.getClasificacion(index);
        if (!clasificacion) return 'bg-gray-100 text-gray-800';

        return clasificacion === ClasificacionMiel.EXPORTACION
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800';
    }

    /**
     * Validar que PB > T
     */
    validarPesos(index: number): boolean {
        const tambor = this.tamboresArray.at(index);
        const bruto = tambor.get('bruto')?.value || 0;
        const tara = tambor.get('tara')?.value || 0;

        return bruto > tara;
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

        if (this.tamboresArray.length === 0) {
            alert('Debe ingresar al menos un tambor');
            return;
        }

        // Validar que todos los PB > T
        for (let i = 0; i < this.tamboresArray.length; i++) {
            if (!this.validarPesos(i)) {
                alert(`Tambor #${i + 1}: El Peso Bruto debe ser mayor que la Tara`);
                return;
            }
        }

        this.loading.set(true);

        const formValue = this.form.value;
        const precioPromedio = formValue.precioPromedio;
        const tipoMielId = formValue.tipoMielId;

        // Construir request con todos los tambores
        const request: CreateEntradaMielRequest = {
            fecha: formValue.fecha,
            apicultorId: formValue.apicultorId,
            ...(formValue.observaciones && { observaciones: formValue.observaciones }),
            detalles: formValue.tambores.map((tambor: any) => {
                const detalle: any = {
                    tipoMielId: tipoMielId,
                    kilos: Number((tambor.bruto - tambor.tara).toFixed(2)),  // PN = PB - T
                    humedad: Number(tambor.humedad),
                    precio: Number(precioPromedio),
                    bruto: Number(tambor.bruto),
                    tara: Number(tambor.tara),
                    autorizado: true
                };

                // Solo agregar floracionId si tiene valor
                if (tambor.floracionId) {
                    detalle.floracionId = Number(tambor.floracionId);
                }

                // Solo agregar colorId si tiene valor
                if (tambor.colorId) {
                    detalle.colorId = Number(tambor.colorId);
                }

                return detalle;
            })
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