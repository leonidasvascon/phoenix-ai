import { Runtime } from "../packages/runtime/src/index.ts";
import { composeMediaPackage } from "../packages/media-composer/composer.ts";

const response = await Runtime.execute({
  brand: "encanto-intenso",
  theme: "saudade",
  objective: "viralizar",
  platform: "instagram",
  format: "reel"
});

const mediaPackage = await composeMediaPackage(response);

console.log(
  JSON.stringify(
    {
      ...response,
      media_package: {
        directory: mediaPackage.directory,
        files: Object.keys(mediaPackage.files)
      }
    },
    null,
    2
  )
);
