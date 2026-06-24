# Frontend Standalone Service Design

**Date:** 2026-06-24  
**Status:** Approved

## Goal

Extract the frontend into a fully standalone service that communicates with all backend microservices through a single nginx reverse proxy, runnable locally via Docker Compose with no paid infrastructure.

## Context

The backend is being split into microservices (employee/salary, auth, leave — more to come). The frontend at `c:/AWS/Projects/EMS/frontend` is already ahead of `salary-management/frontend` — it has separate axios clients (`apiClient`, `authClient`, `leaveClient`) and leaves/change-password features. It also already has its own `.git` and `Dockerfile`. We use this as the base.

## Architecture

```
Browser → nginx:80
  /             → frontend static files (built React dist/)
  /api/v1/*     → employee-service:3001
  /auth/v1/*    → auth-service:3003
  /leave/v1/*   → leave-service:3002
```

Backend services are internal to Docker network only — not exposed to the host. Only nginx is on port 80. Adding a new microservice = one new `location` block in `nginx.conf` + one new service in `docker-compose.yml`.

## Folder Structure

```
c:/AWS/Projects/EMS/
├── docker-compose.yml          ← new
├── nginx/
│   └── nginx.conf              ← new
├── frontend/                   ← existing standalone repo
│   ├── Dockerfile              ← unchanged
│   ├── .env.example            ← new (committed)
│   ├── .env                    ← gitignored, localhost URLs for non-Docker dev
│   └── src/api/client.ts       ← update default path strings only
├── salary-management/
│   └── backend/
└── (future: auth-service/, leave-service/)
```

## Files to Create

### `nginx/nginx.conf`

```nginx
server {
  listen 80;

  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }

  location /api/v1/ {
    proxy_pass http://employee-service:3001/api/v1/;
  }

  location /auth/v1/ {
    proxy_pass http://auth-service:3003/auth/v1/;
  }

  location /leave/v1/ {
    proxy_pass http://leave-service:3002/api/v1/;
  }
}
```

### `docker-compose.yml`

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
      - frontend-dist:/usr/share/nginx/html
    depends_on:
      - frontend
      - employee-service

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: /api/v1
        VITE_AUTH_API_URL: /auth/v1
        VITE_LEAVE_API_URL: /leave/v1
    volumes:
      - frontend-dist:/app

  employee-service:
    build: ./salary-management/backend
    environment:
      - DATABASE_URL=...
    # no ports — internal only

volumes:
  frontend-dist:
```

### `frontend/.env.example`

```env
VITE_API_URL=/api/v1
VITE_AUTH_API_URL=/auth/v1
VITE_LEAVE_API_URL=/leave/v1
```

### `frontend/.env` (gitignored, for non-Docker local dev)

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_AUTH_API_URL=http://localhost:3003/auth/v1
VITE_LEAVE_API_URL=http://localhost:3002/api/v1
```

## Files to Modify

### `frontend/src/api/client.ts`

Fix the two default fallback paths to match nginx location blocks:

```diff
- export const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || '/auth-api/v1';
- export const LEAVE_BASE = import.meta.env.VITE_LEAVE_API_URL || '/leave-api/v1';
+ export const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || '/auth/v1';
+ export const LEAVE_BASE = import.meta.env.VITE_LEAVE_API_URL || '/leave/v1';
```

### `frontend/.gitignore`

Ensure `.env` is listed (keep `.env.example` tracked).

## Adding Future Microservices

1. Add a `location /new-service/v1/` block in `nginx/nginx.conf`
2. Add a new service entry in `docker-compose.yml`
3. Add `VITE_NEWSERVICE_API_URL` to `frontend/.env.example` and a new axios client in `client.ts`

## What Does NOT Change

- `frontend/Dockerfile` — already correct, accepts `VITE_*` build args
- `frontend/src/` component and page files — no changes needed
- `salary-management/` CI workflows — unaffected
