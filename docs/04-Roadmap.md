# Roadmap

## Sprint 1 - Fundacao

Objetivo: construir o cerebro inicial da plataforma.

- Criar Vision
- Criar Brand Book
- Criar AI Manual
- Criar PRD do MVP
- Definir arquitetura
- Definir stack tecnologica
- Desenhar Phoenix AI Brain
- Criar Prompt Engine inicial
- Criar primeiros agentes

## Sprint 2 - Prompt Engine funcional

Objetivo: transformar a inteligencia da Phoenix AI em artefatos executaveis.

- Criar agentes independentes em `prompts/agents`
- Criar primeiro Brand DNA em YAML
- Criar pipeline `content_engine_v1`
- Definir gates de Brand Guardian e Quality Reviewer
- Preparar execucao futura por n8n ou API

## Sprint 3 - Phoenix Runtime

Objetivo: desenhar o coracao de execucao da plataforma.

- Criar contratos JSON Schema
- Criar Pipeline Registry
- Definir Runtime.execute(task)
- Definir Agent Registry
- Definir Brand Loader
- Definir Execution Context
- Definir estrategia de logging
- Decidir Runtime como biblioteca TypeScript

## Sprint 4 - Runtime Core

Objetivo: escrever a primeira linha de codigo executavel da Phoenix AI.

- Criar package `runtime`
- Criar package `agent-sdk`
- Criar package `brand-loader`
- Validar task com schema
- Carregar Brand DNA
- Carregar pipeline por formato
- Executar primeira task ponta a ponta

## Fase Engine - Concluida

Sprints 5 a 12 transformaram o Runtime em uma engine operacional:

- agentes reais com LLM e fallback mock
- Quality Gate com retry e score minimo
- logs, tokens e estimativa de custo
- persistencia local de execucoes
- Analytics Engine v1
- Knowledge Engine
- Media Composer
- Memory Engine v1

## Fase Produto Multi-Marca - Concluida

Sprints 13 a 25 entregaram:

- Phoenix Studio
- Phoenix API
- historico de execucoes e Analytics Dashboard
- Output Preview
- Brand Manager e Brand Editor
- criacao e duplicacao de marcas
- arquivamento e restauracao de marcas
- importacao e exportacao em YAML
- historico e restauracao de versoes do Brand DNA

## Sprint 26 - Release v0.2.0

Status: concluida.

Objetivo: consolidar o primeiro produto multi-marca da Phoenix AI.

- atualizar documentacao e versao dos pacotes
- publicar changelog e release notes
- validar Studio, Runtime e Analytics
- criar a tag `v0.2.0`

## EPIC 6 - AI Quality & Reliability

Status: concluida.

- Evaluation Engine
- Continuous Quality Pipeline
- Observability
- OpenAPI e SDK TypeScript
- Production Readiness v1

## Sprint 50 - Release v1.0.0-beta

Status: em validacao.

Objetivo: preparar a Phoenix AI para implantacao controlada.

- Docker para API, Studio e Worker
- Compose local e producao
- validacao centralizada de variaveis
- endpoint `/version`
- endpoint `/health/details`
- backup e restore
- integrity check
- diagnostico operacional
- Studio `/settings/system`
- CI expandido com Docker, integridade e diagnostico

## Proxima fase

Apos a v1.0.0-beta, a recomendacao e executar uma sprint curta de estabilizacao para revisar
dependencias, cobertura de testes, documentacao operacional, carga e recuperacao de falhas.

## EPIC 7 - Enterprise Platform

### Sprint 51 - Multi-Tenant Workspace v1

Status: em validacao.

Objetivo: permitir que a Phoenix AI opere com organizacoes, membros, papeis e isolamento inicial de contexto.

- package `@phoenix-ai/workspace`
- modelo de Workspace, Members, Roles, Settings e Invitations
- RBAC inicial: Owner, Admin, Editor, Analyst e Viewer
- storage local em `.storage/workspaces/{workspace_id}`
- migracao idempotente para `default-workspace`
- brands vinculadas a `workspace_id`
- API `/workspaces`
- Studio `/workspaces`, `/workspaces/{id}`, membros e settings
- seletor de workspace na navegacao
- auditoria de operacoes administrativas

## Epics

### Epic 1 - Fundacao

- Criar Vision
- Criar Brand Book
- Criar AI Manual
- Criar PRD
- Definir arquitetura
- Definir stack tecnologica
- Desenhar Phoenix AI Brain

### Epic 2 - Prompt Engine

- Prompt base
- Agente de ideias
- Agente de roteiros
- Agente de revisao
- Agente de SEO

### Epic 3 - Automacao

- Fluxo n8n
- Banco de ativos
- Publicacao
- Analytics
