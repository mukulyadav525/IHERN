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
 * Ports: 3000 (main site) and 3001 (blog) unless IHERN_MAIN_PORT /
 * IHERN_BLOG_PORT are set when starting - for a server where those are taken.
 * Apache must send traffic to the same ports (deploy/apache.conf):
 *
 *   IHERN_MAIN_PORT=3100 IHERN_BLOG_PORT=3101 pm2 start deploy/ecosystem.config.cjs
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
const port = (v, fallback) => (/^\d{2,5}$/.test(String(v || "")) ? String(v) : fallback);
const MAIN_PORT = port(process.env.IHERN_MAIN_PORT, "3000");
const BLOG_PORT = port(process.env.IHERN_BLOG_PORT, "3001");

module.exports = {
  apps: [
    {
      name: "ihern-main",
      exec_mode: "fork",
      instances: 1,
      cwd: app("main"),
      script: "../../node_modules/next/dist/bin/next",
      args: `start -p ${MAIN_PORT} -H 127.0.0.1`,
      interpreter: "node",
      env: { NODE_ENV: "production" },
      // Node's heap is capped below pm2's restart limit, so under heavy traffic
      // Node collects garbage harder instead of growing past 1 GB and being
      // restarted mid-peak (measured: without the cap the blog passed 1 GB at
      // ~500 requests/s and pm2 restarted it). max_memory_restart stays as the
      // safety net for a real leak; idle, a process falls back to ~150 MB.
      node_args: "--max-old-space-size=768",
      max_memory_restart: "1G",
    },
    {
      name: "ihern-blog",
      exec_mode: "fork",
      instances: 1,
      cwd: app("blog"),
      script: "../../node_modules/next/dist/bin/next",
      args: `start -p ${BLOG_PORT} -H 127.0.0.1`,
      interpreter: "node",
      env: { NODE_ENV: "production" },
      // Node's heap is capped below pm2's restart limit, so under heavy traffic
      // Node collects garbage harder instead of growing past 1 GB and being
      // restarted mid-peak (measured: without the cap the blog passed 1 GB at
      // ~500 requests/s and pm2 restarted it). max_memory_restart stays as the
      // safety net for a real leak; idle, a process falls back to ~150 MB.
      node_args: "--max-old-space-size=768",
      max_memory_restart: "1G",
    },
  ],
};
