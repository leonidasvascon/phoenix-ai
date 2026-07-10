import { relative } from "node:path";
import type { PublishableMedia, PublishableMediaResolver } from "./publishable-media-resolver.ts";

export class PublicUrlMediaResolver implements PublishableMediaResolver {
  private readonly baseUrl: string;

  constructor(baseUrl = process.env.PHOENIX_PUBLIC_MEDIA_BASE_URL ?? "") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async resolve(localPath: string): Promise<PublishableMedia> {
    if (!this.baseUrl) {
      throw new Error("PHOENIX_PUBLIC_MEDIA_BASE_URL is required for real publishing.");
    }

    if (!this.baseUrl.startsWith("https://")) {
      throw new Error("PHOENIX_PUBLIC_MEDIA_BASE_URL must use HTTPS.");
    }

    const normalized = relative(process.cwd(), localPath).replace(/\\/g, "/");
    const outputIndex = normalized.indexOf("output/");
    const publicPath = outputIndex >= 0 ? normalized.slice(outputIndex + "output/".length) : normalized;

    return {
      localPath,
      publicUrl: `${this.baseUrl}/${publicPath.replace(/^\/+/, "")}`
    };
  }
}
