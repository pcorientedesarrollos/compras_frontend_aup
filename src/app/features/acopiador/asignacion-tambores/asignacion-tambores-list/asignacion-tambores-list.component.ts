/**
 * ============================================================================
 * 🛢️ ASIGNACIÓN TAMBORES - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Permite agrupar detalles de entradas de miel en tambores:
 * - Tabla con detalles disponibles (filtros: clasificación, tipo miel)
 * - Selección múltiple de detalles
 * - Creación progresiva de tambores borradores
 * - Confirmación final para guardar en backend
 * - Alert visual >300kg
 *
 * ============================================================================
 */

import { Component, signal, inject, DestroyRef, OnInit, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Componentes reutilizables
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';

// Modelos
import {
    DetalleDisponibleParaTambor,
    TamborBorrador,
    CreateTamborRequest
} from '../../../../core/models/tambor.model';
import { ClasificacionMiel } from '../../../../core/models/entrada-miel.model';

// Servicios
import { TamborService } from '../../../../core/services/tambor.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';

// Importar TipoMielOption del modelo
import { TipoMielOption } from '../../../../core/models/entrada-miel.model';

@Component({
    selector: 'app-asignacion-tambores-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IconComponent
    ],
    templateUrl: './asignacion-tambores-list.component.html',
    styleUrl: './asignacion-tambores-list.component.css'
})
export class AsignacionTamboresListComponent implements OnInit {
    private tamborService = inject(TamborService);
    private proveedorService = inject(ProveedorService);
    private destroyRef = inject(DestroyRef);

    // ============================================================================
    // STATE - SIGNALS
    // ============================================================================

    /** Flag para controlar la primera carga (evitar doble petición) */
    private isFirstLoad = true;

    /** Detalles disponibles para asignar */
    detallesDisponibles = signal<DetalleDisponibleParaTambor[]>([]);

    /** IDs de detalles seleccionados */
    detallesSeleccionados = signal<string[]>([]);

    /** Tambores creados en borrador (frontend) */
    tamboresBorrador = signal<TamborBorrador[]>([]);

    /** Estado de carga */
    loading = signal(false);

    /** Guardando tambores */
    saving = signal(false);

    /** Tipos de miel disponibles (catálogo) */
    tiposMiel = signal<TipoMielOption[]>([]);

    // Filtros (reordenados según especificación)
    filterApicultor = signal(''); // Incluye búsqueda por nombre o folio
    filterTipoMielId = signal<number | null>(null);
    filterHumedad = signal<number | null>(null); // NUEVO: filtro por humedad
    filterClasificacion = signal<ClasificacionMiel | ''>(''); // Default: TODAS (vacío)

    // Modal cancelar tambor
    tamborACancelar = signal<TamborBorrador | null>(null);
    motivoCancelacion = signal('');

    // Modal observaciones tambor
    tamborObservaciones = signal<TamborBorrador | null>(null);
    observacionesTemp = signal('');

    /** Math para template */
    Math = Math;

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Total de kilos seleccionados */
    totalKilosSeleccionados = computed(() => {
        const ids = this.detallesSeleccionados();
        return this.detallesDisponibles()
            .filter(d => ids.includes(d.id))
            .reduce((sum, d) => sum + d.kilos, 0);
    });

    /** Total de costo seleccionado */
    totalCostoSeleccionado = computed(() => {
        const ids = this.detallesSeleccionados();
        return this.detallesDisponibles()
            .filter(d => ids.includes(d.id))
            .reduce((sum, d) => sum + d.costoTotal, 0);
    });

    /** Detalles filtrados */
    detallesFiltrados = computed(() => {
        let detalles = this.detallesDisponibles();

        // Excluir detalles ya asignados a tambores borrador
        const idsEnTambores = this.tamboresBorrador()
            .flatMap(t => t.detalles.map(d => d.id));
        detalles = detalles.filter(d => !idsEnTambores.includes(d.id));

        // Filtro por apicultor o folio (búsqueda combinada)
        const searchTerm = this.filterApicultor().toLowerCase();
        if (searchTerm) {
            detalles = detalles.filter(d =>
                d.apicultorNombre.toLowerCase().includes(searchTerm) ||
                d.entradaFolio.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro por tipo de miel
        const tipoMielId = this.filterTipoMielId();
        if (tipoMielId) {
            detalles = detalles.filter(d => d.tipoMielId === tipoMielId);
        }

        // Filtro por humedad (exacta o rango - por ahora exacta)
        const humedad = this.filterHumedad();
        if (humedad !== null) {
            detalles = detalles.filter(d => d.humedad <= humedad);
        }

        // Filtro por clasificación
        const clasificacion = this.filterClasificacion();
        if (clasificacion) {
            detalles = detalles.filter(d => d.clasificacion === clasificacion);
        }

        return detalles;
    });

    /** Contador de tambores */
    contadorTambores = computed(() => this.tamboresBorrador().length);

    /**
     * Determina si un detalle es compatible con la selección actual
     * Retorna una función que valida compatibilidad basada en:
     * - Mismo tipo de miel
     * - Mismo rango de humedad
     * - Misma clasificación (EXPORTACION_1/EXPORTACION_2/NACIONAL/INDUSTRIA)
     */
    detalleEsCompatible = computed(() => {
        const seleccionados = this.detallesSeleccionados();

        // Si no hay selección, todos son compatibles
        if (seleccionados.length === 0) {
            return (_detalle: DetalleDisponibleParaTambor) => true;
        }

        // Obtener el primer detalle seleccionado como referencia
        const primerSeleccionado = this.detallesDisponibles()
            .find(d => d.id === seleccionados[0]);

        if (!primerSeleccionado) {
            return (_detalle: DetalleDisponibleParaTambor) => true;
        }

        // Determinar rango de humedad del primer seleccionado
        const rangoHumedadReferencia = primerSeleccionado.humedad <= 20 ? 'BAJO' : 'ALTO';

        // Retornar función que valida compatibilidad
        return (detalle: DetalleDisponibleParaTambor) => {
            const rangoHumedadDetalle = detalle.humedad <= 20 ? 'BAJO' : 'ALTO';

            return detalle.tipoMielId === primerSeleccionado.tipoMielId &&
                   rangoHumedadDetalle === rangoHumedadReferencia &&
                   detalle.clasificacion === primerSeleccionado.clasificacion;
        };
    });

    // ============================================================================
    // CONSTRUCTOR - EFFECTS
    // ============================================================================

    constructor() {
        // Effect reactivo: recarga automáticamente cuando cambian los filtros de clasificación o tipo
        effect(() => {
            // Leer los signals para que el effect se suscriba a cambios
            const clasificacion = this.filterClasificacion();
            const tipoMielId = this.filterTipoMielId();

            // Evitar carga doble en la inicialización
            if (this.isFirstLoad) {
                return;
            }

            // Limpiar selección y recargar
            this.deseleccionarTodos();
            this.loadDetallesDisponibles();
        });
    }

    // ============================================================================
    // LIFECYCLE
    // ============================================================================

    ngOnInit(): void {
        this.loadTiposMiel();
        this.loadDetallesDisponibles();

        // Después de la primera carga, activar los effects reactivos
        this.isFirstLoad = false;
    }

    // ============================================================================
    // METHODS - DATA LOADING
    // ============================================================================

    /**
     * Cargar catálogo de tipos de miel
     */
    loadTiposMiel(): void {
        this.proveedorService.getTiposMiel()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (tipos) => {
                    this.tiposMiel.set(tipos.map(t => ({
                        id: t.idTipoDeMiel,
                        nombre: t.tipoDeMiel
                    })));
                },
                error: () => {
                    console.error('Error al cargar tipos de miel');
                }
            });
    }

    /**
     * Cargar detalles disponibles
     */
    loadDetallesDisponibles(): void {
        this.loading.set(true);

        const filtros: any = {
            limit: 999 // Cargar todos
        };

        // Solo agregar filtros si tienen valor
        const clasificacion = this.filterClasificacion();
        if (clasificacion) {
            filtros.clasificacion = clasificacion;
        }

        const tipoMielId = this.filterTipoMielId();
        if (tipoMielId) {
            filtros.tipoMielId = tipoMielId;
        }

        this.tamborService.getDetallesDisponibles(filtros)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (detalles) => {
                    this.detallesDisponibles.set(detalles);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    alert('Error al cargar detalles disponibles');
                }
            });
    }

    // ============================================================================
    // METHODS - FILTROS
    // ============================================================================

    /**
     * Aplicar filtros
     */
    applyFilters(): void {
        this.deseleccionarTodos();
        this.loadDetallesDisponibles();
    }

    /**
     * Limpiar filtros
     */
    clearFilters(): void {
        this.filterApicultor.set('');
        this.filterTipoMielId.set(null);
        this.filterHumedad.set(null);
        this.filterClasificacion.set(''); // TODAS
        this.deseleccionarTodos();
        this.loadDetallesDisponibles();
    }

    // ============================================================================
    // METHODS - SELECCIÓN
    // ============================================================================

    /**
     * Toggle selección de un detalle
     */
    toggleSeleccion(detalleId: string): void {
        const seleccionados = this.detallesSeleccionados();
        const index = seleccionados.indexOf(detalleId);

        if (index > -1) {
            // Deseleccionar
            this.deseleccionarDetalle(detalleId);
        } else {
            // Seleccionar
            this.seleccionarDetalle(detalleId);
        }
    }

    /**
     * Seleccionar un detalle
     */
    seleccionarDetalle(detalleId: string): void {
        this.detallesSeleccionados.update(ids => [...ids, detalleId]);
    }

    /**
     * Deseleccionar un detalle
     */
    deseleccionarDetalle(detalleId: string): void {
        this.detallesSeleccionados.update(ids => ids.filter(id => id !== detalleId));
    }

    /**
     * Deseleccionar todos
     */
    deseleccionarTodos(): void {
        this.detallesSeleccionados.set([]);
    }

    /**
     * Check si un detalle está seleccionado
     */
    isSeleccionado(detalleId: string): boolean {
        return this.detallesSeleccionados().includes(detalleId);
    }

    // ============================================================================
    // METHODS - TAMBORES BORRADOR
    // ============================================================================

    /**
     * Crear tambor con detalles seleccionados
     */
    crearTamborBorrador(): void {
        const idsSeleccionados = this.detallesSeleccionados();

        if (idsSeleccionados.length === 0) {
            alert('Debe seleccionar al menos un detalle');
            return;
        }

        // Obtener detalles seleccionados
        const detallesSeleccionados = this.detallesDisponibles()
            .filter(d => idsSeleccionados.includes(d.id));

        // Validar homogeneidad (mismo tipo, clasificación Y rango de humedad)
        const primerDetalle = detallesSeleccionados[0];
        const rangoHumedadReferencia = primerDetalle.humedad <= 20 ? 'BAJO' : 'ALTO';

        const todosIguales = detallesSeleccionados.every(d => {
            const rangoHumedadDetalle = d.humedad <= 20 ? 'BAJO' : 'ALTO';
            return d.tipoMielId === primerDetalle.tipoMielId &&
                   d.clasificacion === primerDetalle.clasificacion &&
                   rangoHumedadDetalle === rangoHumedadReferencia;
        });

        if (!todosIguales) {
            alert('Todos los detalles deben ser del mismo tipo de miel, clasificación Y rango de humedad (≤20% o >20%)');
            return;
        }

        // Calcular totales
        const totalKilos = detallesSeleccionados.reduce((sum, d) => sum + d.kilos, 0);
        const totalCosto = detallesSeleccionados.reduce((sum, d) => sum + d.costoTotal, 0);

        // VALIDACIÓN ESTRICTA: No exceder 350kg por tambor
        const MAX_KILOS_TAMBOR = 350;
        if (totalKilos > MAX_KILOS_TAMBOR) {
            alert(`❌ LÍMITE EXCEDIDO: El tambor tendría ${totalKilos.toFixed(2)} kg.\n\nEl límite máximo es de ${MAX_KILOS_TAMBOR} kg por tambor.\n\nPor favor, deseleccione algunos detalles para reducir el peso.`);
            return;
        }

        // Crear tambor borrador
        const nuevoTambor: TamborBorrador = {
            id: `temp-${Date.now()}`, // ID temporal
            detalles: detallesSeleccionados,
            totalKilos,
            totalCosto,
            observaciones: ''
        };

        // Agregar a lista de borradores
        this.tamboresBorrador.update(tambores => [...tambores, nuevoTambor]);

        // Limpiar selección
        this.deseleccionarTodos();
    }

    /**
     * Eliminar tambor borrador
     */
    eliminarTamborBorrador(tamborId: string): void {
        if (!confirm('¿Desea eliminar este tambor?')) {
            return;
        }

        this.tamboresBorrador.update(tambores =>
            tambores.filter(t => t.id !== tamborId)
        );
    }

    /**
     * Abrir modal de observaciones
     */
    abrirModalObservaciones(tamborId: string): void {
        const tambor = this.tamboresBorrador().find(t => t.id === tamborId);
        if (!tambor) return;

        this.tamborObservaciones.set(tambor);
        this.observacionesTemp.set(tambor.observaciones || '');
    }

    /**
     * Guardar observaciones
     */
    guardarObservaciones(): void {
        const tambor = this.tamborObservaciones();
        if (!tambor) return;

        // Actualizar observaciones en el tambor
        this.tamboresBorrador.update(tambores =>
            tambores.map(t =>
                t.id === tambor.id
                    ? { ...t, observaciones: this.observacionesTemp() }
                    : t
            )
        );

        this.cerrarModalObservaciones();
    }

    /**
     * Cerrar modal observaciones
     */
    cerrarModalObservaciones(): void {
        this.tamborObservaciones.set(null);
        this.observacionesTemp.set('');
    }

    /**
     * Cancelar todo (limpiar borradores)
     */
    cancelarTodo(): void {
        if (this.tamboresBorrador().length === 0) {
            return;
        }

        if (!confirm('¿Desea cancelar todos los tambores creados?')) {
            return;
        }

        this.tamboresBorrador.set([]);
        this.deseleccionarTodos();
    }

    // ============================================================================
    // METHODS - GUARDAR
    // ============================================================================

    /**
     * Guardar todos los tambores en backend
     */
    guardarTambores(): void {
        const tambores = this.tamboresBorrador();

        if (tambores.length === 0) {
            alert('No hay tambores para guardar');
            return;
        }

        if (!confirm(`¿Confirmar creación de ${tambores.length} tambor(es)?`)) {
            return;
        }

        this.saving.set(true);

        // Crear requests
        const requests: CreateTamborRequest[] = tambores.map(t => ({
            detalleIds: t.detalles.map(d => d.id),
            observaciones: t.observaciones
        }));

        // Guardar uno por uno (secuencial)
        this.guardarTamboresSecuencial(requests, 0);
    }

    /**
     * Guardar tambores de forma secuencial
     */
    private guardarTamboresSecuencial(requests: CreateTamborRequest[], index: number): void {
        if (index >= requests.length) {
            // Todos guardados exitosamente
            this.saving.set(false);
            alert(`${requests.length} tambor(es) creado(s) exitosamente`);
            this.tamboresBorrador.set([]);
            this.loadDetallesDisponibles(); // Recargar disponibles
            return;
        }

        // Guardar tambor actual
        this.tamborService.createTambor(requests[index])
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    // Continuar con siguiente
                    this.guardarTamboresSecuencial(requests, index + 1);
                },
                error: (error) => {
                    this.saving.set(false);
                    const mensaje = error?.error?.message || 'Error al crear tambor';
                    alert(`Error en tambor ${index + 1}: ${mensaje}`);
                }
            });
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Clase CSS para badge de tambor según peso
     */
    getTamborBadgeClass(kilos: number): string {
        return kilos > 300
            ? 'text-orange-600 font-bold'
            : 'text-gray-700';
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString: Date | string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    }

    /**
     * Formatear moneda
     */
    formatCurrency(value: number): string {
        return `$${value.toFixed(2)}`;
    }

    /**
     * Formatear número con decimales
     */
    formatNumber(value: number, decimals: number = 2): string {
        return value.toFixed(decimals);
    }

    /**
     * Clase CSS para badge de clasificación
     */
    getClasificacionBadgeClass(clasificacion: string): string {
        switch (clasificacion) {
            case 'EXPORTACION_1':
                return 'bg-green-100 text-green-800';
            case 'EXPORTACION_2':
                return 'bg-blue-100 text-blue-800';
            case 'NACIONAL':
                return 'bg-amber-100 text-amber-800';
            case 'INDUSTRIA':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    /**
     * Etiqueta legible para clasificación
     */
    getClasificacionLabel(clasificacion: string): string {
        switch (clasificacion) {
            case 'EXPORTACION_1':
                return 'EXPORTACIÓN 1';
            case 'EXPORTACION_2':
                return 'EXPORTACIÓN 2';
            case 'NACIONAL':
                return 'NACIONAL';
            case 'INDUSTRIA':
                return 'INDUSTRIA';
            default:
                return clasificacion;
        }
    }
}
