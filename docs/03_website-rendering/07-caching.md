# Caching Explained

## What Caching Actually Means, Why Redis Exists, and When to Add Each Layer

> **Context**: This document explains caching from first principles for developers who understand browser caching but are unclear on server-side caching, Redis, and CDN caching. It's specifically written for our stack: Next.js 16 self-hosted on Azure VM with Cloudflare as CDN.

---

## 1. The Three Types of Caching

Think of caching as storing copies of data at different points between the user's browser and your database. Each layer intercepts requests at a different point and solves a different problem.

### Layer 1: Browser Cache (You Already Know This One)

When your browser fetches a page or asset, the server sends HTTP headers that say "you can keep this copy for X seconds." On the next visit, the browser uses the local copy instead of asking the server again.

```
Browser → "Do you have /styles.css cached?" → Yes → Use local copy (0ms)
Browser → "Do you have /styles.css cached?" → No → Ask server (200ms)
```

Key headers:
- `Cache-Control: public, max-age=31536000, immutable` — Next.js uses this for static assets (JS/CSS bundles with hashed filenames). Cached for 1 year.
- `Cache-Control: s-maxage=60, stale-while-revalidate` — ISR pages. CDNs cache for 60s, serve stale while refetching.
- `ETag` / `If-None-Match` — Browser asks "has this changed?" Server responds 304 Not Modified if it hasn't (saves re-downloading).

**What it solves**: Repeat visits are fast because assets are already on the device.

**What it does NOT solve**: Every *new* visitor still hits your server. And the server still has to generate the response (query the database, render HTML) before sending it.

### Layer 2: Server-Side Cache (The One You're Missing)

This is caching that happens **on your server**, between your application code and the database.

Without caching, every page request runs database queries:

```
Visitor 1 → GET /messages → Query PostgreSQL → Render HTML → Send response
Visitor 2 → GET /messages → Query PostgreSQL → Render HTML → Send response  ← same query, same result
Visitor 3 → GET /messages → Query PostgreSQL → Render HTML → Send response  ← same query, same result
```

With server-side caching:

```
Visitor 1 → GET /messages → Query PostgreSQL → Store in cache → Send response
Visitor 2 → GET /messages → Cache hit! → Send response  ← skipped the database entirely
Visitor 3 → GET /messages → Cache hit! → Send response  ← skipped the database entirely
...
Pastor updates a sermon → Cache invalidated
Visitor 99 → GET /messages → Query PostgreSQL → Store in cache → Send response
```

If 100 people visit your sermons page in 60 seconds, instead of 100 database queries, you make 1 query and serve 99 from cache.

**Where is this cache stored?**
- **In-memory** (a JavaScript `Map` or similar) — fastest, but lost on restart
- **Filesystem** (Next.js default for ISR) — survives restarts, but local to one server
- **Redis** (external service) — shared across processes and servers, survives restarts

**What it solves**: Reduces database load dramatically.

**What it does NOT solve**: Each user still makes a network request to your server. The server still has to construct the HTTP response (even though the data came from cache instead of the database).

### Layer 3: CDN Cache (Cloudflare)

A CDN is a network of servers around the world. When a CDN caches your page, users in Singapore get the response from a server in Singapore rather than your Azure VM in the US.

The CDN sits **in front of** your server:

```
User → Cloudflare edge (Singapore) → "Do I have this cached?" → Yes → Return immediately
User → Cloudflare edge (Singapore) → "Do I have this cached?" → No → Forward to Azure VM → Cache response → Return
```

**What it solves**: Your server handles zero traffic for cached pages. Responses are fast because they come from servers geographically close to users.

**What it does NOT solve**: Dynamic, personalized content (logged-in CMS dashboards) can't be CDN-cached because each user sees different content.

### How They Work Together

```
User's Browser
    │
    ▼
[Browser Cache] ── Has it locally? Return immediately. (0ms)
    │  (cache miss)
    ▼
[CDN / Cloudflare] ── Has a cached response? Return from edge. (~20ms)
    │  (cache miss)
    ▼
[Your Azure VM / Next.js Server]
    │
    ▼
[Server-Side Cache (memory/filesystem/Redis)] ── Has cached DB results? Use them. (~1ms)
    │  (cache miss)
    ▼
[PostgreSQL Database] ── Actually query the database. (~5-50ms)
```

For a public church website, the ideal scenario is that **most requests never reach your server at all** — they're served from CDN cache or browser cache. The server only works when content changes.

---

## 2. Why Redis?

### The Problem It Solves

Redis is an in-memory data store that runs as a separate process. All your application processes connect to the same Redis instance. This matters because:

**Problem 1: In-memory cache is lost on restart.**
Every deployment, restart, or crash wipes your cache. The first visitors after a deploy all hit the database simultaneously (a "thundering herd").

**Problem 2: In-memory cache isn't shared between processes.**
Node.js is single-threaded. To use multiple CPU cores, you run multiple processes (via PM2 cluster mode). Each process has its own isolated memory — Process A caches the sermon list, but Process B doesn't know about it.

**Problem 3: In-memory cache isn't shared between servers.**
If you scale to 2 Azure VMs behind a load balancer, each VM has a completely independent cache.

**Redis fixes all three**: It's a shared, persistent, external cache that all processes and servers read from.

### When You Do NOT Need Redis

- **Single server, single process**: Filesystem + in-memory cache works fine.
- **Low traffic**: PostgreSQL can handle the load without caching.
- **Next.js built-in cache is enough**: For our current scale, it is.

**For 1-10 churches on a single Azure VM, Redis is not needed.**

### When You DO Need Redis

- **Multiple servers behind a load balancer** — shared cache required for consistency.
- **Frequent deployments** — cache survives restarts.
- **High traffic** — database can't handle the raw query volume.

### What Redis Would Store

Serialized query results, keyed by church + entity type:

```
Key:   "church:abc123:sermons:list:page1"
Value: [{ id: "1", title: "Grace Alone", ... }, ...]
TTL:   300 seconds (5 minutes)

Key:   "church:abc123:events:upcoming"
Value: [{ id: "5", title: "Sunday Service", ... }, ...]
TTL:   60 seconds (1 minute)

Key:   "church:abc123:theme"
Value: { primaryColor: "#1e40af", font: "Inter", ... }
TTL:   3600 seconds (1 hour, rarely changes)
```

The pattern is `{church_id}:{entity_type}:{query_variant}` → serialized JSON.

---

## 3. Next.js Caching on Azure VM (Self-Hosted)

This is different from Vercel. On Vercel, caching "just works" because Vercel built Next.js and deeply integrated it with their hosting. On Azure VM, some things work automatically and some require configuration.

### What Works Automatically (Zero Config)

| Feature | How It Works Self-Hosted |
|---|---|
| **ISR** (Incremental Static Regeneration) | Pages cached on filesystem. Regenerated in background when TTL expires. |
| **`'use cache'` directive** | Works by default. Caches Server Components and functions in memory + filesystem. |
| **`cacheTag()` + `revalidateTag()`** | Work within a single Next.js process. Invalidates cache entries by tag. |
| **Static asset caching** | `Cache-Control: immutable` headers set automatically for hashed JS/CSS/images. |
| **HTTP cache headers** | `s-maxage` + `stale-while-revalidate` set automatically for ISR pages. |

### What Has Limitations

| Limitation | Impact | When It Matters |
|---|---|---|
| **No global edge distribution** | ISR pages only exist on your server, not at edge locations worldwide | When you have visitors far from your Azure region |
| **Cache lost on deploy** | New deployment = cold cache = first visitors hit DB directly | Every deployment |
| **Single-process revalidation** | `revalidateTag()` only invalidates cache on the process that runs it | When running multiple Node.js processes |

### What Requires Configuration (Later)

When you scale to multiple processes/servers, you'll need a custom cache handler that stores cache in Redis instead of the filesystem:

```js
// next.config.ts (future — Stage 2 only)
const nextConfig = {
  cacheHandler: require.resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0, // Disable in-memory, use Redis only
}
```

**You do NOT need this now.** This is a Stage 2 concern.

---

## 4. Our Caching Strategy (Progressive)

### Stage 1: Now (1-10 Churches, 1 Azure VM)

**Do this:**

1. **Use `'use cache'`** on expensive database queries in Server Components:

```typescript
import { cacheTag } from 'next/cache'

async function getSermons(churchId: string) {
  'use cache'
  cacheTag(`church:${churchId}:sermons`)

  return prisma.message.findMany({
    where: { churchId, status: 'PUBLISHED' },
    orderBy: { date: 'desc' },
  })
}
```

2. **Use `revalidateTag()`** when CMS content changes:

```typescript
// In a Server Action or API route after saving a sermon
import { revalidateTag } from 'next/cache'

revalidateTag(`church:${churchId}:sermons`)
```

3. **Let Cloudflare cache static assets** — this happens automatically when proxying through Cloudflare (JS, CSS, images, fonts).

4. **Set ISR revalidation** on public pages if appropriate:

```typescript
// app/(website)/[[...slug]]/page.tsx
export const revalidate = 60 // Revalidate every 60 seconds
```

**Do NOT do this yet:**
- No Redis
- No custom cache handler
- No Cloudflare page caching rules (static assets are enough for now)

**Total caching cost: $0.**

### Stage 2: Later (10-100 Churches, Growing Traffic)

**Trigger to move here**: Multiple Node.js processes (PM2 cluster mode), or cold cache after deploys causes noticeable latency.

Add Redis as a shared cache backend:
- Azure Cache for Redis Basic C0 (250MB) — ~$16/month
- Or self-host Redis on the same Azure VM — $0

Configure `cacheHandler` and `cacheHandlers` in `next.config.ts` to use Redis.

### Stage 3: Eventually (100-1000+ Churches, Multiple Servers)

Redis becomes mandatory. Multiple servers behind a load balancer must share cache state. See `docs/website-rendering/06-hosting-domain-strategy.md` for infrastructure details.

---

## 5. Cache Invalidation Strategy

The hardest part of caching is knowing when to throw away stale data. Our approach: **on-demand invalidation via tags**.

### Tag Naming Convention

```
church:{churchId}:sermons      ← All sermon-related caches for a church
church:{churchId}:events       ← All event-related caches
church:{churchId}:pages        ← All page/section caches
church:{churchId}:theme        ← Theme customization
church:{churchId}:menus        ← Navigation menus
church:{churchId}:settings     ← Site settings
```

### When to Invalidate

| CMS Action | Tags to Invalidate |
|---|---|
| Create/edit/delete a sermon | `church:{id}:sermons`, `church:{id}:pages` (sermons appear in sections) |
| Create/edit/delete an event | `church:{id}:events`, `church:{id}:pages` |
| Edit a page section | `church:{id}:pages` |
| Change theme | `church:{id}:theme` |
| Edit navigation menu | `church:{id}:menus` |
| Update site settings | `church:{id}:settings` |

### Implementation Pattern

Every CMS write API route should call invalidation after a successful write:

```typescript
// lib/cache/invalidation.ts
import { revalidateTag } from 'next/cache'

export function invalidateSermons(churchId: string) {
  revalidateTag(`church:${churchId}:sermons`)
  revalidateTag(`church:${churchId}:pages`) // Sermons appear in dynamic sections
}

export function invalidateTheme(churchId: string) {
  revalidateTag(`church:${churchId}:theme`)
}
```

```typescript
// app/api/v1/messages/route.ts (POST handler)
const message = await createMessage(data)
invalidateSermons(churchId)
return NextResponse.json(message, { status: 201 })
```

---

## 6. Summary

| Question | Answer |
|---|---|
| **Is browser caching enough?** | For repeat visitors, yes. But it doesn't help with first visits or server load. |
| **What is server-side caching?** | Storing database query results in memory/filesystem/Redis so you don't query the DB on every request. |
| **What is CDN caching?** | Storing full HTTP responses on servers around the world so your origin server doesn't get hit. |
| **Do we need Redis now?** | No. Single server with Next.js built-in cache is sufficient for 1-10 churches. |
| **When do we add Redis?** | When we run multiple processes/servers, or cold caches after deploys become a problem. |
| **What does Cloudflare do for us?** | Caches static assets globally, provides DDoS protection, and handles DNS. Free tier is sufficient. |
| **How do we invalidate cache?** | `revalidateTag()` in CMS write operations. On-demand, not time-based. |
