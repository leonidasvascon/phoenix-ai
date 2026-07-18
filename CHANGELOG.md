# Changelog

Todas as mudancas relevantes da Phoenix AI serao registradas neste arquivo.

## [1.0.0-rc1] - 2026-07-18

### Adicionado

- Release Candidate v1 com hardening operacional.
- Pagina Studio `/system` com versao, health e diagnostico consolidado.
- Scripts `backup-all`, `restore-all`, `health-check`, `preflight` e `post-upgrade`.
- Documentacao consolidada de arquitetura, deploy, operacao, seguranca, API, Plugin SDK e workflows.
- Arquivos de governanca do repositorio: `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` e `SECURITY.md`.
- Headers HTTP adicionais para CSP e isolamento de origem.

### Alterado

- Versao do produto atualizada para `1.0.0-rc1`.
- Checklist de producao passa a orientar validacao antes de tags e deploys.

## [0.2.0] - 2026-07-08

### Adicionado

- Phoenix Studio para operacao sem terminal
- Phoenix API como camada entre Studio e Runtime
- Brand Manager para visualizar o Brand DNA
- Brand Editor para atualizar marcas
- criacao e duplicacao de marcas
- arquivamento e restauracao segura de marcas
- importacao e exportacao de Brand DNA em YAML
- historico e restauracao de versoes do Brand DNA
- historico de execucoes
- Analytics Dashboard
- Output Preview dos pacotes gerados

### Alterado

- Phoenix AI passa de framework interno para produto multi-marca utilizavel
- Studio passa a consumir o Runtime exclusivamente pela API

## [0.1.0] - 2026-07-05

### Adicionado

- Phoenix Runtime
- Agent SDK e Prompt Engine
- Knowledge Engine e Memory Engine v1
- Quality Gate, persistencia e Analytics Engine v1
- Media Composer
