import { afipSoapCall, checkServiceErrors } from '@ramiidv/arca-common';
import type { ArcaEvent, SoapCallOptions, ServerStatus } from '@ramiidv/arca-common';
import type {
  WsAuth,
} from './types.js';

// ---------------------------------------------------------------------------
// Client config
// ---------------------------------------------------------------------------

export interface FecredClientConfig {
  /** SOAP endpoint URL */
  endpoint: string;
  /** SOAP namespace */
  namespace: string;
  /** SOAP call options (retries, timeout) */
  soapOptions?: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'>;
  /** Optional event callback */
  onEvent?: (event: ArcaEvent) => void;
}

// ---------------------------------------------------------------------------
// FecredClient
// ---------------------------------------------------------------------------

/**
 * Low-level client for the WSFECRED web service.
 * Wraps each SOAP method using afipSoapCall from arca-common.
 */
export class FecredClient {
  protected readonly endpoint: string;
  protected readonly namespace: string;
  protected readonly soapOptions?: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'>;
  protected readonly onEvent?: (event: ArcaEvent) => void;

  constructor(config: FecredClientConfig) {
    this.endpoint = config.endpoint;
    this.namespace = config.namespace;
    this.soapOptions = config.soapOptions;
    this.onEvent = config.onEvent;
  }

  // -------------------------------------------------------------------------
  // Private helper
  // -------------------------------------------------------------------------

  private call(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    return afipSoapCall(
      this.endpoint,
      this.namespace,
      method,
      params,
      { ...this.soapOptions, onEvent: this.onEvent },
    );
  }

  // -------------------------------------------------------------------------
  // Health check
  // -------------------------------------------------------------------------

  /** Health check - verifica el estado de los servidores WSFECRED. */
  async dummy(): Promise<ServerStatus> {
    const result = await this.call('dummy', {});
    return {
      appserver: (result['appserver'] ?? result['AppServer'] ?? '') as string,
      dbserver: (result['dbserver'] ?? result['DbServer'] ?? '') as string,
      authserver: (result['authserver'] ?? result['AuthServer'] ?? '') as string,
    };
  }

  // -------------------------------------------------------------------------
  // Consultas de operaciones
  // -------------------------------------------------------------------------

  /**
   * Consulta si una CUIT esta obligada a recibir FCE.
   * @param auth - Credenciales de autenticacion
   * @param cuitConsultada - CUIT a consultar
   */
  async consultarMontoObligadoRecepcion(
    auth: WsAuth,
    cuitConsultada: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.call('consultarMontoObligadoRecepcion', {
      authRequest: auth,
      cuitConsultada: cuitConsultada,
    });
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }

  /**
   * Consulta cuentas corrientes de actividad FCE.
   * @param auth - Credenciales de autenticacion
   * @param params - Filtros de consulta (rol, CUITs, fechas)
   */
  async consultarCtasCtes(
    auth: WsAuth,
    params: {
      rol: string;
      cuitEmisor?: string;
      cuitReceptor?: string;
      fechaDesde: string;
      fechaHasta: string;
    },
  ): Promise<Record<string, unknown>> {
    const requestParams: Record<string, unknown> = {
      authRequest: auth,
      rol: params.rol,
      fechaDesde: params.fechaDesde,
      fechaHasta: params.fechaHasta,
    };
    if (params.cuitEmisor) requestParams['CUITEmisor'] = params.cuitEmisor;
    if (params.cuitReceptor) requestParams['CUITReceptor'] = params.cuitReceptor;

    const result = await this.call('consultarCtasCtes', requestParams);
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }

  /**
   * Consulta comprobantes FCE por filtros.
   * @param auth - Credenciales de autenticacion
   * @param params - Filtros de consulta
   */
  async consultarComprobantes(
    auth: WsAuth,
    params: {
      cuitEmisor?: string;
      cuitReceptor?: string;
      codCtaCte?: number;
      fechaDesde?: string;
      fechaHasta?: string;
    },
  ): Promise<Record<string, unknown>> {
    const requestParams: Record<string, unknown> = {
      authRequest: auth,
    };
    if (params.cuitEmisor) requestParams['CUITEmisor'] = params.cuitEmisor;
    if (params.cuitReceptor) requestParams['CUITReceptor'] = params.cuitReceptor;
    if (params.codCtaCte !== undefined) requestParams['CodCtaCte'] = params.codCtaCte;
    if (params.fechaDesde) requestParams['fechaDesde'] = params.fechaDesde;
    if (params.fechaHasta) requestParams['fechaHasta'] = params.fechaHasta;

    const result = await this.call('consultarComprobantes', requestParams);
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }

  // -------------------------------------------------------------------------
  // Acciones sobre FCE
  // -------------------------------------------------------------------------

  /**
   * Acepta una FCE.
   * @param auth - Credenciales de autenticacion
   * @param codCtaCte - Codigo de cuenta corriente de la FCE a aceptar
   */
  async aceptarFECred(
    auth: WsAuth,
    codCtaCte: number,
  ): Promise<Record<string, unknown>> {
    const result = await this.call('aceptarFECred', {
      authRequest: auth,
      CodCtaCte: codCtaCte,
    });
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }

  /**
   * Rechaza una FCE.
   * @param auth - Credenciales de autenticacion
   * @param codCtaCte - Codigo de cuenta corriente de la FCE a rechazar
   * @param codMotivoRechazo - Codigo del motivo de rechazo
   */
  async rechazarFECred(
    auth: WsAuth,
    codCtaCte: number,
    codMotivoRechazo: number,
  ): Promise<Record<string, unknown>> {
    const result = await this.call('rechazarFECred', {
      authRequest: auth,
      CodCtaCte: codCtaCte,
      CodMotivoRechazo: codMotivoRechazo,
    });
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }

  /**
   * Informa que una FCE aceptada fue pagada/cancelada.
   * @param auth - Credenciales de autenticacion
   * @param params - Datos de la cancelacion
   */
  async informarFacturaAceptadaCancelada(
    auth: WsAuth,
    params: {
      codCtaCte: number;
      codFormaCancelacion: number;
      observaciones?: string;
    },
  ): Promise<Record<string, unknown>> {
    const requestParams: Record<string, unknown> = {
      authRequest: auth,
      CodCtaCte: params.codCtaCte,
      CodFormaCancelacion: params.codFormaCancelacion,
    };
    if (params.observaciones) {
      requestParams['observaciones'] = params.observaciones;
    }

    const result = await this.call('informarFacturaAceptadaCancelada', requestParams);
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }

  // -------------------------------------------------------------------------
  // Consultas de parametros
  // -------------------------------------------------------------------------

  /**
   * Consulta los tipos de retenciones disponibles.
   * @param auth - Credenciales de autenticacion
   */
  async consultarTiposRetenciones(
    auth: WsAuth,
  ): Promise<Record<string, unknown>> {
    const result = await this.call('consultarTiposRetenciones', {
      authRequest: auth,
    });
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }

  /**
   * Consulta las formas de cancelacion disponibles.
   * @param auth - Credenciales de autenticacion
   */
  async consultarTiposFormasCancelacion(
    auth: WsAuth,
  ): Promise<Record<string, unknown>> {
    const result = await this.call('consultarTiposFormasCancelacion', {
      authRequest: auth,
    });
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }

  /**
   * Consulta los tipos de ajustes de operacion disponibles.
   * @param auth - Credenciales de autenticacion
   */
  async consultarTiposAjustesOperacion(
    auth: WsAuth,
  ): Promise<Record<string, unknown>> {
    const result = await this.call('consultarTiposAjustesOperacion', {
      authRequest: auth,
    });
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }

  /**
   * Consulta los tipos de motivos de rechazo disponibles.
   * @param auth - Credenciales de autenticacion
   */
  async consultarTiposMotivoRechazo(
    auth: WsAuth,
  ): Promise<Record<string, unknown>> {
    const result = await this.call('consultarTiposMotivoRechazo', {
      authRequest: auth,
    });
    checkServiceErrors(result as Record<string, unknown>, 'WSFECRED');
    return result;
  }
}
