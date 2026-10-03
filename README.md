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

The server needs **Node.js 22.12 or newer** (Node 22 LTS; `.nvmrc` says 22)
and access to the MySQL server. `npm ci` refuses to install on an older Node
(`.npmrc`), because the blog's HTML cleaner needs 22.12+ and would otherwise
fail only at run time. Check the Node that pm2 actually uses, not just the
shell's: `pm2 show ihern-blog` lists it as "node.js version".

1. `npm ci` then fill in `apps/main/.env.production.local` and
   `apps/blog/.env.production.local` from the `.env.example` files. The two
   SSO secrets must match (`IHERN_SSO_BLOG_SECRET` on the main site =
   `IHERN_SSO_CLIENT_SECRET` on the blog). To serve the main site at
   iiitd.ac.in/IHERN/, keep `NEXT_PUBLIC_BASE_PATH=/IHERN` in
   `apps/main/.env.production.local`: it is needed when building and again
   when starting (set only for the build, every page answers 404).
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

### Before go-live: the PHP admin scripts

Ten scripts in the PHP site's `applications/admin/` answer **without
signing in**: the seven `export*.php` spreadsheets (members, applications,
fees and payments), `delete_member.php` and `delete_memberD.php` (change an
application's status), and `batch.php`, which also builds its SQL from the
posted `program` value (SQL injection). Once Apache sends `/IHERN` to this
app they are no longer reachable there (this app answers 404 for them), but
until then, and through any other address that still serves the PHP files,
they are open. Block or remove `applications/admin/` on the PHP server now
(for example `Require all denied` for that directory), and remove the PHP
site after the switch.

### Releases and rollback

Build each release in its own directory, so the running one is never rebuilt
underneath itself and the previous one stays ready to start again:

```bash
# 1. back up the databases (npm run db:schema only adds tables, but keep a copy)
mysqldump --single-transaction cdnm      > ~/backups/cdnm-$(date +%F).sql
mysqldump --single-transaction ihern2024 > ~/backups/ihern2024-$(date +%F).sql

# 2. the new release beside the old one; settings live outside git
git clone https://github.com/mukulyadav525/IHERN.git /srv/ihern/releases/$(date +%F)
cd /srv/ihern/releases/$(date +%F)
cp /srv/ihern/shared/main.env.production.local apps/main/.env.production.local
cp /srv/ihern/shared/blog.env.production.local apps/blog/.env.production.local
node -v                      # 22.12 or newer
npm ci && npm run build
npm run db:schema            # adds any new blog columns; only adds, safe to repeat

# 3. switch
pm2 delete ihern-main ihern-blog
pm2 start deploy/ecosystem.config.cjs && pm2 save
```

To roll back, run step 3 from the previous release's directory. Restore the
database dumps only if a release changed the data; none so far has (the
blog's tables are additive and the PHP site's tables are used as they are).
The first switch from the PHP site is rolled back by pointing Apache at the
PHP site again, which is why the PHP files stay on the server (blocked, see
above) until the new sites have run for a while.

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

Measured on a laptop (8 cores, already busy), both sites run by pm2 from
`deploy/ecosystem.config.cjs`, one process each. Simulated users each open a
page about every 7 seconds; 60% of views on the main site, 40% on the blog
(a third of those by signed-in readers):

| Users | Pages/s | Errors | p50 | p99 | Peak memory (main / blog) | DB connections |
|---|---|---|---|---|---|---|
| 100 | 15 | 0 | 18 ms | 47 ms | 244 / 289 MB | 8 |
| 250 | 35 | 0 | 33 ms | 87 ms | 379 / 393 MB | 8 |
| 500 | 72 | 0 | 60 ms | 158 ms | 450 / 556 MB | 7 |
| 750 | 107 | 0 | 82 ms | 215 ms | 544 / 605 MB | 7 |
| 1,000 | 143 | 0 | 103 ms | 273 ms | 579 / 696 MB | 7 |
| 1,000, a page every 3.5 s | 285 | 0 | 215 ms | 580 ms | 409 / 561 MB | 8 |
| 1,000, a page every 2 s | 488 | 0 | 407 ms | 2.5 s | 500 / 772 MB | 14 |

Database queries averaged under 0.15 ms; pm2 restarted nothing. The last row
is the laptop's CPU limit: pages slow down but none fail. Without the heap cap
in the pm2 file, that row produced failed requests because pm2 restarted the
blog at 1 GB.

These are laptop figures, not measurements on the server: production
capacity needs a load test on the server itself. As an estimate, 1,000
concurrent visitors need 2 CPU cores and 4 GB of memory for both sites and
MySQL on one machine. The limits are the server's CPU and the MySQL server,
not the code.
