export type MetricPoint = {
  name: string;
  value: number;
  labels: Record<string, string | number | boolean>;
};

const counters = new Map<string, MetricPoint>();
const gauges = new Map<string, MetricPoint>();
const observations = new Map<string, number[]>();

export function incrementCounter(name: string, labels: Record<string, string | number | boolean> = {}, value = 1): void {
  const key = metricKey(name, labels);
  const current = counters.get(key);

  counters.set(key, {
    name,
    labels,
    value: (current?.value ?? 0) + value
  });
}

export function recordGauge(name: string, value: number, labels: Record<string, string | number | boolean> = {}): void {
  gauges.set(metricKey(name, labels), {
    name,
    labels,
    value
  });
}

export function recordDuration(name: string, durationMs: number, labels: Record<string, string | number | boolean> = {}): void {
  const key = metricKey(name, labels);
  const values = observations.get(key) ?? [];

  values.push(durationMs);
  observations.set(key, values.slice(-500));
}

export function getMetricsSnapshot() {
  return {
    counters: Array.from(counters.values()),
    gauges: Array.from(gauges.values()),
    histograms: Array.from(observations.entries()).map(([key, values]) => {
      const [name, labels] = parseMetricKey(key);

      return {
        name,
        labels,
        count: values.length,
        average: average(values),
        max: values.length > 0 ? Math.max(...values) : 0
      };
    })
  };
}

export function resetMetrics(): void {
  counters.clear();
  gauges.clear();
  observations.clear();
}

function metricKey(name: string, labels: Record<string, string | number | boolean>): string {
  return JSON.stringify([name, Object.entries(labels).sort(([a], [b]) => a.localeCompare(b))]);
}

function parseMetricKey(key: string): [string, Record<string, string | number | boolean>] {
  const [name, entries] = JSON.parse(key) as [string, Array<[string, string | number | boolean]>];

  return [name, Object.fromEntries(entries)];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}
