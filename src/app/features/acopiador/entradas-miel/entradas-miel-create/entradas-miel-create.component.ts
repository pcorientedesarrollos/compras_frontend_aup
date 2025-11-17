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
import { Router, ActivatedRoute } from '@angular/router';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { AutocompleteSelectComponent } from '../../../../shared/components/ui/autocomplete-select/autocomplete-select.component';

// Modelos
import {
    CreateEntradaMielRequest,
    CreateEntradaMielDetalleRequest,
    UpdateEntradaMielRequest,
    UpdateEntradaMielDetalleRequest,
    EntradaMielDetailAPI,
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
import { ListaPreciosService } from '../../../lista-precios/services/lista-precios.service';

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
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);
    private listaPreciosService = inject(ListaPreciosService);

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

    /** Modo edición (true si estamos editando una entrada existente) */
    isEditMode = signal(false);

    /** ID de la entrada en modo edición */
    entradaId = signal<string | null>(null);

    /** Entrada original (para modo edición) */
    entradaOriginal = signal<EntradaMielDetailAPI | null>(null);

    // ============================================================================
    // FORM
    // ============================================================================

    form: FormGroup = this.fb.group({
        fecha: [this.getTodayDate(), Validators.required],
        apicultorId: [null, Validators.required],
        tipoMielId: [null, Validators.required],
        numeroTambores: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
        observaciones: [''],
        tambores: this.fb.array([])
    });

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        // Detectar modo edición desde la ruta
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.entradaId.set(id);
        }

        this.loadProveedorId();
        this.loadTiposMiel();
        this.loadFloraciones();
        this.loadColores();
        this.setupNumeroTamboresWatcher();

        // Si estamos en modo edición, cargar datos existentes
        if (this.isEditMode()) {
            this.loadEntradaData();
        }
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
     * Cargar datos de entrada existente (modo edición)
     */
    private loadEntradaData(): void {
        const id = this.entradaId();
        if (!id) return;

        this.loading.set(true);

        this.entradaMielService.getEntradaById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (entrada) => {
                    this.entradaOriginal.set(entrada);
                    this.populateFormWithEntrada(entrada);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    alert('Error al cargar la entrada. Redirigiendo al listado...');
                    this.router.navigate(['/acopiador/entradas-miel']);
                }
            });
    }

    /**
     * Poblar el formulario con datos de entrada existente
     */
    private populateFormWithEntrada(entrada: EntradaMielDetailAPI): void {
        // Establecer valores del formulario
        this.form.patchValue({
            fecha: entrada.fecha.split('T')[0], // Convertir ISO a YYYY-MM-DD
            apicultorId: entrada.apicultorId,
            tipoMielId: entrada.detalles[0]?.tipoMielId || null,
            numeroTambores: entrada.detalles.length,
            observaciones: entrada.observaciones || ''
        });

        // Generar tambores con datos existentes
        this.generarTamboresConDatos(entrada.detalles);
    }

    /**
     * Generar tambores FormArray con datos existentes
     */
    private generarTamboresConDatos(detalles: any[]): void {
        this.tamboresArray.clear();

        detalles.forEach(detalle => {
            const tamborGroup = this.fb.group({
                id: [detalle.id], // Guardar ID para actualización
                estadoUso: [detalle.estadoUso], // Guardar estado de uso
                bruto: [parseFloat(detalle.bruto) || 0, [Validators.required, Validators.min(0.01)]],
                tara: [parseFloat(detalle.tara) || 0, [Validators.required, Validators.min(0)]],
                floracionId: [detalle.floracionId],
                humedad: [parseFloat(detalle.humedad) || null, [Validators.required, Validators.min(0), Validators.max(100)]],
                colorId: [detalle.colorId],
                precio: [parseFloat(detalle.precio) || 0, [Validators.required, Validators.min(0.01)]]
            });

            // Si el detalle está USADO o CANCELADO, deshabilitar todos los campos
            if (detalle.estadoUso === 'USADO' || detalle.estadoUso === 'CANCELADO') {
                tamborGroup.get('bruto')?.disable();
                tamborGroup.get('tara')?.disable();
                tamborGroup.get('floracionId')?.disable();
                tamborGroup.get('humedad')?.disable();
                tamborGroup.get('colorId')?.disable();
                tamborGroup.get('precio')?.disable();
            }

            // Subscribirse a cambios para recalcular totales
            tamborGroup.valueChanges
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => {
                    this.recalcularTotales();
                });

            // Auto-rellenar precio cuando cambie la humedad (solo si no está deshabilitado)
            if (!tamborGroup.get('humedad')?.disabled) {
                tamborGroup.get('humedad')?.valueChanges
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe(() => {
                        const index = this.tamboresArray.controls.indexOf(tamborGroup);
                        this.autoRellenarPrecio(index);
                    });
            }

            this.tamboresArray.push(tamborGroup);
        });

        this.recalcularTotales();
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
    }

    /**
     * Recalcular todos los totales
     */
    private recalcularTotales(): void {
        let sumaPB = 0;
        let sumaTara = 0;
        let sumaPN = 0;
        let sumaImporte = 0;

        this.tamboresArray.controls.forEach((control, index) => {
            const bruto = parseFloat(control.get('bruto')?.value) || 0;
            const tara = parseFloat(control.get('tara')?.value) || 0;
            const pesoNeto = bruto - tara;
            sumaPB += bruto;
            sumaTara += tara;
            sumaPN += pesoNeto;

            // Sumar costo total de cada tambor
            sumaImporte += this.calcularCostoTotal(index);
        });

        this.totalPB.set(parseFloat(sumaPB.toFixed(2)));
        this.totalTara.set(parseFloat(sumaTara.toFixed(2)));
        this.totalPN.set(parseFloat(sumaPN.toFixed(2)));
        this.importeTotal.set(parseFloat(sumaImporte.toFixed(2)));
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
                colorId: [null],
                precio: [null, [Validators.required, Validators.min(0.01)]]
            });

            // CRÍTICO: Subscribirse a cambios de cada tambor para recalcular en tiempo real
            tamborGroup.valueChanges
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => {
                    this.recalcularTotales();
                });

            // Auto-rellenar precio cuando cambie la humedad
            tamborGroup.get('humedad')?.valueChanges
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => {
                    const index = this.tamboresArray.controls.indexOf(tamborGroup);
                    this.autoRellenarPrecio(index);
                });

            this.tamboresArray.push(tamborGroup);
        }

        // Recalcular totales después de generar tambores
        this.recalcularTotales();
    }

    /**
     * Calcular Peso Neto de un tambor (PB - T)
     */
    calcularPesoNeto(index: number): number {
        const tambor = this.tamboresArray.at(index);
        const bruto = parseFloat(tambor.get('bruto')?.value) || 0;
        const tara = parseFloat(tambor.get('tara')?.value) || 0;
        return bruto - tara;
    }

    /**
     * Calcular Costo Total de un tambor (PN × Precio)
     */
    calcularCostoTotal(index: number): number {
        const pesoNeto = this.calcularPesoNeto(index);
        const tambor = this.tamboresArray.at(index);
        const precio = parseFloat(tambor.get('precio')?.value) || 0;
        return pesoNeto * precio;
    }

    /**
     * Obtener clasificación según humedad
     */
    getClasificacion(index: number): ClasificacionMiel | null {
        const tambor = this.tamboresArray.at(index);
        const humedad = parseFloat(tambor.get('humedad')?.value);

        if (humedad === null || humedad === undefined || isNaN(humedad)) return null;

        return humedad <= 20 ? ClasificacionMiel.EXPORTACION : ClasificacionMiel.NACIONAL;
    }

    /**
     * Auto-rellenar precio según tipo de miel y clasificación (basado en humedad)
     */
    autoRellenarPrecio(index: number): void {
        const tipoMielId = this.form.get('tipoMielId')?.value;
        const tambor = this.tamboresArray.at(index);
        const humedad = parseFloat(tambor.get('humedad')?.value);

        // Validar que tengamos tipo de miel y humedad
        if (!tipoMielId || humedad === null || humedad === undefined || isNaN(humedad)) {
            return;
        }

        // Determinar clasificación según humedad
        const clasificacion = humedad <= 20 ? 'EXPORTACION' : 'NACIONAL';

        // Buscar precio en la lista de precios
        this.listaPreciosService.getPrecioPorTipoYClasificacion(tipoMielId, clasificacion)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (precio) => {
                    if (precio !== null) {
                        // Auto-rellenar el precio
                        tambor.patchValue({ precio }, { emitEvent: false });
                    }
                },
                error: (error) => {
                    console.error('Error al obtener precio:', error);
                }
            });
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
        const bruto = parseFloat(tambor.get('bruto')?.value) || 0;
        const tara = parseFloat(tambor.get('tara')?.value) || 0;

        return bruto > tara;
    }

    /**
     * Eliminar un tambor del FormArray (solo en memoria, durante creación)
     */
    deleteTambor(index: number): void {
        if (this.tamboresArray.length <= 1) {
            alert('Debe mantener al menos un tambor');
            return;
        }

        // En modo edición, verificar si el tambor está USADO o CANCELADO
        const tambor = this.tamboresArray.at(index);
        const estadoUso = tambor.get('estadoUso')?.value;

        if (estadoUso === 'USADO' || estadoUso === 'CANCELADO') {
            alert('No se puede eliminar un tambor que ya está en uso o cancelado');
            return;
        }

        // Eliminar del FormArray
        this.tamboresArray.removeAt(index);

        // Actualizar el número de tambores
        this.form.patchValue({
            numeroTambores: this.tamboresArray.length
        }, { emitEvent: false });

        // Recalcular totales
        this.recalcularTotales();
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

        if (!this.proveedorId() && !this.isEditMode()) {
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

        if (this.isEditMode()) {
            this.updateEntrada();
        } else {
            this.createEntrada();
        }
    }

    /**
     * Crear nueva entrada
     */
    private createEntrada(): void {
        this.loading.set(true);

        const formValue = this.form.value;
        const tipoMielId = formValue.tipoMielId;

        // Construir request con todos los tambores
        const request: CreateEntradaMielRequest = {
            fecha: formValue.fecha,
            apicultorId: formValue.apicultorId,
            ...(formValue.observaciones && { observaciones: formValue.observaciones }),
            detalles: formValue.tambores.map((tambor: any) => {
                const bruto = parseFloat(tambor.bruto) || 0;
                const tara = parseFloat(tambor.tara) || 0;
                const pesoNeto = bruto - tara;

                const detalle: any = {
                    tipoMielId: tipoMielId,
                    kilos: parseFloat(pesoNeto.toFixed(2)),  // PN = PB - T
                    humedad: parseFloat(tambor.humedad) || 0,
                    precio: parseFloat(tambor.precio) || 0, // Precio individual por tambor
                    bruto: parseFloat(bruto.toFixed(2)),
                    tara: parseFloat(tara.toFixed(2)),
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

    /**
     * Actualizar entrada existente
     */
    private updateEntrada(): void {
        this.loading.set(true);

        const id = this.entradaId();
        if (!id) {
            this.loading.set(false);
            alert('Error: ID de entrada no encontrado');
            return;
        }

        const formValue = this.form.value;
        const tipoMielId = formValue.tipoMielId;

        // Construir request con todos los tambores (incluir IDs para actualizar)
        // IMPORTANTE: Usar getRawValue() en cada tambor para incluir campos disabled
        const request: UpdateEntradaMielRequest = {
            fecha: formValue.fecha,
            apicultorId: formValue.apicultorId,
            ...(formValue.observaciones && { observaciones: formValue.observaciones }),
            detalles: this.tamboresArray.controls.map((control) => {
                // Usar getRawValue() para obtener valores de campos disabled también
                const tambor = control.getRawValue();

                const bruto = parseFloat(tambor.bruto) || 0;
                const tara = parseFloat(tambor.tara) || 0;
                const pesoNeto = bruto - tara;

                const detalle: any = {
                    tipoMielId: tipoMielId,
                    kilos: parseFloat(pesoNeto.toFixed(2)),  // PN = PB - T
                    humedad: parseFloat(tambor.humedad) || 0,
                    precio: parseFloat(tambor.precio) || 0, // Precio individual por tambor
                    bruto: parseFloat(bruto.toFixed(2)),
                    tara: parseFloat(tara.toFixed(2)),
                    autorizado: true
                };

                // Incluir ID si existe (para actualizar)
                if (tambor.id) {
                    detalle.id = tambor.id;
                }

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
        this.entradaMielService.updateEntrada(id, request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    alert(`Entrada actualizada exitosamente. Folio: ${response.folio}`);
                    this.router.navigate(['/acopiador/entradas-miel']);
                },
                error: (error) => {
                    this.loading.set(false);
                    console.error('Error al actualizar entrada:', error);
                    alert('Error al actualizar la entrada de miel');
                }
            });
    }

    onCancel(): void {
        if (confirm('¿Desea cancelar? Se perderán los datos ingresados.')) {
            this.router.navigate(['/acopiador/entradas-miel']);
        }
    }

    /**
     * Verificar si un tambor está bloqueado (USADO o CANCELADO)
     */
    isTamborBloqueado(index: number): boolean {
        const tambor = this.tamboresArray.at(index);
        const estadoUso = tambor.get('estadoUso')?.value;
        return estadoUso === 'USADO' || estadoUso === 'CANCELADO';
    }

    /**
     * Obtener estado de uso de un tambor
     */
    getEstadoUsoTambor(index: number): string | null {
        const tambor = this.tamboresArray.at(index);
        return tambor.get('estadoUso')?.value || null;
    }

    /**
     * Obtener clase CSS para badge de estado de uso del tambor
     */
    getEstadoUsoTamborBadgeClass(index: number): string {
        const estadoUso = this.getEstadoUsoTambor(index);

        if (estadoUso === 'USADO') {
            return 'bg-gray-100 text-gray-800';
        } else if (estadoUso === 'CANCELADO') {
            return 'bg-red-100 text-red-800';
        } else if (estadoUso === 'DISPONIBLE') {
            return 'bg-green-100 text-green-800';
        }

        return 'bg-blue-100 text-blue-800'; // NUEVO (sin estado aún)
    }
}