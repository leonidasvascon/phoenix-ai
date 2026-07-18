# API

A Phoenix API e documentada por OpenAPI 3.1.

## Arquivos

- `docs/openapi/phoenix-api.json`
- `docs/openapi/phoenix-api.yaml`

## Endpoints de documentacao

- `GET /openapi.json`
- `GET /openapi.yaml`
- `GET /docs`

## Autenticacao

- `Authorization: Bearer <token>`
- `X-Phoenix-Api-Key: <key>`

## SDK

```ts
import { PhoenixClient } from "@phoenix-ai/sdk";

const phoenix = new PhoenixClient({
  baseUrl: "http://127.0.0.1:4000",
  apiKey: process.env.PHOENIX_API_KEY
});
```
