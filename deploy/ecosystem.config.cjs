/**
 * Keeps both sites running on the server with pm2 (https://pm2.keymetrics.io):
 *
 *   npm install -g pm2
 *   npm ci && npm run build          (from the repository root)
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save && pm2 startup          (start again after a reboot)
 *
 * Settings come from each app's .env.production.local.
 */
module.exports = {
  apps: [
    {
      name: "ihern-main",
      cwd: "./apps/main",
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
      cwd: "./apps/blog",
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
