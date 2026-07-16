import { generateQualityReport, persistQualityReport } from "./quality-core.ts";

const report = await generateQualityReport();

await persistQualityReport(report);
console.log(JSON.stringify(report, null, 2));

if (report.status !== "PASS") {
  console.error(`Quality gate failed: ${report.failures.join("; ")}`);
  process.exit(1);
}
