# ADR 0004 - Runtime como biblioteca TypeScript

## Status

Aceito

## Contexto

Phoenix AI precisa executar agentes, carregar marcas, escolher pipelines, validar respostas e registrar logs.

Uma alternativa seria usar n8n como centro da orquestracao.

## Decisao

Phoenix Runtime sera implementado como uma biblioteca TypeScript em `packages/runtime`.

n8n sera um consumidor do Runtime, nao o centro da arquitetura.

## Consequencias

- Runtime podera ser usado pela API, Studio, testes automatizados e n8n.
- A logica central fica versionada no repositorio.
- A execucao fica testavel.
- Fica mais facil trocar provedores de IA no futuro.
- Pipelines podem continuar declarativos em YAML.

## Proxima etapa

Na Sprint 4, iniciar a primeira implementacao de codigo:

- `packages/runtime`
- `packages/agent-sdk`
- `packages/brand-loader`
- primeira execucao de ponta a ponta

