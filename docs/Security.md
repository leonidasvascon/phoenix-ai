# Security

## Controles atuais

- API Key e bearer token.
- RBAC por workspace.
- Secrets Engine.
- Rate limiting configuravel.
- CORS configuravel.
- Sanitizacao de logs, erros e respostas de providers.
- Headers HTTP de seguranca.

## Headers

A API envia:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy`
- `Cross-Origin-Opener-Policy`

## Boas praticas

- Use chaves diferentes por ambiente.
- Rotacione secrets periodicamente.
- Bloqueie fallback assets em publicacao real.
- Nao persista prompts sensiveis em logs.
- Valide webhooks por HMAC.
