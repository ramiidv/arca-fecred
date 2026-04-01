# Changelog

## 0.1.0 (2026-03-31)

### Features
- Initial release
- Orchestrator class `ArcaFecred` with automatic WSAA authentication
- Check FCE obligation status (`consultarMontoObligadoRecepcion`)
- Query current accounts (`consultarCtasCtes`) and invoices (`consultarComprobantes`)
- Accept (`aceptarFECred`) and reject (`rechazarFECred`) electronic credit invoices
- Inform accepted FCE cancellation (`informarFacturaAceptadaCancelada`)
- Parameter queries: retention types, cancellation methods, adjustment types, rejection reasons
- Input validation with `ArcaValidationError` from `@ramiidv/arca-common`
- Low-level `FecredClient` for direct SOAP access
- Enums: `RolCtaCte`, `EstadoCtaCte`, `MotivoRechazo`, `FormaCancelacion`, `TipoAjusteOperacion`, `TipoRetencion`
- Health check via `status()` / `dummy()`
