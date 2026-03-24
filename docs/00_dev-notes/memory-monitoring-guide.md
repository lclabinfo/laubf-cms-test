# Memory Monitoring Guide

> How to check memory usage locally and on the hosting server.
> Use this to verify that optimization changes are working before deploying.

---

## Local Memory Checks (npm run dev)

### Quick Check: Activity Monitor

Open **Activity Monitor** (Cmd+Space → "Activity Monitor") and search for `node`. You'll see one or more Node.js processes. The "Memory" column shows RSS (Resident Set Size) — the actual RAM used.

### Terminal One-Liner (while dev server is running)

```bash
# Show all node processes and their memory (MB)
ps -eo pid,rss,command | grep node | grep -v grep | awk '{printf "%s\t%.0f MB\t%s\n", $1, $2/1024, $3}'
```

### Detailed V8 Heap (run in a separate terminal)

```bash
# Find the Next.js dev server PID
lsof -i :3000 -t

# Send a heap snapshot signal (creates a .heapsnapshot file you can load in Chrome DevTools)
kill -USR2 <pid>
```

### Watch Memory Over Time

```bash
# Poll every 5 seconds while dev server runs
while true; do
  MEM=$(ps -o rss= -p $(lsof -i :3000 -t 2>/dev/null) 2>/dev/null)
  if [ -n "$MEM" ]; then
    echo "$(date +%H:%M:%S) — $(echo "$MEM/1024" | bc) MB"
  fi
  sleep 5
done
```

### Node.js Built-In Memory Report

Add this to any API route temporarily to see memory from inside the process:

```typescript
// Add to any GET route for a quick check, then remove
export async function GET() {
  const mem = process.memoryUsage()
  return Response.json({
    rss: `${(mem.rss / 1024 / 1024).toFixed(0)} MB`,
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(0)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(0)} MB`,
    external: `${(mem.external / 1024 / 1024).toFixed(0)} MB`,
  })
}
```

---

## Local vs Production: What's Different

| Metric | npm run dev | Production (standalone) |
|--------|-------------|------------------------|
| Typical RSS | 400-800 MB | 250-400 MB |
| Why higher in dev | Hot reload, source maps, no tree-shaking | Optimized bundle, tree-shaken |
| Code splitting | Not applied (all loaded) | next/dynamic works |
| Static generation | Disabled | Enabled (if headers() removed) |

**Dev mode is always heavier than production.** Don't panic if `npm run dev` shows 600 MB — production standalone will be significantly lower.

---

## Simulating Production Locally

To see what the production memory looks like on your Mac:

```bash
# Build production
npm run build

# Copy static files for standalone
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# Run standalone server with heap limit (simulates production)
NODE_ENV=production node --max-old-space-size=256 .next/standalone/server.js

# In another terminal, check memory:
ps -o pid,rss,command | grep standalone | grep -v grep | awk '{printf "PID %s — %.0f MB\n", $1, $2/1024}'
```

This is the closest you can get to production without touching the server. Hit a few pages in the browser to warm it up, then check memory.

---

## Hosting Server Commands (when ready to deploy)

```bash
# SSH into server
ssh ubfuser@<server-ip>

# Check current memory
pm2 list                          # shows memory per process
pm2 show laubf_cms                # detailed stats

# System-wide memory
free -h                           # total/used/available RAM
top -o %MEM | head -20            # top memory consumers

# After deploying new code:
cd /home/ubfuser/digital_church/laubf_cms
git pull
npm install
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
pm2 restart laubf_cms
pm2 list                          # verify memory dropped

# Kill stale process (saves 237 MB)
pm2 stop laubf && pm2 delete laubf
```

---

## What to Expect After Optimizations

| State | Expected RSS |
|-------|-------------|
| **Current server** (node_modules/.bin/next start, no heap limit) | ~766 MB |
| **After standalone + heap limit** | ~300-350 MB |
| **After code splitting kicks in** | ~250-300 MB |
| **npm run dev locally** (always higher) | ~500-700 MB |
| **Local production simulation** (standalone + heap limit) | ~250-350 MB |

---

## Quick Smoke Test Checklist

After running the production simulation locally:

- [ ] `curl http://localhost:3000` — homepage loads
- [ ] `curl http://localhost:3000/website` — public site loads
- [ ] Open CMS at `http://localhost:3000/cms` — login works
- [ ] Check memory is under 350 MB after warming up
- [ ] No errors in the terminal output
