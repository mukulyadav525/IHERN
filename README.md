# IHERN — main website and blog, in JavaScript

Both IHERN sites, in one repository, as two Next.js 15 apps (React 19, TypeScript):

| App | Address | Replaces |
|---|---|---|
| `apps/main` | https://iiitd.ac.in/IHERN/ | the PHP website (`IHERN_New/main-site`) |
| `apps/blog` | https://ihernblog.iiitd.ac.in/ | the WordPress blog (`IHERN_New/blog`) |
| `packages/core` | — | shared code: database, IHERN accounts, subscriptions, blog content, mail |

No PHP and no WordPress. Both apps use the existing MySQL databases (`cdnm`
and `ihern2024`); the blog's content moves from WordPress's tables into its
own tables in `cdnm` with a one-time migration that keeps every old link
working.

## What each site does

**Main site** (`apps/main`, details in its README): every page of the PHP
site with the same look, the IHERC 2026 and 2025 conference pages, the IHERN
account (sign-in, sign-up, Google sign-in, My account), the membership form,
member sign-in and dashboard, password reset, the Blogs page (now read from the
blog's tables), the single sign-on server the blog uses, and the **membership
admin panel** at `/membership/admin`. Staff sign in with their existing admin
accounts and get the registered members with photographs, activation, editing,
password reset emails, deletion, the CSV export, and admin users.

**Blog** (`apps/blog`):

- the front page (latest posts ticker, featured posts, filters, the latest
  posts, "You may have missed"), all posts with search / author / category /
  tag / year / sort filters, category, tag, author and monthly archives, pages
  (About us), Subscribe, RSS feed (`/feed`), sitemap;
- posts are read in full with an IHERN account; signed-out readers see the
  opening and a "Sign in to continue reading" box (as on the WordPress blog);
- one IHERN account for both sites: signing in or out on either signs in or
  out of both, and a reader already signed in on the main site is signed in on
  the blog automatically;
- subscribe with one click (no email to type); subscribers are emailed when a
  post is published;
- comments from signed-in readers: a reader's first comment waits for an
  editor's approval, later ones appear at once; editors are emailed;
- **the admin area at `/admin`** (replaces wp-admin): write and edit posts and
  pages in a visual editor (or HTML), schedule them, choose categories, tags,
  author and featured image; manage categories, tags and authors; upload
  images; approve comments; and (admins) choose who can edit.

Old WordPress addresses keep working: `/?p=196`, `/?page_id=30`, `/?cat=6`,
`/?tag=…`, `/?author=5`, `/?s=…`, `/?feed=rss2`, `/?m=202606` all redirect to
the new pages, and images stay at `/wp-content/uploads/…`.

## Run it locally

```bash
npm install                                  # once, from this folder
cp apps/main/.env.example apps/main/.env.local
cp apps/blog/.env.example apps/blog/.env.local
#   fill in the database settings in both; for local work set
#   IHERN_ENV=development and the local addresses (see below)

npm run db:schema                            # creates the blog's tables in cdnm
npm run db:migrate-wordpress -- --uploads /path/to/wordpress/wp-content/uploads
npm run blog:add-editor -- you@example.org admin

npm run dev:main                             # http://localhost:3000
npm run dev:blog                             # http://localhost:3001
```

With `IHERN_ENV=development` the main site accepts the blog at
`http://localhost:3001` (or whatever `IHERN_BLOG_URL` says) and both sides use
a built-in development secret, so sign-in works without further setup.

`npm run build` builds both; `npm run lint` and `npm run typecheck` check them.

## Moving from WordPress

`npm run db:migrate-wordpress -- --uploads <wordpress uploads folder>` reads the
WordPress tables (prefix `ihernblog_`, change with `--prefix`) and copies:

- posts and pages (content cleaned to plain HTML), with their WordPress ids,
  dates, authors, categories, tags, featured images and comment settings;
- authors (name and bio), categories, tags, comments;
- images: the uploads folder is copied into `BLOG_UPLOAD_DIR` with the same
  year/month layout;
- editors: WordPress administrators and editors become blog admins and editors
  (they sign in with the IHERN account that has the same email).

Posts that were already published are marked as announced, so subscribers are
not emailed about them again. It only reads WordPress; run it again any time
(`--update` refreshes posts that were already copied).

## Deploying

The server needs **Node.js 20.9 or newer** (22 LTS recommended) and access to
the MySQL server.

1. `npm ci` then fill in `apps/main/.env.production.local` and
   `apps/blog/.env.production.local` from the `.env.example` files. The two
   SSO secrets must match (`IHERN_SSO_BLOG_SECRET` on the main site =
   `IHERN_SSO_CLIENT_SECRET` on the blog). Build the main site with
   `NEXT_PUBLIC_BASE_PATH=/IHERN` to serve it at iiitd.ac.in/IHERN/.
2. `npm run db:schema`, then the WordPress migration (above), then add editors.
3. `npm run build`.
4. Keep both running: `deploy/ecosystem.config.cjs` (pm2) starts the main
   site on port 3000 and the blog on 3001.
5. Put the web server in front: `deploy/apache.conf` has the proxy settings
   for both addresses.

Run **one process per site** (as the pm2 file does). Each keeps its cache and
its sign-in rate limits in memory; several processes per site would each keep
their own.

After the switch, WordPress and the whole PHP site (admin panel included) can be switched off. Keep a copy
of the WordPress database tables and uploads until you are satisfied.

The membership admin panel replaces `applications/admin`. Point
`IHERN_UPLOAD_DIR` (main site) at the PHP `applications/uploadDoc` folder so
existing member photographs show there.

## Performance and load

Public pages do not query the database on every visit. Blog posts,
categories, authors, the archive and approved comments (blog), the post list
on the Blogs page and the member directory (main site) are read once and
shared between visitors. An editor's or admin's change clears that cache at
once (the blog also tells the main site, at `/api/blog/changed`). Otherwise
it refreshes within a minute (five minutes for the member directory). Who is
signed in, subscriptions and anything personal are never cached.

- Database connections: a pool of 10 per database per site
  (`IHERN_DB_POOL_SIZE`). A query is abandoned after 10 seconds
  (`IHERN_DB_QUERY_TIMEOUT_MS`). When the database is slow or down, pages say
  the service is unavailable instead of waiting without end, and cached
  public content keeps being served.
- Static files (stylesheets, images, fonts) are sent with cache headers, so
  browsers do not re-request them on every page.
- Uploaded blog images are resized on demand (`?w=640` and so on, WebP where
  the browser accepts it) and kept in `.next/cache/ihern-images`
  (`BLOG_IMAGE_CACHE_DIR` to change it).
- Sign-in, account creation, membership registration and password-reset
  emails are rate-limited per address (and per network for sign-ups).

Measured on a laptop (production build, one process per site, a busy machine):

| Test | Result |
|---|---|
| A steady 150 pages a second on each page (about 1,000 people each opening a page every 7 seconds), signed-in blog readers included | no errors; 99% of pages served in under 0.6 s |
| As fast as possible, 100 requests at once | 160 pages a second (blog home) to 400 (other pages) per site; no errors |

These are laptop figures, not measurements on the server. As an estimate,
1,000 concurrent visitors need 2 CPU cores and 4 GB of memory for both sites
and MySQL on one machine (each site peaked at about 600 MB under 100
simultaneous requests). The limits are the server's CPU and the MySQL
server, not the code. Each signed-in blog page view adds about 2 small
indexed queries.
