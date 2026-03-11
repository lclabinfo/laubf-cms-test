# VM Deployment Prompt

> One-shot prompt to give Claude on the Azure VM. Copy everything below the line.

---

I need you to connect the public website subdomain for a Next.js 16 app already running on this Azure VM.

CURRENT STATE:
- `admin.laubf.lclab.io` is ALREADY working — it serves the CMS admin and is already connected, with SSL, nginx, and the Next.js app running. Do NOT touch this.
- `laubf.lclab.io` currently points to a DIFFERENT older service on this server. We need to transition it to the same Next.js app that serves `admin.laubf.lclab.io`, but gracefully — don't break the old service until the new routing is verified.
- The `.env` file already exists on the server with production values. Do NOT overwrite it.
- DNS for `lclab.io` is managed in Namecheap (not Cloudflare).

WHAT NEEDS TO HAPPEN:
The Next.js app has a `proxy.ts` (Next.js 16 convention) that handles subdomain routing. When a request comes to `laubf.lclab.io/about`, the proxy internally rewrites it to `/website/about`. The `/website` prefix never appears in the browser URL. The app already handles this — we just need nginx to route `laubf.lclab.io` traffic to the same Next.js process.

Walk me through each step interactively — do one step, show me the result, wait for my confirmation before proceeding.

## Step 1: Assess current state
Run these commands and show me the output:
```bash
echo "=== Public IP ==="
curl -4 -s ifconfig.me

echo -e "\n=== Node.js ==="
node -v 2>/dev/null || echo "NOT INSTALLED"

echo -e "\n=== PM2 processes ==="
pm2 list 2>/dev/null || echo "No PM2"

echo -e "\n=== What's on port 3000? ==="
lsof -i :3000 -P -n 2>/dev/null | head -5 || ss -tlnp | grep 3000

echo -e "\n=== nginx sites ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null
echo "---"
cat /etc/nginx/sites-enabled/* 2>/dev/null

echo -e "\n=== SSL certs ==="
sudo certbot certificates 2>/dev/null | head -20

echo -e "\n=== DNS check ==="
dig +short laubf.lclab.io
dig +short admin.laubf.lclab.io
```

I need to understand:
1. What port the Next.js app (serving admin.laubf.lclab.io) is running on
2. What the old service on laubf.lclab.io is and what port it uses
3. Whether laubf.lclab.io DNS already points to this VM

## Step 2: Add nginx server block for laubf.lclab.io
We need to add a server block for `laubf.lclab.io` that proxies to the SAME Next.js app that already serves `admin.laubf.lclab.io`. Find what port that app runs on from Step 1 and create the matching config:

```nginx
# Public website — route to the same Next.js app as admin
server {
    listen 80;
    server_name laubf.lclab.io;

    location / {
        proxy_pass http://127.0.0.1:<SAME_PORT_AS_ADMIN>;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

IMPORTANT: Do NOT modify the existing admin.laubf.lclab.io nginx config. Only ADD the new server block. If there's an existing nginx config for laubf.lclab.io pointing to the old service, we need to update it — but ask me first before changing it.

Test with `nginx -t`, then reload.

## Step 3: DNS (if needed)
If `laubf.lclab.io` doesn't already point to this VM's IP, tell me and I'll add/update the A record in Namecheap. If it already points here (likely, since the old service runs here), we can skip this.

## Step 4: SSL for laubf.lclab.io
If `admin.laubf.lclab.io` already has SSL but `laubf.lclab.io` doesn't:
```bash
sudo certbot --nginx -d laubf.lclab.io
```

If both are already on the same cert, this may not be needed. Check from Step 1.

## Step 5: Verify
```bash
curl -s -o /dev/null -w "%{http_code}" https://laubf.lclab.io
curl -s -o /dev/null -w "%{http_code}" https://admin.laubf.lclab.io/cms/login
```

Both should return 200 (or 302 redirect for the login page). If `laubf.lclab.io` works, the old service routing for that domain can be removed.

## Step 6: Clean up old service (if applicable)
Once verified:
1. Show me what the old service is (`pm2 list`, `systemctl list-units`, etc.)
2. Ask me before stopping anything
3. Remove the old nginx config for laubf.lclab.io if it was separate
4. `pm2 save` to persist the final state

Start with Step 1. Show me the output and wait for my go-ahead.
