// A stand-in for Apache where there is none (a test server, a laptop): one
// address in front of both apps, as deploy/apache.conf sets up in production.
//
//   /blog...       -> the blog       (BLOG_PORT, default 3001)
//   everything else -> the main site  (MAIN_PORT, default 3000)
//
//   PORT=3300 MAIN_PORT=3000 BLOG_PORT=3001 pm2 start deploy/proxy.cjs --name ihern-proxy
//
// Plain http only, for testing. Not for production: use Apache (HTTPS).
//
// Behind an HTTPS tunnel (a public link while Apache is not set up, see
// "Preview without Apache" in the README): listen on this machine only and
// tell the apps the visitor came over https, so sign-in cookies work.
//
//   BIND=127.0.0.1 PROTO=https PORT=3300 MAIN_PORT=3100 BLOG_PORT=3101 pm2 start deploy/proxy.cjs --name ihern-proxy
const http = require("http");

const PORT = Number(process.env.PORT || 3300);
const MAIN = Number(process.env.MAIN_PORT || 3000);
const BLOG = Number(process.env.BLOG_PORT || 3001);
const BIND = process.env.BIND || "0.0.0.0";
const PROTO = process.env.PROTO === "https" ? "https" : "http";
const under = (p, base) => p === base || p.startsWith(base + "/") || p.startsWith(base + "?");

http
  .createServer((req, res) => {
    const path = req.url || "/";
    const port = under(path, "/blog") ? BLOG : MAIN;
    // The Host header goes through unchanged (Apache's ProxyPreserveHost On).
    const upstream = http.request(
      { host: "127.0.0.1", port, method: req.method, path, headers: { ...req.headers, "x-forwarded-proto": PROTO } },
      (r) => {
        res.writeHead(r.statusCode || 502, r.headers);
        r.pipe(res);
      }
    );
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("The site is not running just now.");
    });
    req.pipe(upstream);
  })
  .listen(PORT, BIND, () => console.log(`IHERN proxy on ${BIND}:${PORT} (${PROTO}): / -> ${MAIN}, /blog -> ${BLOG}`));
