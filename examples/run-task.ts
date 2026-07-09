import { Runtime } from "../packages/runtime/src/index.ts";
import { composeMediaPackage } from "../packages/media-composer/composer.ts";
import { AssetService } from "../packages/asset-engine/src/index.ts";

const response = await Runtime.execute({
  brand: "encanto-intenso",
  theme: "saudade",
  objective: "viralizar",
  platform: "instagram",
  format: "reel"
});

const mediaPackage = await composeMediaPackage(response);
const assetService = new AssetService();
const assets = await assetService.generate({
  outputDirectory: mediaPackage.directory,
  thumbnailPrompt: String(response.output.thumbnail_prompt ?? ""),
  videoPrompt: String(response.output.video_prompt ?? ""),
  narrationText: [response.output.hook, response.output.story, response.output.ending, response.output.cta]
    .filter((item) => typeof item === "string" && item.trim())
    .join("\n\n")
});

console.log(
  JSON.stringify(
    {
      ...response,
      media_package: {
        directory: mediaPackage.directory,
        files: [
          ...Object.keys(mediaPackage.files),
          "assets/thumbnail.png",
          "assets/narration.mp3",
          "assets/video.mp4",
          "assets/assets.json"
        ],
        assets
      }
    },
    null,
    2
  )
);
