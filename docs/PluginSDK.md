# Plugin SDK

Plugins estendem a Phoenix AI sem alterar o nucleo.

## Capacidades

- Registrar agentes.
- Registrar nos de workflow.
- Registrar eventos.
- Consumir secrets autorizados.
- Publicar telemetria sanitizada.

## Regras

- Plugins nao devem acessar segredos diretamente fora do Secrets Engine.
- Plugins devem declarar capacidades no manifesto.
- Plugins devem ser validados antes de ativacao.
- Logs nao podem conter prompts completos, tokens ou respostas brutas de providers.
