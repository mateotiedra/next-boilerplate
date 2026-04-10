# Deployment Guide — Dokploy on VPS

## Architecture

```
VPS (Dokploy)
├── App Next.js        → Docker container (this repo)
├── PostgreSQL         → Dokploy database service
├── Redis              → Dokploy database service
└── GlitchTip          → Dokploy Docker container (optional)
```

Each service runs independently. If one crashes, the others stay up.

---

## Prerequisites

- A VPS with Dokploy installed (https://dokploy.com)
- A domain name pointing to your VPS (e.g., `yourapp.com`)
- A Kinde account (https://kinde.com)
- A Stripe account (https://stripe.com)
- A Resend account (https://resend.com)

---

## Step 1: Create PostgreSQL Service

1. In Dokploy, go to **Projects** → **Create Service** → **Database** → **PostgreSQL**
2. Set:
   - Name: `yourapp-postgres`
   - Version: `16-alpine`
   - Database: `yourapp`
   - Username: `yourapp`
   - Password: (generate a strong password)
3. Note the internal connection URL: `postgresql://yourapp:PASSWORD@yourapp-postgres:5432/yourapp`

## Step 2: Create Redis Service

1. **Create Service** → **Database** → **Redis**
2. Set:
   - Name: `yourapp-redis`
   - Version: `7-alpine`
3. Note the internal URL: `redis://yourapp-redis:6379`

## Step 3: Deploy the App

1. **Create Service** → **Application** → **Docker**
2. Connect your Git repository
3. Dokploy will use the `Dockerfile` in the repo root
4. Set the domain: `yourapp.com` (Dokploy handles SSL via Let's Encrypt)

### Environment Variables

Set these in Dokploy → Application → Environment:

```
# App
BASE_URL=https://yourapp.com
NODE_ENV=production

# Database (use internal Docker network URL)
POSTGRES_URL=postgresql://yourapp:PASSWORD@yourapp-postgres:5432/yourapp

# Redis (use internal Docker network URL)
REDIS_URL=redis://yourapp-redis:6379

# Kinde
KINDE_CLIENT_ID=your_client_id
KINDE_CLIENT_SECRET=your_client_secret
KINDE_ISSUER_URL=https://yourapp.kinde.com
KINDE_SITE_URL=https://yourapp.com
KINDE_POST_CALLBACK_URL=https://yourapp.com/api/auth/kinde/callback
KINDE_POST_LOGOUT_REDIRECT_URL=https://yourapp.com

# Stripe (use LIVE keys for production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=hello@yourapp.com

# GlitchTip (if deployed)
NEXT_PUBLIC_GLITCHTIP_DSN=https://key@glitchtip.yourapp.com/1
GLITCHTIP_DSN=https://key@glitchtip.yourapp.com/1
```

## Step 4: Run Migrations

After the first deployment, open a terminal in the container (Dokploy → Application → Terminal):

```bash
node -e "require('./lib/db/drizzle')" # Test DB connection
npx drizzle-kit migrate               # Apply migrations
```

## Step 5: Configure Stripe Webhook (Production)

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://yourapp.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the webhook signing secret → update `STRIPE_WEBHOOK_SECRET` in Dokploy

## Step 6: Configure Kinde Callback URLs

In Kinde dashboard → Settings → Applications → Your App:
- **Allowed callback URLs**: `https://yourapp.com/api/auth/kinde/callback`
- **Allowed logout redirect URLs**: `https://yourapp.com`

---

## Dev Deployed Environment

To run a staging/dev environment on the same VPS:

1. Create separate services with `-dev` suffix:
   - `yourapp-dev-postgres`
   - `yourapp-dev-redis`
   - `yourapp-dev` (app)
2. Use domain `dev.yourapp.com`
3. Use Stripe **test** keys
4. Create a separate Kinde **environment** for dev
5. Set all env vars with dev values

---

## GlitchTip (Optional Error Tracking)

1. In Dokploy, **Create Service** → **Docker Compose**
2. Use this compose configuration:

```yaml
services:
  glitchtip:
    image: glitchtip/glitchtip
    environment:
      DATABASE_URL: postgresql://yourapp:PASSWORD@yourapp-postgres:5432/glitchtip
      SECRET_KEY: your-secret-key-here
      PORT: 8000
      GLITCHTIP_DOMAIN: https://glitchtip.yourapp.com
      DEFAULT_FROM_EMAIL: glitchtip@yourapp.com
      EMAIL_URL: smtp://... # or leave empty
    ports:
      - "8000:8000"
```

3. Set domain `glitchtip.yourapp.com`
4. Create a project in GlitchTip and get the DSN
5. Add the DSN to your app's env vars

---

## PostgreSQL Backups

Add a cron job on your VPS:

```bash
# /etc/cron.d/backup-postgres
0 3 * * * root docker exec yourapp-postgres pg_dump -U yourapp yourapp | gzip > /backups/yourapp-$(date +\%Y\%m\%d).sql.gz
```

Keep at least 7 days of backups. Consider syncing to external storage (S3, R2, etc.).

---

## Troubleshooting

- **App won't start**: Check env vars in Dokploy. Missing `POSTGRES_URL` is the most common issue.
- **Auth not working**: Verify Kinde callback URLs match your domain exactly.
- **Stripe webhooks failing**: Check webhook secret and that the endpoint URL is correct.
- **DB connection refused**: Ensure PostgreSQL service is running and the internal network URL is correct.
