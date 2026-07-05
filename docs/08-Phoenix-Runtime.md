# Phoenix Runtime

Versao: 0.1

Status: Sprint 3

## Objetivo

Phoenix Runtime e o coracao da plataforma.

Ele sera responsavel por executar qualquer agente em qualquer pipeline.

Nenhum app, workflow ou automacao deve chamar agentes diretamente.

Sempre chamaremos:

```ts
Runtime.execute(task)
```

## Exemplo de entrada

```http
POST /runtime/execute
```

```json
{
  "brand": "encanto-intenso",
  "theme": "saudade",
  "objective": "viralizar",
  "platform": "instagram",
  "format": "reel"
}
```

## Exemplo de resposta

```json
{
  "status": "success",
  "execution_id": "uuid",
  "execution_time": 12.4,
  "pipeline": [
    "brand_loader",
    "research",
    "hook_specialist",
    "story_writer",
    "reviewer"
  ],
  "score": 95,
  "output": {
    "hook": "...",
    "story": "...",
    "ending": "...",
    "caption": "...",
    "hashtags": []
  }
}
```

## Blocos principais

```text
apps/
  studio/
  api/

packages/
  runtime/
  agent-sdk/
  prompt-engine/
  brand-loader/

schemas/
  task.schema.json
  brand.schema.json
  response.schema.json

pipelines/
  reel.yaml
  carousel.yaml
  story.yaml
```

## Fluxo interno

Task

-> Brand Loader

-> Pipeline Loader

-> Execution Context

-> Agent Registry

-> Agent Execution

-> Validation

-> Response JSON

## Decisoes

- Runtime sera uma biblioteca TypeScript em `packages/runtime`.
- n8n sera consumidor do Runtime, nao o centro da arquitetura.
- Agentes dependerao de uma interface, nao de um provedor de IA especifico.
- Brand DNA sera carregado pelo Runtime e entregue aos agentes como objeto.
- Pipelines serao declarativos em YAML.
- Execucoes deverao gerar logs estruturados.

## Componentes

### Runtime.execute()

Ponto unico de entrada para executar tasks.

### Agent Registry

Mapa de agentes disponiveis.

### Pipeline Loader

Carrega pipelines por formato, como `reel`, `carousel` ou `story`.

### Brand Loader

Carrega e valida o Brand DNA.

### Logger

Registra cada etapa da execucao.

### Execution Context

Objeto compartilhado durante uma execucao.

Deve conter:

- execution id
- task original
- brand carregada
- pipeline escolhido
- logs
- outputs intermediarios
- tempo de execucao

## Futuro banco de execucoes

No futuro, cada execucao deve registrar:

- task
- tempo
- modelo usado
- tokens
- custo
- pipeline
- resultado
- score

