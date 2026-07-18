# Troubleshooting

## Docker nao responde

Verifique:

```bash
docker version
docker compose ps
```

Se houver erro no pipe do Docker Desktop, reinicie o Docker Desktop e rode novamente no diretorio do projeto.

## API retorna 401 ou 403

Confirme `PHOENIX_API_KEY`, bearer token ou sessao do Studio. A chave nunca deve ser exposta em logs ou tela de desenvolvedores.

## Studio nao carrega dados

Confira `NEXT_PUBLIC_PHOENIX_API_URL` e `NEXT_PUBLIC_PHOENIX_API_KEY`.

## Providers caem para mock

Verifique chave, modelo, quotas e configuracao do provider. Fallback e esperado quando o provider real falha.

## Qualidade falhou

Rode:

```bash
pnpm run quality:report
```

Revise benchmarks, regressions e relatorio em `reports/`.
