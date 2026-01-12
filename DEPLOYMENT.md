# Entmoot Deployment Guide

This guide covers deploying Entmoot to production using Coolify on American Cloud.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   American Cloud VM                      │
│                                                          │
│  ┌─────────────────┐    ┌─────────────────┐             │
│  │  entmoot.app    │    │ api.entmoot.app │             │
│  │   (Frontend)    │    │    (Backend)    │             │
│  │   React SPA     │    │   Rails API     │             │
│  │   nginx:alpine  │    │   + Sidekiq     │             │
│  └────────┬────────┘    └────────┬────────┘             │
│           │                      │                       │
│           │    ┌─────────────────┴──────┐               │
│           │    │                        │               │
│  ┌────────▼────▼───┐    ┌───────────────▼────┐         │
│  │     Redis       │    │    PostgreSQL      │         │
│  │   (Cache/Jobs)  │    │    (Database)      │         │
│  └─────────────────┘    └────────────────────┘         │
│                                                          │
│                     Coolify (Traefik)                   │
│                   Auto SSL via Let's Encrypt            │
└─────────────────────────────────────────────────────────┘
```

## Services

| Service | Domain | Description |
|---------|--------|-------------|
| Frontend | https://entmoot.app | React SPA served via nginx |
| Backend | https://api.entmoot.app | Rails 7 API + Sidekiq workers |
| PostgreSQL | Internal | Database (postgres:16-alpine) |
| Redis | Internal | Cache, ActionCable, Sidekiq queues |

## Prerequisites

- American Cloud VM (2GB+ RAM, Ubuntu 22.04)
- Coolify installed on the VM
- Domain pointed to VM IP (A records for `@`, `www`, `api`)
- GitHub repository: https://github.com/justuseapen/entmoot

## DNS Configuration (EasyDNS)

| Type | Host | Points to |
|------|------|-----------|
| A | @ | 172.252.211.242 |
| A | www | 172.252.211.242 |
| A | api | 172.252.211.242 |

## Coolify Setup

### 1. Create PostgreSQL Database

1. Projects → Entmoot → + New → Database → PostgreSQL
2. Configure:
   - Name: `entmoot-postgres`
   - Image: `postgres:16-alpine`
   - Database: `entmoot_production`
   - Username: `entmoot`
   - Password: (auto-generated)
3. Deploy and copy the Internal URL

### 2. Create Redis Instance

1. Projects → Entmoot → + New → Database → Redis
2. Configure:
   - Name: `entmoot-redis`
   - Image: `redis:7-alpine`
3. Deploy and copy the Internal URL

### 3. Deploy Backend (Rails API)

1. Projects → Entmoot → + New → Application → Public Repository
2. Configure:
   - Repository: `https://github.com/justuseapen/entmoot`
   - Branch: `master`
   - Base Directory: `/backend`
   - Build Pack: `Dockerfile`
   - Port: `3000`
3. Set Domain: `https://api.entmoot.app`
4. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `RAILS_ENV` | `production` |
| `RAILS_LOG_TO_STDOUT` | `true` |
| `RAILS_MASTER_KEY` | (from `backend/config/master.key`) |
| `SECRET_KEY_BASE` | (generate with `rails secret`) |
| `DATABASE_URL` | (PostgreSQL Internal URL) |
| `REDIS_URL` | (Redis Internal URL) |
| `DOMAIN` | `entmoot.app` |
| `CORS_ORIGINS` | `https://entmoot.app` |
| `ANTHROPIC_API_KEY` | (your API key) |
| `SENDGRID_API_KEY` | (optional, for emails) |
| `MAILER_FROM` | `noreply@entmoot.app` |

5. Deploy

### 4. Deploy Frontend (React SPA)

1. Projects → Entmoot → + New → Application → Public Repository
2. Configure:
   - Repository: `https://github.com/justuseapen/entmoot`
   - Branch: `master`
   - Base Directory: `/frontend`
   - Build Pack: `Nixpacks`
   - Publish Directory: `/dist`
   - Is it a static site?: ✅ Yes
3. Set Domain: `https://entmoot.app`
4. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.entmoot.app` |

5. Deploy

## Redeployment

### Automatic (Webhooks)
Configure GitHub webhooks in Coolify for automatic deployments on push.

### Manual
1. Go to the application in Coolify
2. Click **Redeploy** or **Deploy**

## Database Operations

### Run Migrations
```bash
# In Coolify Terminal for backend
bundle exec rails db:migrate
```

### Seed Database
```bash
bundle exec rails db:seed
```

### Rails Console
```bash
bundle exec rails console
```

## Monitoring

### View Logs
- Coolify → Application → Logs tab

### Health Check
- Backend: https://api.entmoot.app/health

## Demo Users

After seeding, these demo accounts are available:

| Email | Password | Role |
|-------|----------|------|
| alex@demo.entmoot.family | DemoPassword123! | Admin |
| sam@demo.entmoot.family | DemoPassword123! | Adult |
| taylor@demo.entmoot.family | DemoPassword123! | Teen |
| jordan@demo.entmoot.family | DemoPassword123! | Child |
| pat@demo.entmoot.family | DemoPassword123! | Observer |

## Troubleshooting

### DNS Not Resolving
- Check A records in EasyDNS
- Wait for propagation (up to 48 hours, usually minutes)
- Test with: `dig api.entmoot.app +short`

### Database Connection Failed
- Verify DATABASE_URL uses correct Internal URL from Coolify
- Check PostgreSQL is running in Coolify

### API Error 405
- Ensure VITE_API_URL is set correctly in frontend
- Redeploy frontend after changing env vars

### CORS Errors
- Verify CORS_ORIGINS includes the frontend domain with https://

### SSL Certificate Issues
- Ensure domain starts with `https://` in Coolify
- Check DNS is pointing to correct IP

## Environment Variables Reference

### Backend (Required)
```
RAILS_ENV=production
RAILS_LOG_TO_STDOUT=true
RAILS_MASTER_KEY=<from config/master.key>
SECRET_KEY_BASE=<generate with rails secret>
DATABASE_URL=<postgres internal url>
REDIS_URL=<redis internal url>
DOMAIN=entmoot.app
CORS_ORIGINS=https://entmoot.app
```

### Backend (Optional)
```
ANTHROPIC_API_KEY=<for AI features>
SENDGRID_API_KEY=<for email>
MAILER_FROM=noreply@entmoot.app
SIDEKIQ_CONCURRENCY=5
```

### Frontend
```
VITE_API_URL=https://api.entmoot.app
```
