# Operations

## Comandos

```bash
pnpm run health-check
pnpm run diagnostics
pnpm run integrity:check
pnpm run backup-all
pnpm run restore-all -- .storage/backups/<arquivo>.json --yes
pnpm run post-upgrade
```

## Rotina operacional

1. Verificar `/health/details`.
2. Gerar diagnostico.
3. Conferir Cost Intelligence.
4. Conferir Event Bus e DLQ.
5. Fazer backup antes de migracoes.

## Checklist de implantacao

- Variaveis de ambiente revisadas.
- API Key e secrets definidos.
- CORS restrito ao Studio.
- Rate limit definido.
- Backup realizado.
- `preflight` em PASS.
- Docker build validado.
