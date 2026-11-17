# DevOps Demo · Notes App

A tiny Node.js (Express) notes app built to practise **Docker, GitHub Actions CI/CD and AWS EC2 deployment**.

```
push to main ──► Test (Node 20 & 22) ──► Build Docker image ──► Push to GHCR ──► Deploy to EC2 ──► Smoke test
pull request ──► Test ──► Build image (no push)
```

## Run locally
```bash
npm install
npm test                      # 5 tests, built-in Node test runner
npm run dev                   # http://localhost:3000

docker compose up --build     # same app in Docker
```

## API
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | health check |
| GET | `/api/version` | running commit (proves a deploy worked) |
| GET / POST | `/api/notes` | list / create (`{ "text": "..." }`) |
| DELETE | `/api/notes/:id` | delete |

## Pipeline files
| File | Purpose |
|---|---|
| `.github/workflows/ci-cd.yml` | test → build → deploy |
| `Dockerfile` | production image (non-root, health check) |
| `docker-compose.yml` | local build |
| `docker-compose.prod.yml` | server file: pulls the image from GHCR |

## GitHub secrets needed for deploy
Repo → Settings → Secrets and variables → Actions → New repository secret

| Secret | Value |
|---|---|
| `EC2_HOST` | EC2 public IPv4 address |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | full private key text, including the BEGIN/END lines |

Until these exist, the **deploy** job fails; test and build still work.
