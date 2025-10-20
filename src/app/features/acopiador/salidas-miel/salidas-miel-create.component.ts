/**
 * ============================================================================
 * 📦 SALIDAS MIEL CREATE COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Formulario para crear salida de miel con:
 * - Select de chofer activo
 * - AUTOCOMPLETE de tipo de miel (igual que entradas)
 * - Validación de stock en TIEMPO REAL
 * - Tabla dinámica de detalles
 * - Mostrar stock disponible por tipo/clasificación
 * - Resumen de kilos por tipo
 * - Cálculo automático de totales
 * 
 * ⚠️ CRÍTICO: Validar inventario ANTES de crear
 * 
 * ============================================================================
 */

import { Component, signal, inject, DestroyRef, OnInit, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

// Componentes reutilizables
import { IconComponent } from '../../../shared/components/ui/icon/icon.component';
import { AutocompleteSelectComponent } from '../../../shared/components/ui/autocomplete-select/autocomplete-select.component';

// Modelos
import {
    CreateSalidaMielRequest,
    ResumenKilosPorTipo
} from '../../../core/models/salida-miel.model';

// Tipo de miel option (igual que entradas)
interface TipoMielOption {
    id: number;
    nombre: string;
}

// Servicios
import { SalidaMielService } from '../../../core/services/salida-miel.service';
import { ChoferService } from '../../../core/services/chofer.service';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { ChoferSelectOption, ClasificacionMiel } from '../../../core/models';

@Component({
    selector: 'app-salidas-miel-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IconComponent,
        AutocompleteSelectComponent
    ],
    templateUrl: './salidas-miel-create.component.html',
    styleUrl: './salidas-miel-create.component.css'
})
export class SalidasMielCreateComponent implements OnInit {
    private fb = inject(FormBuilder);
    private salidaMielService = inject(SalidaMielService);
    private choferService = inject(ChoferService);
    private proveedorService = inject(ProveedorService);
    private inventarioService = inject(InventarioService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // FORM
    // ============================================================================

    salidaForm!: FormGroup;

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Choferes activos */
    choferes = signal<ChoferSelectOption[]>([]);

    /** Tipos de miel disponibles (para autocomplete) */
    tiposMiel = signal<TipoMielOption[]>([]);

    /** Stock disponible por tipo/clasificación (cache) */
    stockCache = signal<Map<string, number>>(new Map());

    /** Loading states */
    loading = signal(false);
    loadingChoferes = signal(false);
    loadingTiposMiel = signal(false);
    validatingStock = signal(false);

    /** Errores de validación de stock */
    stockErrors = signal<Map<number, string>>(new Map());

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Enum para template */
    readonly ClasificacionMiel = ClasificacionMiel;

    /**
     * Detalles del formulario como array
     */
    detallesArray = computed(() => {
        return (this.salidaForm?.get('detalles') as FormArray)?.controls || [];
    });

    /**
     * Total de kilos
     */
    totalKilos = computed(() => {
        const detalles = this.salidaForm?.get('detalles') as FormArray;
        if (!detalles) return 0;

        return detalles.controls.reduce((sum, control) => {
            const kilos = control.get('kilos')?.value || 0;
            return sum + parseFloat(kilos.toString());
        }, 0);
    });

    /**
     * Total de compra
     */
    totalCompra = computed(() => {
        const detalles = this.salidaForm?.get('detalles') as FormArray;
        if (!detalles) return 0;

        return detalles.controls.reduce((sum, control) => {
            const kilos = control.get('kilos')?.value || 0;
            const precio = control.get('precio')?.value || 0;
            return sum + (parseFloat(kilos.toString()) * parseFloat(precio.toString()));
        }, 0);
    });

    /**
     * Resumen de kilos por tipo de miel
     */
    resumenKilosPorTipo = computed(() => {
        const detalles = this.salidaForm?.get('detalles') as FormArray;
        if (!detalles) return [];

        const agrupado = new Map<string, ResumenKilosPorTipo>();

        detalles.controls.forEach(control => {
            const tipoMielId = control.get('tipoMielId')?.value;
            const clasificacion = control.get('clasificacion')?.value;
            const kilos = control.get('kilos')?.value || 0;

            if (!tipoMielId || !clasificacion) return;

            const key = `${tipoMielId}-${clasificacion}`;
            const tipoMiel = this.tiposMiel().find(t => t.id === parseInt(tipoMielId));

            if (!agrupado.has(key)) {
                agrupado.set(key, {
                    tipoMielId: parseInt(tipoMielId),
                    tipoMielNombre: tipoMiel?.nombre || 'Desconocido',
                    clasificacion,
                    totalKilos: 0
                });
            }

            agrupado.get(key)!.totalKilos += parseFloat(kilos.toString());
        });

        return Array.from(agrupado.values());
    });

    /**
     * Validar si el formulario tiene errores de stock
     */
    tieneErroresStock = computed(() => {
        return this.stockErrors().size > 0;
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.initForm();
        this.loadChoferes();
        this.loadTiposMiel();
    }

    // ============================================================================
    // FORM INITIALIZATION
    // ============================================================================

    initForm(): void {
        this.salidaForm = this.fb.group({
            fecha: [this.getTodayDate(), [Validators.required]],
            choferId: ['', [Validators.required]],
            observaciones: ['', [Validators.maxLength(1000)]],
            observacionesChofer: ['', [Validators.maxLength(1000)]],
            detalles: this.fb.array([])
        });
    }

    /**
     * Obtener fecha de hoy en formato YYYY-MM-DD
     */
    getTodayDate(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    loadChoferes(): void {
        this.loadingChoferes.set(true);
        this.choferService.getChoferesActivos()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (choferes) => {
                    this.choferes.set(choferes);
                    this.loadingChoferes.set(false);
                },
                error: () => {
                    this.loadingChoferes.set(false);
                    alert('Error al cargar choferes');
                }
            });
    }

    loadTiposMiel(): void {
        this.loadingTiposMiel.set(true);
        this.proveedorService.getTiposMiel()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (tipos) => {
                    // Mapear a TipoMielOption (igual que entradas)
                    const opciones = tipos.map(t => ({
                        id: t.idTipoDeMiel,
                        nombre: t.tipoDeMiel
                    }));
                    this.tiposMiel.set(opciones);
                    this.loadingTiposMiel.set(false);
                },
                error: () => {
                    this.loadingTiposMiel.set(false);
                    alert('Error al cargar tipos de miel');
                }
            });
    }

    // ============================================================================
    // FORM ARRAY - DETALLES
    // ============================================================================

    get detalles(): FormArray {
        return this.salidaForm.get('detalles') as FormArray;
    }

    agregarDetalle(): void {
        const detalle = this.fb.group({
            tipoMielId: [null, [Validators.required]], // null para autocomplete
            clasificacion: ['', [Validators.required]],
            kilos: ['', [Validators.required, Validators.min(0.01)]],
            precio: [''],
            zona: ['', [Validators.maxLength(10)]],
            trazabilidad: ['', [Validators.maxLength(20)]],
            referencia: ['', [Validators.maxLength(500)]],
            observaciones: ['', [Validators.maxLength(1000)]]
        });

        // Validar stock cuando cambian tipo, clasificación o kilos
        detalle.get('tipoMielId')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.validarStockDetalle(this.detalles.length));

        detalle.get('clasificacion')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.validarStockDetalle(this.detalles.length));

        detalle.get('kilos')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.validarStockDetalle(this.detalles.length));

        this.detalles.push(detalle);
    }

    removerDetalle(index: number): void {
        this.detalles.removeAt(index);
        // Limpiar error de stock de ese índice
        const errors = new Map(this.stockErrors());
        errors.delete(index);
        this.stockErrors.set(errors);
    }

    // ============================================================================
    // VALIDACIÓN DE STOCK EN TIEMPO REAL
    // ============================================================================

    /**
     * Validar stock disponible para un detalle específico
     */
    validarStockDetalle(index: number): void {
        const detalle = this.detalles.at(index);
        const tipoMielId = detalle.get('tipoMielId')?.value;
        const clasificacion = detalle.get('clasificacion')?.value;
        const kilos = detalle.get('kilos')?.value;

        // Si no hay datos completos, no validar
        if (!tipoMielId || !clasificacion || !kilos || kilos <= 0) {
            this.limpiarErrorStock(index);
            return;
        }

        this.validatingStock.set(true);

        this.inventarioService.validarStock(
            parseInt(tipoMielId),
            clasificacion as ClasificacionMiel,
            parseFloat(kilos)
        )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (stock) => {
                    if (!stock.suficiente) {
                        this.setErrorStock(
                            index,
                            `Stock insuficiente. Disponible: ${stock.kilosDisponibles.toFixed(2)} kg`
                        );
                    } else {
                        this.limpiarErrorStock(index);
                    }
                    this.validatingStock.set(false);

                    // Guardar en cache
                    const cacheKey = `${tipoMielId}-${clasificacion}`;
                    const cache = new Map(this.stockCache());
                    cache.set(cacheKey, stock.kilosDisponibles);
                    this.stockCache.set(cache);
                },
                error: () => {
                    this.validatingStock.set(false);
                    this.setErrorStock(index, 'Error al validar stock');
                }
            });
    }

    /**
     * Obtener stock disponible para mostrar en el form
     */
    getStockDisponible(tipoMielId: string, clasificacion: ClasificacionMiel): string {
        const cacheKey = `${tipoMielId}-${clasificacion}`;
        const stock = this.stockCache().get(cacheKey);

        if (stock !== undefined) {
            return `Disponible: ${stock.toFixed(2)} kg`;
        }

        return 'Consultando...';
    }

    /**
     * Cargar stock cuando se selecciona tipo + clasificación
     */
    onTipoClasificacionChange(index: number): void {
        const detalle = this.detalles.at(index);
        const tipoMielId = detalle.get('tipoMielId')?.value;
        const clasificacion = detalle.get('clasificacion')?.value;

        if (!tipoMielId || !clasificacion) return;

        this.inventarioService.getStockDisponible(
            parseInt(tipoMielId),
            clasificacion as ClasificacionMiel
        )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (stock) => {
                    const cacheKey = `${tipoMielId}-${clasificacion}`;
                    const cache = new Map(this.stockCache());
                    cache.set(cacheKey, stock);
                    this.stockCache.set(cache);
                },
                error: () => {
                    // Ignorar error silenciosamente
                }
            });
    }

    setErrorStock(index: number, error: string): void {
        const errors = new Map(this.stockErrors());
        errors.set(index, error);
        this.stockErrors.set(errors);
    }

    limpiarErrorStock(index: number): void {
        const errors = new Map(this.stockErrors());
        errors.delete(index);
        this.stockErrors.set(errors);
    }

    getErrorStock(index: number): string | undefined {
        return this.stockErrors().get(index);
    }

    // ============================================================================
    // TEMPLATE HELPERS (para autocomplete)
    // ============================================================================

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
        // Validar formulario
        if (this.salidaForm.invalid) {
            this.salidaForm.markAllAsTouched();
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        // Validar que haya al menos un detalle
        if (this.detalles.length === 0) {
            alert('Debe agregar al menos un detalle de miel');
            return;
        }

        // Validar stock
        if (this.tieneErroresStock()) {
            alert('Hay errores de stock. Por favor revise las cantidades');
            return;
        }

        const formValue = this.salidaForm.value;

        const request: CreateSalidaMielRequest = {
            fecha: formValue.fecha,
            choferId: formValue.choferId,
            observaciones: formValue.observaciones || undefined,
            observacionesChofer: formValue.observacionesChofer || undefined,
            detalles: formValue.detalles.map((d: any) => ({
                tipoMielId: parseInt(d.tipoMielId),
                clasificacion: d.clasificacion,
                kilos: parseFloat(d.kilos),
                precio: d.precio ? parseFloat(d.precio) : undefined,
                zona: d.zona || undefined,
                trazabilidad: d.trazabilidad || undefined,
                referencia: d.referencia || undefined,
                observaciones: d.observaciones || undefined
            }))
        };

        this.loading.set(true);

        this.salidaMielService.createSalida(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (salida) => {
                    alert(`Salida ${salida.folio} creada exitosamente en estado BORRADOR`);
                    this.router.navigate(['/acopiador/salidas-miel']);
                },
                error: (error) => {
                    this.loading.set(false);
                    alert(`Error al crear salida: ${error.error?.message || 'Error desconocido'}`);
                }
            });
    }

    cancelar(): void {
        if (confirm('¿Está seguro de cancelar? Se perderán los datos ingresados.')) {
            this.router.navigate(['/acopiador/salidas-miel']);
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    getNombreTipoMiel(id: number): string {
        const tipo = this.tiposMiel().find(t => t.id === id);
        return tipo?.nombre || 'Desconocido';
    }

    getNombreChofer(id: string): string {
        const chofer = this.choferes().find(c => c.id === id);
        return this.choferService.formatNombreChofer(chofer || { nombre: 'Desconocido', alias: null });
    }

    formatCurrency(value: number): string {
        return this.salidaMielService.formatCurrency(value);
    }

    formatKilos(kilos: number): string {
        return `${kilos.toFixed(2)} kg`;
    }
}