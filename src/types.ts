// Shared types from common
export type { AccessTicket, ArcaEvent, ServerStatus, SoapCallOptions } from '@ramiidv/arca-common';
import type { ArcaEvent } from '@ramiidv/arca-common';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ArcaFecredConfig {
  /** PEM-encoded X.509 certificate */
  cert: string;
  /** PEM-encoded RSA private key */
  key: string;
  /** CUIT of the entity represented (e.g. "20123456789") */
  cuit: string;
  /** Use production endpoints (default: false = testing / homologacion) */
  production?: boolean;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retries on 5xx / network errors (default: 1) */
  retries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  retryDelayMs?: number;
  /** Optional event callback */
  onEvent?: (event: ArcaEvent) => void;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface WsAuth {
  Token: string;
  Sign: string;
  Cuit: string;
}

// ---------------------------------------------------------------------------
// Monto obligado recepcion
// ---------------------------------------------------------------------------

export interface MontoObligadoResult {
  /** CUIT consultada */
  cuitConsultada: string;
  /** Si la CUIT esta obligada a recibir FCE */
  obligado: boolean;
  /** Monto desde el cual esta obligada (si aplica) */
  montoDesde?: number;
  /** Respuesta cruda del WS */
  raw: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Cuenta corriente
// ---------------------------------------------------------------------------

export interface CtaCte {
  /** Codigo de cuenta corriente */
  codCtaCte: number;
  /** CUIT del emisor */
  cuitEmisor: string;
  /** Denominacion del emisor */
  denominacionEmisor?: string;
  /** CUIT del receptor */
  cuitReceptor: string;
  /** Denominacion del receptor */
  denominacionReceptor?: string;
  /** Tipo de comprobante */
  tipoComprobante?: number;
  /** Punto de venta */
  puntoVenta?: number;
  /** Numero de comprobante */
  nroComprobante?: number;
  /** Codigo de moneda */
  codMoneda?: string;
  /** Importe total */
  importeTotal?: number;
  /** Saldo actual */
  saldo?: number;
  /** Estado de la cuenta corriente */
  estado?: string;
  /** Fecha de emision */
  fechaEmision?: string;
  /** Fecha de vencimiento del pago */
  fechaVencimientoPago?: string;
  /** Fecha de vencimiento de aceptacion */
  fechaVencimientoAceptacion?: string;
  /** CAE del comprobante */
  cae?: string;
  /** Respuesta cruda */
  raw?: Record<string, unknown>;
}

/** Parametros para consultar cuentas corrientes */
export interface ConsultarCtasCtesParams {
  /** Rol: "Emisor" o "Receptor" */
  rol: string;
  /** CUIT del emisor (requerido si rol = "Receptor") */
  cuitEmisor?: string;
  /** CUIT del receptor (requerido si rol = "Emisor") */
  cuitReceptor?: string;
  /** Fecha desde (formato YYYY-MM-DD) */
  fechaDesde: string;
  /** Fecha hasta (formato YYYY-MM-DD) */
  fechaHasta: string;
}

// ---------------------------------------------------------------------------
// Comprobantes FCE
// ---------------------------------------------------------------------------

export interface ComprobanteFecred {
  /** Codigo de cuenta corriente */
  codCtaCte: number;
  /** Tipo de comprobante */
  tipoComprobante?: number;
  /** Punto de venta */
  puntoVenta?: number;
  /** Numero de comprobante */
  nroComprobante?: number;
  /** CUIT del emisor */
  cuitEmisor: string;
  /** Denominacion del emisor */
  denominacionEmisor?: string;
  /** CUIT del receptor */
  cuitReceptor: string;
  /** Denominacion del receptor */
  denominacionReceptor?: string;
  /** Codigo de moneda */
  codMoneda?: string;
  /** Importe total */
  importeTotal?: number;
  /** Importe neto */
  importeNeto?: number;
  /** Saldo */
  saldo?: number;
  /** Estado */
  estado?: string;
  /** Fecha de emision */
  fechaEmision?: string;
  /** Fecha de vencimiento del pago */
  fechaVencimientoPago?: string;
  /** CAE */
  cae?: string;
  /** Retenciones aplicadas */
  retenciones?: RetencionFecred[];
  /** Respuesta cruda */
  raw?: Record<string, unknown>;
}

/** Parametros para consultar comprobantes */
export interface ConsultarComprobantesParams {
  /** CUIT del emisor */
  cuitEmisor?: string;
  /** CUIT del receptor */
  cuitReceptor?: string;
  /** Codigo de cuenta corriente (para consultar un comprobante especifico) */
  codCtaCte?: number;
  /** Fecha desde (formato YYYY-MM-DD) */
  fechaDesde?: string;
  /** Fecha hasta (formato YYYY-MM-DD) */
  fechaHasta?: string;
}

// ---------------------------------------------------------------------------
// Aceptar / Rechazar
// ---------------------------------------------------------------------------

/** Resultado de aceptar una FCE */
export interface AceptarFecredResult {
  /** Codigo de cuenta corriente */
  codCtaCte: number;
  /** Resultado de la operacion */
  resultado: string;
  /** Respuesta cruda del WS */
  raw: Record<string, unknown>;
}

/** Resultado de rechazar una FCE */
export interface RechazarFecredResult {
  /** Codigo de cuenta corriente */
  codCtaCte: number;
  /** Resultado de la operacion */
  resultado: string;
  /** Respuesta cruda del WS */
  raw: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Informar FCE aceptada cancelada
// ---------------------------------------------------------------------------

export interface InformarCanceladaParams {
  /** Codigo de cuenta corriente */
  codCtaCte: number;
  /** Codigo de forma de cancelacion */
  codFormaCancelacion: number;
  /** Observaciones opcionales */
  observaciones?: string;
}

export interface InformarCanceladaResult {
  /** Codigo de cuenta corriente */
  codCtaCte: number;
  /** Resultado de la operacion */
  resultado: string;
  /** Respuesta cruda del WS */
  raw: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Retenciones
// ---------------------------------------------------------------------------

export interface RetencionFecred {
  /** Codigo de tipo de retencion */
  codTipoRetencion: number;
  /** Descripcion del tipo de retencion */
  descTipoRetencion?: string;
  /** Importe de la retencion */
  importeRetencion: number;
  /** Porcentaje de la retencion */
  porcentajeRetencion?: number;
}

// ---------------------------------------------------------------------------
// Tipos de parametros (respuestas de consultas de tipos)
// ---------------------------------------------------------------------------

export interface TipoRetencionItem {
  /** Codigo del tipo de retencion */
  codTipoRetencion: number;
  /** Descripcion */
  descTipoRetencion: string;
}

export interface TipoFormaCancelacionItem {
  /** Codigo de la forma de cancelacion */
  codFormaCancelacion: number;
  /** Descripcion */
  descFormaCancelacion: string;
}

export interface TipoAjusteOperacionItem {
  /** Codigo del tipo de ajuste */
  codTipoAjuste: number;
  /** Descripcion */
  descTipoAjuste: string;
}

export interface TipoMotivoRechazoItem {
  /** Codigo del motivo de rechazo */
  codMotivoRechazo: number;
  /** Descripcion */
  descMotivoRechazo: string;
}

// ---------------------------------------------------------------------------
// Service errors
// ---------------------------------------------------------------------------

export interface WsFecredError {
  Code: number;
  Msg: string;
}
