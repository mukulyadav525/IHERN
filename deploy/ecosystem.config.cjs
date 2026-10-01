/**
 * Keeps both sites running on the server with pm2 (https://pm2.keymetrics.io):
 *
 *   npm install -g pm2
 *   npm ci && npm run build          (from the repository root)
 *   pm2 start deploy/ecosystem.config.cjs   (from any directory)
 *   pm2 save && pm2 startup          (start again after a reboot)
 *
 * Settings come from each app's .env.production.local.
 *
 * ONE process per site (fork mode, one instance): each keeps its page cache
 * and sign-in rate limits in memory, so several processes per site (cluster
 * mode, -i max) would each hold their own and disagree. Do not scale with -i.
 *
 * Node.js 22.12+ is required. `pm2 show ihern-main` shows the "node.js
 * version" pm2 runs; it can differ from the shell's `node -v`.
 */
const path = require("path");

// Absolute paths: pm2 resolves a relative cwd against the directory it is run
// from, so "./apps/main" only worked when started from the repository root.
const app = (name) => path.join(__dirname, "..", "apps", name);

module.exports = {
  apps: [
    {
      name: "ihern-main",
      exec_mode: "fork",
      instances: 1,
      cwd: app("main"),
      script: "../../node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      interpreter: "node",
      env: { NODE_ENV: "production" },
      // A safety net for a leak, not a limit for busy moments: under 100
      // simultaneous requests a process was measured at ~600 MB, falling back
      // to well under 100 MB when idle. Restarting at 600 MB would restart it
      // in the middle of a traffic peak.
      max_memory_restart: "1G",
    },
    {
      name: "ihern-blog",
      exec_mode: "fork",
      instances: 1,
      cwd: app("blog"),
      script: "../../node_modules/next/dist/bin/next",
      args: "start -p 3001 -H 127.0.0.1",
      interpreter: "node",
      env: { NODE_ENV: "production" },
      // A safety net for a leak, not a limit for busy moments: under 100
      // simultaneous requests a process was measured at ~600 MB, falling back
      // to well under 100 MB when idle. Restarting at 600 MB would restart it
      // in the middle of a traffic peak.
      max_memory_restart: "1G",
    },
  ],
};
