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

// Listen as "localhost", resolved to 127.0.0.1 (IPv4 first): this machine
// only, at the address Apache forwards to. Not "-H 127.0.0.1": Next gives the
// middleware the address http(s)://localhost:<port>, and when that differs from
// the -H address it takes the middleware's rewrites (the blog's sign-in
// callback, old WordPress links) for another site and fetches them - over
// https behind Apache (X-Forwarded-Proto), which fails: "Internal Server
// Error" on signing in to the blog. Without ipv4first, "localhost" can become
// ::1, which Apache (127.0.0.1) cannot reach.
const HOST = "localhost";
const NODE_ARGS = "--max-old-space-size=768 --dns-result-order=ipv4first";

module.exports = {
  apps: [
    {
      name: "ihern-main",
      exec_mode: "fork",
      instances: 1,
      cwd: app("main"),
      script: "../../node_modules/next/dist/bin/next",
      args: `start -p ${MAIN_PORT} -H ${HOST}`,
      interpreter: "node",
      env: { NODE_ENV: "production" },
      // Node's heap is capped below pm2's restart limit, so under heavy traffic
      // Node collects garbage harder instead of growing past 1 GB and being
      // restarted mid-peak (measured: without the cap the blog passed 1 GB at
      // ~500 requests/s and pm2 restarted it). max_memory_restart stays as the
      // safety net for a real leak; idle, a process falls back to ~150 MB.
      node_args: NODE_ARGS,
      max_memory_restart: "1G",
    },
    {
      name: "ihern-blog",
      exec_mode: "fork",
      instances: 1,
      cwd: app("blog"),
      script: "../../node_modules/next/dist/bin/next",
      args: `start -p ${BLOG_PORT} -H ${HOST}`,
      interpreter: "node",
      env: { NODE_ENV: "production" },
      // Node's heap is capped below pm2's restart limit, so under heavy traffic
      // Node collects garbage harder instead of growing past 1 GB and being
      // restarted mid-peak (measured: without the cap the blog passed 1 GB at
      // ~500 requests/s and pm2 restarted it). max_memory_restart stays as the
      // safety net for a real leak; idle, a process falls back to ~150 MB.
      node_args: NODE_ARGS,
      max_memory_restart: "1G",
    },
  ],
};
