/**
 * ============================================================================
 * VERIFICADOR MODELS - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Interfaces y tipos para el módulo de Verificación (Llegadas de Chofer)
 * Basado en DOCS_FRONTEND_VERIFICACION_COMPLETA.md v2.0
 *
 * ============================================================================
 */

import { ClasificacionMiel } from './entrada-miel.model';
import { EstadoSalida } from './salida-miel.model';
import { ApiResponse } from './user.model';

// ============================================================================
// ENUMS
// ============================================================================

export enum EstatusGeneral {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO'
}

export enum EstadoLlegada {
  PENDIENTE = 'PENDIENTE',           // 0 tambores verificados
  EN_VERIFICACION = 'EN_VERIFICACION', // Algunos tambores verificados
  VERIFICADA = 'VERIFICADA'           // Todos los tambores verificados
}

// ============================================================================
// GESTIÓN DE VERIFICADORES (CRUD - Solo ADMIN)
// ============================================================================

export interface CreateVerificadorDTO {
  username: string;
  password: string;
  email?: string;
  nombreCompleto: string;
  nombreEmpresa: string;
  puesto?: string;
  telefono?: string;
}

export interface UpdateVerificadorDTO {
  nombreCompleto?: string;
  nombreEmpresa?: string;
  puesto?: string;
  telefono?: string;
  email?: string;
}

export interface UpdateEstadoVerificadorDTO {
  estatus: EstatusGeneral;
  motivo?: string;
}

export interface SearchVerificadoresDTO {
  search?: string;
  estatus?: EstatusGeneral;
  page?: number;
  limit?: number;
}

export interface VerificadorResponse {
  id: string;
  nombreCompleto: string;
  nombreEmpresa: string;
  puesto: string | null;
  telefono: string | null;
  estatus: EstatusGeneral;
  fechaAlta: string;
  createdAt: string;
  updatedAt: string;
  usuario?: {
    userId: string;
    username: string;
    email: string | null;
    role: 'VERIFICADOR';
  };
}

export interface VerificadorListResponse {
  id: string;
  nombreCompleto: string;
  nombreEmpresa: string;
  puesto: string | null;
  telefono: string | null;
  estatus: EstatusGeneral;
  username: string;
  email: string | null;
  usuarioActivo: boolean;
  fechaAlta: string;
}

// ============================================================================
// LLEGADAS DE CHOFER (Nuevo concepto agrupado)
// ============================================================================

/**
 * Salida dentro de una llegada (vista simplificada)
 */
export interface SalidaEnLlegada {
  salidaId: string;
  folio: string;
  fecha: string;
  proveedorId: number;
  proveedorNombre: string;
  cantidadTambores: number;
  totalKilos: number;
  totalCompra: number;
  estado: EstadoSalida;
  observaciones: string | null;
  tamboresVerificados: number;
  tieneDiferencias: boolean;
}

/**
 * Llegada agrupada por chofer (lista)
 */
export interface LlegadaChoferResponse {
  choferId: string;
  choferNombre: string;
  choferAlias: string | null;
  fechaLlegada: string;
  cantidadProveedores: number;
  cantidadSalidas: number;
  cantidadTamboresTotal: number;
  kilosTotales: number;
  compraTotalGeneral: number;
  estadoGeneral: EstadoLlegada;
  salidas: SalidaEnLlegada[];
}

/**
 * Tambor individual para verificar
 */
export interface TamborParaVerificar {
  detalleId: string;
  tamborId: string;
  tamborConsecutivo: string;

  // Datos declarados
  tipoMielId: number;
  tipoMielNombre: string;
  floracionId: number | null;
  floracionNombre: string | null;
  colorId: number | null;
  colorNombre: string | null;
  clasificacion: ClasificacionMiel;
  kilosDeclarados: number;
  humedadPromedio: number;
  costoTotal: number;
  taraCapturada: number | null;

  // Datos verificados
  verificado: boolean;
  kilosVerificados: number | null;
  taraVerificada: number | null; // ← NUEVO: Tara verificada
  humedadVerificada: number | null;
  floracionVerificadaId: number | null;
  floracionVerificadaNombre: string | null;
  colorVerificadoId: number | null;
  colorVerificadoNombre: string | null;
  clasificacionVerificada: ClasificacionMiel | null;
  tamborVerificadoId: string | null;
  tamborVerificadoConsecutivo: string | null;
  observacionesVerificador: string | null;
  tieneDiferencias: boolean;

  observaciones: string | null;
}

/**
 * Salida con tambores completos para verificar
 */
export interface SalidaConTambores {
  salidaId: string;
  folio: string;
  fecha: string;
  observaciones: string | null;
  observacionesChofer: string | null;
  tambores: TamborParaVerificar[];
}

/**
 * Proveedor dentro de una llegada
 */
export interface ProveedorEnLlegada {
  proveedorId: number;
  proveedorNombre: string;
  salidas: SalidaConTambores[];
  resumenProveedor: {
    cantidadSalidas: number;
    cantidadTambores: number;
    kilosTotales: number;
    compraTotal: number;
  };
}

/**
 * Detalle completo de llegada para verificar
 */
export interface DetalleLlegadaParaVerificar {
  choferId: string;
  choferNombre: string;
  choferAlias: string | null;
  fechaLlegada: string;
  resumen: {
    cantidadProveedores: number;
    cantidadSalidas: number;
    cantidadTamboresTotal: number;
    kilosTotales: number;
    compraTotalGeneral: number;
  };
  proveedores: ProveedorEnLlegada[];
}

// ============================================================================
// PROCESO DE VERIFICACIÓN
// ============================================================================

/**
 * DTO para verificar tambor individual
 */
export interface VerificarTamborDTO {
  verificado: boolean;
  kilosVerificados?: number;
  taraVerificada?: number; // ← NUEVO: Tara verificada por el verificador
  humedadVerificada?: number;
  floracionVerificadaId?: number;
  colorVerificadoId?: number;
  observacionesVerificador?: string;
}

/**
 * Respuesta de verificación de tambor
 */
export interface VerificacionTamborResponse {
  detalleId: string;
  verificado: boolean;
  tieneDiferencias: boolean;
  tamborVerificado?: {
    id: string;
    consecutivo: string;
    estado: string;
    kilos: number;
    humedadPromedio: number;
    floracionId: number | null;
    colorId: number | null;
    clasificacion: ClasificacionMiel;
  };
  tamborOriginal: {
    id: string;
    consecutivo: string;
    estado: string;
  };
}

/**
 * Resumen de verificación finalizada de salida
 */
export interface ResumenVerificacionSalida {
  salidaId: string;
  folio: string;
  estadoAnterior: EstadoSalida;
  estadoNuevo: EstadoSalida;
  fechaVerificacion: string;
  resumen: {
    cantidadTambores: number;
    tamboresVerificados: number;
    tamboresConDiferencias: number;
    tamboresSinDiferencias: number;
    kilosTotalesDeclarados: number;
    kilosTotalesVerificados: number;
    diferenciaTotalKilos: number;
    porcentajeDiferencia: number;
  };
}

// ============================================================================
// MIS VERIFICACIONES (Historial)
// ============================================================================

export interface VerificacionResponse {
  verificacionId: string;
  numeroVerificacion: number;
  salidaFolio: string;
  fechaVerificacion: string;
  proveedorId: number;
  proveedorNombre: string;
  choferNombre: string;
  choferAlias: string | null;
  verificadorNombre: string;
  cantidadTambores: number;
  cantidadConDiferencias: number;
  cantidadSinDiferencias: number;
  kilosTotalesDeclarados: number;
  kilosTotalesVerificados: number;
  diferenciaTotal: number;
  porcentajeDiferencia?: number;
  observaciones: string | null;
}

export interface TamborVerificadoDetalle {
  detalleId: string;
  tamborOriginal: {
    id: string;
    consecutivo: string;
    kilosDeclarados: number;
    humedadDeclarada: number;
    floracionDeclarada: string | null;
    colorDeclarado: string | null;
    clasificacionDeclarada: ClasificacionMiel;
  };
  tamborVerificado: {
    id: string;
    consecutivo: string;
    kilosVerificados: number;
    humedadVerificada: number;
    floracionVerificada: string | null;
    colorVerificado: string | null;
    clasificacionVerificada: ClasificacionMiel;
  } | null;
  datosFinales: {
    mielNeta: number;
    tara: number;
    pesoBruto: number;
    tipoMiel: string;
    clasificacion: ClasificacionMiel;
    floracion: string | null;
    color: string | null;
    humedad: number;
  };
  tieneDiferencias: boolean;
  diferencias: {
    kilos: number;
    porcentajeKilos: number;
    humedad: number;
    tara: number;
    cambioFloracion: boolean;
    cambioColor: boolean;
    cambioClasificacion: boolean;
  } | null;
  observacionesVerificador: string | null;
  estadoFinal: string;
}

export interface DetalleVerificacionResponse {
  verificacionId: string;
  numeroVerificacion: number;
  salidaFolio: string;
  fechaSalida: string;
  fechaVerificacion: string;
  proveedor: {
    id: number;
    nombre: string;
  };
  chofer: {
    nombre: string;
    alias: string | null;
  };
  verificador: {
    nombre: string;
    empresa: string;
  };
  resumen: {
    cantidadTambores: number;
    cantidadConDiferencias: number;
    cantidadSinDiferencias: number;
    kilosTotalesDeclarados: number;
    kilosTotalesVerificados: number;
    diferenciaTotal: number;
    porcentajeDiferencia: number;
  };
  tambores: TamborVerificadoDetalle[];
  observacionesGenerales: string | null;
}

export interface ResumenVerificacionesResponse {
  totalVerificaciones: number;
  totalTamboresVerificados: number;
  totalConDiferencias: number;
  totalSinDiferencias: number;
  porcentajeDiferencias: number;
  kilosTotalesDeclarados: number;
  kilosTotalesVerificados: number;
  diferenciaTotal: number;
  porcentajeDiferenciaKilos: number;
  porProveedores: {
    proveedorId: number;
    proveedorNombre: string;
    verificaciones: number;
    tambores: number;
    conDiferencias: number;
    diferenciaKilos: number;
  }[];
}

// ============================================================================
// INVENTARIO EN PLANTA
// ============================================================================

export interface TamborInventarioResponse {
  id: string;
  consecutivo: string;
  kilos: number;
  humedadPromedio: number;
  clasificacion: ClasificacionMiel;
  floracion: string | null;
  color: string | null;
  estado: string;
  fechaCreacion: string;
  salidaOrigen: {
    folio: string;
    proveedor: string;
    chofer: string;
  };
  diferenciasConDeclarado?: {
    kilosDiferencia: number;
    humedadDiferencia: number;
  };
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

export interface MisVerificacionesParams {
  page?: number;
  limit?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  proveedorId?: number;
}

export interface InventarioPlantaParams {
  page?: number;
  limit?: number;
  search?: string;
  clasificacion?: ClasificacionMiel;
  proveedorId?: number;
  floracionId?: number;
  colorId?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type CreateVerificadorResponse = ApiResponse<VerificadorResponse>;
export type VerificadoresListResponse = ApiResponse<VerificadorListResponse[]>;
export type VerificadorDetailResponse = ApiResponse<VerificadorResponse>;

export type LlegadasChoferResponse = ApiResponse<LlegadaChoferResponse[]>;
export type DetalleLlegadaResponse = ApiResponse<DetalleLlegadaParaVerificar>;

export type VerificacionTamborApiResponse = ApiResponse<VerificacionTamborResponse>;
export type FinalizarVerificacionResponse = ApiResponse<ResumenVerificacionSalida>;

export type VerificacionesListResponse = ApiResponse<VerificacionResponse[]>;
export type DetalleVerificacionApiResponse = ApiResponse<DetalleVerificacionResponse>;
export type ResumenVerificacionesApiResponse = ApiResponse<ResumenVerificacionesResponse>;

export type InventarioPlantaApiResponse = ApiResponse<TamborInventarioResponse[]>;
