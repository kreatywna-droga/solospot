# G1-61 Architecture Decision Record (ADR)

- **ADR-061**: Visitor session management, telemetry event logging, conversion funnel calculation, and telemetry boundary creation must be implemented in headless `StorefrontAnalyticsTelemetryBridgeEngine.ts`.
- **Clean Telemetry Boundary**: Telemetry processing stops cleanly at `TelemetryBoundaryDTO` connecting directly to backend endpoint `/api/diagnostics` without introducing fake Google Analytics/Meta Pixel stubs.
