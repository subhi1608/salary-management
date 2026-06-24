# Frontend Standalone Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `EMS/frontend` as a fully standalone service behind an nginx reverse proxy, orchestrated with Docker Compose, so all three backend microservices are reachable through a single port (80) with no paid infrastructure.

**Architecture:** nginx:alpine serves the built React `dist/` as static files and reverse-proxies `/api/v1/*`, `/auth/v1/*`, `/leave/v1/*` to the respective backend containers. Backend containers are internal to the Docker network only — nothing is exposed to the host except nginx on port 80. Docker Compose at `EMS/` root ties everything together.

**Tech Stack:** Docker, Docker Compose, nginx:alpine, Vite (React/TypeScript), Node 20

---

## File Map

| Action | Path |
|--------|------|
| Create | `c:/AWS/Projects/EMS/nginx/nginx.conf` |
| Create | `c:/AWS/Projects/EMS/docker-compose.yml` |
| Create | `c:/AWS/Projects/EMS/frontend/.env.example` |
| Create | `c:/AWS/Projects/EMS/frontend/.env` (gitignored) |
| Modify | `c:/AWS/Projects/EMS/frontend/.gitignore` |
| Modify | `c:/AWS/Projects/EMS/frontend/src/api/client.ts` |

---

### Task 1: Fix API client default paths

The two fallback paths in `client.ts` currently don't match the nginx location blocks we'll define. Fix them first so the rest of the plan is consistent.

**Files:**
- Modify: `c:/AWS/Projects/EMS/frontend/src/api/client.ts`

- [ ] **Step 1: Open the file and locate the two constants**

  In `frontend/src/api/client.ts`, find these two lines near the top:
  ```typescript
  export const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || '/auth-api/v1';
  export const LEAVE_BASE = import.meta.env.VITE_LEAVE_API_URL || '/leave-api/v1';
  ```

- [ ] **Step 2: Update both default paths**

  Replace with:
  ```typescript
  export const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || '/auth/v1';
  export const LEAVE_BASE = import.meta.env.VITE_LEAVE_API_URL || '/leave/v1';
  ```
  Nothing else in the file changes.

- [ ] **Step 3: Verify TypeScript still compiles**

  Run from `c:/AWS/Projects/EMS/frontend/`:
  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git -C c:/AWS/Projects/EMS/frontend add src/api/client.ts
  git -C c:/AWS/Projects/EMS/frontend commit -m "fix: align default API base paths with nginx location blocks"
  ```

---

### Task 2: Add `.env.example` and update `.gitignore`

Document the env vars the frontend accepts, and make sure `.env` (with real localhost URLs) is never committed.

**Files:**
- Create: `c:/AWS/Projects/EMS/frontend/.env.example`
- Create: `c:/AWS/Projects/EMS/frontend/.env`
- Modify: `c:/AWS/Projects/EMS/frontend/.gitignore`

- [ ] **Step 1: Create `.env.example`** (this file IS committed — it documents available vars)

  Create `c:/AWS/Projects/EMS/frontend/.env.example` with:
  ```env
  # When running via Docker Compose + nginx, leave these as-is (relative paths).
  # When running locally without Docker, set to full localhost URLs (see .env).
  VITE_API_URL=/api/v1
  VITE_AUTH_API_URL=/auth/v1
  VITE_LEAVE_API_URL=/leave/v1
  ```

- [ ] **Step 2: Create `.env`** (this file is gitignored — used for non-Docker local dev)

  Create `c:/AWS/Projects/EMS/frontend/.env` with:
  ```env
  VITE_API_URL=http://localhost:3001/api/v1
  VITE_AUTH_API_URL=http://localhost:3003/auth/v1
  VITE_LEAVE_API_URL=http://localhost:3002/api/v1
  ```

- [ ] **Step 3: Check `.gitignore`**

  Open `c:/AWS/Projects/EMS/frontend/.gitignore`. If `.env` is not already listed, add it. The file should contain (among other things):
  ```
  .env
  .env.local
  ```
  Do NOT add `.env.example` — that must stay tracked.

- [ ] **Step 4: Verify git sees the right files**

  ```bash
  git -C c:/AWS/Projects/EMS/frontend status
  ```
  Expected: `.env` does NOT appear as untracked. `.env.example` and `.gitignore` appear as modified/new.

- [ ] **Step 5: Commit**

  ```bash
  git -C c:/AWS/Projects/EMS/frontend add .env.example .gitignore
  git -C c:/AWS/Projects/EMS/frontend commit -m "chore: add .env.example and ensure .env is gitignored"
  ```

---

### Task 3: Create nginx config

nginx will serve static frontend files and proxy API requests to backend containers by their Docker Compose service names.

**Files:**
- Create: `c:/AWS/Projects/EMS/nginx/nginx.conf`

- [ ] **Step 1: Create the `nginx/` directory and config**

  Create `c:/AWS/Projects/EMS/nginx/nginx.conf`:
  ```nginx
  server {
    listen 80;

    # Serve React SPA — fallback to index.html for client-side routing
    location / {
      root /usr/share/nginx/html;
      try_files $uri $uri/ /index.html;
    }

    # Employee / salary microservice
    location /api/v1/ {
      proxy_pass http://employee-service:3001/api/v1/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # Auth microservice
    location /auth/v1/ {
      proxy_pass http://auth-service:3003/auth/v1/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # Leave microservice
    location /leave/v1/ {
      proxy_pass http://leave-service:3002/api/v1/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
  }
  ```

  Note: `proxy_pass` host names (`employee-service`, `auth-service`, `leave-service`) must exactly match the service names defined in `docker-compose.yml` in Task 4.

- [ ] **Step 2: Commit**

  ```bash
  git -C c:/AWS/Projects/EMS/salary-management add ../nginx/nginx.conf 2>/dev/null || true
  # nginx/ lives outside the salary-management repo — commit it to frontend repo or track separately
  # If EMS/ root has no git repo, just verify the file exists:
  ls c:/AWS/Projects/EMS/nginx/nginx.conf
  ```

  > Note: `c:/AWS/Projects/EMS/` itself has no git repo — `nginx/` and `docker-compose.yml` are unversioned infrastructure files at the project root. That's fine for local learning. If you want to version them, run `git init` in `c:/AWS/Projects/EMS/` and create a root `.gitignore`.

---

### Task 4: Create `docker-compose.yml`

The Compose file at `EMS/` root defines all services. The frontend is built and its `dist/` output is shared with nginx via a named volume.

**Files:**
- Create: `c:/AWS/Projects/EMS/docker-compose.yml`

- [ ] **Step 1: Create the file**

  Create `c:/AWS/Projects/EMS/docker-compose.yml`:
  ```yaml
  services:

    # ── nginx reverse proxy ──────────────────────────────────────────────────
    nginx:
      image: nginx:alpine
      ports:
        - "80:80"
      volumes:
        - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
        - frontend-dist:/usr/share/nginx/html:ro
      depends_on:
        - frontend
        - employee-service
      restart: unless-stopped

    # ── React frontend (build-only container) ────────────────────────────────
    # Builds the Vite app and copies dist/ into the shared volume, then exits.
    frontend:
      build:
        context: ./frontend
        args:
          VITE_API_URL: /api/v1
          VITE_AUTH_API_URL: /auth/v1
          VITE_LEAVE_API_URL: /leave/v1
      volumes:
        - frontend-dist:/app

    # ── Employee / salary microservice ───────────────────────────────────────
    employee-service:
      build:
        context: ./salary-management/backend
      environment:
        - NODE_ENV=production
        - DATABASE_URL=${DATABASE_URL}
        - JWT_SECRET=${JWT_SECRET}
        - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      # No `ports:` — only reachable inside Docker network via nginx
      restart: unless-stopped

    # ── Auth microservice (add when service exists) ──────────────────────────
    # auth-service:
    #   build:
    #     context: ./auth-service
    #   environment:
    #     - DATABASE_URL=${AUTH_DATABASE_URL}
    #     - JWT_SECRET=${JWT_SECRET}
    #   restart: unless-stopped

    # ── Leave microservice (add when service exists) ─────────────────────────
    # leave-service:
    #   build:
    #     context: ./leave-management
    #   environment:
    #     - DATABASE_URL=${LEAVE_DATABASE_URL}
    #   restart: unless-stopped

  volumes:
    frontend-dist:
  ```

- [ ] **Step 2: Create a `.env` at `EMS/` root for Compose secrets**

  Create `c:/AWS/Projects/EMS/.env`:
  ```env
  DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/ems
  JWT_SECRET=your-jwt-secret-here
  JWT_REFRESH_SECRET=your-refresh-secret-here
  ```

  Replace the values with your actual local database credentials. `host.docker.internal` lets Docker containers reach your local Postgres instance.

- [ ] **Step 3: Verify Docker is running, then do a dry-run parse**

  ```bash
  docker compose -f c:/AWS/Projects/EMS/docker-compose.yml config
  ```
  Expected: Compose prints the fully-resolved config with no errors.

---

### Task 5: Smoke test the full stack

Bring everything up and verify nginx serves the frontend and proxies correctly.

- [ ] **Step 1: Build and start all services**

  ```bash
  cd c:/AWS/Projects/EMS
  docker compose up --build
  ```
  Expected output (in order):
  - `frontend` container builds Vite app (may take ~60s first run)
  - `employee-service` container builds and starts
  - `nginx` container starts
  - No error lines

- [ ] **Step 2: Verify frontend loads**

  Open `http://localhost` in a browser.
  Expected: EMS login page loads with no console errors.

- [ ] **Step 3: Verify nginx proxy headers reach the backend**

  In a separate terminal:
  ```bash
  curl -v http://localhost/api/v1/health 2>&1 | grep -E "< HTTP|connected"
  ```
  Expected: `< HTTP/1.1 200` (or whatever health endpoint the backend exposes). If the backend has no `/health` route, try `curl http://localhost/api/v1/employees` — you should get a 401, not a 502 or connection refused.

- [ ] **Step 4: Stop services**

  ```bash
  docker compose down
  ```

---

### Task 6: Document how to add a future microservice

Add a short comment block at the top of `docker-compose.yml` so the pattern is clear.

- [ ] **Step 1: Add header comment to `docker-compose.yml`**

  At the very top of `c:/AWS/Projects/EMS/docker-compose.yml`, above `services:`, add:
  ```yaml
  # EMS – local Docker Compose stack
  #
  # To add a new microservice:
  #   1. Add a new service block below (copy the commented auth-service template)
  #   2. Add a new `location /new-service/v1/` block in nginx/nginx.conf
  #   3. Add VITE_NEWSERVICE_API_URL to frontend/.env.example
  #   4. Add a new axios client in frontend/src/api/client.ts
  #
  ```

- [ ] **Step 2: Final check — confirm no ports leaked**

  ```bash
  docker compose -f c:/AWS/Projects/EMS/docker-compose.yml config | grep -A3 "ports:"
  ```
  Expected: only `nginx` has a `ports:` entry (`80:80`). Backend services have none.
