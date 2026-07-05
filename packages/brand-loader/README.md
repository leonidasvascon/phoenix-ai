# @phoenix-ai/brand-loader

Brand Loader is responsible for loading Brand DNA from a stable source.

Today, brands can live as YAML files.

In the future, brands should live in Supabase in a `brands` table using JSONB.

## Planned API

```ts
const brand = await loadBrand("encanto-intenso");
```

## Responsibilities

- Resolve brand id.
- Load Brand DNA.
- Validate against `schemas/brand.schema.json`.
- Return a normalized Brand object.

Agents must receive Brand objects from Runtime.

Agents must not read brand files directly.

