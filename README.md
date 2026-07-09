# Phoenix AI

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
