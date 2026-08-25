# G1-61 Transaction Model

## Transaction Principles
1. **Single Commit Per Telemetry Dispatch**: `executeTelemetryDispatch` commits exactly 1 `HistoryStack` entry per batch queue dispatch.
2. **Zero Commit on Event Tracking**: `trackEvent` and `calculateConversionMetrics` commit 0 `HistoryStack` entries.
3. **Determinism**: Identical event sequences produce identical `ConversionMetricsDTO` and SHA256 telemetry payloads.
