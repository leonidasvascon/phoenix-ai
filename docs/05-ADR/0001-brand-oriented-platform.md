# ADR 0001 - Plataforma orientada a Brands

## Status

Aceito

## Contexto

A Phoenix AI precisa atender diferentes marcas, nichos, tons de voz e canais de publicacao sem duplicar codigo.

## Decisao

A plataforma sera orientada a Brands. Cada marca tera uma configuracao declarativa propria, inicialmente planejada como `brand.yaml`.

## Consequencias

- Novas marcas poderao ser criadas sem alterar o core.
- Prompts e agentes deverao consumir configuracoes de marca.
- Analytics e Learning deverao registrar resultados por marca.
- A arquitetura precisa separar regras da plataforma de regras da marca.

