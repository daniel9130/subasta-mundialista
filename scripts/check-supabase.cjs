const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

function readEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error("No existe .env. Copie .env.example como .env y pegue las credenciales de Supabase.");
  }

  const entries = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const env = {};

  for (const line of entries) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    env[key] = value;
  }

  return env;
}

async function main() {
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.");
  }

  const supabase = createClient(url, anonKey);
  const checks = [];

  const matchCheck = await supabase.from("matches").select("id").limit(1);
  checks.push(["matches", !matchCheck.error, matchCheck.error?.message]);

  const participantCheck = await supabase.from("participants").select("id").limit(1);
  checks.push(["participants", !participantCheck.error, participantCheck.error?.message]);

  const bidCheck = await supabase.from("bids").select("id").limit(1);
  checks.push(["bids", !bidCheck.error, bidCheck.error?.message]);

  const adminCheck = await supabase.from("app_admins").select("user_id").limit(1);
  checks.push(["app_admins", !adminCheck.error, adminCheck.error?.message]);

  const realtimeChannel = supabase.channel("health-check");
  checks.push(["realtime client", Boolean(realtimeChannel), null]);
  supabase.removeChannel(realtimeChannel);

  const failed = checks.filter(([, ok]) => !ok);

  console.log("Revision de Supabase");
  for (const [name, ok, message] of checks) {
    console.log(`${ok ? "OK" : "FALTA"} ${name}${message ? `: ${message}` : ""}`);
  }

  if (failed.length) {
    process.exitCode = 1;
    return;
  }

  console.log("Supabase esta listo para pruebas locales.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
