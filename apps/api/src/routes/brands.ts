import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { archiveBrand, createBrand, duplicateBrand, exportBrand, getBrand, importBrand, listArchivedBrands, listBrands, restoreBrand, updateBrand } from "../services/runtime-service.ts";

export async function handleBrandsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "DELETE" && request.method !== "GET" && request.method !== "POST" && request.method !== "PUT") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed."
    });
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , brandId, action] = url.pathname.split("/");

  if (request.method === "GET" && brandId === "archived") {
    sendJson(response, 200, await listArchivedBrands());
    return;
  }

  if (request.method === "GET" && brandId && action === "export") {
    const yaml = await exportBrand(brandId);

    if (!yaml) {
      sendJson(response, 404, {
        status: "error",
        message: "Brand not found."
      });
      return;
    }

    response.writeHead(200, {
      "Access-Control-Allow-Origin": process.env.PHOENIX_STUDIO_ORIGIN ?? "http://127.0.0.1:3000",
      "Content-Disposition": `attachment; filename="${brandId}.yaml"`,
      "Content-Type": "text/yaml; charset=utf-8"
    });
    response.end(yaml);
    return;
  }

  if (request.method === "DELETE") {
    if (!brandId) {
      sendJson(response, 400, {
        status: "error",
        message: "Brand id is required."
      });
      return;
    }

    if (brandId === "encanto-intenso") {
      sendJson(response, 409, {
        status: "error",
        message: "The default brand cannot be archived."
      });
      return;
    }

    const result = await archiveBrand(brandId);
    sendJson(response, 200, result);
    return;
  }

  if (request.method === "POST") {
    if (brandId === "import" && !action) {
      try {
        const yaml = await readImportBody(request);
        const brand = await importBrand(yaml);
        sendJson(response, 201, brand);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid Brand YAML.";
        sendJson(response, message === "Brand already exists." ? 409 : 400, {
          status: "error",
          message
        });
      }
      return;
    }

    if (brandId && action === "restore") {
      const brand = await restoreBrand(brandId);
      sendJson(response, 200, brand);
      return;
    }

    if (brandId && action === "duplicate") {
      const payload = await readJsonBody(request);
      const brand = await duplicateBrand(brandId, payload);
      sendJson(response, 201, brand);
      return;
    }

    if (brandId) {
      sendJson(response, 400, {
        status: "error",
        message: "Use POST /brands to create a brand."
      });
      return;
    }

    const payload = await readJsonBody(request);
    const brand = await createBrand(payload);
    sendJson(response, 201, brand);
    return;
  }

  if (request.method === "PUT") {
    if (!brandId) {
      sendJson(response, 400, {
        status: "error",
        message: "Brand id is required."
      });
      return;
    }

    const payload = await readJsonBody(request);
    const brand = await updateBrand(brandId, payload);
    sendJson(response, 200, brand);
    return;
  }

  if (brandId) {
    const brand = await getBrand(brandId);

    if (!brand) {
      sendJson(response, 404, {
        status: "error",
        message: "Brand not found."
      });
      return;
    }

    sendJson(response, 200, brand);
    return;
  }

  sendJson(response, 200, await listBrands());
}

async function readImportBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");

  if (!body.trim()) {
    throw new Error("Request body is required.");
  }

  if (request.headers["content-type"]?.includes("application/json")) {
    const parsed = JSON.parse(body) as { yaml?: unknown };
    if (typeof parsed.yaml !== "string") {
      throw new Error("Brand YAML is required.");
    }
    return parsed.yaml;
  }

  return body;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");

  if (!body.trim()) {
    throw new Error("Request body is required.");
  }

  return JSON.parse(body) as unknown;
}
