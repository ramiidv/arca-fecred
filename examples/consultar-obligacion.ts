/**
 * Ejemplo: Consultar si una CUIT esta obligada a recibir FCE
 *
 * Verifica si un contribuyente esta obligado a recibir Facturas de
 * Credito Electronica (FCE) segun la Ley 27440 (regimen MiPyME).
 */

import fs from "fs";
import { ArcaFecred } from "@ramiidv/arca-fecred";

async function main() {
  const fecred = new ArcaFecred({
    cert: fs.readFileSync("./certs/certificado.crt", "utf-8"),
    key: fs.readFileSync("./certs/clave.key", "utf-8"),
    cuit: "20123456789",
    production: false,
  });

  // Verificar el estado del servicio
  const status = await fecred.status();
  console.log("Estado del servicio:", status);

  // Consultar si una CUIT esta obligada a recibir FCE
  const cuitAConsultar = "30712345678";
  const resultado = await fecred.consultarMontoObligadoRecepcion(cuitAConsultar);

  console.log(`CUIT: ${resultado.cuitConsultada}`);
  console.log(`Obligado: ${resultado.obligado}`);

  if (resultado.obligado && resultado.montoDesde !== undefined) {
    console.log(`Monto desde: $${resultado.montoDesde.toLocaleString("es-AR")}`);
  }
}

main().catch(console.error);
