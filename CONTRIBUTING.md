# Contributing

Obrigado por contribuir com a Phoenix AI.

## Fluxo

1. Crie uma branch a partir da base atual.
2. Rode `pnpm install`.
3. Faça commits pequenos e descritivos.
4. Execute os checks relevantes antes de abrir PR.

## Checks recomendados

```bash
pnpm run preflight
pnpm run studio:build
docker compose build --quiet
git diff --check
```

## Qualidade

Mudancas em prompts, agentes, providers, workflows ou runtime devem preservar:

- `pnpm run quality:report`
- `pnpm run openapi:validate`
- `pnpm run sdk:build`
- testes especificos do pacote alterado

## Seguranca

Nunca commite chaves, tokens, respostas brutas de providers ou dados sensiveis de usuarios.
