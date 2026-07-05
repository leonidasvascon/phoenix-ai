import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@phoenix-ai/runtime", "@phoenix-ai/media-composer", "@phoenix-ai/memory-engine", "@phoenix-ai/knowledge-engine"]
};

export default nextConfig;
