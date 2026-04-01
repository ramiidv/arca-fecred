import { WSAA_ENDPOINTS } from '@ramiidv/arca-common';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const ENDPOINTS = {
  wsaa: WSAA_ENDPOINTS,
  wsfecred: {
    testing: 'https://fwshomo.afip.gob.ar/wsfecred/FECredService',
    production: 'https://serviciosjava.afip.gob.ar/wsfecred/FECredService',
    namespace: 'https://serviciosjava.afip.gob.ar/wsfecred/FECredService?wsdl',
    serviceId: 'wsfecred',
  },
} as const;

// ---------------------------------------------------------------------------
// Roles en la cuenta corriente
// ---------------------------------------------------------------------------

/** Rol del contribuyente en la cuenta corriente FCE */
export enum RolCtaCte {
  /** Emisor de la FCE */
  EMISOR = 'Emisor',
  /** Receptor de la FCE */
  RECEPTOR = 'Receptor',
}

// ---------------------------------------------------------------------------
// Estados de la cuenta corriente
// ---------------------------------------------------------------------------

/** Estado de la cuenta corriente FCE */
export enum EstadoCtaCte {
  /** Factura emitida, pendiente de aceptacion/rechazo */
  PENDIENTE_ACEPTACION = 'Pendiente de Aceptacion',
  /** Factura aceptada */
  ACEPTADA = 'Aceptada',
  /** Factura rechazada */
  RECHAZADA = 'Rechazada',
  /** Factura cancelada (pagada) */
  CANCELADA = 'Cancelada',
  /** Factura anulada */
  ANULADA = 'Anulada',
}

// ---------------------------------------------------------------------------
// Motivos de rechazo
// ---------------------------------------------------------------------------

/** Codigos de motivo de rechazo para FCE */
export enum MotivoRechazo {
  /** Nota de credito / debito */
  NOTA_CREDITO_DEBITO = 1,
  /** El CUIT informado no es correcto */
  CUIT_INCORRECTO = 2,
  /** La fecha informada no es correcta */
  FECHA_INCORRECTA = 3,
  /** El CBU informado no es correcto */
  CBU_INCORRECTO = 4,
  /** Otros motivos */
  OTROS = 5,
}

// ---------------------------------------------------------------------------
// Formas de cancelacion
// ---------------------------------------------------------------------------

/** Formas de cancelacion de una FCE aceptada */
export enum FormaCancelacion {
  /** Acreditacion en cuenta bancaria */
  ACREDITACION_CUENTA = 1,
  /** Transferencia bancaria */
  TRANSFERENCIA = 2,
  /** Cheque */
  CHEQUE = 3,
  /** Pago electronico */
  PAGO_ELECTRONICO = 4,
  /** Compensacion */
  COMPENSACION = 5,
  /** Endoso */
  ENDOSO = 6,
  /** Otro */
  OTRO = 99,
}

// ---------------------------------------------------------------------------
// Tipos de ajuste de operacion
// ---------------------------------------------------------------------------

/** Tipos de ajuste de operacion FCE */
export enum TipoAjusteOperacion {
  /** Nota de credito */
  NOTA_CREDITO = 1,
  /** Nota de debito */
  NOTA_DEBITO = 2,
}

// ---------------------------------------------------------------------------
// Tipos de retencion
// ---------------------------------------------------------------------------

/** Tipos de retencion comunes en FCE */
export enum TipoRetencion {
  /** Ganancias */
  GANANCIAS = 1,
  /** IVA */
  IVA = 2,
  /** SUSS */
  SUSS = 3,
  /** Ingresos Brutos */
  INGRESOS_BRUTOS = 4,
  /** Otras */
  OTRAS = 99,
}
