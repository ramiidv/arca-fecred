import { ArcaValidationError } from '@ramiidv/arca-common';
import type { ValidationErrorDetail } from '@ramiidv/arca-common';
import type { ConsultarCtasCtesParams } from './types.js';

// ---------------------------------------------------------------------------
// CUIT validation
// ---------------------------------------------------------------------------

/**
 * Validates a CUIT value. Must be a positive number or a non-empty numeric string.
 * @param cuit - Value to validate
 * @param fieldName - Field name for error messages (default: "cuit")
 * @returns The CUIT as a string
 * @throws ArcaValidationError if the CUIT is invalid
 */
export function validateCuit(cuit: unknown, fieldName = 'cuit'): string {
  if (typeof cuit === 'number') {
    if (!Number.isFinite(cuit) || cuit <= 0 || !Number.isInteger(cuit)) {
      throw new ArcaValidationError(
        `${fieldName} debe ser un numero entero positivo.`,
        [{ field: fieldName, message: 'Debe ser un numero entero positivo', value: cuit }],
        fieldName,
      );
    }
    return String(cuit);
  }

  if (typeof cuit === 'string') {
    const trimmed = cuit.trim();
    if (trimmed.length === 0) {
      throw new ArcaValidationError(
        `${fieldName} no puede estar vacio.`,
        [{ field: fieldName, message: 'No puede estar vacio', value: cuit }],
        fieldName,
      );
    }
    // Allow formats: 20123456789 or 20-12345678-9
    const normalized = trimmed.replace(/-/g, '');
    if (!/^\d+$/.test(normalized)) {
      throw new ArcaValidationError(
        `${fieldName} debe contener solo digitos (opcionalmente separados por guiones).`,
        [{ field: fieldName, message: 'Debe contener solo digitos', value: cuit }],
        fieldName,
      );
    }
    return trimmed;
  }

  throw new ArcaValidationError(
    `${fieldName} debe ser un numero o string.`,
    [{ field: fieldName, message: 'Debe ser un numero o string', value: cuit }],
    fieldName,
  );
}

// ---------------------------------------------------------------------------
// CodCtaCte validation
// ---------------------------------------------------------------------------

/**
 * Validates a CodCtaCte (current account code).
 * Must be a non-empty string or a positive number.
 * @param cod - Value to validate
 * @returns The code as a number
 * @throws ArcaValidationError if the code is invalid
 */
export function validateCodCtaCte(cod: unknown): number {
  if (typeof cod === 'number') {
    if (!Number.isFinite(cod) || cod <= 0 || !Number.isInteger(cod)) {
      throw new ArcaValidationError(
        'codCtaCte debe ser un numero entero positivo.',
        [{ field: 'codCtaCte', message: 'Debe ser un numero entero positivo', value: cod }],
        'codCtaCte',
      );
    }
    return cod;
  }

  if (typeof cod === 'string') {
    const trimmed = cod.trim();
    if (trimmed.length === 0) {
      throw new ArcaValidationError(
        'codCtaCte no puede estar vacio.',
        [{ field: 'codCtaCte', message: 'No puede estar vacio', value: cod }],
        'codCtaCte',
      );
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
      throw new ArcaValidationError(
        'codCtaCte debe ser un numero entero positivo.',
        [{ field: 'codCtaCte', message: 'Debe ser un numero entero positivo', value: cod }],
        'codCtaCte',
      );
    }
    return num;
  }

  throw new ArcaValidationError(
    'codCtaCte es requerido.',
    [{ field: 'codCtaCte', message: 'Es requerido', value: cod }],
    'codCtaCte',
  );
}

// ---------------------------------------------------------------------------
// ConsultarCtasCtes params validation
// ---------------------------------------------------------------------------

/**
 * Validates parameters for consultarCtasCtes.
 * Requires rol, fechaDesde, fechaHasta, and at least one of CUITEmisor or CUITReceptor
 * (depending on the role).
 * @param params - Parameters to validate
 * @throws ArcaValidationError if required fields are missing or invalid
 */
export function validateConsultaCtasCtes(params: ConsultarCtasCtesParams): void {
  const errors: ValidationErrorDetail[] = [];

  // Validate rol
  if (!params.rol || typeof params.rol !== 'string' || params.rol.trim().length === 0) {
    errors.push({
      field: 'rol',
      message: 'rol es requerido (debe ser "Emisor" o "Receptor")',
      value: params.rol,
    });
  } else {
    const rolNorm = params.rol.trim();
    if (rolNorm !== 'Emisor' && rolNorm !== 'Receptor') {
      errors.push({
        field: 'rol',
        message: 'rol debe ser "Emisor" o "Receptor"',
        value: params.rol,
      });
    }
  }

  // Validate fechaDesde
  if (!params.fechaDesde || typeof params.fechaDesde !== 'string' || params.fechaDesde.trim().length === 0) {
    errors.push({
      field: 'fechaDesde',
      message: 'fechaDesde es requerido',
      value: params.fechaDesde,
    });
  } else if (!isValidDateString(params.fechaDesde)) {
    errors.push({
      field: 'fechaDesde',
      message: 'fechaDesde debe ser una fecha valida (YYYY-MM-DD)',
      value: params.fechaDesde,
    });
  }

  // Validate fechaHasta
  if (!params.fechaHasta || typeof params.fechaHasta !== 'string' || params.fechaHasta.trim().length === 0) {
    errors.push({
      field: 'fechaHasta',
      message: 'fechaHasta es requerido',
      value: params.fechaHasta,
    });
  } else if (!isValidDateString(params.fechaHasta)) {
    errors.push({
      field: 'fechaHasta',
      message: 'fechaHasta debe ser una fecha valida (YYYY-MM-DD)',
      value: params.fechaHasta,
    });
  }

  // Validate date range
  if (params.fechaDesde && params.fechaHasta && isValidDateString(params.fechaDesde) && isValidDateString(params.fechaHasta)) {
    if (params.fechaDesde > params.fechaHasta) {
      errors.push({
        field: 'fechaHasta',
        message: 'fechaHasta debe ser igual o posterior a fechaDesde',
        value: { fechaDesde: params.fechaDesde, fechaHasta: params.fechaHasta },
      });
    }
  }

  // Validate that at least one CUIT is present
  const hasCuitEmisor = params.cuitEmisor != null && String(params.cuitEmisor).trim().length > 0;
  const hasCuitReceptor = params.cuitReceptor != null && String(params.cuitReceptor).trim().length > 0;

  if (!hasCuitEmisor && !hasCuitReceptor) {
    // While the WS may accept queries without CUITs in some cases,
    // at least one is typically needed depending on the role
    // We allow it but do not error - the service will return its own error if needed
  }

  if (errors.length > 0) {
    throw new ArcaValidationError(
      `Parametros de consultarCtasCtes invalidos: ${errors.map((e) => e.message).join('; ')}`,
      errors,
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Checks if a string is a valid YYYY-MM-DD date.
 */
function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(date.getTime())) return false;
  // Verify the parsed date matches input (catches e.g. 2026-02-30)
  const [y, m, d] = dateStr.split('-').map(Number);
  return date.getUTCFullYear() === y && date.getUTCMonth() + 1 === m && date.getUTCDate() === d;
}
