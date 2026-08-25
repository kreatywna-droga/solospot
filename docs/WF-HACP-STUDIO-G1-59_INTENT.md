# G1-59 Intent & Mission Contract

## Intent
Validate site composition SSOT, compile static site & storefront build artifacts (`SiteBuildArtifactDTO`), generate deployment manifests with SHA256 checksums (`DeploymentManifestDTO`), and execute clean deployment handoffs (`READY_FOR_DEPLOYMENT` -> `HANDOFF_COMPLETED`) via `SitePublishingDeploymentBridgeEngine.ts`.

## Product Selection
- **Selected Capability**: `SitePublishingDeploymentBridgeEngine.ts`
- **Product North Star**: "A non-programmer can create, configure, preview, publish, and operate a professional website or ecommerce store without writing code."
