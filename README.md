# Phoenix AI

Versao: 0.1

Phoenix AI e uma plataforma inteligente para criar, aprender, publicar e otimizar conteudo digital para diferentes marcas, nichos e canais usando Inteligencia Artificial.

## Plataforma

Phoenix AI nao nasce como um projeto unico. Ela nasce como uma plataforma composta por modulos:

- Engine
- Studio
- Scheduler
- Analytics
- Learning
- API

## Decisao arquitetural

A plataforma sera orientada a Brands. Cada marca tera uma configuracao propria, como `brand.yaml`, contendo publico-alvo, tom de voz, pilares de conteudo, identidade visual, frequencia e canais de publicacao.

Isso permite criar novos perfis sem alterar o codigo central da plataforma.

## Estrutura

- `docs/`: documentacao de produto, arquitetura, ADRs e diagramas.
- `apps/`: aplicacoes da plataforma.
- `packages/`: engines e bibliotecas internas.
- `workflows/`: automacoes n8n e GitHub.
- `prompts/`: prompts por finalidade e contexto.
- `assets/`: fontes, logos, videos, musicas e templates.
- `database/`: modelos, migrations e seeds.
- `tests/`: testes automatizados.

## Sprint atual

Sprint 1 - Fundacao.

## Documentos principais

- `docs/00-Vision.md`
- `docs/01-BrandBook.md`
- `docs/02-AI-Manual.md`
- `docs/03-Architecture.md`
- `docs/04-Roadmap.md`
- `docs/06-PRD.md`
- `docs/07-Phoenix-AI-Brain.md`

## Prompt Engine v1

Artefatos iniciais:

- `prompts/agents/`
- `prompts/brands/encanto-intenso.brand.yaml`
- `prompts/pipelines/content_engine_v1.yaml`

## Phoenix Runtime

Contratos e arquitetura da Sprint 3:

- `schemas/task.schema.json`
- `schemas/brand.schema.json`
- `schemas/response.schema.json`
- `pipelines/reel.yaml`
- `pipelines/carousel.yaml`
- `pipelines/story.yaml`
- `docs/08-Phoenix-Runtime.md`

## Runtime MVP

Sprint 4 adiciona o primeiro runtime executavel com agentes mockados.

Rodar exemplo:

```bash
npm run example:task
```

Saida esperada:

- task validada
- Brand DNA carregado
- pipeline carregado
- agentes mockados executados
- JSON final com `status`, `pipeline`, `score` e `output`
