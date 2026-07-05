# ADR 0002 - Stack tecnologica do MVP

## Status

Proposto

## Contexto

O MVP da Phoenix AI precisa permitir configuracao de marcas, geracao de roteiros, planejamento de midia, publicacao semiautomatica e coleta de metricas.

A stack precisa ser moderna, produtiva, escalavel e compativel com automacoes e integracoes de IA.

## Decisao

Stack recomendada para o MVP:

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

## Consequencias

- O projeto pode evoluir como monorepo com apps e packages.
- Supabase reduz atrito inicial com banco, auth e storage.
- NestJS e Prisma criam uma base forte para API e dominio.
- n8n acelera automacoes enquanto o produto ainda esta amadurecendo.
- Redis + BullMQ permitem jobs assincronos para geracao, publicacao e analytics.

## Pendencias

- Confirmar provedor inicial de hospedagem.
- Definir estrategia de ambientes.
- Definir estrutura de schemas Prisma.
- Definir integracao inicial com Instagram.
