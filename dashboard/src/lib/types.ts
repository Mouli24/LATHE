export type ProviderName = "smallest" | "groq" | "sarvam";

export type LatencyStats = {
  mean: number;
  p50: number;
  p95: number;
  min: number;
  max: number;
  stddev: number;
  samples: number[];
};

export type ProviderOutput = {
  ttfb: LatencyStats | null;
  total: LatencyStats | null;
  audio_path: string | null;
  audio_format: string | null;
  runs: number;
  errors: number;
  last_error: string | null;
  is_streaming: boolean;
};

export type TestResult = {
  test_id: string;
  category: string;
  text: string;
  expected_behavior: string;
  outputs: Record<ProviderName, ProviderOutput>;
};

export type RunResults = {
  schema_version?: number;
  run_id: string;
  generated_at: string;
  runs_per_cell?: number;
  providers: ProviderName[];
  skipped_providers?: ProviderName[];
  results: TestResult[];
};

export type MetricKey = "p50" | "p95" | "mean";
