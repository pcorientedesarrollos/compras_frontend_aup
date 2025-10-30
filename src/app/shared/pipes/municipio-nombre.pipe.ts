/**
 * ============================================================================
 * 🏘️ MUNICIPIO NOMBRE PIPE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Pipe para convertir código de municipio → nombre del municipio
 *
 * USO:
 * {{ municipioCodigo | municipioNombre:estadoCodigo | async }}
 * Ejemplo: {{ "001" | municipioNombre:"20" | async }} → "Oaxaca de Juárez"
 *
 * CARACTERÍSTICAS:
 * - Retorna Observable (usar con async pipe)
 * - Caché por estado (múltiples peticiones, una por estado)
 * - Maneja errores devolviendo el código original
 *
 * ============================================================================
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { MunicipioService } from '../../core/services/municipio.service';
import { MunicipioAPI } from '../../core/models/municipio.model';

@Pipe({
    name: 'municipioNombre',
    standalone: true
})
export class MunicipioNombrePipe implements PipeTransform {
    private municipioService = inject(MunicipioService);

    // ✅ Caché estático compartido entre todas las instancias del pipe
    // Estructura: Map<estadoCodigo, Observable<MunicipioAPI[]>>
    private static municipiosCacheByEstado$ = new Map<string, Observable<MunicipioAPI[]>>();
    // Estructura: Map<"estadoCodigo-municipioCodigo", nombreMunicipio>
    private static municipiosMap = new Map<string, string>();

    /**
     * Transforma código de municipio a nombre
     *
     * @param municipioCodigo Código/clave del municipio (ej: "001", "050")
     * @param estadoCodigo Código INEGI del estado (ej: "20", "31")
     * @returns Observable con el nombre del municipio
     */
    transform(municipioCodigo: string | null | undefined, estadoCodigo: string | null | undefined): Observable<string> {
        // Validaciones
        if (!municipioCodigo || !estadoCodigo) {
            return of('Sin municipio');
        }

        // Clave única para el caché
        const cacheKey = `${estadoCodigo}-${municipioCodigo}`;

        // Si ya está en caché, retornar inmediatamente
        if (MunicipioNombrePipe.municipiosMap.has(cacheKey)) {
            return of(MunicipioNombrePipe.municipiosMap.get(cacheKey)!);
        }

        // Si no hay caché para este estado, cargar municipios
        if (!MunicipioNombrePipe.municipiosCacheByEstado$.has(estadoCodigo)) {
            MunicipioNombrePipe.municipiosCacheByEstado$.set(
                estadoCodigo,
                this.municipioService.getMunicipiosByEstado(estadoCodigo).pipe(
                    map(municipios => {
                        // Llenar el Map para búsquedas rápidas
                        municipios.forEach(municipio => {
                            const key = `${municipio.estado_codigo}-${municipio.clave_municipio}`;
                            MunicipioNombrePipe.municipiosMap.set(key, municipio.nombreMunicipio);
                        });
                        return municipios;
                    }),
                    shareReplay(1), // Compartir resultado entre suscripciones
                    catchError(() => of([])) // En caso de error, retornar array vacío
                )
            );
        }

        // Buscar en el caché
        return MunicipioNombrePipe.municipiosCacheByEstado$.get(estadoCodigo)!.pipe(
            map(() => {
                return MunicipioNombrePipe.municipiosMap.get(cacheKey) || municipioCodigo; // Si no encuentra, retorna el código
            })
        );
    }
}
