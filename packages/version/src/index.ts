export type PhoenixVersionInfo = {
  version: string;
  commit: string;
  build_date: string;
  node: string;
  environment: string;
};

export function getVersionInfo(): PhoenixVersionInfo {
  return {
    version: "1.0.0-beta",
    commit: process.env.PHOENIX_COMMIT_SHA ?? "unknown",
    build_date: process.env.PHOENIX_BUILD_DATE ?? new Date().toISOString(),
    node: process.version,
    environment: process.env.PHOENIX_ENV ?? process.env.NODE_ENV ?? "development"
  };
}
