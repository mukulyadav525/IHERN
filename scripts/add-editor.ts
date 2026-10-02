/**
 * Lets an IHERN account use the blog's admin area.
 *
 *   npm run blog:add-editor -- someone@iiitd.ac.in            (editor)
 *   npm run blog:add-editor -- someone@iiitd.ac.in admin      (can also manage editors)
 *
 * The person signs in to the blog with their IHERN account (the same email)
 * and opens /admin.
 */
import { loadEnv } from "./env";

async function main() {
  loadEnv();
  const [email, roleArg] = process.argv.slice(2);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Usage: npm run blog:add-editor -- <email> [admin|editor]");
  const role = roleArg === "admin" ? "admin" : "editor";
  const { addEditor } = await import("@ihern/core/blog");
  const { getPool } = await import("@ihern/core/db");
  if (!(await addEditor(email, role))) throw new Error("Could not save (is the database configured and the schema applied?).");
  console.log(`${email.toLowerCase()} is now a blog ${role}.`);
  await getPool("cdnm")?.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
