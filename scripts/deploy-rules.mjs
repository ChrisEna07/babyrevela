import { readFileSync } from "node:fs";
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
const databaseURL = env.FIREBASE_DATABASE_URL || "https://babyshow-d072f-default-rtdb.firebaseio.com";
const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT || "./firebase-service-account.json";

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(resolve(here, "..", serviceAccountPath), "utf8"));
} catch (e) {
  console.error("Error leyendo servicio:", e);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
  databaseURL,
});

const db = getDatabase();
const rulesContent = readFileSync(resolve(here, "../database.rules.json"), "utf8");

try {
  console.log("Desplegando reglas de seguridad a Firebase Realtime Database...");
  await db.setRules(rulesContent);
  console.log("✅ Reglas de seguridad aplicadas exitosamente en Firebase Realtime Database!");
  process.exit(0);
} catch (err) {
  console.error("Error aplicando reglas:", err);
  process.exit(1);
}
