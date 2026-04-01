// Main class
export { ArcaFecred } from './arca-fecred.js';

// Low-level client
export { FecredClient } from './fecred-client.js';
export type { FecredClientConfig } from './fecred-client.js';

// Error classes (from common)
export {
  ArcaError,
  ArcaAuthError,
  ArcaSoapError,
  ArcaServiceError,
} from '@ramiidv/arca-common';

// WSAA client (from common)
export { WsaaClient } from '@ramiidv/arca-common';
export type { WsaaClientConfig } from '@ramiidv/arca-common';

// Types
export type {
  ArcaFecredConfig,
  WsAuth,
  AccessTicket,
  ArcaEvent,
  ServerStatus,
  SoapCallOptions,
  MontoObligadoResult,
  CtaCte,
  ComprobanteFecred,
  ConsultarCtasCtesParams,
  ConsultarComprobantesParams,
  AceptarFecredResult,
  RechazarFecredResult,
  InformarCanceladaParams,
  InformarCanceladaResult,
  RetencionFecred,
  TipoRetencionItem,
  TipoFormaCancelacionItem,
  TipoAjusteOperacionItem,
  TipoMotivoRechazoItem,
  WsFecredError,
} from './types.js';

// Constants and enums
export {
  ENDPOINTS,
  RolCtaCte,
  EstadoCtaCte,
  MotivoRechazo,
  FormaCancelacion,
  TipoAjusteOperacion,
  TipoRetencion,
} from './constants.js';

// Validation
export {
  validateCuit,
  validateCodCtaCte,
  validateConsultaCtasCtes,
} from './validation.js';
export { ArcaValidationError } from '@ramiidv/arca-common';
export type { ValidationErrorDetail } from '@ramiidv/arca-common';

// Utilities (from common)
export {
  ensureArray,
  parseXml,
  buildXml,
  checkServiceErrors,
} from '@ramiidv/arca-common';
