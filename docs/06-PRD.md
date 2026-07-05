# PRD - Product Requirements Document

Produto: Phoenix AI

Versao do PRD: 0.1

Status: Em elaboracao

## Objetivo do MVP

Permitir que um usuario configure uma marca, gere roteiros consistentes com a identidade da marca e publique conteudo de forma semiautomatica.

## Problema

Hoje um criador precisa usar varias ferramentas diferentes:

- ChatGPT
- Canva
- CapCut
- ElevenLabs
- Google Drive
- Instagram
- Planilhas

Isso gera retrabalho e falta de consistencia.

## Solucao

A Phoenix AI centraliza o processo de criacao, planejamento, publicacao e analise de conteudo.

Fluxo:

Marca

-> DNA

-> Ideia

-> Roteiro

-> Storyboard

-> Midia

-> Legenda

-> Publicacao

-> Metricas

## Funcionalidades do MVP

### Modulo 1 - Brand Manager

Responsavel por cadastrar e manter marcas.

Cada marca tera:

- nome
- descricao
- publico
- tom de voz
- emocoes
- paleta
- fontes
- plataformas
- frequencia
- objetivos

Exemplo:

```yaml
name: Encanto Intenso
tone: Elegante
personality: Misteriosa
cta: Discreto
format: Reels
```

### Modulo 2 - Prompt Engine

Responsavel por montar o prompt ideal.

Entrada:

- marca
- objetivo
- tema

Saida:

- prompt otimizado

### Modulo 3 - Script Engine

Responsavel por gerar:

- gancho
- desenvolvimento
- fechamento
- CTA

### Modulo 4 - Media Planner

Responsavel por decidir:

- tipo de video
- tipo de imagem
- musica
- narracao
- duracao

### Modulo 5 - Publisher

Responsavel por publicacao automatica ou semiautomatica.

No MVP, a integracao sera apenas com Instagram.

Expansoes futuras:

- TikTok
- YouTube Shorts
- Facebook

### Modulo 6 - Analytics

Responsavel por coletar:

- visualizacoes
- curtidas
- comentarios
- compartilhamentos
- salvamentos
- seguidores

Depois, esses dados deverao ser relacionados ao roteiro e ao DNA da marca.

## Fluxo do usuario

Criar marca

-> Escolher tema

-> Gerar roteiro

-> Aprovar

-> Gerar video

-> Revisar

-> Publicar

-> Receber metricas

## Criterios de sucesso

KPIs do MVP:

- tempo para gerar um roteiro
- tempo para gerar um video
- numero de conteudos publicados por semana
- taxa de aprovacao sem edicao
- crescimento de seguidores
- taxa de retencao dos videos

Esses indicadores dirao se a plataforma economiza tempo e melhora resultados.

## Fora do MVP

Ficam para versoes futuras:

- geracao automatica de videos por IA
- aprendizado continuo baseado em metricas
- publicacao em multiplas redes simultaneamente
- colaboracao entre usuarios
- marketplace de templates
- aplicativo mobile

## Arquitetura do MVP

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js + React |
| Backend | NestJS |
| Banco | PostgreSQL via Supabase |
| ORM | Prisma |
| Automacao | n8n |
| IA | OpenAI |
| Narracao | ElevenLabs |
| Armazenamento | Supabase Storage |
| Filas | Redis + BullMQ |
| Autenticacao | Supabase Auth |
| Hospedagem | Docker + Coolify ou Railway no inicio |

## Proxima decisao

A proxima etapa e definir como a IA da Phoenix AI pensa.

Antes de escrever prompts, vamos desenhar o Phoenix AI Brain, composto por agentes especializados.

