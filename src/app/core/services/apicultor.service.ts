/**
 * ============================================================================
 * 🐝 APICULTOR SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Servicio para consumir las APIs de Apicultores del backend
 * 
 * ENDPOINTS:
 * - POST   /api/apicultores                    → Crear apicultor
 * - GET    /api/apicultores                    → Listar con filtros y paginación
 * - GET    /api/apicultores/:id                → Detalle por ID
 * - GET    /api/apicultores/codigo/:codigo     → Buscar por código único
 * - GET    /api/apicultores/curp/:curp         → Buscar por CURP
 * - PUT    /api/apicultores/:id                → Actualizar (incluye proveedores)
 * - DELETE /api/apicultores/:id                → Eliminar (solo ADMIN)
 * - GET    /api/apicultores/:id/proveedores    → Proveedores vinculados
 * - GET    /api/apicultores/proveedor/:id      → Apicultores de un proveedor
 * 
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import {
    ApicultorAPI,
    ApicultorDetailAPI,
    ApicultorProveedor,
    CreateApicultorRequest,
    UpdateApicultorRequest,
    ApicultorFilterParams,
    ApicultoresPaginatedResponse,
    ApicultorDetailResponse,
    CreateApicultorResponse,
    UpdateApicultorResponse,
    DeleteApicultorResponse,
    ProveedoresDeApicultorResponse
} from '../models/index';

@Injectable({
    providedIn: 'root'
})
export class ApicultorService {
    private httpService = inject(HttpService);

    private readonly BASE_PATH = 'apicultores';

    // ============================================================================
    // API 1: POST /api/apicultores
    // ============================================================================

    /**
     * Crear un nuevo apicultor
     * Opcionalmente puede vincularse con proveedores usando proveedorIds[]
     * 
     * @param data Datos del apicultor a crear
     * @returns Observable con el apicultor creado
     */
    createApicultor(data: CreateApicultorRequest): Observable<ApicultorDetailAPI> {
        return this.httpService
            .post<CreateApicultorResponse>(this.BASE_PATH, data)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 2: GET /api/apicultores
    // ============================================================================

    /**
     * Buscar apicultores con filtros avanzados y paginación
     * Los ACOPIADORES solo ven apicultores vinculados a ellos
     * 
     * @param params Parámetros de filtrado y paginación
     * @returns Observable con lista paginada de apicultores
     */
    getApicultores(params: ApicultorFilterParams = {}): Observable<ApicultoresPaginatedResponse> {
        // Construir query params dinámicamente (solo los que tienen valor)
        const queryParams: Record<string, string> = {};

        if (params.nombre) queryParams['nombre'] = params.nombre;
        if (params.curp) queryParams['curp'] = params.curp;
        if (params.codigo) queryParams['codigo'] = params.codigo;
        if (params.estadoCodigo) queryParams['estadoCodigo'] = params.estadoCodigo;
        if (params.municipioCodigo) queryParams['municipioCodigo'] = params.municipioCodigo;
        if (params.estatus) queryParams['estatus'] = params.estatus;
        if (params.page) queryParams['page'] = params.page.toString();
        if (params.limit) queryParams['limit'] = params.limit.toString();

        // Construir query string
        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString ? `${this.BASE_PATH}?${queryString}` : this.BASE_PATH;

        return this.httpService.get<ApicultoresPaginatedResponse>(url);
    }

    /**
     * Obtener TODOS los apicultores sin paginación (para filtrado local)
     * Útil para tablas con filtrado frontend
     * 
     * @returns Observable con todos los apicultores
     */
    getAllApicultores(): Observable<ApicultorAPI[]> {
        const url = `${this.BASE_PATH}?page=1&limit=9999`;

        return this.httpService
            .get<ApicultoresPaginatedResponse>(url)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 3: GET /api/apicultores/:id
    // ============================================================================

    /**
     * Obtener información completa de un apicultor por su ID
     * Incluye apiarios y proveedores vinculados
     * 
     * @param id ID del apicultor (CUID)
     * @returns Observable con el apicultor completo
     */
    getApicultorById(id: string): Observable<ApicultorDetailAPI> {
        return this.httpService
            .get<ApicultorDetailResponse>(`${this.BASE_PATH}/${id}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 4: GET /api/apicultores/codigo/:codigo
    // ============================================================================

    /**
     * Buscar un apicultor por su código único
     * Útil para búsquedas rápidas sin conocer el ID
     * 
     * @param codigo Código único del apicultor (ej: APIC-2025-001)
     * @returns Observable con el apicultor encontrado
     */
    getApicultorByCodigo(codigo: string): Observable<ApicultorDetailAPI> {
        return this.httpService
            .get<ApicultorDetailResponse>(`${this.BASE_PATH}/codigo/${codigo}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 5: GET /api/apicultores/curp/:curp
    // ============================================================================

    /**
     * Buscar un apicultor por su CURP
     * Útil para validar duplicados o búsquedas por documento oficial
     * 
     * @param curp CURP del apicultor (18 caracteres)
     * @returns Observable con el apicultor encontrado
     */
    getApicultorByCurp(curp: string): Observable<ApicultorDetailAPI> {
        return this.httpService
            .get<ApicultorDetailResponse>(`${this.BASE_PATH}/curp/${curp}`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 6: PUT /api/apicultores/:id
    // ============================================================================

    /**
     * Actualizar un apicultor existente
     * 
     * IMPORTANTE: Campo proveedorIds gestiona vínculos:
     * - Si NO se envía: mantiene vínculos actuales
     * - Si se envía con IDs: reemplaza completamente los vínculos
     * - Si se envía vacío []: elimina todos los vínculos
     * 
     * @param id ID del apicultor
     * @param data Datos a actualizar
     * @returns Observable con el apicultor actualizado
     */
    updateApicultor(id: string, data: UpdateApicultorRequest): Observable<ApicultorDetailAPI> {
        return this.httpService
            .put<UpdateApicultorResponse>(`${this.BASE_PATH}/${id}`, data)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 7: DELETE /api/apicultores/:id
    // ============================================================================

    /**
     * Eliminar un apicultor del sistema
     * Solo disponible para ADMINISTRADORES
     * No se puede eliminar si tiene apiarios o usuario asociado
     * 
     * @param id ID del apicultor
     * @returns Observable con mensaje de confirmación
     */
    deleteApicultor(id: string): Observable<string> {
        return this.httpService
            .delete<DeleteApicultorResponse>(`${this.BASE_PATH}/${id}`)
            .pipe(
                map(response => response.message)
            );
    }

    // ============================================================================
    // API 8: GET /api/apicultores/:id/proveedores
    // ============================================================================

    /**
     * Obtener lista de proveedores vinculados a un apicultor
     * Solo retorna vínculos activos
     * 
     * @param id ID del apicultor
     * @returns Observable con lista de proveedores
     */
    getProveedoresDeApicultor(id: string): Observable<ApicultorProveedor[]> {
        return this.httpService
            .get<ProveedoresDeApicultorResponse>(`${this.BASE_PATH}/${id}/proveedores`)
            .pipe(
                map(response => response.data)
            );
    }

    // ============================================================================
    // API 9: GET /api/apicultores/proveedor/:proveedorId
    // ============================================================================

    /**
     * Obtener apicultores vinculados a un proveedor específico
     * Incluye paginación
     * 
     * @param proveedorId ID del proveedor
     * @param page Número de página (default: 1)
     * @param limit Registros por página (default: 10)
     * @returns Observable con lista paginada
     */
    getApicultoresByProveedor(
        proveedorId: number,
        page: number = 1,
        limit: number = 10
    ): Observable<ApicultoresPaginatedResponse> {
        // Construir query params
        const queryParams: Record<string, string> = {};
        if (page) queryParams['page'] = page.toString();
        if (limit) queryParams['limit'] = limit.toString();

        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString
            ? `${this.BASE_PATH}/proveedor/${proveedorId}?${queryString}`
            : `${this.BASE_PATH}/proveedor/${proveedorId}`;

        return this.httpService.get<ApicultoresPaginatedResponse>(url);
    }

    // ============================================================================
    // MÉTODOS HELPER
    // ============================================================================

    /**
     * Verificar si un código de apicultor ya existe
     * Útil para validación en formularios
     * 
     * @param codigo Código a verificar
     * @returns Observable<boolean> true si existe, false si no
     */
    codigoExists(codigo: string): Observable<boolean> {
        return this.getApicultorByCodigo(codigo).pipe(
            map(() => true),
            // Si el observable error (404), retorna false
            // El errorInterceptor ya maneja esto
        );
    }

    /**
     * Verificar si un CURP ya existe
     * Útil para validación en formularios
     * 
     * @param curp CURP a verificar
     * @returns Observable<boolean> true si existe, false si no
     */
    curpExists(curp: string): Observable<boolean> {
        return this.getApicultorByCurp(curp).pipe(
            map(() => true)
        );
    }
}