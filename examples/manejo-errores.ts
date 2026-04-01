/**
 * Ejemplo: Manejo de errores
 *
 * El SDK provee clases de error especificas para catch granular:
 *   - ArcaAuthError: falla de autenticacion WSAA
 *   - ArcaServiceError: error de negocio de ARCA (con codigos)
 *   - ArcaSoapError: error HTTP/SOAP (timeout, servidor caido)
 *   - ArcaValidationError: datos de entrada invalidos
 */

import fs from "fs";
import {
  ArcaFecred,
  ArcaAuthError,
  ArcaServiceError,
  ArcaSoapError,
} from "@ramiidv/arca-fecred";
import { ArcaValidationError } from "@ramiidv/arca-common";

async function main() {
  const fecred = new ArcaFecred({
    cert: fs.readFileSync("./certs/certificado.crt", "utf-8"),
    key: fs.readFileSync("./certs/clave.key", "utf-8"),
    cuit: "20123456789",
    production: false,
    timeout: 60_000, // 60s para servidores lentos
  });

  try {
    // Consultar obligacion de una CUIT
    const resultado = await fecred.consultarMontoObligadoRecepcion("30712345678");
    console.log(`Obligado: ${resultado.obligado}`);

    // Consultar cuentas corrientes
    const cuentas = await fecred.consultarCtasCtes({
      rol: "Receptor",
      fechaDesde: "2026-01-01",
      fechaHasta: "2026-03-31",
    });
    console.log(`Cuentas encontradas: ${cuentas.length}`);
  } catch (e) {
    if (e instanceof ArcaValidationError) {
      // Datos de entrada invalidos (CUIT mal formada, fechas invalidas, etc.)
      console.error("Error de validacion:", e.message);
      for (const detail of e.details) {
        console.error(`  Campo: ${detail.field} - ${detail.message}`);
      }
    } else if (e instanceof ArcaAuthError) {
      // Certificado invalido, expirado, o respuesta WSAA inesperada
      console.error("Error de autenticacion:", e.message);
      fecred.clearAuthCache();
    } else if (e instanceof ArcaServiceError) {
      // Error de negocio con codigos de ARCA
      for (const err of e.errors) {
        console.error(`ARCA [${err.code}]: ${err.msg}`);
      }
    } else if (e instanceof ArcaSoapError) {
      // Timeout, HTTP 500, SOAP Fault
      console.error("Error de conexion:", e.message);
    } else {
      throw e;
    }
  }
}

main().catch(console.error);
