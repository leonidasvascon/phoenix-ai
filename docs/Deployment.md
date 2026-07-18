# Deployment

## Requisitos

- Node.js compativel com o projeto.
- pnpm 11.
- Docker Desktop ou Docker Engine.

## Desenvolvimento local

```bash
pnpm install
pnpm run preflight
docker compose up --build
```

API: `http://127.0.0.1:4000`
Studio: `http://127.0.0.1:3000`

## Producao

Use `docker-compose.prod.yml` com variaveis externas e volumes persistentes para:

- `.storage`
- `reports`
- `output`

Antes de publicar, rode:

```bash
pnpm run backup-all
pnpm run preflight
docker compose -f docker-compose.prod.yml build
```
