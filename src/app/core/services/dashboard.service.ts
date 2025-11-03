/**
 * ============================================================================
 * DASHBOARD SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Servicio centralizado para obtener métricas y estadísticas
 * del dashboard según el rol del usuario
 *
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApicultorService } from './apicultor.service';
import { ApiarioService } from './apiario.service';
import { ProveedorService } from './proveedor.service';
import { EntradaMielService } from './entrada-miel.service';
import { InventarioService } from './inventario.service';
import { VerificacionService } from './verificacion.service';

// Interfaces para métricas del dashboard
export interface DashboardMetrics {
  totalApicultores?: number;
  totalApiarios?: number;
  totalProveedores?: number;
  totalUsuarios?: number;
  totalColmenas?: number;
  totalKilosInventario?: number;
  totalTamboresDisponibles?: number;
  totalEntradasMiel?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apicultorService = inject(ApicultorService);
  private apiarioService = inject(ApiarioService);
  private proveedorService = inject(ProveedorService);
  private entradaMielService = inject(EntradaMielService);
  private inventarioService = inject(InventarioService);
  private verificacionService = inject(VerificacionService);

  /**
   * Obtener métricas del dashboard para ADMINISTRADOR
   */
  getAdminMetrics(): Observable<DashboardMetrics> {
    return forkJoin({
      apicultores: this.apicultorService.getApicultores({ page: 1, limit: 1 }).pipe(
        map(response => response.pagination?.total || 0),
        catchError(() => of(0))
      ),
      apiarios: this.apiarioService.getEstadisticas().pipe(
        map(stats => ({
          total: stats.totalApiarios,
          colmenas: stats.totalColmenas
        })),
        catchError(() => of({ total: 0, colmenas: 0 }))
      ),
      proveedores: this.proveedorService.getProveedoresActivos().pipe(
        map(proveedores => proveedores.length),
        catchError(() => of(0))
      ),
      inventario: this.inventarioService.getResumenInventario().pipe(
        map(response => ({
          kilos: response.totales.kilosDisponibles,
          tambores: response.resumen.length // Total de tipos de miel en inventario
        })),
        catchError(() => of({ kilos: 0, tambores: 0 }))
      )
    }).pipe(
      map(data => ({
        totalApicultores: data.apicultores,
        totalApiarios: data.apiarios.total,
        totalColmenas: data.apiarios.colmenas,
        totalProveedores: data.proveedores,
        totalKilosInventario: data.inventario.kilos,
        totalTamboresDisponibles: data.inventario.tambores
      }))
    );
  }

  /**
   * Obtener métricas del dashboard para ACOPIADOR
   */
  getAcopiadorMetrics(proveedorId: number): Observable<DashboardMetrics> {
    return forkJoin({
      apicultores: this.apicultorService.getApicultores({ page: 1, limit: 1 }).pipe(
        map(response => response.pagination?.total || 0),
        catchError(() => of(0))
      ),
      entradas: this.entradaMielService.getEstadisticas({ proveedorId }).pipe(
        map(stats => stats.totalEntradas),
        catchError(() => of(0))
      ),
      inventario: this.inventarioService.getResumenInventario().pipe(
        map(response => ({
          kilos: response.totales.kilosDisponibles,
          tambores: response.resumen.length
        })),
        catchError(() => of({ kilos: 0, tambores: 0 }))
      )
    }).pipe(
      map(data => ({
        totalApicultores: data.apicultores,
        totalEntradasMiel: data.entradas,
        totalKilosInventario: data.inventario.kilos,
        totalTamboresDisponibles: data.inventario.tambores
      }))
    );
  }

  /**
   * Obtener métricas del dashboard para APICULTOR
   */
  getApicultorMetrics(apicultorId: string): Observable<DashboardMetrics> {
    return this.apiarioService.getEstadisticas({ apicultorId }).pipe(
      map(stats => ({
        totalApiarios: stats.totalApiarios,
        totalColmenas: stats.totalColmenas
      })),
      catchError(() => of({
        totalApiarios: 0,
        totalColmenas: 0
      }))
    );
  }

  /**
   * Obtener métricas del dashboard para VERIFICADOR
   */
  getVerificadorMetrics(): Observable<any> {
    return this.verificacionService.getResumenVerificaciones().pipe(
      catchError(() => of({
        totalVerificaciones: 0,
        totalTamboresVerificados: 0,
        totalKilosVerificados: 0
      }))
    );
  }
}
