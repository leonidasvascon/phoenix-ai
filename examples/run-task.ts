import { Runtime } from "../packages/runtime/src/index.ts";

const response = await Runtime.execute({
  brand: "encanto-intenso",
  theme: "saudade",
  objective: "viralizar",
  platform: "instagram",
  format: "reel"
});

console.log(JSON.stringify(response, null, 2));

