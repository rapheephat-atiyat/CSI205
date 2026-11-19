# Performance audit — 2026-11-19

Branch: `fix/site-performance`, initially based on `dev` at `4a5288d` after FAQ PR #73; merged current `dev` at `b33ec5b` before opening the performance PR. The upstream rear-camera selection/fallback fix is preserved alongside deferred loading and cancellation guards.
Next.js 16.4.6 / React 19.3.0 / OpenNext Cloudflare 1.20.17 / Wrangler 4.165.0.

## Changes

- Cache public event summaries and published FAQ with `use cache`, tags, and `cacheLife({ stale: 60, revalidate: 60, expire: 300 })`. Failed reads throw; errors are not converted into cached demo content.
- Invalidate the matching tag after successful admin event/category/question writes. Authentication, checkout, stock, orders and wallet balances are not shared cached.
- Select only `EventSummary` columns instead of fetching descriptions and other unused event fields for the catalog.
- Read orders through the server service, removing the server-to-own-HTTP-API round trip. Deduplicate layout/page authentication with React `cache` within a render only.
- Import `html5-qrcode` when the camera button is clicked. Cancel pending initialization when closing/unmounting; manual entry remains available.
- Render public FAQ category icons on the server. Keep the admin icon picker dynamic so admins can still choose supported Lucide icons.
- Remove hardcoded homepage stock banners and public demo-event fallbacks. Images come from saved event records; missing images get a text/icon empty state. Existing seed files and database records are not deleted.
- Show a retryable error with a Toast when public event reads fail.
- Serve fingerprinted `/_next/static/*` assets with immutable one-year headers using Cloudflare's `public/_headers` support.
- Ignore generated `cloudflare-env.d.ts`, avoiding generated runtime declarations in Tailwind's source scan. Generate bindings with `npm run cf-typegen`.

## Cache without R2

`open-next.config.ts` uses the installed SDK's KV incremental cache, D1 Next-mode tag cache and Durable Object revalidation queue. The previous static-assets cache was read-only and explicitly did not support composable `use cache` writes.

New resources in the existing Cloudflare account:

| Binding | Resource | Purpose |
| --- | --- | --- |
| `NEXT_INC_CACHE_KV` | `csi205-next-cache` | Public content and incremental cache |
| `NEXT_TAG_CACHE_D1` | `csi205-next-tags` (APAC) | Tag invalidation timestamps |
| `NEXT_CACHE_DO_QUEUE` | `DOQueueHandler`, migration `v1-cache-queue` | Background revalidation; created when the Worker is deployed |

Only the new remote D1 cache table was initialized. No production PostgreSQL migration, seed or data write was performed. No Worker was deployed for this change.

KV is eventually consistent: updates can take 60 seconds or longer to appear in other locations. The 60-second revalidation / 300-second expiry settings are Next cache policies, not a guaranteed cross-region freshness bound. D1 tags invalidate old entries, but this is not a promise of globally instant publication. Critical transactional data continues to use fresh service reads. Direct database edits/seeds bypass admin invalidation and rely on revalidation.

The resources require the normal Cloudflare KV, D1 and Durable Objects quotas. Existing Worker compatibility settings and unrelated bindings were preserved. Production must be released through `dev` → `main`, not by manually deploying this branch.

Sources: [OpenNext caching](https://opennext.js.org/cloudflare/caching), [KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/), and the installed Next `use-cache.md`, `cacheLife.md`, `revalidateTag.md` guides.

## HTTP measurements

Actual production `next start` on `127.0.0.1:3018`, anonymous requests, same machine and configured remote PostgreSQL, no CPU/network throttling. Each route has one first request followed by three sequential warm samples; numbers below are full-response times, not LCP or TTFB.

| Route | Before first / warm median (range), ms | After first / warm median (range), ms |
| --- | --- | --- |
| `/` | 2571 / 187 (159–478) | 1656 / 71 (61–110) |
| `/events` | 361 / 148 (146–154) | 135 / 42 (41–57) |
| `/api/events` | 1366 / 213 (113–224) | 232 / 5 (4–7) |
| `/faq` | 458 / 147 (138–164) | 228 / 46 (33–51) |
| `/api/faq` | 182 / 110 (109–112) | 15 / 5 (4–5) |
| `/e/checkout-demo-closed` | 671 / 336 (331–343) | 566 / 341 (331–356) |

The event detail route was not optimized and showed no warm improvement. The remote public dataset changed from 28 to 29 events between measurements, so these are indicative latency comparisons, not a controlled payload-size experiment. HTTP samples preceded the final camera-only upstream merge; public cache implementation was unchanged by that merge. No claim is made that every user or production region will see the same reduction. Removing the homepage banner also changes its content and resource requirements.

Read-only diagnostics before changes found about 60 KB of event descriptions across 28 rows that the catalog query did not need. This is database query payload, not browser JavaScript savings.

## Browser bundle measurements

Named snapshots, whole application (68 routes):

1. `perf-before-20261119` → `perf-scanner-20261119`: defer camera library.
2. `perf-scanner-20261119` → `perf-faq-icons-20261119`: server FAQ icons; exclude generated Cloudflare types from Tailwind scanning.
3. `perf-faq-icons-20261119` → `perf-final-20261119`: remove hardcoded banner/demo fallbacks and unused order client state/logs; add event error/retry UI.
4. `perf-final-20261119` → `perf-merged-20261119`: preserve upstream rear-camera fix. Final table below uses this merged capture; scanner UI smoke and Linux build/dry-run were repeated successfully.

The scanner intermediate capture temporarily included 1,717 extra compressed CSS bytes from the generated binding declarations. The subsequent capture removes that noise. Every accepted capture is preserved, rather than replacing the initial baseline.

Metric: synchronous reachable **compressed build attribution** for client JS/CSS, using known client bootstrap/client-reference roots. Deduplicate `(filename, source_path)` attribution across routes. These are not browser transfer measurements or predicted network savings.

| Route | Before bytes | Final bytes | Difference |
| --- | ---: | ---: | ---: |
| `/` | 330174 | 322104 | -8070 (-2.4%) |
| `/events` | 323391 | 323723 | +332 (+0.1%, error/retry UI) |
| `/faq` | 348125 | 326458 | -21667 (-6.2%) |
| `/vendor/scan` | 403091 | 288301 | -114790 (-28.5%) |
| `/account` | 344280 | 344181 | -99 |
| `/profile` | 215434 | 215359 | -75 |

The scanner package remains available as an asynchronous import (~114,928 compressed attributed bytes) after a camera click. It was moved out of synchronous reachability, not removed. Public FAQ no longer imports `lucide-react/dynamic` on the client; saved icon names still render as server SVGs.

### Graph evidence and candidate decisions

Whole emitted client scope was clustered with an undirected, unweighted synchronous graph using Louvain resolution 1 / seed 7. All whole-graph intermediary modules were retained so optimized barrel modules did not disconnect import chains. Directed minimum cuts used capacity 1 for application-source import edges and 1,000,000 for protected dependency/runtime edges.

| Candidate / importer | Evidence and decision | Behavioral verification |
| --- | --- | --- |
| `app/vendor/scan/components.tsx` → `html5-qrcode` | Initial `/vendor/scan` synchronous cut cost 2: imports into `esm/index.js <locals>` and `esm/html5-qrcode.js`. Final graph has no synchronous path from the route's known roots to this package. Accepted as size optimization. | Invalid manual UUID rejected; valid UUID opens confirmation; cancel works. Camera click loads the deferred module, close during compilation stays closed afterwards, reopen/close works. Hardware QR decoding was not verified; no camera permission was granted. |
| `app/(main)/faq/FaqClient.tsx` → Lucide dynamic registry | Server-render icon SVGs; accepted as size optimization. Public FAQ Lucide attribution falls from ~28.6 KB to ~7.1 KB. | All five category icons visible, category filtering, case-insensitive `qr code` search, no-results/clear, keyboard expand and answers checked on rendered UI. |
| Homepage carousel | Removed per user's no-mock request, not substituted with another stock image. | Actual Worker-rendered homepage checked on mobile/desktop; carousel absent and event links/images from saved records remain. |
| ExcelJS | ~255 KB across applicable async outputs; already imported on export. No speculative additional deferral. | Existing behavior preserved; not a newly verified export workflow. |
| Recharts | ~139 KB across relevant routes, used by visible dashboards. No blind deferral or removal. | Existing behavior preserved; not a newly verified dashboard workflow. |
| Brand logo | Raw build asset ~267 KB is not its actual image-optimized network transfer; already uses responsive Next Image. No unsupported savings claim. | Existing branding preserved. |
| Event detail client boundary / font weights | Potential future work; not changed without comparable rendering and browser timing evidence. | Unverified candidates, not accepted optimizations. |

Graph conditions: route membership and build roots describe the known static graph; client async triggers, runtime navigations and browser scheduling are separate observations. No unsupported chunk coverage was reported. Final export coverage: 2,710 exact client chunks and 1,731 non-chunk asset records; no groups missing trigger joins. Optimized concatenation limits some source-to-output-member identity joins, addressed below.

### Client-dependency scan

The initial direct output-member scan had zero heuristic matches. A second scan of **all emitted client source parts, including async assets**, found 17 intentional Better Auth browser modules (6,399 compressed attributed bytes total). Direct module membership alone misses concatenated source parts and must not be presented as an exhaustive clean bill of health.

All rows below are suppressed intentional browser code imported by `lib/auth-client.ts` through `better-auth/react` / `better-auth/client/plugins`. The source `Auth` import is type-only; no `lib/auth.ts`, project `server/`, TypeORM, PostgreSQL driver or migrations implementation was found in the emitted client source parts. No `use server` directives/client-imported Server Actions were found in the project's app/components/lib/server TS/TSX sources.

Emitted identity convention for the following table: `[project]/node_modules/better-auth/dist/<path> [app-client] (ecmascript)` (some graph variants add `<locals>`). Exact emitted **part** filenames and module variants are retained in `client-dependencies.json`. A module variant is not itself a direct output-member identity when concatenated; source-part attribution is the evidence of browser bytes.

Affected routes (same for all 17 rows): `/`, `/account`, `/account/orders`, `/account/tickets`, `/account/wallet`, `/admin`, `/admin/[slug]`, `/admin/[slug]/history`, `/admin/[slug]/reports`, `/admin/[slug]/settings`, `/admin/[slug]/tickets`, `/admin/[slug]/tickets/payments`, `/admin/[slug]/users`, `/admin/[slug]/vendors`, `/admin/create`, `/admin/faq`, `/auth/login`, `/auth/register`, `/e/[slug]`, `/e/[slug]/book`, `/e/[slug]/book/order/[id]`, `/events`, `/faq`, `/login`, `/register`, `/signup`.

| Source / emitted identity path | Compressed bytes | Disposition + evidence |
| --- | ---: | --- |
| `client/config.mjs` | 986 | Suppressed: browser fetch client configuration |
| `client/fetch-plugins.mjs` | 132 | Suppressed: browser redirect/fetch lifecycle |
| `client/parser.mjs` | 702 | Suppressed: response parsing |
| `client/equality.mjs` | 249 | Suppressed: browser state comparison |
| `client/query-atom.mjs` | 104 | Suppressed: client query state |
| `client/broadcast-channel.mjs` | 415 | Suppressed: cross-tab session notifications |
| `client/focus-manager.mjs` | 299 | Suppressed: browser focus handling |
| `client/online-manager.mjs` | 309 | Suppressed: browser connectivity handling |
| `client/session-refresh.mjs` | 656 | Suppressed: browser session refresh |
| `client/session-atom.mjs` | 928 | Suppressed: calls session endpoint; no server session store |
| `client/react/react-store.mjs` | 208 | Suppressed: React browser store |
| `client/react/index.mjs` | 183 | Suppressed: `createAuthClient` browser entry |
| `client/proxy.mjs` | 514 | Suppressed: browser API proxy |
| `utils/url.mjs` | 565 | Suppressed: public URL construction |
| `utils/is-atom.mjs` | 71 | Suppressed: public client utility |
| `plugins/additional-fields/client.mjs` | 75 | Suppressed: type inference plugin browser stub |
| `package.mjs` | 3 | Suppressed: package metadata |

### Possible server-only leaks

No possible server-only implementation leak was found in the scoped scan. Heuristics are not a complete secret audit. There were no boundary-remediation edits or unresolved ownership findings.

### Evidence gaps

- Optimized concatenated source parts do not all appear as individual output-member identities. The full part scan supplements that gap; exact variant/part provenance is recorded separately.
- No browser performance trace, field/CrUX data, LCP/INP/CLS measurement, or deterministic `instant()` validation was available. CUA's read-only DOM evaluator does not expose the browser performance API. Do not call the app Core Web Vitals-compliant or claim proven instant navigation from this audit.
- Next's dev diagnostic identified the first event thumbnail as a possible LCP image loaded lazily; image priority remains a follow-up requiring browser timing validation.
- QR hardware decoding and cross-region KV consistency were not exercised. No new camera permission was granted.
- Database geography was not verified, so Worker placement was not guessed. Existing Worker observability configuration has no explicitly enabled logs/traces; production tracing remains follow-up work.

## Verification

- Targeted ESLint for all changed/new TypeScript files: passed, no warnings.
- `npm run build`: passed, including TypeScript and all 57 prerendered pages.
- `npm run test:db`: passed, 2 membership regression checks.
- `npm run test:faq`: passed, 9 tests using real Next HTTP handlers + sessions against a newly created, migrated, isolated localhost PostgreSQL database. Covers authorization/drafts/validation, cache reuse, admin invalidation, event create/update/delete and empty catalog without demo replacements. The runner never loads `.env` and drops only the database it created.
- Next dev MCP `get_errors`: no config or browser-session errors during UI smoke tests. This is a smoke check, not the full `next-dev-loop` / `instant()` rig.
- Rendered UI: FAQ search/categories/keyboard/empty state; orders with PAID filtering and two separate users (first user's order absent for second user); scanner manual UUID/confirmation/cancel/deferred open/close. Mobile 390×844 and desktop 1280×900: no document horizontal overflow observed on public homepage/FAQ.
- `npm run cf-typegen`: passed using installed Wrangler schema; generated binding file ignored.
- Native Windows OpenNext packaging encountered `EPERM` while creating a symlink. Re-tested in the existing official `node:24.15.0-bookworm-slim` Linux container, with isolated Linux dependencies/build output: **OpenNext build passed**. No Windows security settings or app dependencies changed to bypass this.
- Linux `wrangler deploy --dry-run`: passed again after merging upstream, no upload/deploy. Final reported Worker gzip size 8,552.53 KiB, with expected KV/D1/DO bindings. Slim-image local runtime needed Debian CA certificates; TLS verification stayed enabled.
- Local OpenNext/Workerd preview: populated 40 KV entries and the D1 cache table; `/api/events`, `/api/faq`, `/`, `/faq` all returned HTTP 200. Local KV inspection confirmed `.composable` cache writes. Bindings used local mode; no production cache content was written by this preview.
- The older PR #73 optional `Workers Builds: csi205` check failed. Its logs require a Cloudflare Dashboard login not present in the test browser; the failure reason is not established. Its required `Cloudflare npm ci` check passed, and #73 was merged to dev before optimization. A successful local Linux build does not establish that the external build was repaired.

## Installed skills

Installed globally, 14 skills; app dependencies were not added for them. Read the relevant skill instructions and installed Next/OpenNext guides before applying changes. Installing a skill does not mean every optional audit in it was run.

| Source | Installed skills |
| --- | --- |
| [vercel/next.js](https://github.com/vercel/next.js/tree/canary/skills) | `next-bundle-optimizer`, `next-cache-components-adoption`, `next-cache-components-optimizer`, `next-dev-loop`, `next-partial-prefetching-adoption`, `next-partial-prefetching-optimizer` |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) | `react-best-practices` |
| [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | `performance`, `core-web-vitals` |
| [supabase/agent-skills](https://github.com/supabase/agent-skills) | `supabase-postgres-best-practices` |
| [cloudflare/skills](https://github.com/cloudflare/skills) | `web-perf`, `workers-best-practices`, `nextjs-on-cloudflare`, `wrangler` |

Existing OpenNext was preserved; no framework migration was performed.

## Reproducing the evidence

Machine-local artifacts are under `C:/Users/raphe/.codex/visualizations/2026/11/18/01a1eef8-3324-74a3-bbe7-e032823873ff/`: `performance-before.json`, `performance-after.json`, `worker-smoke.json`, five analyzer JSONL gzip exports and summaries, `client-dependencies.json`, `client-dependencies-merged.json`, and real browser screenshots.

Capture with the installed CLI:

```sh
node node_modules/next/dist/bin/next analyze --output --snapshot <unique-name>
# Git Bash / Linux, with pipefail:
set -o pipefail
node node_modules/next/dist/bin/next analyze export --snapshot <unique-name> | gzip > <artifact>.jsonl.gz
```

For API integration tests, start a separate local PostgreSQL instance and set `TEST_DATABASE` to a **new, unused** localhost database named `tuatua_faq_api_test_<8 hexadecimal characters>` before `npm run test:faq`. Do not substitute a real development or production database.

For Cloudflare verification, run the installed OpenNext build followed by Wrangler `deploy --dry-run` and OpenNext `preview` in Linux/WSL. A dry run and local preview do not deploy the Worker or prove production-region behavior.
