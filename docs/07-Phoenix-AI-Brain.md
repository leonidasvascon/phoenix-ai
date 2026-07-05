# Phoenix AI Brain

Versao: 0.1

Status: Rascunho inicial

## Objetivo

Definir a inteligencia central da plataforma antes da implementacao tecnica.

O Phoenix AI Brain nao sera apenas uma sequencia de prompts. Ele sera uma composicao de agentes especializados, cada um com responsabilidade clara, entradas definidas, saidas esperadas e criterios de qualidade.

## Estrutura v1

Phoenix AI Brain v1 funciona como uma empresa de IA.

Nenhum agente deve fazer tudo.

Cada agente executa uma unica funcao e entrega um output estruturado para o proximo agente.

## Agentes v1

### CEO Agent - Orchestrator

Gerencia o fluxo.

Responsabilidades:

- receber objetivo, tema e Brand DNA
- distribuir tarefas
- decidir ordem de execucao
- encaminhar revisoes
- impedir que etapas obrigatorias sejam puladas

Restricao:

- nunca escreve conteudo final

### Brand Guardian

Garante que todo conteudo siga o DNA da marca.

Responsabilidades:

- validar tom de voz
- validar personalidade
- validar coerencia visual e editorial
- bloquear outputs desalinhados com a Brand

Arquivo base: `prompts/agents/brand_guardian.md`

### Research Agent

Pesquisa o tema.

Responsabilidades:

- mapear emocoes
- identificar gatilhos
- levantar linguagem do publico
- indicar riscos

Restricao:

- nao escreve conteudo

Arquivo base: `prompts/agents/research_agent.md`

### Idea Generator

Cria ideias originais alinhadas ao nicho, objetivo e publico.

Responsabilidades:

- gerar ideias de conteudo
- variar angulos criativos
- propor temas recorrentes
- evitar repeticao excessiva

Observacao:

- no pipeline v1, sua funcao inicial fica parcialmente coberta por Research Agent e Creative Director

### Creative Director

Decide a direcao criativa.

Responsabilidades:

- escolher tipo de conteudo
- definir angulo
- definir estrutura narrativa
- orientar Story Writer e Hook Specialist

Restricao:

- nao escreve o conteudo final

Arquivo base: `prompts/agents/creative_director.md`

### Script Writer

Transforma ideias em roteiros.

Responsabilidades:

- criar gancho
- desenvolver narrativa
- estruturar fechamento
- criar CTA

Arquivo base: `prompts/agents/story_writer.md`

### Hook Specialist

Escreve apenas os primeiros segundos.

Responsabilidades:

- criar varias opcoes de gancho
- escolher o gancho recomendado
- explicar por que funciona

Restricao:

- nao escreve roteiro completo

Arquivo base: `prompts/agents/hook_specialist.md`

### Storyboard Designer

Define a sequencia visual do conteudo.

Responsabilidades:

- dividir roteiro em cenas
- sugerir enquadramento
- sugerir elementos visuais
- orientar edicao

Arquivo base: `prompts/agents/storyboard_ai.md`

### Media Planner

Escolhe os recursos de midia necessarios.

Responsabilidades:

- decidir formato
- sugerir fonte de midia
- definir assets necessarios
- orientar audio, narracao e musica

Arquivo base: `prompts/agents/media_planner.md`

### Quality Reviewer

Avalia o conteudo antes da publicacao.

Responsabilidades:

- revisar clareza
- revisar aderencia a marca
- revisar forca do gancho
- revisar CTA
- apontar riscos ou inconsistencias

Arquivo base: `prompts/agents/quality_reviewer.md`

### Publisher

Prepara publicacao.

Responsabilidades:

- montar legenda
- sugerir hashtags
- preparar pacote para Instagram no MVP
- exigir aprovacao antes da publicacao

Arquivo base: `prompts/agents/publisher.md`

### Performance Analyst

Analisa resultados e gera aprendizados.

Responsabilidades:

- relacionar metricas ao roteiro
- identificar padroes de performance
- sugerir ajustes futuros
- registrar aprendizados reutilizaveis

Arquivo base: `prompts/agents/performance_ai.md`

## Fluxo inicial

Brand

-> Brand Guardian

-> Idea Generator

-> Script Writer

-> Storyboard Designer

-> Quality Reviewer

-> Publisher

-> Analytics

-> Performance Analyst

## Pipeline executavel v1

Arquivo base: `prompts/pipelines/content_engine_v1.yaml`

Fluxo:

Tema

-> Brand DNA

-> Research

-> Creative Direction

-> Hook

-> Story

-> Storyboard

-> Media Plan

-> Brand Review

-> Quality Review

-> Publish Package

## Brand DNA

O DNA da marca sera declarativo, nao um prompt.

Exemplo base: `prompts/brands/encanto-intenso.brand.yaml`

## Decisoes pendentes

- Formato dos inputs e outputs de cada agente.
- Ordem final de execucao.
- Como registrar memoria e aprendizados.
- Como o Brand Guardian aprova ou rejeita outputs.
- Como medir qualidade antes da publicacao.
