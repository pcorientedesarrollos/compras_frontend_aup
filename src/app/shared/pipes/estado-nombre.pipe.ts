/**
 * ============================================================================
 * 🗺️ ESTADO NOMBRE PIPE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Pipe para convertir código de estado → nombre del estado
 *
 * USO:
 * {{ estadoCodigo | estadoNombre | async }}
 * Ejemplo: {{ "20" | estadoNombre | async }} → "Oaxaca"
 *
 * CARACTERÍSTICAS:
 * - Retorna Observable (usar con async pipe)
 * - Caché automático (una sola petición HTTP)
 * - Maneja errores devolviendo el código original
 *
 * ============================================================================
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { EstadoService } from '../../core/services/estado.service';
import { EstadoAPI } from '../../core/models/estado.model';

@Pipe({
    name: 'estadoNombre',
    standalone: true
})
export class EstadoNombrePipe implements PipeTransform {
    private estadoService = inject(EstadoService);

    // ✅ Caché estático compartido entre todas las instancias del pipe
    private static estadosCache$: Observable<EstadoAPI[]> | null = null;
    private static estadosMap: Map<string, string> = new Map();

    /**
     * Transforma código de estado a nombre
     *
     * @param codigoPipe Código INEGI del estado (ej: "20", "31")
     * @returns Observable con el nombre del estado
     */
    transform(codigo: string | null | undefined): Observable<string> {
        // Si no hay código, retornar placeholder
        if (!codigo) {
            return of('Sin estado');
        }

        // Si ya está en caché, retornar inmediatamente
        if (EstadoNombrePipe.estadosMap.has(codigo)) {
            return of(EstadoNombrePipe.estadosMap.get(codigo)!);
        }

        // Si no hay caché, cargar todos los estados (una sola vez)
        if (!EstadoNombrePipe.estadosCache$) {
            EstadoNombrePipe.estadosCache$ = this.estadoService.getAllEstados().pipe(
                map(estados => {
                    // Llenar el Map para búsquedas rápidas
                    estados.forEach(estado => {
                        EstadoNombrePipe.estadosMap.set(estado.codigo_inegi, estado.estado);
                    });
                    return estados;
                }),
                shareReplay(1), // Compartir resultado entre suscripciones
                catchError(() => of([])) // En caso de error, retornar array vacío
            );
        }

        // Buscar en el caché
        return EstadoNombrePipe.estadosCache$.pipe(
            map(() => {
                return EstadoNombrePipe.estadosMap.get(codigo) || codigo; // Si no encuentra, retorna el código
            })
        );
    }
}
