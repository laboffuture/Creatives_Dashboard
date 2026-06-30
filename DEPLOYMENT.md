# Deploying TopRock Portal (self-hosted)

This app is configured for a **standalone** Node deployment (`output: "standalone"`),
so it runs as a plain Node server behind your own reverse proxy (Nginx/Caddy).

## 1. Prerequisites on the server

- Node.js **≥ 20.9.0**
- A domain with HTTPS (via your reverse proxy)

## 2. Google OAuth for production

In Google Cloud Console → Credentials → your OAuth client, add the production
**Authorized redirect URI**:

```
https://portal.yourdomain.com/api/auth/callback/google
```

Without this, sign-in fails with `redirect_uri_mismatch`.

## 3. Environment variables (set on the server, NOT committed)

| Var | Notes |
|---|---|
| `NEXTAUTH_URL` | `https://portal.yourdomain.com` (must match the real domain) |
| `NEXTAUTH_SECRET` | strong random value — `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud |
| `ALLOWED_DOMAIN` | optional; restrict sign-in to one Workspace domain |
| `GOOGLE_SCRIPT_URL` | Apps Script web app for backups list |
| `GOOGLE_API_KEY` *or* service account | for reading backup `.xlsx` files |

> ⚠️ Treat any secret that ever lived in a committed/placeholder file as
> compromised and rotate it.

## 4. Build

Always install fresh on the target platform — **never copy `node_modules`**
between machines (native binaries like `lightningcss`/`swc` are platform-specific):

```bash
npm ci          # or: npm install
npm run build   # produces .next/standalone + .next/static
```

## 5. Run (standalone)

The standalone server does not include `public/` or `.next/static` by default,
so copy them next to the server once after each build:

```bash
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# start it (set env first, or use a process manager)
NODE_ENV=production NEXTAUTH_URL=https://portal.yourdomain.com \
  node .next/standalone/server.js
```

Default port is `3000`; override with `PORT=8080`.

### Keep it running (pm2 example)

```bash
npm i -g pm2
pm2 start .next/standalone/server.js --name toprock-portal --update-env
pm2 save
```

## 6. Reverse proxy (Nginx example)

```nginx
server {
  server_name portal.yourdomain.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Terminate TLS at the proxy (e.g. Certbot/Let's Encrypt), then `NEXTAUTH_URL`
should be the `https://` address.

## 7. Post-deploy smoke test

1. Visit `https://portal.yourdomain.com` → should redirect to `/login`.
2. Sign in with an allowed Google account → lands on the Overview.
3. Hit `https://portal.yourdomain.com/api/drive` while logged **out** → expect `401`.
4. Confirm KPIs render real numbers (not all zeros).
