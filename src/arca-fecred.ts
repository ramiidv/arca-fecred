import { WsaaClient, ensureArray } from '@ramiidv/arca-common';
import type { ArcaEvent, SoapCallOptions, ServerStatus } from '@ramiidv/arca-common';
import { ENDPOINTS } from './constants.js';
import { FecredClient } from './fecred-client.js';
import { validateCuit, validateCodCtaCte, validateConsultaCtasCtes } from './validation.js';
import type {
  ArcaFecredConfig,
  WsAuth,
  MontoObligadoResult,
  CtaCte,
  ComprobanteFecred,
  ConsultarCtasCtesParams,
  ConsultarComprobantesParams,
  AceptarFecredResult,
  RechazarFecredResult,
  InformarCanceladaParams,
  InformarCanceladaResult,
  TipoRetencionItem,
  TipoFormaCancelacionItem,
  TipoAjusteOperacionItem,
  TipoMotivoRechazoItem,
} from './types.js';

/**
 * Main orchestrator class for ARCA WSFECRED (Factura de Credito Electronica MiPyME).
 *
 * Provides high-level methods that handle WSAA authentication automatically
 * and expose results from the WSFECRED web service for managing FCE
 * (Electronic Credit Invoices) under Law 27440.
 *
 * @example
 * ```ts
 * import { ArcaFecred } from '@ramiidv/arca-fecred';
 * import { readFileSync } from 'fs';
 *
 * const fecred = new ArcaFecred({
 *   cert: readFileSync('cert.pem', 'utf-8'),
 *   key: readFileSync('key.pem', 'utf-8'),
 *   cuit: '20123456789',
 *   production: false,
 * });
 *
 * // Check if a CUIT is obligated to receive FCE
 * const obligado = await fecred.consultarMontoObligadoRecepcion('30712345678');
 * console.log(obligado.obligado); // true/false
 *
 * // Query current accounts
 * const cuentas = await fecred.consultarCtasCtes({
 *   rol: 'Receptor',
 *   fechaDesde: '2026-01-01',
 *   fechaHasta: '2026-03-31',
 * });
 * ```
 */
export class ArcaFecred {
  /** Low-level WSAA client for direct access */
  public readonly wsaa: WsaaClient;
  /** Low-level WSFECRED client for direct access */
  public readonly fecred: FecredClient;

  private readonly cuit: string;
  private readonly onEvent?: (event: ArcaEvent) => void;

  constructor(config: ArcaFecredConfig) {
    const isProduction = config.production ?? false;
    const env = isProduction ? 'production' : 'testing';
    this.cuit = config.cuit;
    this.onEvent = config.onEvent;

    const soapOptions: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'> = {
      timeout: config.timeout,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
    };

    this.wsaa = new WsaaClient({
      cert: config.cert,
      key: config.key,
      production: isProduction,
      timeout: config.timeout,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
      onEvent: config.onEvent,
    });

    this.fecred = new FecredClient({
      endpoint: ENDPOINTS.wsfecred[env],
      namespace: ENDPOINTS.wsfecred.namespace,
      soapOptions,
      onEvent: config.onEvent,
    });
  }

  // =========================================================================
  // Health check
  // =========================================================================

  /**
   * Health check for the WSFECRED service.
   * Does not require authentication.
   */
  async status(): Promise<ServerStatus> {
    return this.fecred.dummy();
  }

  // =========================================================================
  // Consultas de operaciones
  // =========================================================================

  /**
   * Check if a CUIT is obligated to receive FCE (Factura de Credito Electronica).
   * Authenticates automatically via WSAA.
   *
   * @param cuitConsultada - CUIT to check
   * @returns Result indicating if the CUIT is obligated and the threshold amount
   */
  async consultarMontoObligadoRecepcion(cuitConsultada: string): Promise<MontoObligadoResult> {
    validateCuit(cuitConsultada, 'cuitConsultada');
    const auth = await this.getAuth();
    const result = await this.fecred.consultarMontoObligadoRecepcion(auth, cuitConsultada);

    return {
      cuitConsultada,
      obligado: (result['obligado'] ?? result['Obligado'] ?? false) as boolean,
      montoDesde: result['montoDesde'] != null
        ? Number(result['montoDesde'] ?? result['MontoDesde'])
        : undefined,
      raw: result,
    };
  }

  /**
   * Query current accounts from FCE activity.
   * Authenticates automatically via WSAA.
   *
   * @param params - Query filters (role, CUITs, date range)
   * @returns Array of current account records
   */
  async consultarCtasCtes(params: ConsultarCtasCtesParams): Promise<CtaCte[]> {
    validateConsultaCtasCtes(params);
    const auth = await this.getAuth();
    const result = await this.fecred.consultarCtasCtes(auth, {
      rol: params.rol,
      cuitEmisor: params.cuitEmisor,
      cuitReceptor: params.cuitReceptor,
      fechaDesde: params.fechaDesde,
      fechaHasta: params.fechaHasta,
    });

    const ctasCtes = result['arrayCtasCtes'] ?? result['CtasCtes'] ?? result['ctasCtes'];
    if (!ctasCtes) return [];

    const ctasCtesObj = ctasCtes as Record<string, unknown>;
    const items = ensureArray(
      ctasCtesObj['CtaCte'] ?? ctasCtesObj['ctaCte'] ?? ctasCtesObj,
    );

    return items.map((item) => this.parseCtaCte(item as Record<string, unknown>));
  }

  /**
   * Search FCE invoices by filters.
   * Authenticates automatically via WSAA.
   *
   * @param params - Query filters
   * @returns Array of FCE invoice records
   */
  async consultarComprobantes(params: ConsultarComprobantesParams): Promise<ComprobanteFecred[]> {
    const auth = await this.getAuth();
    const result = await this.fecred.consultarComprobantes(auth, {
      cuitEmisor: params.cuitEmisor,
      cuitReceptor: params.cuitReceptor,
      codCtaCte: params.codCtaCte,
      fechaDesde: params.fechaDesde,
      fechaHasta: params.fechaHasta,
    });

    const comprobantes = result['arrayComprobantes'] ?? result['Comprobantes'] ?? result['comprobantes'];
    if (!comprobantes) return [];

    const compObj = comprobantes as Record<string, unknown>;
    const items = ensureArray(
      compObj['Comprobante'] ?? compObj['comprobante'] ?? compObj,
    );

    return items.map((item) => this.parseComprobante(item as Record<string, unknown>));
  }

  // =========================================================================
  // Acciones sobre FCE
  // =========================================================================

  /**
   * Accept an FCE (Factura de Credito Electronica).
   * Authenticates automatically via WSAA.
   *
   * @param codCtaCte - Current account code of the FCE to accept
   * @returns Result of the acceptance operation
   */
  async aceptarFECred(codCtaCte: number): Promise<AceptarFecredResult> {
    validateCodCtaCte(codCtaCte);
    const auth = await this.getAuth();
    const result = await this.fecred.aceptarFECred(auth, codCtaCte);

    return {
      codCtaCte,
      resultado: (result['resultado'] ?? result['Resultado'] ?? '') as string,
      raw: result,
    };
  }

  /**
   * Reject an FCE (Factura de Credito Electronica).
   * Authenticates automatically via WSAA.
   *
   * @param codCtaCte - Current account code of the FCE to reject
   * @param codMotivoRechazo - Rejection reason code (use MotivoRechazo enum)
   * @returns Result of the rejection operation
   */
  async rechazarFECred(codCtaCte: number, codMotivoRechazo: number): Promise<RechazarFecredResult> {
    validateCodCtaCte(codCtaCte);
    const auth = await this.getAuth();
    const result = await this.fecred.rechazarFECred(auth, codCtaCte, codMotivoRechazo);

    return {
      codCtaCte,
      resultado: (result['resultado'] ?? result['Resultado'] ?? '') as string,
      raw: result,
    };
  }

  /**
   * Inform that an accepted FCE was paid/cancelled.
   * Authenticates automatically via WSAA.
   *
   * @param params - Cancellation details (account code, payment method, optional observations)
   * @returns Result of the cancellation notification
   */
  async informarFacturaAceptadaCancelada(params: InformarCanceladaParams): Promise<InformarCanceladaResult> {
    validateCodCtaCte(params.codCtaCte);
    const auth = await this.getAuth();
    const result = await this.fecred.informarFacturaAceptadaCancelada(auth, {
      codCtaCte: params.codCtaCte,
      codFormaCancelacion: params.codFormaCancelacion,
      observaciones: params.observaciones,
    });

    return {
      codCtaCte: params.codCtaCte,
      resultado: (result['resultado'] ?? result['Resultado'] ?? '') as string,
      raw: result,
    };
  }

  // =========================================================================
  // Consultas de parametros
  // =========================================================================

  /**
   * Query available retention types.
   * Authenticates automatically via WSAA.
   */
  async consultarTiposRetenciones(): Promise<TipoRetencionItem[]> {
    const auth = await this.getAuth();
    const result = await this.fecred.consultarTiposRetenciones(auth);
    return this.parseParamArray<TipoRetencionItem>(
      result,
      ['arrayTiposRetenciones', 'TiposRetenciones', 'tiposRetenciones'],
      ['TipoRetencion', 'tipoRetencion'],
      (item) => ({
        codTipoRetencion: Number(item['codTipoRetencion'] ?? item['CodTipoRetencion'] ?? 0),
        descTipoRetencion: (item['descTipoRetencion'] ?? item['DescTipoRetencion'] ?? '') as string,
      }),
    );
  }

  /**
   * Query available payment method types for cancelling accepted FCE.
   * Authenticates automatically via WSAA.
   */
  async consultarTiposFormasCancelacion(): Promise<TipoFormaCancelacionItem[]> {
    const auth = await this.getAuth();
    const result = await this.fecred.consultarTiposFormasCancelacion(auth);
    return this.parseParamArray<TipoFormaCancelacionItem>(
      result,
      ['arrayTiposFormasCancelacion', 'TiposFormasCancelacion', 'tiposFormasCancelacion'],
      ['TipoFormaCancelacion', 'tipoFormaCancelacion'],
      (item) => ({
        codFormaCancelacion: Number(item['codFormaCancelacion'] ?? item['CodFormaCancelacion'] ?? 0),
        descFormaCancelacion: (item['descFormaCancelacion'] ?? item['DescFormaCancelacion'] ?? '') as string,
      }),
    );
  }

  /**
   * Query available operation adjustment types.
   * Authenticates automatically via WSAA.
   */
  async consultarTiposAjustesOperacion(): Promise<TipoAjusteOperacionItem[]> {
    const auth = await this.getAuth();
    const result = await this.fecred.consultarTiposAjustesOperacion(auth);
    return this.parseParamArray<TipoAjusteOperacionItem>(
      result,
      ['arrayTiposAjustesOperacion', 'TiposAjustesOperacion', 'tiposAjustesOperacion'],
      ['TipoAjusteOperacion', 'tipoAjusteOperacion'],
      (item) => ({
        codTipoAjuste: Number(item['codTipoAjuste'] ?? item['CodTipoAjuste'] ?? 0),
        descTipoAjuste: (item['descTipoAjuste'] ?? item['DescTipoAjuste'] ?? '') as string,
      }),
    );
  }

  /**
   * Query available rejection reason types.
   * Authenticates automatically via WSAA.
   */
  async consultarTiposMotivoRechazo(): Promise<TipoMotivoRechazoItem[]> {
    const auth = await this.getAuth();
    const result = await this.fecred.consultarTiposMotivoRechazo(auth);
    return this.parseParamArray<TipoMotivoRechazoItem>(
      result,
      ['arrayTiposMotivoRechazo', 'TiposMotivoRechazo', 'tiposMotivoRechazo'],
      ['TipoMotivoRechazo', 'tipoMotivoRechazo'],
      (item) => ({
        codMotivoRechazo: Number(item['codMotivoRechazo'] ?? item['CodMotivoRechazo'] ?? 0),
        descMotivoRechazo: (item['descMotivoRechazo'] ?? item['DescMotivoRechazo'] ?? '') as string,
      }),
    );
  }

  // =========================================================================
  // Cache management
  // =========================================================================

  /** Invalidate the cached WSAA access ticket for WSFECRED. */
  clearAuthCache(): void {
    this.wsaa.clearTicket(ENDPOINTS.wsfecred.serviceId);
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private async getAuth(): Promise<WsAuth> {
    const ticket = await this.wsaa.getAccessTicket(ENDPOINTS.wsfecred.serviceId);
    return {
      Token: ticket.token,
      Sign: ticket.sign,
      Cuit: this.cuit,
    };
  }

  private parseCtaCte(item: Record<string, unknown>): CtaCte {
    return {
      codCtaCte: Number(item['codCtaCte'] ?? item['CodCtaCte'] ?? 0),
      cuitEmisor: String(item['cuitEmisor'] ?? item['CUITEmisor'] ?? item['CuitEmisor'] ?? ''),
      denominacionEmisor: (item['denominacionEmisor'] ?? item['DenominacionEmisor']) as string | undefined,
      cuitReceptor: String(item['cuitReceptor'] ?? item['CUITReceptor'] ?? item['CuitReceptor'] ?? ''),
      denominacionReceptor: (item['denominacionReceptor'] ?? item['DenominacionReceptor']) as string | undefined,
      tipoComprobante: item['tipoComprobante'] != null ? Number(item['tipoComprobante'] ?? item['TipoComprobante']) : undefined,
      puntoVenta: item['puntoVenta'] != null ? Number(item['puntoVenta'] ?? item['PuntoVenta']) : undefined,
      nroComprobante: item['nroComprobante'] != null ? Number(item['nroComprobante'] ?? item['NroComprobante']) : undefined,
      codMoneda: (item['codMoneda'] ?? item['CodMoneda']) as string | undefined,
      importeTotal: item['importeTotal'] != null ? Number(item['importeTotal'] ?? item['ImporteTotal']) : undefined,
      saldo: item['saldo'] != null ? Number(item['saldo'] ?? item['Saldo']) : undefined,
      estado: (item['estado'] ?? item['Estado']) as string | undefined,
      fechaEmision: (item['fechaEmision'] ?? item['FechaEmision']) as string | undefined,
      fechaVencimientoPago: (item['fechaVencimientoPago'] ?? item['FechaVencimientoPago']) as string | undefined,
      fechaVencimientoAceptacion: (item['fechaVencimientoAceptacion'] ?? item['FechaVencimientoAceptacion']) as string | undefined,
      cae: (item['cae'] ?? item['CAE']) as string | undefined,
      raw: item,
    };
  }

  private parseComprobante(item: Record<string, unknown>): ComprobanteFecred {
    const retenciones = item['retenciones'] ?? item['Retenciones'];
    let parsedRetenciones: ComprobanteFecred['retenciones'] | undefined;

    if (retenciones) {
      const retObj = retenciones as Record<string, unknown>;
      const retItems = ensureArray(
        retObj['Retencion'] ?? retObj['retencion'] ?? retObj,
      );
      parsedRetenciones = retItems.map((r) => {
        const ret = r as Record<string, unknown>;
        return {
          codTipoRetencion: Number(ret['codTipoRetencion'] ?? ret['CodTipoRetencion'] ?? 0),
          descTipoRetencion: (ret['descTipoRetencion'] ?? ret['DescTipoRetencion']) as string | undefined,
          importeRetencion: Number(ret['importeRetencion'] ?? ret['ImporteRetencion'] ?? 0),
          porcentajeRetencion: ret['porcentajeRetencion'] != null
            ? Number(ret['porcentajeRetencion'] ?? ret['PorcentajeRetencion'])
            : undefined,
        };
      });
    }

    return {
      codCtaCte: Number(item['codCtaCte'] ?? item['CodCtaCte'] ?? 0),
      tipoComprobante: item['tipoComprobante'] != null ? Number(item['tipoComprobante'] ?? item['TipoComprobante']) : undefined,
      puntoVenta: item['puntoVenta'] != null ? Number(item['puntoVenta'] ?? item['PuntoVenta']) : undefined,
      nroComprobante: item['nroComprobante'] != null ? Number(item['nroComprobante'] ?? item['NroComprobante']) : undefined,
      cuitEmisor: String(item['cuitEmisor'] ?? item['CUITEmisor'] ?? item['CuitEmisor'] ?? ''),
      denominacionEmisor: (item['denominacionEmisor'] ?? item['DenominacionEmisor']) as string | undefined,
      cuitReceptor: String(item['cuitReceptor'] ?? item['CUITReceptor'] ?? item['CuitReceptor'] ?? ''),
      denominacionReceptor: (item['denominacionReceptor'] ?? item['DenominacionReceptor']) as string | undefined,
      codMoneda: (item['codMoneda'] ?? item['CodMoneda']) as string | undefined,
      importeTotal: item['importeTotal'] != null ? Number(item['importeTotal'] ?? item['ImporteTotal']) : undefined,
      importeNeto: item['importeNeto'] != null ? Number(item['importeNeto'] ?? item['ImporteNeto']) : undefined,
      saldo: item['saldo'] != null ? Number(item['saldo'] ?? item['Saldo']) : undefined,
      estado: (item['estado'] ?? item['Estado']) as string | undefined,
      fechaEmision: (item['fechaEmision'] ?? item['FechaEmision']) as string | undefined,
      fechaVencimientoPago: (item['fechaVencimientoPago'] ?? item['FechaVencimientoPago']) as string | undefined,
      cae: (item['cae'] ?? item['CAE']) as string | undefined,
      retenciones: parsedRetenciones,
      raw: item,
    };
  }

  /**
   * Generic parser for parameter arrays from WSFECRED responses.
   * Handles varying SOAP response structures (different key names, namespaces).
   */
  private parseParamArray<T>(
    result: Record<string, unknown>,
    containerKeys: string[],
    itemKeys: string[],
    mapper: (item: Record<string, unknown>) => T,
  ): T[] {
    let container: unknown;
    for (const key of containerKeys) {
      if (result[key] !== undefined) {
        container = result[key];
        break;
      }
    }
    if (!container) return [];

    const containerObj = container as Record<string, unknown>;
    let items: unknown[] = [];
    for (const key of itemKeys) {
      if (containerObj[key] !== undefined) {
        items = ensureArray(containerObj[key]);
        break;
      }
    }
    if (items.length === 0) {
      items = ensureArray(containerObj);
    }

    return items.map((item) => mapper(item as Record<string, unknown>));
  }
}
