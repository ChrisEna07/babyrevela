import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const here = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(here, "../.env.local"), "utf8");
    const vars = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return vars;
  } catch {
    return {};
  }
}

const env = { ...loadEnvLocal(), ...process.env };

const pin = env.ADMIN_PIN || "1234";
const superAdminName = env.SUPER_ADMIN_NAME || "ChrizDev";
const superAdminPin = env.SUPER_ADMIN_PIN || "3008";
const databaseURL = env.FIREBASE_DATABASE_URL;
const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT || "./firebase-service-account.json";

if (!pin || pin.length < 4) {
  console.error("✗ Define ADMIN_PIN (mínimo 4 caracteres) en .env.local");
  process.exit(1);
}
if (!superAdminName || superAdminPin.length < 4) {
  console.error("✗ Define SUPER_ADMIN_NAME y SUPER_ADMIN_PIN (mínimo 4 dígitos) en .env.local");
  process.exit(1);
}
if (!databaseURL) {
  console.error("✗ Define FIREBASE_DATABASE_URL en .env.local");
  process.exit(1);
}
if (!env.FIREBASE_SERVICE_ACCOUNT && !serviceAccountPath) {
  console.error("✗ Define FIREBASE_SERVICE_ACCOUNT (ruta al JSON de servicio)");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(resolve(here, "..", serviceAccountPath), "utf8"));
} catch {
  console.error(`✗ No se pudo leer la cuenta de servicio en ${serviceAccountPath}`);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
  databaseURL,
});

const db = getDatabase();
const pinHash = createHash("sha256").update(pin).digest("hex");
const superAdminHash = createHash("sha256").update(superAdminPin).digest("hex");

console.log("Inicializando Realtime Database…");

await db.ref("meta/pinHash").set(pinHash);

await db.ref("meta/superAdmin").set({
  name: superAdminName,
  pinHash: superAdminHash,
});

await db.ref("state").set({
  votingOpen: false,
  phase: "idle",
  countdownEndsAt: null,
  countdownDuration: 10,
  revealChoice: null,
});

const rulesContent = readFileSync(resolve(here, "../database.rules.json"), "utf8");
await db.setRules(rulesContent);
console.log(`✓ Reglas de seguridad (.read=true, .write=true) aplicadas en Realtime Database.`);
console.log("");
console.log("Siguientes pasos:");
console.log("  1. Importa database.rules.json desde la consola de Firebase");
console.log("     (Realtime Database > Reglas) o con: firebase deploy --only database");
console.log("  2. Ejecuta: npm run dev");
console.log("  3. Accede al súper admin desde /admin > botón 'Súper administrador'");
process.exit(0);
