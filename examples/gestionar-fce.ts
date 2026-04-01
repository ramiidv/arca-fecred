/**
 * Ejemplo: Gestionar FCE - Aceptar, rechazar e informar cancelacion
 *
 * Flujo completo de gestion de Facturas de Credito Electronica:
 * 1. Consultar cuentas corrientes pendientes
 * 2. Aceptar una FCE
 * 3. Informar la cancelacion (pago) de la FCE aceptada
 *
 * Tambien muestra como rechazar una FCE con motivo.
 */

import fs from "fs";
import {
  ArcaFecred,
  RolCtaCte,
  FormaCancelacion,
  MotivoRechazo,
} from "@ramiidv/arca-fecred";

async function main() {
  const fecred = new ArcaFecred({
    cert: fs.readFileSync("./certs/certificado.crt", "utf-8"),
    key: fs.readFileSync("./certs/clave.key", "utf-8"),
    cuit: "20123456789",
    production: false,
  });

  // 1. Consultar cuentas corrientes como receptor
  const cuentas = await fecred.consultarCtasCtes({
    rol: RolCtaCte.RECEPTOR,
    fechaDesde: "2026-01-01",
    fechaHasta: "2026-03-31",
  });

  console.log(`Se encontraron ${cuentas.length} cuentas corrientes`);

  for (const cta of cuentas) {
    console.log(
      `  - CodCtaCte: ${cta.codCtaCte} | Emisor: ${cta.cuitEmisor} | ` +
      `Total: $${cta.importeTotal ?? 0} | Estado: ${cta.estado ?? "N/A"}`
    );
  }

  if (cuentas.length === 0) {
    console.log("No hay cuentas corrientes para gestionar.");
    return;
  }

  // 2. Aceptar la primera FCE pendiente
  const ctaParaAceptar = cuentas[0];
  console.log(`\nAceptando FCE con CodCtaCte: ${ctaParaAceptar.codCtaCte}...`);

  const resultadoAceptacion = await fecred.aceptarFECred(ctaParaAceptar.codCtaCte);
  console.log(`Resultado: ${resultadoAceptacion.resultado}`);

  // 3. Informar cancelacion (pago) de la FCE aceptada
  console.log("\nInformando cancelacion por transferencia bancaria...");

  const resultadoCancelacion = await fecred.informarFacturaAceptadaCancelada({
    codCtaCte: ctaParaAceptar.codCtaCte,
    codFormaCancelacion: FormaCancelacion.TRANSFERENCIA,
    observaciones: "Pago realizado por transferencia bancaria",
  });
  console.log(`Resultado cancelacion: ${resultadoCancelacion.resultado}`);

  // Ejemplo alternativo: Rechazar una FCE
  // const resultadoRechazo = await fecred.rechazarFECred(
  //   ctaParaAceptar.codCtaCte,
  //   MotivoRechazo.OTROS,
  // );
  // console.log(`Resultado rechazo: ${resultadoRechazo.resultado}`);
}

main().catch(console.error);
