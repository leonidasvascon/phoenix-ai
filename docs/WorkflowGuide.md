# Workflow Guide

Workflow Builder orquestra modulos existentes.

## Nos iniciais

- Trigger
- Scheduler
- Strategy
- Task
- Evaluation
- Condition
- Publishing
- Webhook
- Notification

## Exemplo

```text
Scheduler -> Strategy -> Task -> Evaluation -> Condition -> Publishing -> Notification
```

## Regra arquitetural

O Workflow Engine nao gera conteudo, nao avalia e nao publica diretamente. Ele chama Runtime, Evaluation Engine e Publishing Engine.
