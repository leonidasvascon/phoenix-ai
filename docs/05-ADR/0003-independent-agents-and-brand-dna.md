# ADR 0003 - Agentes independentes e Brand DNA declarativo

## Status

Aceito

## Contexto

Phoenix AI precisa produzir conteudo com qualidade consistente sem depender de um unico prompt gigante.

Prompts monoliticos sao dificeis de testar, evoluir, substituir e depurar.

## Decisao

A inteligencia da Phoenix AI sera organizada como uma equipe de agentes independentes.

Cada agente tera:

- funcao especifica
- input declarado
- output estruturado
- regras de execucao
- criterios de qualidade

O DNA da marca sera representado por arquivo declarativo, como `brand.yaml`.

## Consequencias

- Um agente podera ser substituido sem quebrar o pipeline inteiro.
- O mesmo pipeline podera operar marcas diferentes usando apenas outro Brand DNA.
- n8n, API ou outro orquestrador podera executar os agentes em sequencia.
- Revisoes poderao voltar para o agente responsavel, em vez de reiniciar todo o fluxo.

## Primeiro pipeline

Tema -> Brand DNA -> Research -> Creative Direction -> Hook -> Story -> Storyboard -> Media Plan -> Brand Review -> Quality Review -> Publish Package

