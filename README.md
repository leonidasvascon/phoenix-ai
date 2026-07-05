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
- `knowledge/`: base de conhecimento criativa usada pelos agentes.
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

Gerar analytics a partir das execucoes persistidas:

```bash
npm run example:analytics
```

Gerar pacote de midia publicavel:

```bash
npm run example:task
```

O comando executa o Runtime, persiste a execucao e cria:

```text
output/YYYY-MM-DD/reel_001/
  roteiro.md
  legenda.txt
  hashtags.txt
  thumbnail_prompt.txt
  video_prompt.txt
  metadata.json
```

Provider mock explicito:

```bash
PHOENIX_PROVIDER=mock npm run example:task
```

Provider OpenAI:

```bash
PHOENIX_PROVIDER=openai npm run example:task
```

Saida esperada:

- task validada
- Brand DNA carregado
- pipeline carregado
- agentes mockados executados
- Quality Gate executado
- JSON final com `status`, `pipeline`, `score`, `quality`, `execution` e `output`
- execucoes persistidas em `.storage/executions/{execution_id}.json`
- pacote de midia gerado em `output/YYYY-MM-DD/{format}_NNN/`

## Knowledge Engine

Sprint 11 adiciona uma base de conhecimento versionada para alimentar os agentes antes da geracao de conteudo.

Estrutura inicial:

- `packages/knowledge-engine/`: carrega e recupera conhecimento criativo.
- `knowledge/emotions/`: mapas emocionais por tema.
- `knowledge/hooks/`: estrategias de abertura.
- `knowledge/storytelling/`: estruturas narrativas.
- `knowledge/ctas/`: chamadas de acao por estilo.
- `knowledge/forbidden/`: padroes proibidos.
- `knowledge/vocabulary/`: vocabulario de marca.

Fluxo atualizado:

```text
Task -> Brand Loader -> Knowledge Loader -> Pipeline -> Agents -> Media Composer
```
