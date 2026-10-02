import { existsSync, readFileSync } from "fs";
import path from "path";

/**
 * Loads settings for the command-line scripts from an env file, the same
 * KEY=value files the apps use. The first that exists of:
 *   $IHERN_ENV_FILE, apps/blog/.env.production.local, apps/blog/.env.local
 * Values already in the environment win.
 */
export function loadEnv(): string | null {
  const root = path.resolve(__dirname, "..");
  const candidates = [process.env.IHERN_ENV_FILE, path.join(root, "apps/blog/.env.production.local"), path.join(root, "apps/blog/.env.local")].filter(Boolean) as string[];
  const file = candidates.find((f) => existsSync(f));
  if (!file) return null;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
  return file;
}
