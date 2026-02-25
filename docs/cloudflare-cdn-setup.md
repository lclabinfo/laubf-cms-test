# Cloudflare CDN Setup Guide

This guide covers how to set up Cloudflare CDN for our Next.js project, what the free plan includes, and step-by-step configuration for someone who has never used Cloudflare before.

---

## Table of Contents

1. [What is Cloudflare?](#what-is-cloudflare)
2. [Free Plan — What You Get](#free-plan--what-you-get)
3. [How Cloudflare CDN Works](#how-cloudflare-cdn-works)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Cache Rules for Next.js](#cache-rules-for-nextjs)
6. [Next.js Configuration](#nextjs-configuration)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Security Features (Free)](#security-features-free)
9. [Speed Optimizations](#speed-optimizations)
10. [Analytics](#analytics)
11. [Cloudflare with Vercel vs Self-Hosted](#cloudflare-with-vercel-vs-self-hosted)
12. [Free vs Pro vs Business](#free-vs-pro-vs-business)
13. [Image Optimization](#image-optimization)
14. [Cloudflare Workers & Pages](#cloudflare-workers--pages)
15. [Recommended Configuration for This Project](#recommended-configuration-for-this-project)

---

## What is Cloudflare?

Cloudflare is a reverse proxy that sits between your visitors and your server. When someone visits your site, the request goes through Cloudflare's global network (330+ data centers) before reaching your server. This gives you:

- **CDN (Content Delivery Network)** — Static files are cached at edge locations worldwide, so visitors get content from a server near them instead of your origin server.
- **DDoS Protection** — Cloudflare absorbs malicious traffic before it hits your server.
- **SSL/TLS** — Free HTTPS certificates.
- **DNS** — Fast, reliable DNS hosting.
- **Firewall** — Block bad actors, bots, and suspicious traffic.

---

## Free Plan — What You Get

No credit card required. No bandwidth limits. No request limits for CDN.

| Feature | Free Plan |
|---|---|
| **CDN** | Global, 330+ data centers, unlimited bandwidth |
| **DNS** | Fast authoritative DNS hosting |
| **SSL/TLS** | Universal SSL certificate (shared) |
| **DDoS Protection** | Unmetered, unlimited (L3/L4/L7) |
| **WAF Custom Rules** | 5 rules |
| **WAF Managed Rulesets** | Cloudflare Free Managed Ruleset |
| **Rate Limiting** | Unmetered (1 rule) |
| **Cache Rules** | 10 rules |
| **Page Rules** (legacy) | 3 rules |
| **Bot Protection** | Bot Fight Mode (basic) |
| **Brotli Compression** | Yes (default) |
| **HTTP/2** | Yes (default) |
| **HTTP/3 (QUIC)** | Yes |
| **Early Hints (103)** | Yes |
| **Always Online** | Yes (serves cached pages when origin is down) |
| **Web Analytics** | Yes (privacy-first, Core Web Vitals) |
| **Rocket Loader** | Yes (but don't use with Next.js — see below) |

### What's NOT on Free

- Image Optimization (Polish) — requires Pro ($20/mo)
- Full OWASP WAF Ruleset — requires Pro
- Advanced Bot Management (ML) — requires Business ($200/mo)
- Custom Nameservers — requires Business
- SLA guarantees — Enterprise only

---

## How Cloudflare CDN Works

### The Big Picture

```
Without Cloudflare:
  Visitor (Tokyo) ──────────────────────> Your Server (Los Angeles)
                     ~150ms latency

With Cloudflare:
  Visitor (Tokyo) ──> Cloudflare Edge (Tokyo) ──> Your Server (Los Angeles)
                      ~5ms (cache HIT)            only on cache MISS
```

### How It Works Step by Step

1. You point your domain's **nameservers** to Cloudflare.
2. When a visitor requests your site, DNS resolves to **Cloudflare's edge** (not directly to your server).
3. Cloudflare checks its edge cache:
   - **Cache HIT** — Serves content directly from the nearest edge node. Your server is never contacted.
   - **Cache MISS** — Forwards the request to your server, caches the response, serves it to the visitor.
4. Future requests from the same region get the cached version.

### What Gets Cached by Default

Cloudflare **automatically caches** files with these extensions: `.js`, `.css`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.woff`, `.woff2`, `.ttf`, `.pdf`, `.mp4`, `.webm`, `.zip`, and 60+ others.

**HTML and JSON are NOT cached by default.** You need explicit Cache Rules to cache them.

---

## Step-by-Step Setup

### Step 1: Create a Cloudflare Account

1. Go to [cloudflare.com](https://www.cloudflare.com).
2. Click **Sign Up**.
3. Enter your email and a password.
4. No credit card needed for the Free plan.

### Step 2: Add Your Domain

1. In the Cloudflare dashboard, click **"Add a Domain"** (or "Add a Site").
2. Enter your domain name (e.g., `yourdomain.com`).
3. Select the **Free** plan when prompted.
4. Click **Continue**.

Cloudflare will automatically scan your existing DNS records and import them. This takes about 30 seconds.

### Step 3: Review DNS Records

1. Cloudflare shows you the DNS records it found. Review them:
   - Make sure your main `A` record (or `CNAME`) pointing to your server is there.
   - Each record has a **proxy toggle** (orange cloud = proxied, grey cloud = DNS only).
2. Set your main domain record to **Proxied** (orange cloud). This enables CDN, caching, and DDoS protection.
3. Leave email-related records (MX, SPF, DKIM) as **DNS only** (grey cloud) — you don't want email going through the CDN.

**If self-hosted (VPS):**
- `A` record: `yourdomain.com` → `YOUR_SERVER_IP` (Proxied)
- `A` record: `www` → `YOUR_SERVER_IP` (Proxied)

**If using Vercel:**
- `CNAME` record: `yourdomain.com` → `cname.vercel-dns.com` (DNS only — see Vercel section below)

### Step 4: Change Your Nameservers

This is the most important step. Cloudflare will give you two nameservers, like:
```
ada.ns.cloudflare.com
bob.ns.cloudflare.com
```

1. Go to your **domain registrar** (where you bought your domain — Namecheap, GoDaddy, Google Domains, Porkbun, etc.).
2. Find the **Nameservers** setting for your domain.
3. Replace the existing nameservers with the two Cloudflare nameservers.
4. Save the changes.

**Important:** If you have DNSSEC enabled at your registrar, **disable it first** before changing nameservers. You can re-enable it through Cloudflare afterward.

**Propagation time:** Usually 5-30 minutes, but can take up to 24 hours. Cloudflare will email you when your site is active.

### Step 5: Configure SSL/TLS

Once your domain is active on Cloudflare:

1. Go to **SSL/TLS** in the left sidebar.
2. Click **Overview**.
3. Set the encryption mode to **Full (Strict)** (see SSL section below for details).
4. Go to **SSL/TLS → Edge Certificates**:
   - Enable **Always Use HTTPS** — redirects all HTTP requests to HTTPS.
   - Enable **Automatic HTTPS Rewrites** — fixes mixed content (http:// links in your HTML).
   - Set **Minimum TLS Version** to **1.2**.

### Step 6: Set Up Cache Rules

1. Go to **Caching → Cache Rules** in the left sidebar.
2. Create rules for your Next.js app (detailed in the next section).

### Step 7: Enable Speed Optimizations

1. Go to **Speed → Optimization** in the left sidebar.
2. Verify these are enabled:
   - **Brotli** compression — should be on by default.
   - **Early Hints** — enable if not already on.
   - **HTTP/2** — should be on by default.
   - **HTTP/3 (with QUIC)** — enable it.
3. **Leave Rocket Loader OFF** — it breaks React/Next.js hydration.

### Step 8: Verify Everything Works

1. Open your site in a browser.
2. Open **DevTools → Network** tab.
3. Reload the page.
4. Click on a `.js` or `.css` file and look at the **Response Headers**:
   - `cf-cache-status: HIT` — Cloudflare served it from cache.
   - `cf-cache-status: MISS` — First request, Cloudflare fetched from your server and cached it.
   - `cf-cache-status: DYNAMIC` — Not cached (HTML pages by default).
   - `cf-ray: abc123-LAX` — Confirms traffic is going through Cloudflare (LAX = Los Angeles edge).
5. Check your SSL certificate — it should show "Cloudflare Inc" as the issuer.

---

## Cache Rules for Next.js

Go to **Caching → Cache Rules** and create these rules. You get 10 on the Free plan.

### Rule 1: Cache Next.js Static Assets (Highest Priority)

- **When:** URI Path starts with `/_next/static/`
- **Then:** Cache eligible
  - Edge TTL: **1 year** (365 days)
  - Browser TTL: **1 year**
- **Why:** These files have content hashes in their names (e.g., `_next/static/chunks/abc123.js`). When the content changes, the filename changes. Safe to cache forever.

### Rule 2: Cache Public Static Assets

- **When:** URI Path starts with `/images/` OR `/fonts/` OR matches static file extensions
- **Then:** Cache eligible
  - Edge TTL: **30 days**
  - Browser TTL: **30 days**

### Rule 3: Bypass Cache for API Routes

- **When:** URI Path starts with `/api/`
- **Then:** Bypass cache
- **Why:** API routes return dynamic, user-specific data. Never cache these.

### Rule 4: Bypass Cache for CMS Admin

- **When:** URI Path starts with `/cms/`
- **Then:** Bypass cache
- **Why:** Admin pages are authenticated and dynamic.

### Rule 5: Bypass Cache for Auth Routes

- **When:** URI Path starts with `/auth/` OR `/api/auth/`
- **Then:** Bypass cache

### Rule 6: Cache Public Website HTML (Optional)

- **When:** URI Path does NOT match `/api/*`, `/cms/*`, `/auth/*`
- **Then:** Cache eligible
  - Edge TTL: **1 hour**
  - Browser TTL: **0** (or very short)
- **Why:** Public pages can be edge-cached for speed. Keep TTL short so content updates propagate quickly.

---

## Next.js Configuration

### Cache-Control Headers in `next.config.ts`

For self-hosted Next.js, configure headers so Cloudflare knows how to cache:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        // Immutable static assets (content-hashed by Next.js)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public folder static files (images, fonts, etc.)
        source: '/:all*(css|js|gif|svg|jpg|jpeg|png|woff|woff2|avif|webp|ico)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API routes — never cache
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // Public website pages — CDN caches for 1 hour, browser always revalidates
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};
```

### Key Cache-Control Directives

| Directive | What It Does |
|---|---|
| `public` | Content can be cached by Cloudflare |
| `private` | Cloudflare will NOT cache this |
| `max-age=N` | Browser caches for N seconds |
| `s-maxage=N` | CDN (Cloudflare) caches for N seconds. Overrides `max-age` for the CDN. **This is the most important directive.** |
| `immutable` | Content will never change. Safe to cache forever. |
| `no-store` | Don't cache at all |
| `stale-while-revalidate=N` | Serve stale content for N seconds while fetching fresh content in the background |

### Cloudflare-Specific Headers

You can use special headers to control Cloudflare independently from browser caching:

```typescript
// In a Next.js API route or middleware
headers.set('Cache-Control', 'public, max-age=0, must-revalidate');  // Browser: don't cache
headers.set('CDN-Cache-Control', 'public, s-maxage=3600');            // CDN: cache 1 hour
```

- `CDN-Cache-Control` — Respected by Cloudflare (and other CDNs). Cloudflare strips it before sending to the browser.
- `Cloudflare-CDN-Cache-Control` — Only respected by Cloudflare. Other CDNs ignore it.

### ISR (Incremental Static Regeneration) Gotcha

If you use Next.js ISR, Cloudflare's edge cache can get out of sync:
- Next.js revalidates a page and generates new HTML.
- But Cloudflare's edge still serves the old cached version until its TTL expires.

**Fix:** Keep Cloudflare's edge TTL ≤ your Next.js revalidation period. Or use Cloudflare's [Cache Purge API](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/) to purge specific URLs after revalidation.

---

## SSL/TLS Configuration

### SSL Modes Explained

| Mode | Visitor → Cloudflare | Cloudflare → Your Server | Notes |
|---|---|---|---|
| **Off** | HTTP | HTTP | No encryption at all. Don't use this. |
| **Flexible** | HTTPS | HTTP | Visitor sees HTTPS but your server connection is unencrypted. **Dangerous — don't use.** |
| **Full** | HTTPS | HTTPS | Encrypted both ways, but Cloudflare doesn't validate your server's certificate. |
| **Full (Strict)** | HTTPS | HTTPS (validated) | Encrypted both ways, certificate validated. **Use this.** |

### How to Set Up Full (Strict)

1. In Cloudflare dashboard: **SSL/TLS → Overview** → Select **Full (Strict)**.
2. Generate a **Cloudflare Origin CA certificate**:
   - Go to **SSL/TLS → Origin Server**.
   - Click **Create Certificate**.
   - Choose RSA or ECDSA (either is fine).
   - Set validity (15 years is the max, good for set-and-forget).
   - Click **Create**.
   - Copy the **certificate** and **private key**.
3. Install the certificate on your server:
   - Save the certificate as `origin.pem` and the key as `origin.key`.
   - Configure your web server (Nginx, Caddy, etc.) to use these files.

**Nginx example:**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/ssl/origin.pem;
    ssl_certificate_key /etc/ssl/origin.key;

    # ... proxy to Next.js
}
```

---

## Security Features (Free)

### DDoS Protection
- **Always on, unmetered, unlimited** on all plans including Free.
- Cloudflare has mitigated attacks of 26M+ requests/second for Free plan customers.
- No configuration needed.

### WAF (Web Application Firewall)
- **5 custom rules** — block/challenge by IP, country, URI, user agent, etc.
- **Cloudflare Free Managed Ruleset** — automatically deployed, protects against high-severity vulnerabilities.

Example custom rules:
- Block all traffic from a specific country.
- Challenge requests to `/cms/*` that don't come from your IP.
- Block requests with suspicious user agents.

### Bot Fight Mode
- Basic bot detection — challenges suspected bots with CAPTCHAs/JS challenges.
- Enable at **Security → Bots → Bot Fight Mode**.

### Rate Limiting
- 1 rate limiting rule on Free.
- Example: Limit `/api/*` to 100 requests per minute per IP.

### Other Security Settings
- **Always Use HTTPS** — Redirect HTTP → HTTPS automatically.
- **Automatic HTTPS Rewrites** — Fix mixed content.
- **Email Obfuscation** — Hide email addresses from scrapers.
- **Under Attack Mode** — Enable during active attacks for extra JS challenges.

---

## Speed Optimizations

### What to Enable (Free Plan)

| Feature | Enable? | Notes |
|---|---|---|
| **Brotli** | Yes (default) | 20-25% smaller than gzip |
| **HTTP/2** | Yes (default) | Multiplexing, header compression |
| **HTTP/3 (QUIC)** | Yes | Faster connections, especially on mobile |
| **Early Hints (103)** | Yes | Browser preloads resources before HTML arrives |
| **0-RTT Connection Resumption** | Yes | Returning visitors connect faster |
| **Rocket Loader** | **NO** | Breaks React/Next.js hydration |

### Why NOT Rocket Loader

Rocket Loader defers all JavaScript loading until after the page renders. This conflicts with Next.js because:
- React hydration depends on JS loading in a specific order.
- Components won't be interactive until Rocket Loader decides to load the JS.
- You'll see flash of unstyled/non-interactive content.

Next.js already handles JS optimization through code splitting and dynamic imports. Rocket Loader adds no benefit and causes breakage.

---

## Analytics

### Cloudflare Web Analytics (Free)

Privacy-first analytics, no cookies, GDPR-friendly.

**What you get:**
- Page views, unique visitors, referrers.
- Browser, OS, country breakdown.
- **Core Web Vitals** from real users (LCP, INP, CLS).
- 6 months data retention.

**Setup:**
1. Go to **Analytics & Logs → Web Analytics** in the Cloudflare dashboard.
2. Add your site.
3. Cloudflare auto-injects the analytics snippet for proxied domains (no code changes needed).
4. Or manually add to your layout:

```tsx
// app/(website)/layout.tsx
<Script
  defer
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'
  strategy="afterInteractive"
/>
```

### Dashboard Analytics

When your domain is proxied through Cloudflare, you also get:
- Total requests, bandwidth, unique visitors.
- Cache hit ratio (how much traffic Cloudflare handled without hitting your server).
- Threats blocked, firewall events.
- DNS query volume.

---

## Cloudflare with Vercel vs Self-Hosted

### Self-Hosted (VPS) — Ideal Setup

```
Visitor → Cloudflare Edge (CDN + SSL + DDoS) → Your VPS (Next.js)
```

This is the best use case for Cloudflare CDN. You get:
- Free SSL termination at the edge.
- Free DDoS protection.
- Static assets cached globally.
- Reduced origin server load.
- No conflicts with another CDN.

### Vercel — Use DNS Only

**Vercel officially does NOT recommend proxying through Cloudflare.** Issues:

1. **Double CDN** — Vercel already has a global edge network. Adding Cloudflare as a proxy means traffic goes through two CDNs, adding latency.
2. **Cache conflicts** — Vercel's `Forwarded` headers change with every request (including client IP), causing Cloudflare's cache to fragment and almost never achieve a HIT.
3. **Broken security** — Vercel's DDoS protection and bot detection only see Cloudflare's IPs, not real visitor IPs.

**If using Vercel:** Set DNS records to **DNS only** (grey cloud, not proxied). You get Cloudflare's fast DNS but let Vercel handle CDN, caching, and security.

---

## Free vs Pro vs Business

| Feature | Free | Pro ($20/mo) | Business ($200/mo) |
|---|---|---|---|
| CDN & DDoS | Unlimited | Unlimited | Unlimited |
| SSL | Universal (shared) | Universal + Advanced | Universal + Advanced |
| WAF Custom Rules | 5 | 20 | 100 |
| WAF Managed Rulesets | Free ruleset | Full OWASP + Cloudflare Managed | All managed rulesets |
| Cache Rules | 10 | 25 | 50 |
| Rate Limiting | 1 rule | Multiple rules | Multiple rules |
| Bot Protection | Basic | Super Bot Fight Mode | Advanced (ML) |
| Image Optimization (Polish) | No | Yes | Yes |
| Support | Community | Email (24hr) | Priority email (8hr) |
| SLA | None | None | 100% uptime |

### When to Upgrade

- **Stay on Free:** Small-to-medium traffic site, you use Next.js `<Image>` for image optimization, 5 WAF rules is enough.
- **Upgrade to Pro ($20/mo):** You need automatic image optimization (Polish/WebP), more WAF rules, or OWASP managed ruleset.
- **Upgrade to Business ($200/mo):** You need advanced bot management, 100+ WAF rules, or an SLA.

---

## Image Optimization

### Polish (Pro+ Only, $20/mo)
- Automatically compresses images (lossless or lossy).
- Converts to WebP when the browser supports it.
- No code changes needed — applied at the edge.

### For Free Plan
Use **Next.js `<Image>` component** instead. It handles:
- Automatic resizing to the right dimensions.
- Format conversion (WebP, AVIF).
- Lazy loading.
- Works on all Cloudflare plans because optimization happens at your server, not the CDN.

---

## Cloudflare Workers & Pages

### Cloudflare Pages (Static Hosting)

Free plan includes:
- Unlimited sites, bandwidth, and requests.
- 500 builds/month.
- Git integration (GitHub, GitLab).
- Preview deployments on every PR.

Good for static Next.js exports (`output: 'export'`).

### Cloudflare Workers (Serverless)

Free plan includes:
- 100,000 requests/day.
- 10ms CPU time per invocation.

### Full Next.js on Cloudflare (via OpenNext)

You can deploy your entire Next.js app ON Cloudflare:
1. Use the `@opennextjs/cloudflare` adapter.
2. SSR runs on Workers, static assets on Pages.
3. No separate server needed.

**Relevance for this project:** If you're self-hosted on a VPS, Workers/Pages aren't needed — use Cloudflare purely as a CDN proxy. If you want to eliminate the VPS entirely, OpenNext on Cloudflare Workers is a viable free alternative (for <100K requests/day).

---

## Recommended Configuration for This Project

### If Self-Hosted (VPS) — Recommended

1. **Plan:** Free
2. **SSL:** Full (Strict) with Cloudflare Origin CA certificate
3. **Cache Rules:**
   - Cache `/_next/static/*` — 1 year TTL
   - Cache `/images/*`, `/fonts/*` — 30 days TTL
   - Bypass `/api/*` — never cache
   - Bypass `/cms/*` — never cache
   - Bypass `/auth/*` — never cache
   - Optionally cache public HTML — 1 hour edge TTL
4. **Enable:** Brotli, HTTP/2, HTTP/3, Early Hints
5. **Disable:** Rocket Loader
6. **Analytics:** Enable Web Analytics (auto-injected for proxied domains)
7. **Security:** Enable Bot Fight Mode, set up 1-2 WAF rules for admin protection

### If on Vercel

1. Use Cloudflare for **DNS only** (grey cloud, not proxied)
2. Let Vercel handle CDN, caching, SSL, DDoS
3. Optionally add Cloudflare Web Analytics snippet

### Quick Reference: Response Headers to Watch

| Header | Meaning |
|---|---|
| `cf-cache-status: HIT` | Served from Cloudflare's cache |
| `cf-cache-status: MISS` | Fetched from your server, now cached |
| `cf-cache-status: BYPASS` | Cache rule says don't cache this |
| `cf-cache-status: DYNAMIC` | Not cached (HTML by default) |
| `cf-ray: abc123-LAX` | Request ID + edge location (LAX = Los Angeles) |
| `age: 3600` | Seconds since the resource was cached |
