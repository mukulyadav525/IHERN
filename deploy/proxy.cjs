// A stand-in for Apache where there is none (a test server, a laptop): one
// address in front of both apps, as deploy/apache.conf sets up in production.
//
//   /IHERN/blog...  -> the blog       (BLOG_PORT, default 3001)
//   /IHERN...       -> the main site  (MAIN_PORT, default 3000)
//   anything else   -> redirected to /IHERN
//
//   PORT=3300 MAIN_PORT=3000 BLOG_PORT=3001 pm2 start deploy/proxy.cjs --name ihern-proxy
//
// Plain http only, for testing. Not for production: use Apache (HTTPS).
const http = require("http");

const PORT = Number(process.env.PORT || 3300);
const MAIN = Number(process.env.MAIN_PORT || 3000);
const BLOG = Number(process.env.BLOG_PORT || 3001);
const under = (p, base) => p === base || p.startsWith(base + "/") || p.startsWith(base + "?");

http
  .createServer((req, res) => {
    const path = req.url || "/";
    const port = under(path, "/IHERN/blog") ? BLOG : under(path, "/IHERN") ? MAIN : 0;
    if (!port) {
      res.writeHead(302, { Location: "/IHERN" });
      return res.end();
    }
    // The Host header goes through unchanged (Apache's ProxyPreserveHost On).
    const upstream = http.request(
      { host: "127.0.0.1", port, method: req.method, path, headers: { ...req.headers, "x-forwarded-proto": "http" } },
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
  .listen(PORT, "0.0.0.0", () => console.log(`IHERN proxy on port ${PORT}: /IHERN -> ${MAIN}, /IHERN/blog -> ${BLOG}`));
