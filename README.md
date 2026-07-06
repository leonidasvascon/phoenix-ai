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

## Memory Engine

Sprint 12 adiciona memoria operacional por marca para reduzir repeticao e alimentar os agentes com historico.

Estrutura inicial:

- `packages/memory-engine/`: carrega, recupera e grava memoria por marca.
- `.storage/memory/{brand_id}.json`: memoria local gerada em runtime.

Memoria v1 registra:

- `used_hooks`
- `used_themes`
- `used_ctas`
- `used_storytelling`
- `recent_outputs`

Fluxo atualizado:

```text
Task -> Brand Loader -> Knowledge Loader -> Memory Loader -> Pipeline -> Agents -> Quality Gate -> Persistence -> Analytics -> Media Composer
```

O payload dos agentes agora recebe:

```text
task + brand + knowledge + memory + previous_outputs
```

## Phoenix Studio

Sprint 13 inicia o primeiro produto visual da Phoenix AI.

Rodar o Studio:

```bash
npm run api:dev
npm run studio:dev
```

Tela inicial:

- selecionar marca
- informar tema
- informar objetivo
- escolher formato
- gerar pacote publicavel sem usar terminal

## Phoenix API

Sprint 14 separa o Studio do Runtime.

Rodar a API:

```bash
npm run api:dev
```

Endpoints v1:

- `POST /tasks`
- `GET /executions`
- `GET /executions/:id`
- `GET /analytics`
- `POST /brands`
- `GET /brands`
- `GET /brands/:id`
- `PUT /brands/:id`

Fluxo atualizado:

```text
Studio -> API -> Runtime -> Media Composer -> Output
```

## Execution History

Sprint 15 adiciona historico operacional no Studio.

Tela:

```text
http://127.0.0.1:3000/history
```

Dados consumidos:

- `GET /executions`

A tela mostra:

- data e hora
- marca
- tema
- formato
- score
- status
- caminho do pacote em `output/`
- indicador de fallback
- botao para copiar caminho
- botao para abrir o preview do pacote

## Output Preview

Sprint 17 adiciona visualizacao do pacote gerado sem abrir a pasta manualmente.

Tela:

```text
http://127.0.0.1:3000/executions/{execution_id}
```

Dados consumidos:

- `GET /executions/:id`

A tela mostra:

- dados da execucao
- `metadata.json`
- `roteiro.md`
- `legenda.txt`
- `hashtags.txt`
- `video_prompt.txt`
- `thumbnail_prompt.txt`

## Analytics Dashboard

Sprint 16 adiciona dashboard de analytics no Studio.

Tela:

```text
http://127.0.0.1:3000/analytics
```

Dados consumidos:

- `GET /analytics`

A tela mostra:

- total de execucoes
- taxa de sucesso
- score medio
- tempo medio
- custo estimado total
- agentes com mais falhas
- temas mais usados
- marcas mais usadas

## Brand Manager

Sprint 18 adiciona visualizacao de marcas e Brand DNA no Studio.

Telas:

```text
http://127.0.0.1:3000/brands
http://127.0.0.1:3000/brands/{brand_id}
```

Dados consumidos:

- `GET /brands`
- `GET /brands/:id`

A tela de marcas mostra:

- lista de marcas cadastradas em `prompts/brands`
- nome
- proposito
- personalidade
- botao para abrir o DNA

A tela de DNA mostra:

- Brand DNA completo
- tom de voz
- emocoes
- visual
- preferencias
- padroes proibidos

## Brand Editor

Sprint 19 adiciona edicao do Brand DNA pelo Studio.

Endpoint:

- `PUT /brands/:id`

O endpoint:

- recebe JSON do Brand DNA
- valida `version`, `brand.id` e `brand.name`
- salva em `prompts/brands/{id}.yaml`
- retorna o Brand DNA atualizado

Campos editaveis no Studio:

- proposito
- tom
- emocoes
- hooks preferidos
- storytelling preferido
- CTA preferido
- padroes proibidos

## Brand Creation

Sprint 20 adiciona criacao de marcas pelo Studio.

Tela:

```text
http://127.0.0.1:3000/brands/new
```

Endpoint:

- `POST /brands`

O endpoint:

- recebe dados basicos da nova marca
- gera um id slugificado a partir do nome
- valida duplicidade em `prompts/brands/{id}.yaml`
- cria o arquivo YAML da marca
- retorna o Brand DNA criado

Campos da tela:

- nome da marca
- proposito
- tom
- emocoes
- hooks preferidos
- storytelling preferido
- CTA preferido
- padroes proibidos
