import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { archiveBrand, createBrand, duplicateBrand, getBrand, listBrands, updateBrand } from "../services/runtime-service.ts";

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
