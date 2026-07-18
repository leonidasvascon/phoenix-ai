type HealthResult = {
  endpoint: string;
  status: "PASS" | "FAIL";
  http_status?: number;
  error?: string;
};

async function check(endpoint: string): Promise<HealthResult> {
  const baseUrl = process.env.PHOENIX_API_URL ?? "http://127.0.0.1:4000";
  try {
    const response = await fetch(new URL(endpoint, baseUrl));
    return {
      endpoint,
      status: response.ok ? "PASS" : "FAIL",
      http_status: response.status
    };
  } catch (error) {
    return {
      endpoint,
      status: "FAIL",
      error: error instanceof Error ? error.message : "Unknown health check error."
    };
  }
}

const checks = await Promise.all(["/health/live", "/health/ready", "/version"].map(check));
const report = {
  status: checks.every((item) => item.status === "PASS") ? "PASS" : "FAIL",
  checked_at: new Date().toISOString(),
  checks
};

console.log(JSON.stringify(report, null, 2));
if (report.status !== "PASS") process.exitCode = 1;
