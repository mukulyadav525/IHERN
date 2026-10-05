# IHERN — main website (`apps/main`)

The India Higher Education Research Network website as a Next.js 15 app (App
Router, TypeScript). It is a port of the PHP site in `IHERN_New/main-site` and
does what that site does, with the same look:

- every page of the main site, the two conference microsites (IHERC 2026 and
  the IHERC 2025 archive), and the Blogs page;
- one IHERN account for the website and the IHERN Blog (`apps/blog`), with
  single sign-on both ways and the blog subscription;
- the membership form, member sign-in and dashboard, and password reset;
- the **membership admin panel** at `/membership/admin` (replaces
  `applications/admin`), described below.

It uses the **same databases** (`cdnm`, `ihern2024`). Database access, the
IHERN accounts and subscriptions, the blog's content and mail live in the
shared package `packages/core` (imported as `@ihern/core/...`), which the blog
uses too. The single sign-on endpoints keep the PHP site's addresses, so the
old WordPress blog could also still sign in against this app.

## Run it locally

From the repository root (see the README there):

```bash
npm install
cp apps/main/.env.example apps/main/.env.local   # then fill in the database and the values marked for development
npm run dev:main                                 # http://localhost:3000
```

`npm run build:main` and `npm run start:main` for a production build.
`npm run typecheck` and `npm run lint` are clean.

## How it matches the PHP site

**The look.** The pages use the PHP site's own stylesheets, unchanged
(`public/style.css`, `public/assets/css/*`, and `public/iherc2026/assets/css/*`
for the conference pages), and the same markup and class names. The one
addition is `public/assets/css/ihern-next.css`: a handful of rules for things
the PHP markup did inline in a way React cannot express. Page by page, at six
screen widths from 360 to 1920 px, the rendered pages match the PHP pages to
within anti-aliasing.

**The behaviour.** jQuery and its plugins are gone; what they did is in small
React components:

| PHP site | Here |
|---|---|
| navbar sticky state, nine-dot drawer (`ihern-nav.js`, `main.js`) | `components/SiteHeader.tsx` |
| back-to-top button | `components/ScrollUp.tsx` |
| member directory search (`members.php`) | `components/MemberDirectory.tsx` |
| blog filters and sort (`blog.php`) | `components/BlogBrowser.tsx` |
| IHERC navbar, menu, one-page navigation, WOW animations | `components/iherc/IhercBehaviour.tsx` |
| IHERC 2025 countdown | `components/iherc/Countdown.tsx` |

**Every old address still works.** Bookmarks, search results, links in old
emails and the blog's navigation all point at `.php` and `.html` addresses;
`next.config.mjs` sends each one to its page here (`/about.php` → `/about`,
`/applications/register.php` → `/join`, `/iherc2026/abstract.html` →
`/iherc2026/abstract`, …). The single sign-on endpoints are served *at* their
old addresses (`/sso-authorize.php`, `/sso-token.php`, …), because the blog
calls them server-to-server.

## Pages

| Address | What | PHP original |
|---|---|---|
| `/` | Home: welcome, events, main activities | `index.php` |
| `/about` `/initiatives` `/members` `/stc` `/sig` `/reports` | Main pages | same names `.php` |
| `/blogs` | Posts from the blog, with filters; signed-out readers see openings only | `blog.php` |
| `/login` | Sign in / create an IHERN account (`?mode=register`) | `blog-login.php` |
| `/account` | My account: name, email, blog subscription | `blog-account.php` |
| `/logout` | Sign out here and on the blog | `blog-logout.php` |
| `/join` | Membership form (with photograph) | `applications/register.php` |
| `/membership/login` | Member sign in | `applications/index.php` |
| `/membership/dashboard` | The member's registration, printable | `applications/dashboard.php` |
| `/membership/forgot-password` `/membership/reset-password` | Password reset | `forgotPassword.php`, `resetpass.php` |
| `/iherc2026` `/iherc2026/abstract` `/iherc2026/registration` | IHERC 2026 | `iherc2026/*.html` |
| `/iherc2025` (+ `/abstract`, `/program`, `/registration`) | IHERC 2025 archive | `iherc2025/*.html` |
| `/sso-*.php`, `/blog-oauth.php` | Single sign-on and Google sign-in endpoints | same addresses |
| `/sitemap.xml` `/robots.txt` | | `sitemap.xml` |

## Where things are

```
app/(site)/            main site: layout (header, footer), one folder per page
  login/ account/ join/ membership/     forms, each with its server action
app/(iherc2026)/ app/(iherc2025)/       conference microsites, own layout and CSS
app/api/sso/*          single sign-on endpoints (port of sso-*.php)
app/api/auth/google/*  Google sign-in (port of blog-oauth.php)
app/logout/            sign-out with back-channel to the blog
lib/
  auth.ts              session cookie, safe return paths, initials
  membership.ts        membership registrations, member sign-in, resets (ihern2024)
  sso.ts               single sign-on server (port of sso-server.php)
  initiatives.ts       the Initiatives page content - edit here
  oauth.ts paths.ts seo.ts nav.ts scroll.ts
public/                the PHP site's assets, PDFs and conference files

../../packages/core/src/   shared with the blog
  db.ts                database connections
  env.ts               site addresses, development or production
  store.ts             IHERN accounts and blog subscriptions (cdnm)
  blog.ts              the blog's posts, categories, tags, authors, comments
  mail.ts              every email both sites send
```

**Editing content.** Text lives in the page files under `app/` as ordinary
markup (`app/(site)/about/page.tsx`, `app/(iherc2026)/iherc2026/page.tsx`, …).
The Initiatives page reads `lib/initiatives.ts`. The navigation is defined once
in `lib/nav.ts`; the blog (`apps/blog/lib/site.ts`) carries the same list, so
change both.

## Accounts and single sign-on

- **One IHERN account** (`cdnm.blog_subscribers`), same bcrypt hashes as the PHP
  site, so existing readers sign in with their current password. Hashes written
  here are PHP-compatible, so both apps can run against the same database.
- **Members who joined through the membership form** sign in with that email
  and password; their IHERN account is created on first sign-in.
- **Google sign-in** appears when `IHERN_GOOGLE_CLIENT_ID/SECRET` are set.
- **The blog** sends readers to `/sso-authorize.php`; signed-in readers come
  straight back signed in. Signing out on either side signs out of both.
  The blog's silent check ("is this reader already signed in?") works too.
- **Subscriptions** belong to the account (`cdnm.blog_subscriptions`). A
  confirmation goes out when a reader subscribes; the blog's new-post
  notification (`/sso-notify.php`) emails every active subscriber.
- **Sessions** are signed, httpOnly cookies; forms use Next.js server actions,
  which accept submissions only from this site's own origin.

## Deploying

The app needs Node.js 22.12 or newer (Node 22 LTS) and the two MySQL databases.

1. **Database.** The tables are the PHP site's; nothing new. If the server has
   not had them yet, run the scripts from the PHP project's `_setup/sql/`
   (`blog_subscribers.sql`, `blog_sso.sql`, and `members_schema_upgrade.sql`
   against `ihern2024`).
2. **Configuration.** Copy `.env.example` to `.env.production.local` and fill it
   in. `NEXT_PUBLIC_BASE_PATH` and `IHERN_SITE_URL` are used at build time.
3. **Build and run** from the repository root: `npm ci`, `npm run build`,
   then keep it running with `deploy/ecosystem.config.cjs` (pm2) or systemd.
4. **Web server.** The site is at the root of `https://ihern.iiitd.edu.in`
   (`NEXT_PUBLIC_BASE_PATH` empty), the blog at `/blog` of the same address.
   `deploy/apache.conf` has the Apache settings for both.
5. **The blog.** `IHERN_BLOG_URL` here is the blog's address, and the blog's
   `IHERN_SSO_CLIENT_SECRET` must equal `IHERN_SSO_BLOG_SECRET` here.
6. **Membership photographs** go to `IHERN_UPLOAD_DIR` (default `uploads/uploadDoc`,
   not publicly served; admins see them in the admin panel). Point it at the
   PHP `applications/uploadDoc` folder so the photographs members uploaded
   there keep showing.

## Membership admin panel

`/membership/admin` is the staff back office for membership registrations
(`ihern2024.studentregistration`), replacing the PHP `applications/admin`.
The old addresses (`applications/admin/`, `adminDashboard.php`, `index.php`,
`logout.php`, …) redirect to it.

- **Sign in** with the existing `adminlogin` accounts: same email, same
  password, same active flag. Nothing to migrate. After 5 wrong passwords for
  an address, that address must wait 15 minutes.
- **Dashboard:** active members (the PHP dashboard's count), inactive, all
  registrations, new in the last 30 days, and the latest registrations.
- **Members:** every registration with its photograph, searchable (name,
  email, mobile, membership number, organization, interests) and filtered by
  active / inactive. Per member: activate or deactivate, edit details and
  photograph, email a password reset link, delete (removes the photograph
  too).
- **Export:** "Export active members (CSV)" gives the PHP export's file and
  columns (`IHERNCandidateDetails.csv`, S.No. … Registration Date, active
  members in membership-number order). "Export everyone" adds inactive
  registrations and a Status column. Values a spreadsheet would run as
  formulas are prefixed with `'`.
- **Admin users:** add admins, deactivate or reactivate them (not yourself).
- **Change password:** signs out every other browser using the account.

Differences from the PHP panel, all deliberate:

- The PHP export (`exportStudentDetails.php`) answered anyone who posted to
  it, signed in or not. The export here needs a signed-in admin, and so do the
  photographs.
- The PHP panel recorded admin sign-ins in `authsession` under the admin's id.
  Members use the same table, so an admin signing in signed out the member
  with the same number. The session here is a signed cookie limited to
  `/membership/admin`. It ends when the admin's password or status changes.
- Deactivating a member also signs them out of the member dashboard.
- Admin passwords stay in `adminlogin`'s existing format (unsalted SHA-256),
  so the PHP panel can keep running alongside during the switch. That format
  is weak. Once the PHP panel is off, moving to a salted hash is a small
  change in `lib/admin.ts`.

## Not ported

- **Old fee and payment scripts** in `applications/` (`payNow*.php`,
  `paymentlink*.php`) from the IIIT-Delhi fee portal the membership system was
  built on; nothing on the site links to them. IHERC payment is an external
  link, as before.

## Intentional differences from the PHP site

- IHERC 2025: the PHP page ran two countdown scripts that raced; whichever
  finished last won ("Countdown Ended" or a row of zeros). This shows
  "Countdown Ended" consistently.
- IHERC 2025 inner pages: the PHP pages wrongly highlighted "About" in the
  menu (the 2026 pages had already been fixed); here the current page is
  highlighted.
- IHERC in-page links land on their section even when photos above it finish
  loading during the scroll (the PHP version could stop short).
- The member dashboard uses the site's own design instead of the old admin
  template, with the same details and a Print button. A signed-in member who
  opens member sign-in goes to their dashboard (the PHP page signed them out).
