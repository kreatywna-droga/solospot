# G1-59 Architecture Decision Record (ADR)

- **ADR-059**: Site publishing, build artifact compilation, and deployment manifest generation must be implemented in headless `SitePublishingDeploymentBridgeEngine.ts`.
- **Clean Handoff Boundary**: Deployment pipeline stops cleanly at `DeploymentManifestDTO` with SHA256 checksums without introducing fake DNS/hosting stubs.
