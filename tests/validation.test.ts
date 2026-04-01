import { describe, it, expect } from 'vitest';
import { validateCuit, validateCodCtaCte, validateConsultaCtasCtes } from '../src/validation.js';

// ---------------------------------------------------------------------------
// validateCuit
// ---------------------------------------------------------------------------

describe('validateCuit', () => {
  it('accepts a valid CUIT string', () => {
    expect(validateCuit('20123456789')).toBe('20123456789');
  });

  it('accepts a CUIT string with hyphens', () => {
    expect(validateCuit('20-12345678-9')).toBe('20-12345678-9');
  });

  it('accepts a positive integer number', () => {
    expect(validateCuit(20123456789)).toBe('20123456789');
  });

  it('throws on empty string', () => {
    expect(() => validateCuit('')).toThrow('vacio');
  });

  it('throws on whitespace-only string', () => {
    expect(() => validateCuit('   ')).toThrow('vacio');
  });

  it('throws on non-numeric string', () => {
    expect(() => validateCuit('abc')).toThrow('digitos');
  });

  it('throws on negative number', () => {
    expect(() => validateCuit(-1)).toThrow('positivo');
  });

  it('throws on zero', () => {
    expect(() => validateCuit(0)).toThrow('positivo');
  });

  it('throws on float', () => {
    expect(() => validateCuit(20.5)).toThrow('positivo');
  });

  it('throws on null/undefined', () => {
    expect(() => validateCuit(null)).toThrow('numero o string');
    expect(() => validateCuit(undefined)).toThrow('numero o string');
  });

  it('uses custom field name in error', () => {
    expect(() => validateCuit('', 'cuitEmisor')).toThrow('cuitEmisor');
  });
});

// ---------------------------------------------------------------------------
// validateCodCtaCte
// ---------------------------------------------------------------------------

describe('validateCodCtaCte', () => {
  it('accepts a positive integer', () => {
    expect(validateCodCtaCte(12345)).toBe(12345);
  });

  it('accepts a numeric string', () => {
    expect(validateCodCtaCte('99999')).toBe(99999);
  });

  it('throws on empty string', () => {
    expect(() => validateCodCtaCte('')).toThrow('vacio');
  });

  it('throws on zero', () => {
    expect(() => validateCodCtaCte(0)).toThrow('positivo');
  });

  it('throws on negative number', () => {
    expect(() => validateCodCtaCte(-5)).toThrow('positivo');
  });

  it('throws on non-numeric string', () => {
    expect(() => validateCodCtaCte('abc')).toThrow('positivo');
  });

  it('throws on null', () => {
    expect(() => validateCodCtaCte(null)).toThrow('requerido');
  });

  it('throws on undefined', () => {
    expect(() => validateCodCtaCte(undefined)).toThrow('requerido');
  });
});

// ---------------------------------------------------------------------------
// validateConsultaCtasCtes
// ---------------------------------------------------------------------------

describe('validateConsultaCtasCtes', () => {
  const validParams = {
    rol: 'Receptor',
    fechaDesde: '2026-01-01',
    fechaHasta: '2026-03-31',
  };

  it('accepts valid params', () => {
    expect(() => validateConsultaCtasCtes(validParams)).not.toThrow();
  });

  it('accepts valid params with CUITs', () => {
    expect(() =>
      validateConsultaCtasCtes({
        ...validParams,
        cuitEmisor: '30712345678',
      }),
    ).not.toThrow();
  });

  it('accepts Emisor role', () => {
    expect(() =>
      validateConsultaCtasCtes({ ...validParams, rol: 'Emisor' }),
    ).not.toThrow();
  });

  it('throws on missing rol', () => {
    expect(() =>
      validateConsultaCtasCtes({ ...validParams, rol: '' }),
    ).toThrow('rol');
  });

  it('throws on invalid rol', () => {
    expect(() =>
      validateConsultaCtasCtes({ ...validParams, rol: 'Invalido' }),
    ).toThrow('rol');
  });

  it('throws on missing fechaDesde', () => {
    expect(() =>
      validateConsultaCtasCtes({ ...validParams, fechaDesde: '' }),
    ).toThrow('fechaDesde');
  });

  it('throws on invalid fechaDesde format', () => {
    expect(() =>
      validateConsultaCtasCtes({ ...validParams, fechaDesde: '2026/01/01' }),
    ).toThrow('fechaDesde');
  });

  it('throws on missing fechaHasta', () => {
    expect(() =>
      validateConsultaCtasCtes({ ...validParams, fechaHasta: '' }),
    ).toThrow('fechaHasta');
  });

  it('throws on invalid date (Feb 30)', () => {
    expect(() =>
      validateConsultaCtasCtes({ ...validParams, fechaDesde: '2026-02-30' }),
    ).toThrow('fechaDesde');
  });

  it('throws when fechaHasta is before fechaDesde', () => {
    expect(() =>
      validateConsultaCtasCtes({
        ...validParams,
        fechaDesde: '2026-03-31',
        fechaHasta: '2026-01-01',
      }),
    ).toThrow('fechaHasta');
  });

  it('accepts same fechaDesde and fechaHasta', () => {
    expect(() =>
      validateConsultaCtasCtes({
        ...validParams,
        fechaDesde: '2026-03-01',
        fechaHasta: '2026-03-01',
      }),
    ).not.toThrow();
  });
});
