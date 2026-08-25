# G1-59 Transaction Model

## Transaction Principles
1. **Single Commit Per Publishing Execution**: `compileSiteBuildArtifact` commits exactly 1 `HistoryStack` entry.
2. **Zero Commit on Validation**: `validateSiteComposition` commits 0 `HistoryStack` entries.
3. **Determinism**: Identical site composition SSOT inputs produce identical SHA256 checksums and build artifacts.
