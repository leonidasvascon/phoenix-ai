# Architecture

Versao: 0.1

## Visao geral

Phoenix AI sera uma plataforma modular:

- Engine
- Studio
- Scheduler
- Analytics
- Learning
- API

## Modulos

### Engine

Responsavel pela orquestracao dos agentes e geracao dos outputs de conteudo.

### Studio

Interface para configurar marcas, revisar conteudos, editar campanhas e aprovar publicacoes.

### Scheduler

Responsavel por calendario editorial, filas de publicacao e recorrencia.

### Analytics

Responsavel por coletar metricas, gerar relatorios e identificar padroes de desempenho.

### Learning

Responsavel por transformar metricas em aprendizados reutilizaveis pela Engine.

### API

Camada de integracao entre apps, packages, automacoes e servicos externos.

## Arquitetura orientada a Brands

Cada Brand sera configurada por arquivo declarativo. Exemplo futuro:

```yaml
name: Encanto Intenso
audience: Mulheres interessadas em beleza, autoestima e autocuidado
voice: Elegante, sensorial e confiante
content_pillars:
  - autoestima
  - beleza
  - desejo
  - rotina
publishing:
  frequency: daily
  platforms:
    - instagram
    - tiktok
```

## Decisoes pendentes

- Stack tecnologica.
- Formato final de `brand.yaml`.
- Banco de dados.
- Provedor de IA.
- Estrategia de automacao e publicacao.

