# Security Policy

## Versoes suportadas

| Versao | Suporte |
| --- | --- |
| 1.0.0-rc1 | sim |

## Reporte de vulnerabilidades

Reporte vulnerabilidades diretamente ao mantenedor do reposititorio. Nao abra issue publica contendo segredos, tokens, payloads sensiveis ou detalhes exploraveis.

## Regras de seguranca

- Segredos devem ficar em variaveis de ambiente ou no Secrets Engine.
- Logs devem ser sanitizados.
- Webhooks devem usar assinatura HMAC quando houver segredo configurado.
- Endpoints protegidos exigem API Key, bearer token ou sessao valida.
- Em producao, configure CORS, rate limit e `PHOENIX_API_KEY`.

## Checklist antes de producao

```bash
pnpm run preflight
pnpm run diagnostics
docker compose build --quiet
```
