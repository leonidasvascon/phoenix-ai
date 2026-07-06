import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import { getBrand, listBrands } from "../services/runtime-service.ts";

export async function handleBrandsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "GET") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed."
    });
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , brandId] = url.pathname.split("/");

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
