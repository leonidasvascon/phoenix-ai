# Phoenix AI

[![Quality](https://github.com/leonidasvascon/phoenix-ai/actions/workflows/quality.yml/badge.svg)](https://github.com/leonidasvascon/phoenix-ai/actions/workflows/quality.yml)

Versao: 0.2.0

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

## Release atual

`v0.2.0` - Produto Multi-Marca.

Esta versao consolida o Phoenix Studio e a Phoenix API em um produto utilizavel para criar, editar,
duplicar, arquivar, restaurar, importar, exportar e versionar marcas. O Studio tambem oferece historico
de execucoes, analytics e visualizacao dos pacotes gerados.

Release notes: `docs/releases/v0.2.0.md`.

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

- `DELETE /brands/:id`
- `POST /tasks`
- `POST /tasks/batch`
- `GET /batch-templates`
- `POST /batch-templates`
- `PUT /batch-templates/:id`
- `DELETE /batch-templates/:id`
- `GET /scheduled-jobs`
- `POST /scheduled-jobs`
- `DELETE /scheduled-jobs/:id`
- `POST /scheduled-jobs/run-due`
- `GET /learning`
- `POST /learning/analyze`
- `GET /feedback`
- `POST /feedback`
- `GET /feedback/:execution_id`
- `GET /prompt-optimizations`
- `POST /prompt-optimizations/generate`
- `GET /providers`
- `GET /providers/status`
- `GET /video-jobs`
- `GET /video-jobs/:execution_id`
- `GET /executions`
- `GET /executions/:id`
- `GET /analytics`
- `GET /brands/archived`
- `POST /brands`
- `POST /brands/:id/duplicate`
- `POST /brands/:id/restore`
- `GET /brands`
- `GET /brands/:id`
- `GET /brands/:id/export`
- `GET /brands/:id/versions`
- `GET /brands/:id/versions/:version`
- `POST /brands/import`
- `POST /brands/:id/versions/:version/restore`
- `PUT /brands/:id`

Fluxo atualizado:

```text
Studio -> API -> Runtime -> Media Composer -> Output
```

## Authentication v1

Sprint 27 protege todos os endpoints da Phoenix API com uma chave configurada em `PHOENIX_API_KEY`.

Configure o ambiente:

```env
PHOENIX_API_KEY=change-me
NEXT_PUBLIC_PHOENIX_API_URL=http://127.0.0.1:4000
NEXT_PUBLIC_PHOENIX_API_KEY=change-me
```

A API aceita a chave em `Authorization: Bearer <token>` ou `X-Phoenix-Api-Key`.

- requisicao sem chave retorna `401`
- chave invalida retorna `403`
- chave valida executa o endpoint normalmente

O Studio centraliza as chamadas autenticadas e oferece login local em `/login`. A chave informada e
armazenada no navegador. Esta primeira versao e adequada para ambiente controlado; autenticacao por
usuario, sessoes e autorizacao granular ficam para uma evolucao posterior.

Todas as rotas do Studio, exceto `/login`, sao protegidas por sessao local. Sem token salvo, o Studio
redireciona automaticamente para o login. O botao `Sair` remove o token e encerra a sessao no navegador.

## Runtime Settings

Sprint 29 adiciona a tela `/settings` no Studio e os endpoints `GET /settings` e `PUT /settings` na API.
As configuracoes ficam persistidas em `.storage/settings.json` e controlam:

- `PHOENIX_PROVIDER`
- `PHOENIX_API_URL`
- score minimo do Quality Gate
- maximo de tentativas
- pasta de output dos pacotes gerados

Ao gerar uma nova task via API, o Runtime usa o provider, score minimo e tentativas salvas. O Media Composer
usa a pasta de output configurada.

## Task Templates

Sprint 30 adiciona modelos reutilizaveis de task persistidos em `.storage/task-templates.json`.

Endpoints:

- `GET /task-templates`
- `POST /task-templates`
- `PUT /task-templates/:id`
- `DELETE /task-templates/:id`

O Studio oferece a tela `/templates` para criar, editar, excluir e usar modelos. O comando `Usar template`
abre a Nova Task com marca, tema, objetivo, plataforma e formato preenchidos.

## Batch Task Runner

Sprint 31 adiciona geracao de multiplas tasks em sequencia pela API e pelo Studio.

Endpoint:

- `POST /tasks/batch`

Entrada:

```json
{
  "items": [
    {
      "brand": "encanto-intenso",
      "theme": "saudade",
      "objective": "viralizar",
      "platform": "instagram",
      "format": "reel"
    }
  ]
}
```

O Studio oferece a tela `/batch` para adicionar/remover linhas, escolher marca e formato, preencher tema
e objetivo, executar o lote e visualizar o resultado individual de cada item. Cada task bem-sucedida gera
uma execucao persistida e um pacote em `output/`.

## Batch Templates

Sprint 32 adiciona templates reutilizaveis de lotes persistidos em `.storage/batch-templates.json`.

Endpoints:

- `GET /batch-templates`
- `POST /batch-templates`
- `PUT /batch-templates/:id`
- `DELETE /batch-templates/:id`

Formato:

```json
{
  "name": "Semana Saudade",
  "items": [
    {
      "brand": "encanto-intenso",
      "theme": "saudade",
      "objective": "viralizar",
      "platform": "instagram",
      "format": "reel"
    }
  ]
}
```

A tela `/batch` permite salvar o lote atual como template e carregar um template existente. A tela
`/batch/templates` permite criar, editar e excluir modelos de lote.

## Scheduler

Sprint 33 adiciona agendamento local de tasks e batches em `.storage/scheduled-jobs.json`.

Endpoints:

- `GET /scheduled-jobs`
- `POST /scheduled-jobs`
- `DELETE /scheduled-jobs/:id`
- `POST /scheduled-jobs/run-due`

Formato:

```json
{
  "name": "Semana Saudade",
  "type": "batch",
  "run_at": "2026-07-10T08:00:00-03:00",
  "payload": {
    "items": []
  },
  "status": "pending"
}
```

A tela `/scheduler` permite criar, listar e excluir jobs. O endpoint `POST /scheduled-jobs/run-due`
executa manualmente jobs vencidos e atualiza o status para `completed` ou `failed`.

## Scheduler Worker

Sprint 34 adiciona um worker opcional dentro da Phoenix API para executar jobs pendentes automaticamente.

Variaveis:

```env
PHOENIX_SCHEDULER_WORKER=true
PHOENIX_SCHEDULER_INTERVAL_MS=60000
```

Rodar API com worker:

```bash
PHOENIX_SCHEDULER_WORKER=true PHOENIX_SCHEDULER_INTERVAL_MS=60000 npm run api:dev:worker
```

No Windows PowerShell:

```powershell
$env:PHOENIX_SCHEDULER_WORKER="true"
$env:PHOENIX_SCHEDULER_INTERVAL_MS="60000"
npm run api:dev:worker
```

O worker usa a mesma logica de `POST /scheduled-jobs/run-due`, registra jobs verificados, jobs executados
e erros, e ignora ciclos concorrentes quando uma execucao anterior ainda esta ativa.

## Learning Engine

Sprint 35 adiciona o pacote `@phoenix-ai/learning-engine` para transformar execucoes salvas em aprendizado
operacional.

Endpoints:

- `GET /learning`
- `POST /learning/analyze`

O Learning v1 analisa:

- score medio por tema
- score medio por marca
- score medio por formato
- fallbacks por agente
- temas mais usados
- marcas mais usadas
- tempo medio por formato

Sprint 37 integra feedbacks reais ao Learning Engine e adiciona:

- views por tema
- likes por tema
- shares por tema
- saves por tema
- seguidores ganhos por tema
- engagement rate
- save rate
- share rate
- melhor execucao real
- piores execucoes reais
- recomendacoes baseadas em performance publicada

Saida:

```json
{
  "summary": {
    "total_executions": 24,
    "average_score": 95,
    "success_rate": 100
  },
  "real_performance": {
    "total_feedbacks": 6,
    "matched_feedbacks": 6,
    "feedback_coverage_rate": 25,
    "performance_by_theme": [
      {
        "name": "saudade",
        "count": 3,
        "views": 4200,
        "likes": 510,
        "shares": 96,
        "saves": 128,
        "followers_gained": 22,
        "engagement_rate": 17.48,
        "save_rate": 3.05,
        "share_rate": 2.29
      }
    ],
    "best_execution": {
      "execution_id": "uuid",
      "theme": "saudade",
      "brand": "encanto-intenso",
      "format": "reel",
      "platform": "instagram",
      "views": 1800,
      "likes": 240,
      "comments": 18,
      "shares": 42,
      "saves": 55,
      "followers_gained": 10,
      "engagement_rate": 19.72,
      "save_rate": 3.06,
      "share_rate": 2.33,
      "internal_score": 95,
      "posted_at": "2026-07-09T00:00:00-03:00"
    },
    "worst_executions": []
  },
  "recommendations": [
    {
      "type": "theme",
      "priority": "high",
      "message": "O tema saudade apresenta score medio alto. Priorize variacoes desse tema."
    }
  ]
}
```

A tela `/learning` mostra resumo, rankings de aprendizado, performance real por tema, melhores execucoes, piores
execucoes e recomendacoes acionaveis para os proximos conteudos.

## Feedback Engine

Sprint 36 adiciona o pacote `@phoenix-ai/feedback-engine` para registrar performance real de conteudos publicados.

Endpoints:

- `GET /feedback`
- `POST /feedback`
- `GET /feedback/:execution_id`

Persistencia:

```text
.storage/feedback.json
```

Formato:

```json
{
  "execution_id": "uuid",
  "platform": "instagram",
  "views": 0,
  "likes": 0,
  "comments": 0,
  "shares": 0,
  "saves": 0,
  "followers_gained": 0,
  "posted_at": "2026-07-09T00:00:00-03:00"
}
```

A tela `/feedback` permite lancar feedback manual e listar feedbacks cadastrados. O preview de execucao
em `/executions/{execution_id}` tem o botao `Adicionar feedback`, preenchendo automaticamente o ID.

## Prompt Optimizer

Sprint 38 adiciona o pacote `@phoenix-ai/prompt-optimizer` para transformar recomendacoes do Learning Engine
em instrucoes praticas para os agentes.

Endpoints:

- `GET /prompt-optimizations`
- `POST /prompt-optimizations/generate`

Persistencia:

```text
.storage/prompt-optimizations.json
```

Formato:

```json
{
  "brand_id": "encanto-intenso",
  "agent": "hook_specialist",
  "instruction": "Priorize hooks do tipo pergunta, pois conteudos com esse padrao tiveram maior taxa de compartilhamento.",
  "source": "feedback_analytics",
  "active": true
}
```

O Runtime injeta `learning_recommendations` e `prompt_optimizations` no payload enviado aos agentes. A tela
`/optimizations` lista otimizacoes ativas e permite gerar novas instrucoes a partir do Learning.

## Asset Engine

Epic 4 inicia o `Autonomous Content Pipeline`. A Sprint 39 adiciona o pacote `@phoenix-ai/asset-engine`
para gerar ativos multimidia por meio de providers independentes.

Fluxo:

```text
Task -> Runtime -> Media Composer -> Asset Engine -> Output
```

Provider Architecture:

- `VideoProvider`
- `ImageProvider`
- `VoiceProvider`
- `AssetRegistry`
- `AssetService`

Supported Providers:

- Video: `mock`
- Image: `mock`, `openai`
- Voice: `mock`, `openai`

Image Provider v1:

```env
PHOENIX_IMAGE_PROVIDER=mock
OPENAI_API_KEY=
PHOENIX_IMAGE_SIZE=1024x1024
PHOENIX_IMAGE_MODEL=gpt-image-1
```

Regras:

- `PHOENIX_IMAGE_PROVIDER=mock` gera `assets/thumbnail.png` placeholder.
- `PHOENIX_IMAGE_PROVIDER=openai` usa OpenAI Images API para gerar `assets/thumbnail.png`.
- se `PHOENIX_IMAGE_PROVIDER=openai` estiver sem `OPENAI_API_KEY`, o Asset Engine cai para `mock`.
- `assets/assets.json` registra `requested_provider`, `provider_id`, `fallback`, `model` e `size`.

Voice Provider v1:

```env
PHOENIX_VOICE_PROVIDER=mock
OPENAI_API_KEY=
PHOENIX_VOICE_MODEL=
PHOENIX_VOICE_NAME=
PHOENIX_VOICE_FORMAT=mp3
PHOENIX_VOICE_SPEED=1
```

Regras:

- `PHOENIX_VOICE_PROVIDER=mock` gera `assets/narration.mp3` placeholder.
- `PHOENIX_VOICE_PROVIDER=openai` usa OpenAI Audio Speech API para gerar `assets/narration.mp3`.
- sem `OPENAI_API_KEY`, modelo ou voz, o provider cai para `mock`.
- `assets/assets.json` registra `requested_provider`, `provider_id`, `fallback`, `model`, `voice`, `format` e `speed`.
- a narração usa `output.narration` quando existir, depois `story`, e por fim o roteiro completo.

Video Provider v1:

```env
PHOENIX_VIDEO_PROVIDER=mock
OPENAI_API_KEY=
PHOENIX_VIDEO_MODEL=
PHOENIX_VIDEO_SIZE=1080x1920
PHOENIX_VIDEO_DURATION_SECONDS=8
PHOENIX_VIDEO_POLL_INTERVAL_MS=5000
PHOENIX_VIDEO_TIMEOUT_MS=600000
```

Regras:

- `PHOENIX_VIDEO_PROVIDER=mock` gera `assets/video.mp4` placeholder.
- `PHOENIX_VIDEO_PROVIDER=openai` usa um provider assíncrono com criação de job, polling e download.
- sem `OPENAI_API_KEY` ou modelo configurado, o provider cai para `mock`.
- jobs temporários são persistidos em `.storage/video-jobs/{execution_id}.json`.
- `assets/assets.json` registra `requested_provider`, `provider_id`, `fallback`, `status`, `model`, `size` e `duration_seconds`.
- o preview de execução mostra status de vídeo e exibe player HTML5 quando houver MP4 real concluído.

Arquivos gerados:

```text
output/
  2026-07-09/
    reel_010/
      roteiro.md
      legenda.txt
      hashtags.txt
      thumbnail_prompt.txt
      video_prompt.txt
      metadata.json
      assets/
        thumbnail.png
        narration.mp3
        video.mp4
        assets.json
```

Endpoints:

- `GET /providers`
- `GET /providers/status`
- `GET /video-jobs`
- `GET /video-jobs/:execution_id`

A tela `/providers` mostra o provider de video, imagem e voz, incluindo modo `mock` e status `online`.

Future Integrations:

- Veo
- Runway
- Kling
- Pika
- ElevenLabs
- Cartesia
- Azure Speech
- Flux
- Ideogram

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

## Brand Duplication

Sprint 21 adiciona duplicacao de marcas a partir de um Brand DNA existente.

Endpoint:

- `POST /brands/:id/duplicate`

O endpoint:

- carrega o Brand DNA original
- recebe novo nome e novo proposito
- gera um novo id slugificado
- copia estrutura e preferencias
- atualiza `brand.id`, `brand.name` e `purpose`
- salva em `prompts/brands/{new_id}.yaml`
- impede duplicidade

No Studio:

- a tela `/brands/{id}` tem o botao `Duplicar marca`
- o formulario pede novo nome e novo proposito
- apos criar, redireciona para `/brands/{new_id}`

## Brand Archive

Sprint 22 adiciona arquivamento seguro de marcas.

Endpoint:

- `DELETE /brands/:id`

O endpoint:

- move `prompts/brands/{id}.yaml` para `.storage/archived-brands/{id}-{timestamp}.yaml`
- impede arquivamento de `encanto-intenso`
- retorna status, id da marca, nome, timestamp e caminho do arquivo arquivado

No Studio:

- a tela `/brands/{id}` tem o botao `Arquivar marca`
- exige confirmacao antes de arquivar
- redireciona para `/brands`
- acesso direto a marca arquivada mostra `Marca nao encontrada ou arquivada.`

## Brand Restore

Sprint 23 adiciona restauracao segura de marcas arquivadas.

Endpoints:

- `GET /brands/archived`
- `POST /brands/:id/restore`

`GET /brands/archived` retorna:

- `id`
- `nome`
- `arquivado_em`
- `arquivo`

`POST /brands/:id/restore`:

- localiza a ultima versao arquivada da marca
- valida que `prompts/brands/{id}.yaml` ainda nao existe
- move o YAML de `.storage/archived-brands/` para `prompts/brands/`
- retorna o Brand DNA restaurado

No Studio:

- `/brands` tem o botao `Marcas arquivadas`
- `/brands/archived` lista as marcas arquivadas
- cada marca arquivada pode ser restaurada
- estado vazio quando nao ha arquivos arquivados

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

## Brand Export & Import

Sprint 24 adiciona backup e migracao de Brand DNA em YAML.

Endpoints:

- `GET /brands/:id/export` retorna o YAML original como arquivo para download
- `POST /brands/import` aceita YAML puro ou JSON no formato `{ "yaml": "..." }`

A importacao valida `brand.id`, `brand.name` e `purpose`, impede IDs duplicados e salva o arquivo em
`prompts/brands/{id}.yaml`. No Studio, `/brands/import` recebe o YAML e redireciona para a marca importada.

## Brand Versioning

Sprint 25 adiciona historico auditavel do Brand DNA. Os snapshots sao armazenados em:

```text
.storage/brand-versions/{id}/{timestamp}.yaml
```

Uma versao e criada antes de editar, duplicar ou arquivar uma marca. A importacao registra o YAML recebido
como versao inicial. Ao restaurar uma versao antiga, o estado atual tambem e preservado antes da troca.

Endpoints:

- `GET /brands/:id/versions` lista o historico
- `GET /brands/:id/versions/:version` retorna metadados, YAML e Brand DNA parseado
- `POST /brands/:id/versions/:version/restore` restaura a versao selecionada

O Studio exibe o historico em `/brands/{id}`, permite visualizar o YAML e restaurar uma versao com confirmacao.

Campos da tela:

- nome da marca
- proposito
- tom
- emocoes
- hooks preferidos
- storytelling preferido
- CTA preferido
- padroes proibidos

## Publishing Engine

Sprint 43 adiciona uma camada segura de publicacao desacoplada do Runtime.

O fluxo passa a ser:

```text
Execution Package -> Publication Draft -> Validation -> Publish
```

Endpoints:

- `GET /publications`
- `POST /publications`
- `GET /publications/:id`
- `POST /publications/:id/publish`
- `POST /publications/:id/cancel`

As publicacoes sao persistidas em:

```text
.storage/publications/{publication_id}.json
```

Regras v1:

- provider inicial `mock`
- `dry_run=true` por padrao
- bloqueio de duplicidade por `execution_id + platform`
- validacao de video, thumbnail, legenda e metadata
- bloqueio de assets mock/fallback quando `PHOENIX_ALLOW_FALLBACK_ASSETS=false`
- publicacao efetiva somente via `POST /publications/:id/publish`

Variaveis:

```text
PHOENIX_PUBLISHING_PROVIDER=mock
PHOENIX_ALLOW_FALLBACK_ASSETS=false
PHOENIX_PUBLISHING_DRY_RUN=true
META_GRAPH_API_VERSION=
META_ACCESS_TOKEN=
META_INSTAGRAM_ACCOUNT_ID=
PHOENIX_PUBLIC_MEDIA_BASE_URL=
PHOENIX_INSTAGRAM_POLL_INTERVAL_MS=5000
PHOENIX_INSTAGRAM_TIMEOUT_MS=300000
```

## Instagram Publishing Provider

Sprint 44 adiciona o primeiro provider real de publicacao, usando a API oficial da Meta em duas etapas:

```text
Publication Draft -> Media Container -> Processing Poll -> media_publish
```

O provider `instagram` implementa:

- validacao de conta profissional configurada
- validacao de token sem expor o segredo na API ou no Studio
- resolucao de midia local para URL publica HTTPS via `PHOENIX_PUBLIC_MEDIA_BASE_URL`
- criacao de container de Reel
- polling de processamento do container
- publicacao final via `media_publish`
- persistencia de `provider_data.container_id` antes do polling
- registro de `publishing_limit`
- modo `dry-run` por padrao

Endpoint adicional:

- `POST /providers/instagram/validate`

Resposta:

```json
{
  "provider": "instagram",
  "configured": false,
  "credentials_valid": false,
  "account_id_present": false,
  "access_token_present": false,
  "public_media_base_url_present": false,
  "ready": false
}
```

Sem URL publica HTTPS, a publicacao real e bloqueada. O caminho local `output/.../assets/video.mp4` nunca e enviado diretamente para a Meta.

## Strategy Engine

Sprint 45 inicia o Epic 5, Phoenix Intelligence. A Phoenix passa a transformar aprendizado, analytics e feedback real em um plano editorial.

Entrada:

```json
{
  "goal": "grow_instagram",
  "period_days": 30,
  "posts_per_week": 7
}
```

Endpoints:

- `GET /strategy` retorna o ultimo plano salvo
- `POST /strategy/generate` gera um novo plano

O plano fica persistido em:

```text
.storage/strategy/latest.json
```

O Strategy Engine entrega:

- prioridades estrategicas
- oportunidades
- gaps de conteudo
- calendario editorial
- tasks prontas para alimentar Batch, Scheduler e Runtime

Tela:

```text
http://127.0.0.1:3000/strategy
```

## Evaluation Engine

Sprint 46 inicia o Epic 6, AI Quality & Reliability. A Phoenix passa a avaliar automaticamente o conteudo com rubricas independentes antes de tratar uma geracao como confiavel.

Rubrica v1:

- originalidade
- clareza
- forca do hook
- alinhamento com a marca
- impacto emocional

Pacote:

```text
packages/evaluation-engine
```

Entradas de benchmark:

```text
benchmarks/reels
benchmarks/carousel
benchmarks/storytelling
benchmarks/hooks
```

Endpoints:

- `GET /evaluation` retorna o ultimo relatorio salvo
- `POST /evaluation/run` executa benchmarks e regressao sobre ate 100 execucoes persistidas

O relatorio fica persistido em:

```text
.storage/evaluation/latest.json
```

Tela:

```text
http://127.0.0.1:3000/evaluation
```

## Quality Pipeline

Sprint 47 adiciona Continuous Quality Pipeline para impedir regressao de qualidade em PRs.

Workflows:

- `.github/workflows/quality.yml`
- `.github/workflows/benchmarks.yml`

Comandos locais:

```bash
pnpm run quality:benchmarks
pnpm run quality:regressions
pnpm run quality:report
```

O gate falha quando:

- `average_score < 95`
- `benchmark_pass_rate < 100%`
- `regression_failures > 0`

Relatorios gerados:

```text
reports/quality-report.json
reports/quality-report.md
.storage/quality/reports/latest.json
.storage/quality/reports/YYYY-MM-DD.json
```

Endpoints:

- `GET /quality` retorna o ultimo relatorio e o historico
- `GET /quality/report` retorna o ultimo relatorio gerado

Tela:

```text
http://127.0.0.1:3000/evaluation/history
```
