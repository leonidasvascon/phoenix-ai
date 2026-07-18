# Architecture

Phoenix AI e uma plataforma modular de agentes criativos.

## Blocos principais

- Studio: interface operacional.
- API: contrato HTTP autenticado.
- Runtime: executa tasks e pipelines.
- Agent SDK e Prompt Engine: executam agentes especializados.
- Knowledge, Memory, Learning e Strategy: fornecem contexto e decisao.
- Evaluation e Quality Pipeline: impedem regressao de qualidade.
- Asset Engine e Publishing Engine: geram e publicam artefatos.
- Workflow Engine, Scheduler e Event Bus: orquestram automacoes.
- Workspace, Identity, Secrets e Cost Intelligence: governanca empresarial.

## Principio

Cada modulo executa uma responsabilidade. O Workflow Engine orquestra; ele nao substitui Runtime, Evaluation ou Publishing.
