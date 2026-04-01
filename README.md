# @ramiidv/arca-fecred

[![npm](https://img.shields.io/npm/v/@ramiidv/arca-fecred)](https://www.npmjs.com/package/@ramiidv/arca-fecred)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

SDK en TypeScript para el web service **WSFECRED** de **ARCA** (ex AFIP) -- Factura de Credito Electronica MiPyME (Ley 27440).

Gestiona el ciclo de vida completo de las FCE: consulta de obligados, cuentas corrientes, comprobantes, aceptacion, rechazo e informar cancelacion.

## Instalacion

```bash
npm install @ramiidv/arca-fecred
```

## Requisitos

- Node.js >= 18
- Certificado digital X.509 y clave privada de ARCA
  - **Testing**: generalo desde [WSASS Homologacion](https://wsass-homo.afip.gob.ar/wsass/portal/main.aspx)
  - **Produccion**: generalo desde [Administracion de Certificados Digitales](https://www.afip.gob.ar/ws/documentacion/certificados.asp) (requiere clave fiscal en [arca.gob.ar](https://arca.gob.ar))

## Uso rapido

```typescript
import { readFileSync } from 'fs';
import { ArcaFecred, RolCtaCte, MotivoRechazo, FormaCancelacion } from '@ramiidv/arca-fecred';

const fecred = new ArcaFecred({
  cert: readFileSync('./cert.pem', 'utf-8'),
  key: readFileSync('./key.pem', 'utf-8'),
  cuit: '20123456789',
  production: false, // true para produccion
});

// Verificar si una CUIT esta obligada a recibir FCE
const obligado = await fecred.consultarMontoObligadoRecepcion('30712345678');
console.log(obligado.obligado); // true/false

// Consultar cuentas corrientes como receptor
const cuentas = await fecred.consultarCtasCtes({
  rol: RolCtaCte.RECEPTOR,
  fechaDesde: '2026-01-01',
  fechaHasta: '2026-03-31',
});

for (const cta of cuentas) {
  console.log(`FCE #${cta.codCtaCte}: $${cta.importeTotal} - ${cta.estado}`);
}

// Aceptar una FCE
const aceptar = await fecred.aceptarFECred(12345);
console.log(aceptar.resultado);

// Rechazar una FCE
const rechazar = await fecred.rechazarFECred(12345, MotivoRechazo.CBU_INCORRECTO);
console.log(rechazar.resultado);

// Informar que una FCE aceptada fue pagada
const cancelar = await fecred.informarFacturaAceptadaCancelada({
  codCtaCte: 12345,
  codFormaCancelacion: FormaCancelacion.TRANSFERENCIA,
});
console.log(cancelar.resultado);
```

## Configuracion

```typescript
const fecred = new ArcaFecred({
  cert: '...',               // Certificado X.509 (PEM)
  key: '...',                // Clave privada (PEM)
  cuit: '20123456789',       // CUIT representada
  production: false,          // Default: false (testing/homologacion)
  timeout: 30_000,            // Default: 30000 (30 segundos)
  retries: 1,                 // Default: 1 (reintentos en errores transitorios)
  retryDelayMs: 1_000,        // Default: 1000 (backoff exponencial: 1s, 2s, ...)
  onEvent: (e) => {           // Opcional: callback para logging/debugging
    console.log(e.type, e);
  },
});
```

## Ejemplos

### Verificar obligacion de recepcion FCE

```typescript
const resultado = await fecred.consultarMontoObligadoRecepcion('30712345678');

if (resultado.obligado) {
  console.log(`CUIT obligada a recibir FCE desde $${resultado.montoDesde}`);
} else {
  console.log('CUIT no obligada a recibir FCE');
}
```

### Consultar cuentas corrientes

```typescript
// Como emisor (mis facturas FCE emitidas)
const misEmitidas = await fecred.consultarCtasCtes({
  rol: RolCtaCte.EMISOR,
  fechaDesde: '2026-01-01',
  fechaHasta: '2026-03-31',
});

// Como receptor (FCE que me enviaron)
const recibidas = await fecred.consultarCtasCtes({
  rol: RolCtaCte.RECEPTOR,
  cuitEmisor: '30712345678', // opcional: filtrar por emisor
  fechaDesde: '2026-01-01',
  fechaHasta: '2026-03-31',
});
```

### Consultar comprobantes FCE

```typescript
// Buscar por CUIT emisor
const comprobantes = await fecred.consultarComprobantes({
  cuitEmisor: '30712345678',
  fechaDesde: '2026-01-01',
  fechaHasta: '2026-03-31',
});

// Buscar un comprobante especifico por codigo de cuenta corriente
const comprobante = await fecred.consultarComprobantes({
  codCtaCte: 12345,
});
```

### Aceptar y luego informar cancelacion

```typescript
import { FormaCancelacion } from '@ramiidv/arca-fecred';

// 1. Aceptar la FCE
await fecred.aceptarFECred(12345);

// 2. Luego de pagar, informar la cancelacion
await fecred.informarFacturaAceptadaCancelada({
  codCtaCte: 12345,
  codFormaCancelacion: FormaCancelacion.TRANSFERENCIA,
  observaciones: 'Transferencia realizada el 2026-03-15',
});
```

### Rechazar una FCE

```typescript
import { MotivoRechazo } from '@ramiidv/arca-fecred';

await fecred.rechazarFECred(12345, MotivoRechazo.OTROS);
```

### Consultar parametros disponibles

```typescript
// Tipos de retencion
const retenciones = await fecred.consultarTiposRetenciones();
for (const r of retenciones) {
  console.log(`${r.codTipoRetencion}: ${r.descTipoRetencion}`);
}

// Formas de cancelacion
const formas = await fecred.consultarTiposFormasCancelacion();

// Tipos de ajuste de operacion
const ajustes = await fecred.consultarTiposAjustesOperacion();

// Motivos de rechazo
const motivos = await fecred.consultarTiposMotivoRechazo();
```

### Health check

```typescript
const status = await fecred.status();
console.log(status.appserver); // "OK"
console.log(status.dbserver);  // "OK"
console.log(status.authserver); // "OK"
```

## Retry automatico

El SDK reintenta automaticamente en errores transitorios (timeout, HTTP 5xx, errores de red). No reintenta en errores de negocio (4xx, errores de ARCA).

- **Default**: 1 reintento con backoff exponencial (1s, 2s, ...)
- **Configurable**: `retries: 0` para desactivar, `retries: 3` para mas intentos

```typescript
const fecred = new ArcaFecred({
  ...config,
  retries: 2,         // 2 reintentos (3 intentos totales)
  retryDelayMs: 2000, // empezar con 2s -> 4s -> 8s
});
```

## Eventos / Logging

El SDK emite eventos para debugging y monitoreo sin forzar un logger especifico.

```typescript
const fecred = new ArcaFecred({
  ...config,
  onEvent: (e) => console.log(`[${e.type}]`, e),
});
```

| Evento | Cuando | Datos |
| --- | --- | --- |
| `auth:login` | Nuevo token obtenido | `service`, `durationMs` |
| `auth:cache-hit` | Token cacheado reutilizado | `service` |
| `request:start` | Antes de una llamada SOAP | `method`, `endpoint` |
| `request:end` | Llamada SOAP completada | `method`, `durationMs` |
| `request:retry` | Reintentando tras error | `method`, `attempt`, `error` |
| `request:error` | Llamada SOAP fallo | `method`, `error` |

## Manejo de errores

El SDK provee clases de error especificas para catch granular:

```typescript
import {
  ArcaFecred,
  ArcaAuthError,
  ArcaServiceError,
  ArcaSoapError,
} from '@ramiidv/arca-fecred';

try {
  const resultado = await fecred.aceptarFECred(12345);
} catch (e) {
  if (e instanceof ArcaAuthError) {
    // Error de autenticacion WSAA (certificado invalido, expirado, etc.)
    console.error('Auth error:', e.message);
    fecred.clearAuthCache(); // Limpiar cache e intentar de nuevo
  }

  if (e instanceof ArcaServiceError) {
    // Error de negocio de WSFECRED (FCE no encontrada, estado invalido, etc.)
    for (const err of e.errors) {
      console.error(`[${err.code}] ${err.msg}`);
    }
  }

  if (e instanceof ArcaSoapError) {
    // Error HTTP/SOAP (timeout, servidor caido, etc.)
    console.error('HTTP status:', e.statusCode);
  }
}
```

| Clase | Cuando se lanza |
| --- | --- |
| `ArcaAuthError` | Falla en login WSAA, respuesta inesperada, token/sign invalidos |
| `ArcaServiceError` | Error devuelto por WSFECRED (FCE no encontrada, operacion invalida, etc.). Contiene `errors: { code, msg }[]` |
| `ArcaSoapError` | Error HTTP, timeout, SOAP Fault. Contiene `statusCode?: number` |
| `ArcaError` | Clase base para todos los errores del SDK |

## API

### `new ArcaFecred(config)`

| Parametro | Tipo | Default | Descripcion |
| --- | --- | --- | --- |
| `cert` | `string` | -- | Contenido del certificado X.509 (PEM) |
| `key` | `string` | -- | Contenido de la clave privada (PEM) |
| `cuit` | `string` | -- | CUIT de la entidad representada |
| `production` | `boolean` | `false` | Entorno de produccion |
| `timeout` | `number` | `30000` | Timeout HTTP en milisegundos |
| `retries` | `number` | `1` | Reintentos en errores transitorios |
| `retryDelayMs` | `number` | `1000` | Delay inicial entre reintentos (exponencial) |
| `onEvent` | `function` | -- | Callback para eventos del SDK |

### Consultas de operaciones

| Metodo | Descripcion |
| --- | --- |
| `consultarMontoObligadoRecepcion(cuit)` | Verifica si una CUIT esta obligada a recibir FCE |
| `consultarCtasCtes(params)` | Consulta cuentas corrientes de actividad FCE |
| `consultarComprobantes(params)` | Busca comprobantes FCE por filtros |

### Acciones sobre FCE

| Metodo | Descripcion |
| --- | --- |
| `aceptarFECred(codCtaCte)` | Acepta una FCE |
| `rechazarFECred(codCtaCte, codMotivoRechazo)` | Rechaza una FCE con motivo |
| `informarFacturaAceptadaCancelada(params)` | Informa que una FCE aceptada fue pagada/cancelada |

### Consultas de parametros

| Metodo | Descripcion |
| --- | --- |
| `consultarTiposRetenciones()` | Tipos de retenciones disponibles |
| `consultarTiposFormasCancelacion()` | Formas de cancelacion disponibles |
| `consultarTiposAjustesOperacion()` | Tipos de ajustes de operacion disponibles |
| `consultarTiposMotivoRechazo()` | Motivos de rechazo disponibles |

### Estado y utilidades

| Metodo | Descripcion |
| --- | --- |
| `status()` | Health check del servicio WSFECRED (no requiere autenticacion) |
| `clearAuthCache()` | Invalida el ticket de acceso cacheado |

### Acceso a clientes de bajo nivel

Para casos avanzados, se pueden usar los clientes individuales directamente:

```typescript
const fecred = new ArcaFecred({ /* ... */ });

// Obtener ticket de acceso manualmente
const ticket = await fecred.wsaa.getAccessTicket('wsfecred');

const credenciales = {
  Token: ticket.token,
  Sign: ticket.sign,
  Cuit: '20123456789',
};

// Llamar directamente al servicio
const rawResult = await fecred.fecred.consultarMontoObligadoRecepcion(
  credenciales,
  '30712345678',
);
```

## Enums disponibles

- `RolCtaCte` -- Rol en la cuenta corriente (EMISOR, RECEPTOR)
- `EstadoCtaCte` -- Estado de la cuenta corriente (PENDIENTE_ACEPTACION, ACEPTADA, RECHAZADA, CANCELADA, ANULADA)
- `MotivoRechazo` -- Motivos de rechazo (NOTA_CREDITO_DEBITO, CUIT_INCORRECTO, FECHA_INCORRECTA, CBU_INCORRECTO, OTROS)
- `FormaCancelacion` -- Formas de cancelacion (ACREDITACION_CUENTA, TRANSFERENCIA, CHEQUE, PAGO_ELECTRONICO, COMPENSACION, ENDOSO, OTRO)
- `TipoAjusteOperacion` -- Tipos de ajuste (NOTA_CREDITO, NOTA_DEBITO)
- `TipoRetencion` -- Tipos de retencion (GANANCIAS, IVA, SUSS, INGRESOS_BRUTOS, OTRAS)

## Entornos

| Entorno | WSAA | WSFECRED |
| --- | --- | --- |
| Testing | `wsaahomo.afip.gov.ar` | `fwshomo.afip.gob.ar` |
| Produccion | `wsaa.afip.gov.ar` | `serviciosjava.afip.gob.ar` |

## Licencia

MIT
