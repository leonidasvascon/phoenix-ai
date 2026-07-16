import { runBenchmarks } from "../packages/evaluation-engine/src/index.ts";

const minimumPassRate = Number(process.env.PHOENIX_MIN_BENCHMARK_PASS_RATE ?? 100);
const results = await runBenchmarks();
const passed = results.filter((item) => item.passed).length;
const passRate = results.length > 0 ? Number(((passed / results.length) * 100).toFixed(2)) : 100;

console.log(JSON.stringify({
  passed,
  failed: results.length - passed,
  total: results.length,
  pass_rate: passRate,
  results: results.map((item) => ({
    id: item.id,
    score: item.evaluation.overall_score,
    min_score: item.min_score,
    passed: item.passed
  }))
}, null, 2));

if (passRate < minimumPassRate) {
  console.error(`Benchmark pass rate ${passRate}% is below ${minimumPassRate}%.`);
  process.exit(1);
}
